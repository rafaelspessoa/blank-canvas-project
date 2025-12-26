import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo - will be replaced with Supabase
const mockUsers: (User & { senha: string })[] = [
  {
    id: '1',
    nome: 'Administrador',
    usuario: 'admin',
    senha: 'admin123',
    perfil: 'admin',
    comissao: 0,
    status: 'ativo',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    nome: 'João Vendedor',
    usuario: 'joao',
    senha: '123456',
    perfil: 'vendedor',
    comissao: 10,
    status: 'ativo',
    limite_apostas: 5000,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    nome: 'Maria Vendedora',
    usuario: 'maria',
    senha: '123456',
    perfil: 'vendedor',
    comissao: 12,
    status: 'ativo',
    limite_apostas: 8000,
    created_at: new Date().toISOString(),
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('milhar_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('milhar_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = mockUsers.find(
      u => u.usuario === usuario && u.senha === senha && u.status === 'ativo'
    );

    if (foundUser) {
      const { senha: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('milhar_user', JSON.stringify(userWithoutPassword));
      localStorage.setItem('milhar_login_time', new Date().toISOString());
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('milhar_user');
    localStorage.removeItem('milhar_login_time');
  };

  const isAdmin = user?.perfil === 'admin';

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin }}>
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
