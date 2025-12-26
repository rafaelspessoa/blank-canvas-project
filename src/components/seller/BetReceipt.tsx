import React, { useRef } from 'react';
import { Bet } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Printer, 
  Share2, 
  Copy 
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface BetReceiptProps {
  bet: Bet;
  allBets?: Bet[];
  onClose: () => void;
}

export function BetReceipt({ bet, allBets, onClose }: BetReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const bets = allBets && allBets.length > 0 ? allBets : [bet];
  const totalValue = bets.reduce((acc, b) => acc + b.valor, 0);
  const valorUnit = bets.length > 0 ? bets[0].valor : bet.valor;
  
  // Calculate potential prize based on game type multiplier
  const getMultiplier = (tipo: string) => {
    switch (tipo) {
      case 'milhar': return 4000;
      case 'centena': return 600;
      case 'dezena': return 60;
      default: return 1000;
    }
  };
  
  const potentialPrize = totalValue * getMultiplier(bet.tipo_jogo);

  // Generate receipt code
  const receiptCode = `${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const handleCopyReceipt = () => {
    navigator.clipboard.writeText(receiptCode);
    toast.success('Código copiado!');
  };

  const handlePrint = () => {
    window.print();
    toast.success('Enviando para impressão...');
  };

  const handleGeneratePdf = () => {
    window.print();
    toast.success('Na janela de impressão, escolha "Salvar como PDF".');
  };

  const handleShare = async () => {
    const numbersText = bets.map(b => b.numero).join('    ');
    
    const text = `
═══════════════════════════════
     COMPROVANTE DE APOSTA
═══════════════════════════════
${format(new Date(bet.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
 
RECIBO:     ${receiptCode}
JOGO:       ${bet.tipo_jogo.toUpperCase()}
VENDEDOR:   ${bet.vendedor_nome?.toUpperCase()}
APOSTADOR:  ${(bet.apostador_nome || '-').toUpperCase()}
TELEFONE:   ${bet.apostador_telefone || '-'}
 
- NÚMEROS APOSTADOS -
${numbersText}
 
QTD NÚMEROS:          ${bets.length}
VALOR UNIT:           R$ ${valorUnit.toFixed(2)}
 
TOTAL:                R$ ${totalValue.toFixed(2)}

┌─────────────────────────────┐
│      VALOR DO PRÊMIO        │
│      R$ ${potentialPrize.toFixed(2).padStart(10)}        │
└─────────────────────────────┘

        BOA SORTE!
      MILHARPRO.COM.BR
═══════════════════════════════
    `.trim();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comprovante de Aposta',
          text,
        });
      } catch {
        navigator.clipboard.writeText(text);
        toast.success('Comprovante copiado!');
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('Comprovante copiado!');
    }
  };

  return (
    <div className="animate-scale-in max-w-md mx-auto">
      {/* Receipt Card - Thermal Printer Style */}
      <div 
        ref={receiptRef}
        className="bg-white text-black rounded-lg overflow-hidden shadow-xl print:shadow-none font-mono text-sm"
      >
        {/* Dotted top edge */}
        <div className="h-3 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#e5e5e5_4px,#e5e5e5_8px)]" />
        
        {/* Header */}
        <div className="px-4 pt-4 pb-3 text-center border-b border-dashed border-gray-300">
          <h1 className="text-lg font-bold tracking-wider">COMPROVANTE DE APOSTA</h1>
          <p className="text-gray-600 mt-1">
            {format(new Date(bet.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>

        {/* Info Section */}
        <div className="px-4 py-3 space-y-1 border-b border-dashed border-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-600">RECIBO:</span>
            <button 
              onClick={handleCopyReceipt}
              className="font-semibold hover:text-blue-600 flex items-center gap-1"
            >
              {receiptCode.substring(0, 20)}
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">JOGO:</span>
            <span className="font-semibold">{bet.tipo_jogo.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">VENDEDOR:</span>
            <span className="font-semibold">{bet.vendedor_nome?.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">APOSTADOR:</span>
            <span className="font-semibold">{(bet.apostador_nome || '-').toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TELEFONE:</span>
            <span className="font-semibold">{bet.apostador_telefone || '-'}</span>
          </div>
        </div>

        {/* Numbers Section */}
        <div className="px-4 py-3 border-b border-dashed border-gray-300">
          <p className="text-center text-gray-600 mb-3">- NÚMEROS APOSTADOS -</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {bets.map((b) => (
              <div 
                key={b.id}
                className="text-center font-bold text-lg py-2 bg-gray-50 rounded"
              >
                {b.numero}
              </div>
            ))}
          </div>
          
          <div className="space-y-1 pt-2 border-t border-dotted border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">QTD NÚMEROS:</span>
              <span className="font-semibold">{bets.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">VALOR UNIT:</span>
              <span className="font-semibold">R$ {valorUnit.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Total Section */}
        <div className="px-4 py-3 border-b border-dashed border-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">TOTAL:</span>
            <span className="text-xl font-bold">R$ {totalValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Prize Section */}
        <div className="px-4 py-4">
          <div className="border-2 border-black rounded-lg p-4 text-center bg-gray-50">
            <p className="text-sm text-gray-600 mb-1">VALOR DO PRÊMIO</p>
            <p className="text-2xl font-bold">
              R$ {potentialPrize.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 text-center space-y-1">
          <p className="text-xs text-gray-500">VALIDADE: 3 DIAS</p>
          <p className="text-lg font-bold tracking-wider">BOA SORTE!</p>
          <p className="text-xs text-gray-400">MILHARPRO.COM.BR</p>
        </div>

        {/* Dotted bottom edge */}
        <div className="h-3 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#e5e5e5_4px,#e5e5e5_8px)]" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handlePrint}
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleShare}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>
      </div>

      <Button 
        variant="accent" 
        size="lg"
        className="w-full mt-3"
        onClick={onClose}
      >
        Nova Aposta
      </Button>
    </div>
  );
}
