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

// Sem jogos iniciais - app zerado para produção
const initialGames: Game[] = [];

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
