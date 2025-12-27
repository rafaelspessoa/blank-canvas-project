import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    const { action, data } = await req.json();
    console.log('Manage seller action:', action, data);

    if (action === 'create') {
      const sellerData = data as CreateSellerRequest;

      // Criar usuário no auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: sellerData.email,
        password: sellerData.senha,
        email_confirm: true,
      });

      if (authError) {
        console.error('Error creating auth user:', authError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário: ' + authError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Auth user created:', authUser.user.id);

      // Criar perfil
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
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
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: authUser.user.id,
          role: sellerData.perfil,
        });

      if (roleError) {
        console.error('Error creating role:', roleError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar cargo: ' + roleError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Role created');

      return new Response(
        JSON.stringify({ 
          success: true,
          user_id: authUser.user.id,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      const updateData = data as UpdateSellerRequest;
      
      // Buscar o auth_user_id do perfil
      const { data: profile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('auth_user_id')
        .eq('id', updateData.id)
        .single();

      if (profileFetchError || !profile) {
        return new Response(
          JSON.stringify({ error: 'Vendedor não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
      const profileUpdates: any = {};
      if (updateData.nome) profileUpdates.nome = updateData.nome;
      if (updateData.usuario) profileUpdates.usuario = updateData.usuario;
      if (updateData.email) profileUpdates.email = updateData.email;
      if (updateData.comissao !== undefined) profileUpdates.comissao = updateData.comissao;
      if (updateData.status) profileUpdates.status = updateData.status;

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

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      const { id } = data;

      // Buscar o auth_user_id
      const { data: profile, error: profileFetchError } = await supabaseAdmin
        .from('profiles')
        .select('auth_user_id')
        .eq('id', id)
        .single();

      if (profileFetchError || !profile) {
        return new Response(
          JSON.stringify({ error: 'Vendedor não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in manage-seller function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
