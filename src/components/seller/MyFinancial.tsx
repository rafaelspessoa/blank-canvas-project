import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBets } from '@/contexts/BetsContext';
import { StatCard } from '@/components/shared/StatCard';
import { 
  Wallet, 
  TrendingUp, 
  Calendar,
  CheckCircle
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MyFinancial() {
  const { user } = useAuth();
  const { getBetsByVendedor, getTodayTotal } = useBets();

  if (!user) return null;

  const myBets = getBetsByVendedor(user.id);
  const todayTotal = getTodayTotal(user.id);
  const estimatedCommission = todayTotal * (user.comissao / 100);

  // Sem fechamentos iniciais - app zerado para produção
  const closings: Array<{ date: Date; total: number; commission: number }> = [];

  const weekTotal = closings.reduce((sum, c) => sum + c.commission, 0) + estimatedCommission;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Meu Financeiro</h1>
        <p className="text-muted-foreground mt-1">
          Acompanhe seus ganhos e fechamentos
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title="Vendas Hoje"
          value={todayTotal}
          icon={Wallet}
          variant="accent"
        />
        <StatCard
          title="Comissão Hoje"
          value={estimatedCommission}
          icon={TrendingUp}
          variant="success"
          subtitle={`${user.comissao}% sobre vendas`}
        />
      </div>

      {/* Weekly Summary */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Resumo da Semana</h2>
          <span className="text-2xl font-bold text-accent">
            {weekTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent rounded-full transition-all duration-500"
            style={{ width: `${Math.min((weekTotal / 1000) * 100, 100)}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Meta semanal: R$ 1.000,00
        </p>
      </div>

      {/* Closings History */}
      <div className="glass-card rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Histórico de Fechamentos</h2>
        </div>
        <div className="divide-y divide-border">
          {/* Today */}
          <div className="p-4 bg-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Hoje</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">
                  {todayTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-sm text-success">
                  +{estimatedCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </div>

          {/* Historical */}
          {closings.length > 0 ? (
            closings.map((closing, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {format(closing.date, "EEEE", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(closing.date, "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {closing.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-sm text-success">
                      +{closing.commission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum fechamento anterior
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
