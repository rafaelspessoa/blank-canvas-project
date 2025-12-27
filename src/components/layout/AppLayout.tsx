import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  DollarSign, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  PlusCircle,
  History,
  Wallet,
  Gamepad2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: PlusCircle, label: 'Vender', id: 'vender' },
  { icon: Gamepad2, label: 'Jogos', id: 'jogos' },
  { icon: Users, label: 'Vendedores', id: 'vendedores' },
  { icon: Receipt, label: 'Apostas', id: 'apostas' },
  { icon: DollarSign, label: 'Financeiro', id: 'financeiro' },
  { icon: Settings, label: 'Configurações', id: 'configuracoes' },
  { icon: Gamepad2, label: 'Números Bloqueados', id: 'numeros-bloqueados' },
];

const vendedorNavItems: NavItem[] = [
  { icon: PlusCircle, label: 'Nova Aposta', id: 'nova-aposta' },
  { icon: History, label: 'Minhas Apostas', id: 'minhas-apostas' },
  { icon: Wallet, label: 'Financeiro', id: 'meu-financeiro' },
];

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
}

export function AppLayout({ children, currentView, onViewChange }: AppLayoutProps) {
  const { user, logout, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = isAdmin ? adminNavItems : vendedorNavItems;

  const NavContent = () => (
    <>
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-lg">M</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sidebar-foreground truncate">Milhar Pro</h2>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.nome}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onViewChange(item.id);
              setSidebarOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              currentView === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" />
          <span>Sair</span>
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar flex-col fixed h-full">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold">M</span>
          </div>
          <span className="font-bold text-sidebar-foreground">Milhar Pro</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-sidebar-foreground"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </Button>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={cn(
          "md:hidden fixed top-16 left-0 bottom-0 w-72 bg-sidebar z-50 flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
