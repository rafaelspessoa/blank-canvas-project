import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBets } from '@/contexts/BetsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameType, Bet } from '@/types';
import { GameTypeBadge } from '@/components/shared/GameTypeBadge';
import { 
  Check, 
  Delete, 
  RotateCcw,
  Shuffle,
  Plus,
  X,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BetReceipt } from './BetReceipt';

const gameTypes: { type: GameType; label: string; digits: number }[] = [
  { type: 'milhar', label: 'Milhar', digits: 4 },
  { type: 'centena', label: 'Centena', digits: 3 },
  { type: 'dezena', label: 'Dezena', digits: 2 },
];

const quickValues = [1, 2, 5, 10, 20, 50];

interface NumberEntry {
  id: string;
  numero: string;
  valor: number;
}

export function NewBetForm() {
  const { user } = useAuth();
  const { addBet } = useBets();
  
  const [selectedGame, setSelectedGame] = useState<GameType>('milhar');
  const [numero, setNumero] = useState('');
  const [valor, setValor] = useState('');
  const [numbers, setNumbers] = useState<NumberEntry[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastBets, setLastBets] = useState<Bet[]>([]);
  
  const numeroInputRef = useRef<HTMLInputElement>(null);

  const selectedGameInfo = gameTypes.find(g => g.type === selectedGame)!;
  const isNumberValid = numero.length === selectedGameInfo.digits && /^\d+$/.test(numero);
  const isValueValid = parseFloat(valor) > 0;
  const canAddNumber = isNumberValid && isValueValid;
  const canSubmit = numbers.length > 0;

  const totalValue = numbers.reduce((acc, n) => acc + n.valor, 0);

  useEffect(() => {
    numeroInputRef.current?.focus();
  }, [selectedGame]);

  const generateRandomNumber = (): string => {
    const digits = selectedGameInfo.digits;
    let result = '';
    for (let i = 0; i < digits; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  };

  const handleRandomNumber = () => {
    const randomNum = generateRandomNumber();
    setNumero(randomNum);
    setTimeout(() => {
      document.getElementById('valor-input')?.focus();
    }, 100);
  };

  const handleAddRandomWithValue = () => {
    const currentValor = parseFloat(valor);
    if (!currentValor || currentValor <= 0) {
      toast.error('Informe um valor antes de gerar número aleatório');
      return;
    }
    
    const randomNum = generateRandomNumber();
    const newEntry: NumberEntry = {
      id: Date.now().toString(),
      numero: randomNum,
      valor: currentValor,
    };
    
    setNumbers(prev => [...prev, newEntry]);
    toast.success(`Número ${randomNum} adicionado!`);
  };

  const handleNumberInput = (digit: string) => {
    if (numero.length < selectedGameInfo.digits) {
      const newNumero = numero + digit;
      setNumero(newNumero);
      
      if (newNumero.length === selectedGameInfo.digits) {
        setTimeout(() => {
          document.getElementById('valor-input')?.focus();
        }, 100);
      }
    }
  };

  const handleDeleteDigit = () => {
    setNumero(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setNumero('');
    numeroInputRef.current?.focus();
  };

  const handleQuickValue = (value: number) => {
    setValor(value.toString());
  };

  const handleAddNumber = () => {
    if (!canAddNumber) return;

    const newEntry: NumberEntry = {
      id: Date.now().toString(),
      numero,
      valor: parseFloat(valor),
    };

    setNumbers(prev => [...prev, newEntry]);
    setNumero('');
    
    toast.success(`Número ${numero} adicionado à lista!`);
    numeroInputRef.current?.focus();
  };

  const handleRemoveNumber = (id: string) => {
    setNumbers(prev => prev.filter(n => n.id !== id));
  };

  const handleClearAll = () => {
    setNumbers([]);
    setNumero('');
    setValor('');
    toast.info('Lista limpa');
  };

  const handleSubmit = () => {
    if (!canSubmit || !user) return;

    const bets: Bet[] = [];
    
    numbers.forEach(entry => {
      const newBet = addBet({
        vendedor_id: user.id,
        vendedor_nome: user.nome,
        tipo_jogo: selectedGame,
        numero: entry.numero,
        valor: entry.valor,
      });
      bets.push(newBet);
    });

    setLastBets(bets);
    setShowReceipt(true);
    
    toast.success(`${numbers.length} aposta(s) registrada(s)!`, {
      description: `Total: R$ ${totalValue.toFixed(2)}`,
    });

    // Reset form
    setNumbers([]);
    setNumero('');
    setValor('');
  };

  if (showReceipt && lastBets.length > 0) {
    return (
      <BetReceipt 
        bet={lastBets[0]} 
        allBets={lastBets}
        onClose={() => {
          setShowReceipt(false);
          setLastBets([]);
        }} 
      />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nova Aposta</h1>
        <p className="text-muted-foreground mt-1">
          Adicione múltiplos números à aposta
        </p>
      </div>

      {/* Game Type Selection */}
      <div className="glass-card rounded-xl p-4">
        <Label className="text-sm text-muted-foreground mb-3 block">Tipo de Jogo</Label>
        <div className="grid grid-cols-3 gap-2">
          {gameTypes.map(({ type, label, digits }) => (
            <button
              key={type}
              onClick={() => {
                setSelectedGame(type);
                setNumero('');
                setNumbers([]);
              }}
              className={cn(
                "p-3 rounded-lg font-medium transition-all duration-200",
                selectedGame === type
                  ? `game-badge-${type} shadow-lg`
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="block text-sm">{label}</span>
              <span className="block text-xs opacity-75">{digits} dígitos</span>
            </button>
          ))}
        </div>
      </div>

      {/* Number Display */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm text-muted-foreground">Número</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRandomNumber}
            className="gap-2"
          >
            <Shuffle className="w-4 h-4" />
            Aleatório
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-4">
          {Array.from({ length: selectedGameInfo.digits }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-12 h-14 md:w-14 md:h-16 rounded-xl flex items-center justify-center",
                "border-2 font-mono text-2xl md:text-3xl font-bold transition-all duration-200",
                numero[idx] 
                  ? "border-accent bg-accent/10 text-foreground" 
                  : "border-border bg-muted text-muted-foreground",
                numero.length === idx && "border-accent animate-pulse-soft"
              )}
            >
              {numero[idx] || '-'}
            </div>
          ))}
        </div>

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              variant="secondary"
              size="lg"
              className="text-lg font-bold h-12"
              onClick={() => handleNumberInput(digit.toString())}
              disabled={numero.length >= selectedGameInfo.digits}
            >
              {digit}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="lg"
            className="text-lg h-12 text-muted-foreground"
            onClick={handleClear}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="text-lg font-bold h-12"
            onClick={() => handleNumberInput('0')}
            disabled={numero.length >= selectedGameInfo.digits}
          >
            0
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="text-lg h-12 text-destructive"
            onClick={handleDeleteDigit}
            disabled={numero.length === 0}
          >
            <Delete className="w-5 h-5" />
          </Button>
        </div>

        <input
          ref={numeroInputRef}
          type="text"
          inputMode="numeric"
          value={numero}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, selectedGameInfo.digits);
            setNumero(value);
          }}
          className="sr-only"
          aria-label="Número da aposta"
        />
      </div>

      {/* Value Input */}
      <div className="glass-card rounded-xl p-4">
        <Label className="text-sm text-muted-foreground mb-3 block">Valor da Aposta</Label>
        
        {/* Quick Values */}
        <div className="grid grid-cols-6 gap-2 mb-3">
          {quickValues.map((qv) => (
            <Button
              key={qv}
              variant={parseFloat(valor) === qv ? "accent" : "outline"}
              size="sm"
              onClick={() => handleQuickValue(qv)}
              className="font-semibold text-xs"
            >
              R${qv}
            </Button>
          ))}
        </div>

        <div className="relative mb-3">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
            R$
          </span>
          <Input
            id="valor-input"
            type="number"
            inputMode="decimal"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="pl-10 text-xl font-bold h-12 text-center"
            min="0"
            step="0.5"
          />
        </div>

        {/* Add Number Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleAddNumber}
            disabled={!canAddNumber}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleAddRandomWithValue}
            disabled={!isValueValid}
            className="gap-2"
          >
            <Shuffle className="w-5 h-5" />
            + Aleatório
          </Button>
        </div>
      </div>

      {/* Numbers List */}
      {numbers.length > 0 && (
        <div className="glass-card rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm text-muted-foreground">
              Números Adicionados ({numbers.length})
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-destructive hover:text-destructive gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {numbers.map((entry, index) => (
              <div 
                key={entry.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-5">
                    {index + 1}.
                  </span>
                  <span className="font-mono font-bold text-foreground text-lg">
                    {entry.numero}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-accent">
                    R$ {entry.valor.toFixed(2)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveNumber(entry.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Total:</span>
            <span className="text-xl font-bold text-foreground">
              R$ {totalValue.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        variant="accent"
        size="xl"
        className="w-full h-14 text-lg"
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        <Check className="w-6 h-6 mr-2" />
        Registrar {numbers.length > 0 ? `${numbers.length} Aposta(s)` : 'Aposta'}
      </Button>

      {/* Summary */}
      {canSubmit && (
        <div className="text-center text-muted-foreground animate-fade-in">
          <p className="text-sm">
            <GameTypeBadge type={selectedGame} size="sm" /> • 
            {numbers.length} número(s) • 
            Total <span className="font-bold text-foreground">R$ {totalValue.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
