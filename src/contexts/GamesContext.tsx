import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Game {
  id: string;
  nome: string;
  tipo: 'milhar' | 'centena';
  valor_minimo: number;
  valor_maximo: number;
  multiplicador: number;
  horario_abertura: string;
  horario_fechamento: string;
  ativo: boolean;
}

interface GamesContextType {
  games: Game[];
  addGame: (game: Game) => void;
  updateGame: (game: Game) => void;
  deleteGame: (id: string) => void;
  toggleActive: (id: string) => void;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

const initialGames: Game[] = [
  {
    id: '1',
    nome: 'Milhar Principal',
    tipo: 'milhar',
    valor_minimo: 1,
    valor_maximo: 100,
    multiplicador: 4000,
    horario_abertura: '08:00',
    horario_fechamento: '22:00',
    ativo: true,
  },
  {
    id: '2',
    nome: 'Centena Rápida',
    tipo: 'centena',
    valor_minimo: 1,
    valor_maximo: 200,
    multiplicador: 600,
    horario_abertura: '09:00',
    horario_fechamento: '21:00',
    ativo: true,
  },
];

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>(initialGames);

  const addGame = (game: Game) => {
    setGames((prev) => [...prev, game]);
  };

  const updateGame = (game: Game) => {
    setGames((prev) => prev.map((g) => (g.id === game.id ? game : g)));
  };

  const deleteGame = (id: string) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
  };

  const toggleActive = (id: string) => {
    setGames((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ativo: !g.ativo } : g))
    );
  };

  return (
    <GamesContext.Provider
      value={{ games, addGame, updateGame, deleteGame, toggleActive }}
    >
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GamesContext);
  if (!context) {
    throw new Error('useGames must be used within a GamesProvider');
  }
  return context;
}
