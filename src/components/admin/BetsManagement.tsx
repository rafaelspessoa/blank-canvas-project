import React, { useState } from 'react';
import { useBets } from '@/contexts/BetsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GameTypeBadge } from '@/components/shared/GameTypeBadge';
import { 
  Search, 
  Filter, 
  XCircle,
  Calendar,
  Download
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function BetsManagement() {
  const { bets, cancelBet } = useBets();
  const [searchTerm, setSearchTerm] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null);

  const filteredBets = bets.filter(bet => {
    const matchesSearch = 
      bet.numero.includes(searchTerm) ||
      bet.vendedor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesGameType = gameTypeFilter === 'all' || bet.tipo_jogo === gameTypeFilter;
    const matchesStatus = statusFilter === 'all' || bet.status === statusFilter;

    return matchesSearch && matchesGameType && matchesStatus;
  });

  const totalValue = filteredBets
    .filter(b => b.status === 'ativa')
    .reduce((sum, bet) => sum + bet.valor, 0);

  const handleCancelBet = () => {
    if (selectedBetId) {
      cancelBet(selectedBetId);
      toast.success('Aposta cancelada com sucesso!');
      setCancelDialogOpen(false);
      setSelectedBetId(null);
    }
  };

  const openCancelDialog = (id: string) => {
    setSelectedBetId(id);
    setCancelDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Apostas</h1>
          <p className="text-muted-foreground mt-1">
            {filteredBets.length} apostas • Total: {totalValue.toLocaleString('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            })}
          </p>
        </div>
        
        <Button variant="outline" size="lg">
          <Download className="w-5 h-5 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, vendedor ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Tipo de jogo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="milhar">Milhar</SelectItem>
            <SelectItem value="centena">Centena</SelectItem>
            <SelectItem value="dezena">Dezena</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativa">Ativas</SelectItem>
            <SelectItem value="cancelada">Canceladas</SelectItem>
            <SelectItem value="paga">Pagas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bets List */}
      <div className="glass-card rounded-xl overflow-hidden">
        {/* Desktop Table Header */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 p-4 bg-muted/50 text-sm font-medium text-muted-foreground">
          <div>Código</div>
          <div>Vendedor</div>
          <div>Tipo</div>
          <div>Número</div>
          <div>Valor</div>
          <div>Data/Hora</div>
          <div className="text-right">Ações</div>
        </div>

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
                {/* Mobile Layout */}
                <div className="md:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="font-mono font-bold text-primary text-xl">
                          {bet.numero}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{bet.vendedor_nome}</p>
                        <p className="text-xs text-muted-foreground font-mono">{bet.codigo}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {bet.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <GameTypeBadge type={bet.tipo_jogo} size="sm" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(bet.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {bet.status === 'ativa' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openCancelDialog(bet.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                    {bet.status === 'cancelada' && (
                      <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                        Cancelada
                      </span>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:grid md:grid-cols-7 gap-4 items-center">
                  <div className="font-mono text-sm text-muted-foreground">{bet.codigo}</div>
                  <div className="font-medium text-foreground">{bet.vendedor_nome}</div>
                  <div><GameTypeBadge type={bet.tipo_jogo} size="sm" /></div>
                  <div className="font-mono font-bold text-lg text-primary">{bet.numero}</div>
                  <div className="font-semibold text-foreground">
                    {bet.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(bet.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                  <div className="text-right">
                    {bet.status === 'ativa' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => openCancelDialog(bet.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancelar
                      </Button>
                    )}
                    {bet.status === 'cancelada' && (
                      <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                        Cancelada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma aposta encontrada
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Aposta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta aposta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelBet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancelar Aposta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
