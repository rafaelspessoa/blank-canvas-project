import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bet, BetStatus } from '@/types';

interface BetsContextType {
  bets: Bet[];
  addBet: (bet: Omit<Bet, 'id' | 'codigo' | 'data_hora' | 'status'>) => Promise<Bet>;
  cancelBet: (id: string) => Promise<void>;
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

function mapBetRow(row: any): Bet {
  return {
    id: row.id,
    vendedor_id: row.vendedor_id,
    vendedor_nome: row.vendedor_nome ?? undefined,
    tipo_jogo: row.tipo_jogo,
    numero: row.numero,
    valor: Number(row.valor),
    data_hora: row.data_hora,
    status: row.status as BetStatus,
    codigo: row.codigo,
    apostador_nome: row.apostador_nome ?? undefined,
    apostador_telefone: row.apostador_telefone ?? undefined,
  };
}

export function BetsProvider({ children }: { children: ReactNode }) {
  const [bets, setBets] = useState<Bet[]>([]);

  useEffect(() => {
    const loadBets = async () => {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .order('data_hora', { ascending: false });

      if (error) {
        console.error('Erro ao carregar apostas:', error);
        return;
      }

      if (data) {
        setBets(data.map(mapBetRow));
      }
    };

    loadBets();
  }, []);

  const addBet = async (
    betData: Omit<Bet, 'id' | 'codigo' | 'data_hora' | 'status'>
  ): Promise<Bet> => {
    const insertData = {
      vendedor_id: betData.vendedor_id,
      vendedor_nome: betData.vendedor_nome ?? null,
      tipo_jogo: betData.tipo_jogo,
      numero: betData.numero,
      valor: betData.valor,
      codigo: generateCode(),
      apostador_nome: betData.apostador_nome ?? null,
      apostador_telefone: betData.apostador_telefone ?? null,
    };

    const { data, error } = await supabase
      .from('bets')
      .insert(insertData)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao salvar aposta:', error);
      throw new Error('Erro ao salvar aposta');
    }

    const newBet = mapBetRow(data);
    setBets((prev) => [newBet, ...prev]);
    return newBet;
  };

  const cancelBet = async (id: string) => {
    const { data, error } = await supabase
      .from('bets')
      .update({ status: 'cancelada' })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao cancelar aposta:', error);
      return;
    }

    const updated = mapBetRow(data);
    setBets((prev) => prev.map((bet) => (bet.id === id ? updated : bet)));
  };

  const getBetsByVendedor = (vendedorId: string) => {
    return bets.filter((bet) => bet.vendedor_id === vendedorId);
  };

  const getTodayBets = () => {
    const today = new Date().toDateString();
    return bets.filter((bet) => new Date(bet.data_hora).toDateString() === today);
  };

  const getTodayTotal = (vendedorId?: string) => {
    const todayBets = getTodayBets().filter((bet) => bet.status === 'ativa');
    const filtered = vendedorId
      ? todayBets.filter((bet) => bet.vendedor_id === vendedorId)
      : todayBets;
    return filtered.reduce((sum, bet) => sum + bet.valor, 0);
  };

  const getTodayCount = (vendedorId?: string) => {
    const todayBets = getTodayBets();
    return vendedorId
      ? todayBets.filter((bet) => bet.vendedor_id === vendedorId).length
      : todayBets.length;
  };

  return (
    <BetsContext.Provider
      value={{
        bets,
        addBet,
        cancelBet,
        getBetsByVendedor,
        getTodayBets,
        getTodayTotal,
        getTodayCount,
      }}
    >
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
