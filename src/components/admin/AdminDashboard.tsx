import React from 'react';
import { useBets } from '@/contexts/BetsContext';
import { StatCard } from '@/components/shared/StatCard';
import { GameTypeBadge } from '@/components/shared/GameTypeBadge';
import { 
  DollarSign, 
  TrendingUp, 
  Receipt, 
  Clock, 
  CheckCircle,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminDashboard() {
  const { getTodayBets, getTodayTotal, getTodayCount, bets } = useBets();
  
  const todayBets = getTodayBets();
  const totalApostado = getTodayTotal();
  const totalApostas = getTodayCount();
  const apostasAtivas = todayBets.filter(b => b.status === 'ativa').length;
  const apostasCanceladas = todayBets.filter(b => b.status === 'cancelada').length;
  
  // Simulated commission rate of 10%
  const lucroBruto = totalApostado;
  const lucroLiquido = totalApostado * 0.9;

  // Get unique sellers today
  const vendedoresHoje = new Set(todayBets.map(b => b.vendedor_id)).size;

  const recentBets = bets.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do dia • {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Apostado"
          value={totalApostado}
          icon={DollarSign}
          variant="accent"
          subtitle="Hoje"
        />
        <StatCard
          title="Lucro Líquido"
          value={lucroLiquido}
          icon={TrendingUp}
          variant="success"
          subtitle="90% do total"
        />
        <StatCard
          title="Total de Apostas"
          value={totalApostas.toString()}
          icon={Receipt}
          variant="primary"
          subtitle={`${apostasAtivas} ativas`}
        />
        <StatCard
          title="Apostas Abertas"
          value={apostasAtivas.toString()}
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Finalizadas"
          value={(totalApostas - apostasAtivas).toString()}
          icon={CheckCircle}
          variant="default"
        />
        <StatCard
          title="Vendedores Ativos"
          value={vendedoresHoje.toString()}
          icon={Users}
          variant="default"
          subtitle="Vendendo hoje"
        />
      </div>

      {/* Recent Activity */}
      <div className="glass-card rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Apostas Recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {recentBets.length > 0 ? (
            recentBets.map((bet) => (
              <div 
                key={bet.id} 
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="font-mono font-bold text-primary text-lg">
                      {bet.numero}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{bet.vendedor_nome}</span>
                      <GameTypeBadge type={bet.tipo_jogo} size="sm" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(bet.data_hora), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {bet.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className={`text-xs font-medium ${
                    bet.status === 'ativa' ? 'text-success' : 
                    bet.status === 'cancelada' ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma aposta registrada hoje
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
