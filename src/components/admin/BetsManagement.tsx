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
  Download,
  Printer
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Todas as Apostas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie todas as apostas do sistema
          </p>
        </div>
        <Button variant="outline" size="lg" className="gap-2">
          <Download className="w-5 h-5" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl shadow-sm p-3 sm:p-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, número ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Todos os Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
              <SelectItem value="paga">Pagas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={gameTypeFilter} onValueChange={setGameTypeFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Todos os Jogos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Jogos</SelectItem>
              <SelectItem value="milhar">Milhar</SelectItem>
              <SelectItem value="centena">Centena</SelectItem>
              <SelectItem value="dezena">Dezena</SelectItem>
            </SelectContent>
          </Select>

          <div className="hidden sm:flex items-center text-sm text-muted-foreground ml-auto">
            <span>
              {filteredBets.length} apostas • Total:{' '}
              {totalValue.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Bets List */}
      <div className="space-y-4">
        {filteredBets.length > 0 ? (
          filteredBets.map((bet) => (
            <article
              key={bet.id}
              className={cn(
                'bg-card border border-border rounded-xl shadow-sm overflow-hidden',
                bet.status === 'cancelada' && 'opacity-60'
              )}
            >
              {/* Card header: apostador / vendedor */}
              <header className="px-4 pt-4 pb-3 border-b border-border/60 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>
                      Apostador:{' '}
                      <span className="font-bold">
                        {bet.apostador_nome || 'Não informado'}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        bet.status === 'ativa' && 'bg-success/10 text-success',
                        bet.status === 'cancelada' && 'bg-destructive/10 text-destructive',
                        bet.status === 'paga' && 'bg-primary/10 text-primary'
                      )}
                    >
                      {bet.status}
                    </span>
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Vendedor: <span className="font-medium">{bet.vendedor_nome}</span>
                  </p>
                  {bet.apostador_telefone && (
                    <p className="text-xs text-muted-foreground">
                      Telefone: {bet.apostador_telefone}
                    </p>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>Código</p>
                  <p className="font-mono font-medium text-foreground">{bet.codigo}</p>
                  <p className="mt-1">
                    {format(new Date(bet.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </header>

              {/* Card body: números, tipo e valor */}
              <div className="px-4 py-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Número:</span>
                  <span className="inline-flex items-center rounded-full bg-primary text-primary-foreground px-3 py-1 font-mono font-semibold text-base">
                    {bet.numero}
                  </span>
                  <GameTypeBadge type={bet.tipo_jogo} size="sm" className="ml-1" />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Valor da aposta:{' '}
                    <span className="font-semibold text-foreground">
                      {bet.valor.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </span>
                  </p>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-xl font-bold text-primary">
                      {bet.valor.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card footer: ações */}
              <footer className="px-4 pb-4 pt-3 border-t border-border/60 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  Código: <span className="font-mono">{bet.codigo}</span>
                </div>
                <div className="flex gap-2 justify-end flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.print()}
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => window.print()}
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </Button>
                  {bet.status === 'ativa' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-destructive text-destructive hover:bg-destructive/10"
                      onClick={() => openCancelDialog(bet.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancelar aposta
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      Aposta {bet.status}
                    </span>
                  )}
                </div>
              </footer>
            </article>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground bg-card border border-dashed border-border rounded-xl">
            Nenhuma aposta encontrada
          </div>
        )}
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

