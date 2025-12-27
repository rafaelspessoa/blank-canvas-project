import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.23.8/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSellerRequest {
  nome: string;
  usuario: string;
  email: string;
  senha: string;
  comissao: number;
  perfil: 'vendedor' | 'gerente';
}

interface UpdateSellerRequest {
  id: string;
  nome?: string;
  usuario?: string;
  email?: string;
  senha?: string;
  comissao?: number;
  perfil?: 'vendedor' | 'gerente';
  status?: 'ativo' | 'bloqueado';
}

const CreateSellerSchema = z.object({
  nome: z.string().min(1).max(100),
  usuario: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/, {
      message: 'Usuário deve conter apenas letras, números, pontos, traços e sublinhado',
    }),
  email: z.string().email(),
  senha: z.string().min(8),
  comissao: z.number().min(0).max(100),
  perfil: z.enum(['vendedor', 'gerente']),
});

const UpdateSellerSchema = z.object({
  id: z.string().uuid(),
  nome: z.string().min(1).max(100).optional(),
  usuario: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9._-]+$/)
    .optional(),
  email: z.string().email().optional(),
  senha: z.string().min(8).optional(),
  comissao: z.number().min(0).max(100).optional(),
  perfil: z.enum(['vendedor', 'gerente']).optional(),
  status: z.enum(['ativo', 'bloqueado']).optional(),
});

const DeleteSellerSchema = z.object({
  id: z.string().uuid(),
});

const ActionSchema = z.enum(['create', 'update', 'delete']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Auth + admin role enforcement
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Error validating auth token:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || !roleData || roleData.role !== 'admin') {
      console.error('Forbidden: user without admin role tried to manage sellers', {
        userId: user.id,
        roleError,
      });
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const actionResult = ActionSchema.safeParse(body.action);

    if (!actionResult.success) {
      return new Response(JSON.stringify({ error: 'Ação inválida' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const action = actionResult.data;
    const data = body.data;

    console.log('Manage seller action:', action, data);

    if (action === 'create') {
      const parseResult = CreateSellerSchema.safeParse(data);
      if (!parseResult.success) {
        console.error('Validation error on create seller:', parseResult.error.flatten());
        return new Response(
          JSON.stringify({ error: 'Dados inválidos', details: parseResult.error.errors }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const sellerData = parseResult.data as CreateSellerRequest;

      // Criar usuário no auth
      const { data: authUser, error: authErrorCreate } =
        await supabaseAdmin.auth.admin.createUser({
          email: sellerData.email,
          password: sellerData.senha,
          email_confirm: true,
        });

      if (authErrorCreate || !authUser?.user) {
        console.error('Error creating auth user:', authErrorCreate);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário: ' + authErrorCreate?.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Auth user created:', authUser.user.id);

      // Criar perfil
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        auth_user_id: authUser.user.id,
        nome: sellerData.nome,
        usuario: sellerData.usuario,
        email: sellerData.email,
        comissao: sellerData.comissao,
        status: 'ativo',
      });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar perfil: ' + profileError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Profile created');

      // Criar role
      const { error: roleErrorCreate } = await supabaseAdmin.from('user_roles').insert({
        user_id: authUser.user.id,
        role: sellerData.perfil,
      });

      if (roleErrorCreate) {
        console.error('Error creating role:', roleErrorCreate);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar cargo: ' + roleErrorCreate.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Role created');

      return new Response(
        JSON.stringify({ success: true, user_id: authUser.user.id }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      const parseResult = UpdateSellerSchema.safeParse(data);
      if (!parseResult.success) {
        console.error('Validation error on update seller:', parseResult.error.flatten());
        return new Response(
          JSON.stringify({ error: 'Dados inválidos', details: parseResult.error.errors }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const updateData = parseResult.data as UpdateSellerRequest;

      // Buscar o auth_user_id do perfil
      const { data: profile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('auth_user_id')
        .eq('id', updateData.id)
        .maybeSingle();

      if (profileFetchError || !profile) {
        return new Response(JSON.stringify({ error: 'Vendedor não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Atualizar senha se fornecida
      if (updateData.senha) {
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          profile.auth_user_id,
          { password: updateData.senha }
        );

        if (passwordError) {
          console.error('Error updating password:', passwordError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar senha: ' + passwordError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Atualizar email no auth se fornecido
      if (updateData.email) {
        const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
          profile.auth_user_id,
          { email: updateData.email }
        );

        if (emailError) {
          console.error('Error updating email:', emailError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar email: ' + emailError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Atualizar perfil
      const profileUpdates: Record<string, unknown> = {};
      if (updateData.nome) profileUpdates.nome = updateData.nome;
      if (updateData.usuario) profileUpdates.usuario = updateData.usuario;
      if (updateData.email) profileUpdates.email = updateData.email;
      if (updateData.comissao !== undefined) profileUpdates.comissao = updateData.comissao;
      if (updateData.status) profileUpdates.status = updateData.status;

      if (Object.keys(profileUpdates).length > 0) {
        const { error: profileUpdateError } = await supabaseAdmin
          .from('profiles')
          .update(profileUpdates)
          .eq('id', updateData.id);

        if (profileUpdateError) {
          console.error('Error updating profile:', profileUpdateError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar perfil: ' + profileUpdateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Atualizar role se fornecido
      if (updateData.perfil) {
        const { error: roleUpdateError } = await supabaseAdmin
          .from('user_roles')
          .update({ role: updateData.perfil })
          .eq('user_id', profile.auth_user_id);

        if (roleUpdateError) {
          console.error('Error updating role:', roleUpdateError);
          return new Response(
            JSON.stringify({ error: 'Erro ao atualizar cargo: ' + roleUpdateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const parseResult = DeleteSellerSchema.safeParse(data);
      if (!parseResult.success) {
        console.error('Validation error on delete seller:', parseResult.error.flatten());
        return new Response(
          JSON.stringify({ error: 'Dados inválidos', details: parseResult.error.errors }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { id } = parseResult.data;

      // Buscar o auth_user_id
      const { data: profile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('auth_user_id')
        .eq('id', id)
        .maybeSingle();

      if (profileFetchError || !profile) {
        return new Response(JSON.stringify({ error: 'Vendedor não encontrado' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Deletar usuário (isso vai cascadear para profiles e user_roles)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
        profile.auth_user_id
      );

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Erro ao deletar vendedor: ' + deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in manage-seller function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
