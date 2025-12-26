export type UserRole = 'admin' | 'vendedor';

export type GameType = 'milhar' | 'centena' | 'dezena';

export type BetStatus = 'ativa' | 'cancelada' | 'paga';

export interface User {
  id: string;
  nome: string;
  usuario: string;
  perfil: UserRole;
  comissao: number;
  status: 'ativo' | 'bloqueado';
  limite_apostas?: number;
  created_at: string;
}

export interface Bet {
  id: string;
  vendedor_id: string;
  vendedor_nome?: string;
  tipo_jogo: GameType;
  numero: string;
  valor: number;
  data_hora: string;
  status: BetStatus;
  codigo: string;
}

export interface DailyClose {
  id: string;
  data: string;
  total_apostado: number;
  total_comissao: number;
  lucro: number;
  vendedor_id?: string;
}

export interface GameSettings {
  tipo_jogo: GameType;
  valor_minimo: number;
  valor_maximo: number;
  multiplicador: number;
}

export interface DashboardStats {
  totalApostadoHoje: number;
  totalApostas: number;
  apostasAbertas: number;
  apostasFechadas: number;
  lucroBruto: number;
  lucroLiquido: number;
}
