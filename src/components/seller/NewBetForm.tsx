import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBets } from '@/contexts/BetsContext';
import { useGames } from '@/contexts/GamesContext';
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
  const { games } = useGames();
  const activeGames = games.filter((game) => game.ativo);
  
  const [selectedGame, setSelectedGame] = useState<GameType>('milhar');
  const [selectedRegisteredGameId, setSelectedRegisteredGameId] = useState<string | null>(null);
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
    <div className="max-w-xl mx-auto space-y-4 animate-fade-in">
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dados da Aposta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione o jogo, informe o apostador e adicione os números.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Selecione o Jogo</Label>
          {activeGames.length > 0 ? (
            <div className="w-full">
              <select
                className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                value={selectedRegisteredGameId ?? ''}
                onChange={(e) => {
                  const id = e.target.value || null;
                  setSelectedRegisteredGameId(id);

                  const game = activeGames.find((g) => g.id === id);
                  if (game) {
                    setSelectedGame(game.tipo);
                  }

                  setNumero('');
                  setNumbers([]);
                }}
              >
                <option value="" disabled>
                  Escolha um jogo disponível
                </option>
                {activeGames.map((game) => {
                  const gameInfo = gameTypes.find((g) => g.type === game.tipo)!;
                  return (
                    <option key={game.id} value={game.id}>
                      {game.nome} • {gameInfo.label} ({gameInfo.digits} dígitos)
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum jogo cadastrado encontrado. Cadastre jogos na área administrativa.
            </p>
          )}
        </div>

        {/* Nome do Apostador */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Nome do Apostador (opcional)</Label>
          <Input
            placeholder="Digite o nome do apostador"
            // Mantemos este estado apenas na interface por enquanto
            // para não alterar a estrutura das apostas salvas.
            value={""}
            onChange={() => {}}
          />
        </div>

        {/* Número da Aposta */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Números ({selectedGameInfo.digits} dígitos)
          </Label>
          <div className="flex gap-2">
            <Input
              ref={numeroInputRef}
              type="text"
              inputMode="numeric"
              maxLength={selectedGameInfo.digits}
              placeholder={''.padStart(selectedGameInfo.digits, '0')}
              value={numero}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, selectedGameInfo.digits);
                setNumero(value);
              }}
              className="flex-1 text-center font-mono text-lg"
              aria-label="Número da aposta"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddNumber}
              disabled={!canAddNumber}
              className="gap-1 px-4"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAll}
              className="px-3"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Valor por Número */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Valor por Número (R$)</Label>
          <div className="relative">
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
              className="pl-10 text-base h-11"
              min="0"
              step="0.5"
            />
          </div>
        </div>

        {/* Lista de Números */}
        {numbers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-muted-foreground">
                Números adicionados ({numbers.length})
              </Label>
              <span className="text-sm font-medium text-foreground">
                Total: R$ {totalValue.toFixed(2)}
              </span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {numbers.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                    <span className="font-mono font-semibold text-foreground text-base">
                      {entry.numero}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-accent">
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
          </div>
        )}
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => {
            setNumbers([]);
            setNumero('');
            setValor('');
            setSelectedRegisteredGameId(null);
          }}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="accent"
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          <Check className="w-5 h-5 mr-2" />
          Salvar Aposta
        </Button>
      </div>

      {/* Resumo */}
      {canSubmit && (
        <div className="text-center text-muted-foreground animate-fade-in text-sm">
          <p>
            <GameTypeBadge type={selectedGame} size="sm" /> • {numbers.length} número(s) • Total{' '}
            <span className="font-bold text-foreground">R$ {totalValue.toFixed(2)}</span>
          </p>
        </div>
      )}
    </div>
  );
}
