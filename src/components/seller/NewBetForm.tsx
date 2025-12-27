import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBets } from '@/contexts/BetsContext';
import { useGames } from '@/contexts/GamesContext';
import { useBlockedNumbers } from '@/contexts/BlockedNumbersContext';
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
  Trash2,
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
  const { getBlockedNumbersByGame } = useBlockedNumbers();
  const activeGames = games.filter((game) => game.ativo);

  const [selectedGame, setSelectedGame] = useState<GameType>('milhar');
  const [selectedRegisteredGameId, setSelectedRegisteredGameId] = useState<string | null>(
    null
  );
  const [numero, setNumero] = useState('');
  const [valor, setValor] = useState('');
  const [bettorName, setBettorName] = useState('');
  const [bettorPhone, setBettorPhone] = useState('');
  const [numbers, setNumbers] = useState<NumberEntry[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastBets, setLastBets] = useState<Bet[]>([]);

  const numeroInputRef = useRef<HTMLInputElement>(null);

  const selectedGameInfo = gameTypes.find((g) => g.type === selectedGame)!;
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

    setNumbers((prev) => [...prev, newEntry]);
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
    setNumero((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setNumero('');
    numeroInputRef.current?.focus();
  };

  const handleQuickValue = (value: number) => {
    setValor(value.toString());
  };

  const handleAddNumber = () => {
    if (!isNumberValid) {
      toast.error(`O número precisa ter ${selectedGameInfo.digits} dígitos`);
      return;
    }

    if (!selectedRegisteredGameId) {
      toast.error('Selecione um jogo antes de adicionar o número.');
      return;
    }

    const blockedForGame = getBlockedNumbersByGame(selectedRegisteredGameId);
    const blockedSet = new Set(blockedForGame.map((b) => b.numero));
    if (blockedSet.has(numero)) {
      toast.error('Este número foi vendido.');
      return;
    }

    const valorNumero = isValueValid ? parseFloat(valor) : 0;

    const newEntry: NumberEntry = {
      id: Date.now().toString(),
      numero,
      valor: valorNumero,
    };

    setNumbers((prev) => [...prev, newEntry]);
    setNumero('');

    toast.success(
      valorNumero > 0
        ? `Número ${numero} adicionado com valor R$ ${valorNumero.toFixed(2)}`
        : `Número ${numero} adicionado! Defina o valor depois.`,
    );
    numeroInputRef.current?.focus();
  };
  const handleRemoveNumber = (id: string) => {
    setNumbers((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = () => {
    setNumbers([]);
    setNumero('');
    setValor('');
    toast.info('Lista limpa');
  };

  const handleSubmit = async () => {
    if (!canSubmit || !user) return;

    if (!selectedRegisteredGameId) {
      toast.error('Selecione um jogo antes de finalizar a aposta.');
      return;
    }

    const blockedForGame = getBlockedNumbersByGame(selectedRegisteredGameId);
    const blockedSet = new Set(blockedForGame.map((b) => b.numero));

    const hasBlocked = numbers.some((entry) => blockedSet.has(entry.numero));
    if (hasBlocked) {
      toast.error('Há número(s) bloqueado(s) nesta aposta. Remova-os para continuar.');
      return;
    }

    const hasInvalidValue = numbers.some((entry) => !entry.valor || entry.valor <= 0);
    if (hasInvalidValue) {
      toast.error('Defina um valor maior que zero para todos os números antes de salvar.');
      return;
    }

    const bets: Bet[] = [];

    try {
      for (const entry of numbers) {
        const newBet = await addBet({
          vendedor_id: user.id,
          vendedor_nome: user.nome,
          tipo_jogo: selectedGame,
          numero: entry.numero,
          valor: entry.valor,
          apostador_nome: bettorName || undefined,
          apostador_telefone: bettorPhone || undefined,
        });
        bets.push(newBet);
      }
    } catch (error) {
      console.error('Erro ao registrar aposta(s):', error);
      toast.error('Erro ao registrar aposta. Tente novamente.');
      return;
    }

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
                }}
              >
                <option value="">Selecione um jogo registrado</option>
                {activeGames.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum jogo cadastrado. Peça ao administrador para configurar os jogos.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bettorName" className="text-sm text-muted-foreground">
              Nome do Apostador (opcional)
            </Label>
            <Input
              id="bettorName"
              type="text"
              placeholder="Nome"
              value={bettorName}
              onChange={(e) => setBettorName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bettorPhone" className="text-sm text-muted-foreground">
              Telefone (opcional)
            </Label>
            <Input
              id="bettorPhone"
              type="tel"
              placeholder="(99) 99999-9999"
              value={bettorPhone}
              onChange={(e) => setBettorPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm text-muted-foreground">
            Número para{' '}
            <span className="font-medium text-foreground">{selectedGameInfo.label}</span>
          </Label>
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Input
                ref={numeroInputRef}
                type="text"
                placeholder={`Informe o número com ${selectedGameInfo.digits} dígitos`}
                value={numero}
                maxLength={selectedGameInfo.digits}
                className="pl-11"
                onChange={(e) => setNumero(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <GameTypeBadge type={selectedGame} />
              </div>
            </div>
            <Button type="button" variant="outline" size="icon" onClick={handleRandomNumber}>
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleClear}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('1')}
            >
              1
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('2')}
            >
              2
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('3')}
            >
              3
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('4')}
            >
              4
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('5')}
            >
              5
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('6')}
            >
              6
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('7')}
            >
              7
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('8')}
            >
              8
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('9')}
            >
              9
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => handleNumberInput('0')}
            >
              0
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={handleDeleteDigit}
            >
              <Delete className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="justify-center h-10"
              onClick={() => {
                setNumero('');
                handleRandomNumber();
              }}
            >
              <Shuffle className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="border rounded-md border-border p-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="valor-input" className="text-sm text-muted-foreground">
              Valor (R$)
            </Label>
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => handleAddRandomWithValue()}
            >
              <Plus className="w-4 h-4 mr-2" />
              Com valor aleatório
            </Button>
          </div>
          <div className="flex items-center space-x-3 mt-2">
            <Input
              id="valor-input"
              type="number"
              placeholder="0,00"
              className="w-full"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddNumber}>
              Adicionar
            </Button>
          </div>

          <div className="flex items-center space-x-2 mt-3">
            {quickValues.map((value) => (
              <Button
                key={value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickValue(value)}
              >
                R$ {value.toFixed(2)}
              </Button>
            ))}
          </div>
        </div>

        {numbers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-foreground">
                Números adicionados <span className="text-muted-foreground">({numbers.length})</span>
              </h3>
              <Button type="button" variant="link" size="sm" onClick={handleClearAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar tudo
              </Button>
            </div>

            <ul className="space-y-2">
              {numbers.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-2 text-sm"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-foreground">{item.numero}</span>
                    {item.valor > 0 && (
                      <span className="text-muted-foreground">R$ {item.valor.toFixed(2)}</span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveNumber(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between font-semibold text-foreground">
              Total da Aposta: <span>R$ {totalValue.toFixed(2)}</span>
            </div>

            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Finalizar Aposta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
