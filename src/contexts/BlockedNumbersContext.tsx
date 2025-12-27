import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BlockedNumber {
  id: string;
  gameId: string;
  numero: string;
}

interface BlockedNumbersContextType {
  blockedNumbers: BlockedNumber[];
  addBlockedNumber: (gameId: string, numero: string) => void;
  removeBlockedNumber: (id: string) => void;
  getBlockedNumbersByGame: (gameId: string) => BlockedNumber[];
}

const BlockedNumbersContext = createContext<BlockedNumbersContextType | undefined>(
  undefined
);

const initialBlockedNumbers: BlockedNumber[] = [];

export function BlockedNumbersProvider({ children }: { children: ReactNode }) {
  const [blockedNumbers, setBlockedNumbers] = useState<BlockedNumber[]>(
    initialBlockedNumbers
  );

  const addBlockedNumber = (gameId: string, numero: string) => {
    setBlockedNumbers((prev) => {
      // avoid duplicates for same game/number
      if (prev.some((b) => b.gameId === gameId && b.numero === numero)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          gameId,
          numero,
        },
      ];
    });
  };

  const removeBlockedNumber = (id: string) => {
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
