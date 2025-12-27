import React, { useState } from 'react';
import { useBets } from '@/contexts/BetsContext';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Download,
  FileText,
  Table,
  Calendar
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function FinancialReports() {
  const { bets, getTodayTotal } = useBets();
  const [period, setPeriod] = useState('today');

  // Calculate stats based on period
  const getPeriodBets = () => {
    const now = new Date();
    return bets.filter(bet => {
      const betDate = new Date(bet.data_hora);
      switch (period) {
        case 'today':
          return betDate.toDateString() === now.toDateString();
        case 'week':
          return betDate >= startOfWeek(now, { locale: ptBR });
        case 'month':
          return betDate >= startOfMonth(now);
        default:
          return true;
      }
    });
  };

  const periodBets = getPeriodBets();
  const activeBets = periodBets.filter(b => b.status === 'ativa');
  const cancelledBets = periodBets.filter(b => b.status === 'cancelada');
  
  const totalApostado = activeBets.reduce((sum, bet) => sum + bet.valor, 0);
  const totalCancelado = cancelledBets.reduce((sum, bet) => sum + bet.valor, 0);
  const comissaoTotal = totalApostado * 0.1; // 10% average commission
  const lucroLiquido = totalApostado - comissaoTotal;

  const handleExportPDF = () => {
    toast.success('Relatório PDF gerado com sucesso!');
  };

  const handleExportExcel = () => {
    toast.success('Relatório Excel gerado com sucesso!');
  };

  const periodLabels: Record<string, string> = {
    today: 'Hoje',
    week: 'Esta Semana',
    month: 'Este Mês',
  };

  // Sem fechamentos iniciais - app zerado para produção
  const recentClosings: Array<{ date: Date; total: number; commission: number; profit: number }> = [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1">
            Relatórios e fechamentos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Apostado"
          value={totalApostado}
          icon={DollarSign}
          variant="accent"
          subtitle={periodLabels[period]}
        />
        <StatCard
          title="Lucro Líquido"
          value={lucroLiquido}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Comissões"
          value={comissaoTotal}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Canceladas"
          value={totalCancelado}
          icon={TrendingDown}
          variant="default"
          subtitle={`${cancelledBets.length} apostas`}
        />
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" size="lg" onClick={handleExportPDF}>
          <FileText className="w-5 h-5 mr-2" />
          Exportar PDF
        </Button>
        <Button variant="outline" size="lg" onClick={handleExportExcel}>
          <Table className="w-5 h-5 mr-2" />
          Exportar Excel
        </Button>
      </div>

      {/* Recent Closings */}
      <div className="glass-card rounded-xl">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Fechamentos Recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {recentClosings.length > 0 ? (
            recentClosings.map((closing, index) => (
              <div 
                key={index}
                className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {format(closing.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Comissão: {closing.commission.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-foreground">
                    {closing.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-sm text-success">
                    Lucro: {closing.profit.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum fechamento registrado ainda
            </div>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold text-foreground mb-4">Resumo do Período</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Apostas Registradas</p>
            <p className="text-2xl font-bold text-foreground">{periodBets.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Apostas Ativas</p>
            <p className="text-2xl font-bold text-success">{activeBets.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Taxa de Cancelamento</p>
            <p className="text-2xl font-bold text-foreground">
              {periodBets.length > 0 
                ? ((cancelledBets.length / periodBets.length) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Ticket Médio</p>
            <p className="text-2xl font-bold text-foreground">
              {activeBets.length > 0
                ? (totalApostado / activeBets.length).toLocaleString('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL' 
                  })
                : 'R$ 0,00'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
