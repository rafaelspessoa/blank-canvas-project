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
import { jsPDF } from 'jspdf';

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
    const numbersHtml = bets
      .map(
        (b) =>
          `<div style="text-align:center;font-weight:700;font-size:18px;padding:6px 0;margin-bottom:4px;border-radius:6px;background:#f3f4f6;">${b.numero}</div>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charSet="utf-8" />
  <title>Comprovante de Aposta</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 16px; background: #f5f5f5; }
    .receipt { max-width: 360px; margin: 0 auto; background: #ffffff; color: #111827; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); padding: 16px 16px 20px; font-size: 13px; }
    .title { text-align: center; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 4px; }
    .muted { color: #6b7280; }
    .section { border-top: 1px dashed #d1d5db; padding-top: 8px; margin-top: 8px; }
    .row { display: flex; justify-content: space-between; margin-top: 4px; }
    .numbers-title { text-align:center; margin-bottom:6px; color:#6b7280; }
    .total-box { margin-top:12px; padding:10px 12px; border-radius:8px; border:1px dashed #111827; text-align:center; }
    .total-label { font-size:12px; font-weight:600; }
    .total-value { font-size:18px; font-weight:700; margin-top:2px; }
    .prize-box { margin-top:12px; padding:10px 12px; border-radius:8px; border:2px solid #111827; text-align:center; background:#f9fafb; }
    .footer { margin-top:10px; text-align:center; font-size:11px; color:#9ca3af; }
    @media print { body { background:#fff; padding:0; } .receipt { box-shadow:none; margin:0; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="title">COMPROVANTE DE APOSTA</div>
    <div class="muted" style="text-align:center; margin-bottom:8px;">${format(
      new Date(bet.data_hora),
      "dd/MM/yyyy HH:mm",
      { locale: ptBR },
    )}</div>

    <div class="section">
      <div class="row"><span class="muted">RECIBO:</span><span>${receiptCode.substring(0, 20)}</span></div>
      <div class="row"><span class="muted">JOGO:</span><span>${bet.tipo_jogo.toUpperCase()}</span></div>
      <div class="row"><span class="muted">VENDEDOR:</span><span>${
        bet.vendedor_nome?.toUpperCase() ?? ''
      }</span></div>
      <div class="row"><span class="muted">APOSTADOR:</span><span>${(
        bet.apostador_nome || '-'
      ).toUpperCase()}</span></div>
      <div class="row"><span class="muted">TELEFONE:</span><span>${
        bet.apostador_telefone || '-'
      }</span></div>
    </div>

    <div class="section">
      <div class="numbers-title">- NÚMEROS APOSTADOS -</div>
      ${numbersHtml}
      <div class="row" style="margin-top:10px;"><span class="muted">QTD NÚMEROS:</span><span>${
        bets.length
      }</span></div>
      <div class="row"><span class="muted">VALOR UNIT:</span><span>R$ ${valorUnit.toFixed(
        2,
      )}</span></div>
    </div>

    <div class="total-box">
      <div class="total-label">TOTAL</div>
      <div class="total-value">R$ ${totalValue.toFixed(2)}</div>
    </div>

    <div class="prize-box">
      <div class="muted" style="font-size:12px;">VALOR DO PRÊMIO</div>
      <div style="font-size:18px;font-weight:700;">R$ ${potentialPrize.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
      })}</div>
    </div>

    <div class="footer">ESSE BILHETE VALE ATÉ AS 16H DO PROXIMO DIA • BOA SORTE!</div>
  </div>
  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

    const printWindow = window.open('', '_blank', 'width=420,height=600');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
    }

    toast.success('Abrindo comprovante para impressão...');
  };

  const handleGeneratePdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    const numbersText = bets.map((b) => b.numero).join('    ');

    const text = `
COMPROVANTE DE APOSTA
Data: ${format(new Date(bet.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}

RECIBO: ${receiptCode.substring(0, 20)}
JOGO: ${bet.tipo_jogo.toUpperCase()}
VENDEDOR: ${(bet.vendedor_nome || '-').toUpperCase()}
APOSTADOR: ${(bet.apostador_nome || '-').toUpperCase()}
TELEFONE: ${bet.apostador_telefone || '-'}

- NÚMEROS APOSTADOS -
${numbersText}

QTD NÚMEROS: ${bets.length}
VALOR UNIT: R$ ${valorUnit.toFixed(2)}
TOTAL: R$ ${totalValue.toFixed(2)}

VALOR DO PRÊMIO: R$ ${potentialPrize.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
    })}
`;

    doc.setFont('courier', 'normal');
    doc.setFontSize(11);
    const marginLeft = 40;
    const marginTop = 40;
    const maxWidth = 515; // A4 width (595pt) - margins
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, marginLeft, marginTop);

    doc.save('comprovante-aposta.pdf');
    toast.success('Comprovante salvo em PDF.');
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
          <p className="text-xs text-gray-500 font-bold">ESSE BILHETE VALE ATÉ AS 16H DO PROXIMO DIA</p>
          <p className="text-lg font-bold tracking-wider">BOA SORTE!</p>
        </div>

        {/* Dotted bottom edge */}
        <div className="h-3 bg-[repeating-linear-gradient(90deg,transparent,transparent_4px,#e5e5e5_4px,#e5e5e5_8px)]" />
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handlePrint}
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir comprovante
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleGeneratePdf}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Salvar PDF
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
