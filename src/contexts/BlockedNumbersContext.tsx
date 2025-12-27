import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BlockedNumber {
  id: string;
  gameId: string;
  numero: string;
}

interface BlockedNumbersContextType {
  blockedNumbers: BlockedNumber[];
  addBlockedNumber: (gameId: string, numero: string) => Promise<void>;
  removeBlockedNumber: (id: string) => Promise<void>;
  getBlockedNumbersByGame: (gameId: string) => BlockedNumber[];
}

const BlockedNumbersContext = createContext<BlockedNumbersContextType | undefined>(
  undefined
);

export function BlockedNumbersProvider({ children }: { children: ReactNode }) {
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>([]);

  useEffect(() => {
    const loadBlocked = async () => {
      const { data, error } = await supabase.from('blocked_numbers').select('*');

      if (error) {
        console.error('Erro ao carregar números bloqueados:', error);
        return;
      }

      if (data) {
        const mapped: BlockedNumber[] = data.map((row: any) => ({
          id: row.id,
          gameId: row.game_id,
          numero: row.numero,
        }));
        setBlockedNumbers(mapped);
      }
    };

    loadBlocked();
  }, []);

  const addBlockedNumber = async (gameId: string, numero: string) => {
    const { data, error } = await supabase
      .from('blocked_numbers')
      .insert({ game_id: gameId, numero })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao bloquear número:', error);
      return;
    }

    const newItem: BlockedNumber = {
      id: data.id,
      gameId: data.game_id,
      numero: data.numero,
    };

    setBlockedNumbers((prev) => {
      if (prev.some((b) => b.gameId === newItem.gameId && b.numero === newItem.numero)) {
        return prev;
      }
      return [...prev, newItem];
    });
  };

  const removeBlockedNumber = async (id: string) => {
    const { error } = await supabase.from('blocked_numbers').delete().eq('id', id);

    if (error) {
      console.error('Erro ao remover número bloqueado:', error);
      return;
    }

    setBlockedNumbers((prev) => prev.filter((b) => b.id !== id));
  };

  const getBlockedNumbersByGame = (gameId: string) =>
    blockedNumbers.filter((b) => b.gameId === gameId);

  return (
    <BlockedNumbersContext.Provider
      value={{ blockedNumbers, addBlockedNumber, removeBlockedNumber, getBlockedNumbersByGame }}
    >
      {children}
    </BlockedNumbersContext.Provider>
  );
}

export function useBlockedNumbers() {
  const context = useContext(BlockedNumbersContext);
  if (!context) {
    throw new Error('useBlockedNumbers must be used within a BlockedNumbersProvider');
  }
  return context;
}
