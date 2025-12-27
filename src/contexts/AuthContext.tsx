import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface DbProfile {
  id: string;
  auth_user_id: string;
  nome: string | null;
  usuario: string | null;
  status: string;
  comissao: number | null;
  created_at: string;
}

interface DbUserRole {
  role: UserRole;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromSession = async (session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']) => {
    if (!session?.user) {
      setUser(null);
      setRole(null);
      return;
    }

    const authUserId = session.user.id;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle<DbProfile>();

    if (profileError) {
      console.error('Erro ao carregar perfil:', profileError);
    }

    const { data: roleRow, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authUserId)
      .maybeSingle<DbUserRole>();

    if (roleError) {
      console.error('Erro ao carregar cargo:', roleError);
    }

    if (!profile) {
      // Sem perfil ainda: mantém user nulo, mas sessão existe
      setUser(null);
      setRole(roleRow?.role ?? null);
      return;
    }

    const appUser: User = {
      id: profile.id,
      nome: profile.nome ?? '',
      usuario: profile.usuario ?? (session.user.email ?? ''),
      perfil: roleRow?.role ?? ('vendedor' as UserRole),
      comissao: profile.comissao ?? 0,
      status: profile.status as User['status'],
      created_at: profile.created_at,
    };

    setUser(appUser);
    setRole(roleRow?.role ?? ('vendedor' as UserRole));
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Atualiza estado de forma síncrona
      if (!session) {
        setUser(null);
        setRole(null);
        return;
      }

      // Busca perfil/cargo fora do callback para evitar deadlocks
      setTimeout(() => {
        loadUserFromSession(session).catch((err) => {
          console.error('Erro ao atualizar usuário da sessão:', err);
        });
      }, 0);
    });

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (data.session) {
          await loadUserFromSession(data.session);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, senha: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error || !data.session) {
        console.error('Erro de login:', error);
        return false;
      }

      await loadUserFromSession(data.session);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
