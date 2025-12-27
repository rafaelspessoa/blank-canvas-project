import React, { useState } from 'react';
import { useGames } from '@/contexts/GamesContext';
import { useBlockedNumbers } from '@/contexts/BlockedNumbersContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GameTypeBadge } from '@/components/shared/GameTypeBadge';
import { toast } from 'sonner';

const gameTypeInfo: Record<string, { label: string; digits: number }> = {
  milhar: { label: 'Milhar', digits: 4 },
  centena: { label: 'Centena', digits: 3 },
  dezena: { label: 'Dezena', digits: 2 },
};

export function BlockedNumbersManagement() {
  const { games } = useGames();
  const { getBlockedNumbersByGame, addBlockedNumber, removeBlockedNumber } =
    useBlockedNumbers();

  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [numero, setNumero] = useState('');

  const selectedGame = games.find((g) => g.id === selectedGameId) || null;
  const blockedForGame = selectedGameId ? getBlockedNumbersByGame(selectedGameId) : [];

  const handleAdd = async () => {
    if (!selectedGame) {
      toast.error('Selecione um jogo primeiro');
      return;
    }

    const info = gameTypeInfo[selectedGame.tipo];
    const clean = numero.trim();

    if (!info) {
      toast.error('Tipo de jogo inválido');
      return;
    }

    if (!/^\d+$/.test(clean) || clean.length !== info.digits) {
      toast.error(`Informe um número com ${info.digits} dígitos para ${info.label}`);
      return;
    }

    await addBlockedNumber(selectedGame.id, clean);
    toast.success(`Número ${clean} bloqueado para o jogo ${selectedGame.nome}`);
    setNumero('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Números Bloqueados</h1>
        <p className="text-muted-foreground mt-1">
          Segure números específicos por jogo para impedir novas apostas nesses números.
        </p>
      </div>

      <div className="glass-card rounded-xl p-4 md:p-6 space-y-4">
        <div className="space-y-2">
          <Label>Selecione o jogo</Label>
          <select
            className="w-full h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            value={selectedGameId}
            onChange={(e) => setSelectedGameId(e.target.value)}
          >
            <option value="">Escolha um jogo</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.nome}
              </option>
            ))}
          </select>
        </div>

        {selectedGame && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GameTypeBadge type={selectedGame.tipo} />
                <span className="text-sm text-muted-foreground">
                  {gameTypeInfo[selectedGame.tipo].label} •{' '}
                  {gameTypeInfo[selectedGame.tipo].digits} dígitos
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label>Número para bloquear</Label>
                <Input
                  value={numero}
                  onChange={(e) => setNumero(e.target.value.replace(/\D/g, ''))}
                  maxLength={gameTypeInfo[selectedGame.tipo].digits}
                  placeholder={`Digite ${gameTypeInfo[selectedGame.tipo].digits} dígitos`}
                />
              </div>

              <Button
                type="button"
                variant="destructive"
                className="mt-1 sm:mt-0 sm:w-40"
                onClick={handleAdd}
              >
                Adicionar número
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectedGame && (
        <div className="glass-card rounded-xl p-4 md:p-6">
          <h2 className="font-semibold text-foreground mb-3">
            Números bloqueados para {selectedGame.nome}
          </h2>
          {blockedForGame.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum número bloqueado para este jogo.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {blockedForGame.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <span className="font-mono font-semibold text-foreground">
                    {item.numero}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      await removeBlockedNumber(item.id);
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
