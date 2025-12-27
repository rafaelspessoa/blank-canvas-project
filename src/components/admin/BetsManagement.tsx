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
  Printer,
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
import { Bet } from '@/types';

export function BetsManagement() {
  const { bets, cancelBet } = useBets();
  const [searchTerm, setSearchTerm] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBetId, setSelectedBetId] = useState<string | null>(null);

  const filteredBets = bets.filter((bet) => {
    const matchesSearch =
      bet.numero.includes(searchTerm) ||
      bet.vendedor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bet.codigo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesGameType = gameTypeFilter === 'all' || bet.tipo_jogo === gameTypeFilter;
    const matchesStatus = statusFilter === 'all' || bet.status === statusFilter;

    return matchesSearch && matchesGameType && matchesStatus;
  });

  const totalValue = filteredBets
    .filter((b) => b.status === 'ativa')
    .reduce((sum, bet) => sum + bet.valor, 0);

  const handleCancelBet = async () => {
    if (selectedBetId) {
      await cancelBet(selectedBetId);
      toast.success('Aposta cancelada com sucesso!');
      setCancelDialogOpen(false);
      setSelectedBetId(null);
    }
  };

  const openCancelDialog = (id: string) => {
    setSelectedBetId(id);
    setCancelDialogOpen(true);
  };

  const handlePrintBet = (bet: Bet) => {
    const valorFormatado = bet.valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    const dataFormatada = format(new Date(bet.data_hora), 'dd/MM/yyyy HH:mm', {
      locale: ptBR,
    });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charSet="utf-8" />
  <title>Comprovante de Aposta</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 16px; background: #f5f5f5; }
    .receipt { max-width: 360px; margin: 0 auto; background: #ffffff; color: #111827; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 16px 16px 20px; font-size: 13px; }
    .title { text-align: center; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 8px; }
    .muted { color: #6b7280; }
    .section { border-top: 1px dashed #d1d5db; padding-top: 8px; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; margin-top: 4px; }
    .number-pill { display:inline-block; padding:6px 12px; border-radius:999px; background:#047857; color:#ecfdf5; font-weight:600; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; margin-top:4px; }
    .badge { display:inline-block; padding:2px 8px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:600; margin-left:8px; }
    .total-box { margin-top:12px; padding:10px 12px; border-radius:8px; border:1px dashed #111827; text-align:center; }
    .total-label { font-size:12px; font-weight:600; }
    .total-value { font-size:18px; font-weight:700; margin-top:2px; }
    .footer { margin-top:10px; text-align:center; font-size:11px; color:#9ca3af; }
    @media print { body { background:#fff; padding:0; } .receipt { box-shadow:none; margin:0; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="title">COMPROVANTE DE APOSTA</div>
    <div class="muted" style="text-align:center; margin-bottom:8px;">${dataFormatada}</div>

    <div class="section">
      <div class="row"><span class="muted">CÓDIGO:</span><span>${bet.codigo}</span></div>
      ${bet.vendedor_nome ? `<div class="row"><span class="muted">VENDEDOR:</span><span>${bet.vendedor_nome}</span></div>` : ''}
      ${bet.apostador_nome ? `<div class="row"><span class="muted">APOSTADOR:</span><span>${bet.apostador_nome}</span></div>` : ''}
      ${bet.apostador_telefone ? `<div class="row"><span class="muted">TELEFONE:</span><span>${bet.apostador_telefone}</span></div>` : ''}
    </div>

    <div class="section">
      <div class="muted" style="text-align:center;">- NÚMERO APOSTADO -</div>
      <div style="text-align:center; margin-top:6px;">
        <span class="number-pill">${bet.numero}</span>
        <span class="badge">${bet.tipo_jogo.toUpperCase()}</span>
      </div>
    </div>

    <div class="section">
      <div class="total-box">
        <div class="total-label">VALOR APOSTADO</div>
        <div class="total-value">${valorFormatado}</div>
      </div>
    </div>

    <div class="footer">
      <div>ESSE BILHETE VALE ATÉ AS 16H DO PROXIMO DIA</div>
      <div style="margin-top:4px;">Guarde este comprovante para conferência.</div>
    </div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
                    onClick={() => handlePrintBet(bet)}
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => handlePrintBet(bet)}
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
