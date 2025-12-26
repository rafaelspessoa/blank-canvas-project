import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBets } from '@/contexts/BetsContext';
import { StatCard } from '@/components/shared/StatCard';
import { GameTypeBadge } from '@/components/shared/GameTypeBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DollarSign, 
  Receipt, 
  Percent,
  Search,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Bet } from '@/types';
import { BetReceipt } from './BetReceipt';

export function MyBets() {
  const { user } = useAuth();
  const { getBetsByVendedor, getTodayTotal, getTodayCount } = useBets();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);

  if (!user) return null;

  const myBets = getBetsByVendedor(user.id);
  const todayTotal = getTodayTotal(user.id);
  const todayCount = getTodayCount(user.id);
  const estimatedCommission = todayTotal * (user.comissao / 100);

  const filteredBets = myBets.filter(bet =>
    bet.numero.includes(searchTerm) ||
    bet.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedBet) {
    return (
      <BetReceipt
        bet={selectedBet}
        onClose={() => setSelectedBet(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Minhas Apostas</h1>
          <p className="text-muted-foreground mt-1">Acompanhe suas vendas do dia</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 self-start sm:self-auto"
          onClick={() => window.print()}
        >
          <Receipt className="w-4 h-4" />
          Exportar / PDF
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Vendido Hoje"
          value={todayTotal}
          icon={DollarSign}
          variant="accent"
        />
        <StatCard
          title="Apostas"
          value={todayCount.toString()}
          icon={Receipt}
          variant="primary"
        />
        <StatCard
          title="Comissão"
          value={estimatedCommission}
          icon={Percent}
          variant="success"
          subtitle={`${user.comissao}%`}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por número ou código..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Bets List */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="divide-y divide-border">
          {filteredBets.length > 0 ? (
            filteredBets.map((bet) => (
              <div 
                key={bet.id}
                className={cn(
                  "p-4 hover:bg-muted/30 transition-colors",
                  bet.status === 'cancelada' && "opacity-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="font-mono font-bold text-primary text-xl">
                        {bet.numero}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{bet.codigo}</span>
                        <GameTypeBadge type={bet.tipo_jogo} size="sm" />
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(bet.data_hora), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="font-bold text-lg text-foreground">
                      {bet.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    {bet.status === 'ativa' ? (
                      <span className="block text-xs font-medium text-success">Ativa</span>
                    ) : (
                      <span className="block text-xs font-medium text-destructive">Cancelada</span>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => setSelectedBet(bet)}
                    >
                      <Receipt className="w-3 h-3 mr-1" />
                      Comprovante
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              {searchTerm ? 'Nenhuma aposta encontrada' : 'Você ainda não registrou apostas hoje'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
