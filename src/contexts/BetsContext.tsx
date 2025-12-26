import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Bet, GameType, BetStatus } from '@/types';

interface BetsContextType {
  bets: Bet[];
  addBet: (bet: Omit<Bet, 'id' | 'codigo' | 'data_hora' | 'status'>) => Bet;
  cancelBet: (id: string) => void;
  getBetsByVendedor: (vendedorId: string) => Bet[];
  getTodayBets: () => Bet[];
  getTodayTotal: (vendedorId?: string) => number;
  getTodayCount: (vendedorId?: string) => number;
}

const BetsContext = createContext<BetsContextType | undefined>(undefined);

// Generate unique bet code
const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Mock initial bets
const initialBets: Bet[] = [
  {
    id: '1',
    vendedor_id: '2',
    vendedor_nome: 'João Vendedor',
    tipo_jogo: 'milhar',
    numero: '1234',
    valor: 10,
    data_hora: new Date().toISOString(),
    status: 'ativa',
    codigo: 'ABC12345',
  },
  {
    id: '2',
    vendedor_id: '2',
    vendedor_nome: 'João Vendedor',
    tipo_jogo: 'centena',
    numero: '567',
    valor: 5,
    data_hora: new Date().toISOString(),
    status: 'ativa',
    codigo: 'DEF67890',
  },
  {
    id: '3',
    vendedor_id: '3',
    vendedor_nome: 'Maria Vendedora',
    tipo_jogo: 'dezena',
    numero: '89',
    valor: 2,
    data_hora: new Date().toISOString(),
    status: 'ativa',
    codigo: 'GHI11223',
  },
];

export function BetsProvider({ children }: { children: ReactNode }) {
  const [bets, setBets] = useState<Bet[]>(initialBets);

  const addBet = (betData: Omit<Bet, 'id' | 'codigo' | 'data_hora' | 'status'>): Bet => {
    const newBet: Bet = {
      ...betData,
      id: Date.now().toString(),
      codigo: generateCode(),
      data_hora: new Date().toISOString(),
      status: 'ativa',
    };
    setBets(prev => [newBet, ...prev]);
    return newBet;
  };

  const cancelBet = (id: string) => {
    setBets(prev =>
      prev.map(bet =>
        bet.id === id ? { ...bet, status: 'cancelada' as BetStatus } : bet
      )
    );
  };

  const getBetsByVendedor = (vendedorId: string) => {
    return bets.filter(bet => bet.vendedor_id === vendedorId);
  };

  const getTodayBets = () => {
    const today = new Date().toDateString();
    return bets.filter(bet => new Date(bet.data_hora).toDateString() === today);
  };

  const getTodayTotal = (vendedorId?: string) => {
    const todayBets = getTodayBets().filter(bet => bet.status === 'ativa');
    const filtered = vendedorId 
      ? todayBets.filter(bet => bet.vendedor_id === vendedorId)
      : todayBets;
    return filtered.reduce((sum, bet) => sum + bet.valor, 0);
  };

  const getTodayCount = (vendedorId?: string) => {
    const todayBets = getTodayBets();
    return vendedorId 
      ? todayBets.filter(bet => bet.vendedor_id === vendedorId).length
      : todayBets.length;
  };

  return (
    <BetsContext.Provider value={{
      bets,
      addBet,
      cancelBet,
      getBetsByVendedor,
      getTodayBets,
      getTodayTotal,
      getTodayCount,
    }}>
      {children}
    </BetsContext.Provider>
  );
}

export function useBets() {
  const context = useContext(BetsContext);
  if (context === undefined) {
    throw new Error('useBets must be used within a BetsProvider');
  }
  return context;
}
