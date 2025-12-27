import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  addGame: (game: Game) => Promise<void>;
  updateGame: (game: Game) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  toggleActive: (id: string) => Promise<void>;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    const loadGames = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Erro ao carregar jogos:', error);
        return;
      }

      if (data) {
        const mapped: Game[] = data.map((row: any) => ({
          id: row.id,
          nome: row.nome,
          tipo: row.tipo,
          valor_minimo: Number(row.valor_minimo),
          valor_maximo: Number(row.valor_maximo),
          multiplicador: Number(row.multiplicador),
          horario_abertura: row.horario_abertura,
          horario_fechamento: row.horario_fechamento,
          ativo: row.ativo,
        }));
        setGames(mapped);
      }
    };

    loadGames();
  }, []);

  const addGame = async (game: Game) => {
    const insertData = {
      nome: game.nome,
      tipo: game.tipo,
      valor_minimo: game.valor_minimo,
      valor_maximo: game.valor_maximo,
      multiplicador: game.multiplicador,
      horario_abertura: game.horario_abertura,
      horario_fechamento: game.horario_fechamento,
      ativo: game.ativo,
    };

    const { data, error } = await supabase
      .from('games')
      .insert(insertData)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao criar jogo:', error);
      return;
    }

    const newGame: Game = {
      id: data.id,
      nome: data.nome,
      tipo: data.tipo as 'milhar' | 'centena',
      valor_minimo: Number(data.valor_minimo),
      valor_maximo: Number(data.valor_maximo),
      multiplicador: Number(data.multiplicador),
      horario_abertura: data.horario_abertura,
      horario_fechamento: data.horario_fechamento,
      ativo: data.ativo,
    };

    setGames((prev) => [...prev, newGame]);
  };

  const updateGame = async (game: Game) => {
    const { data, error } = await supabase
      .from('games')
      .update({
        nome: game.nome,
        tipo: game.tipo,
        valor_minimo: game.valor_minimo,
        valor_maximo: game.valor_maximo,
        multiplicador: game.multiplicador,
        horario_abertura: game.horario_abertura,
        horario_fechamento: game.horario_fechamento,
        ativo: game.ativo,
      })
      .eq('id', game.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao atualizar jogo:', error);
      return;
    }

    const updated: Game = {
      id: data.id,
      nome: data.nome,
      tipo: data.tipo as 'milhar' | 'centena',
      valor_minimo: Number(data.valor_minimo),
      valor_maximo: Number(data.valor_maximo),
      multiplicador: Number(data.multiplicador),
      horario_abertura: data.horario_abertura,
      horario_fechamento: data.horario_fechamento,
      ativo: data.ativo,
    };

    setGames((prev) => prev.map((g) => (g.id === game.id ? updated : g)));
  };

  const deleteGame = async (id: string) => {
    const { error } = await supabase.from('games').delete().eq('id', id);

    if (error) {
      console.error('Erro ao excluir jogo:', error);
      return;
    }

    setGames((prev) => prev.filter((g) => g.id !== id));
  };

  const toggleActive = async (id: string) => {
    const game = games.find((g) => g.id === id);
    if (!game) return;

    const { data, error } = await supabase
      .from('games')
      .update({ ativo: !game.ativo })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao alternar status do jogo:', error);
      return;
    }

    const updated: Game = {
      id: data.id,
      nome: data.nome,
      tipo: data.tipo as 'milhar' | 'centena',
      valor_minimo: Number(data.valor_minimo),
      valor_maximo: Number(data.valor_maximo),
      multiplicador: Number(data.multiplicador),
      horario_abertura: data.horario_abertura,
      horario_fechamento: data.horario_fechamento,
      ativo: data.ativo,
    };

    setGames((prev) => prev.map((g) => (g.id === id ? updated : g)));
  };

  return (
    <GamesContext.Provider value={{ games, addGame, updateGame, deleteGame, toggleActive }}>
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
