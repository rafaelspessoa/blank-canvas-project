import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { SellersManagement } from '@/components/admin/SellersManagement';
import { BetsManagement } from '@/components/admin/BetsManagement';
import { FinancialReports } from '@/components/admin/FinancialReports';
import { GameSettings } from '@/components/admin/GameSettings';
import { GamesManagement } from '@/components/admin/GamesManagement';
import { BlockedNumbersManagement } from '@/components/admin/BlockedNumbersManagement';
import { NewBetForm } from '@/components/seller/NewBetForm';
import { MyBets } from '@/components/seller/MyBets';
import { MyFinancial } from '@/components/seller/MyFinancial';

export default function Index() {
  const { user, isLoading, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState(isAdmin ? 'dashboard' : 'nova-aposta');

  // Update default view when user changes
  React.useEffect(() => {
    if (user) {
      setCurrentView(isAdmin ? 'dashboard' : 'nova-aposta');
    }
  }, [user, isAdmin]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto mb-4 flex items-center justify-center animate-pulse">
            <span className="text-primary-foreground font-bold text-2xl">M</span>
          </div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    if (isAdmin) {
      switch (currentView) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'vender':
          return <NewBetForm />;
        case 'jogos':
          return <GamesManagement />;
        case 'vendedores':
          return <SellersManagement />;
        case 'apostas':
          return <BetsManagement />;
        case 'financeiro':
          return <FinancialReports />;
        case 'configuracoes':
          return <GameSettings />;
        case 'numeros-bloqueados':
          return <BlockedNumbersManagement />;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (currentView) {
        case 'nova-aposta':
          return <NewBetForm />;
        case 'minhas-apostas':
          return <MyBets />;
        case 'meu-financeiro':
          return <MyFinancial />;
        default:
          return <NewBetForm />;
      }
    }
  };

  return (
    <AppLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </AppLayout>
  );
}
