-- Create games table for configurable game settings
CREATE TABLE IF NOT EXISTS public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('milhar', 'centena', 'dezena')),
  valor_minimo numeric NOT NULL,
  valor_maximo numeric NOT NULL,
  multiplicador numeric NOT NULL,
  horario_abertura text NOT NULL,
  horario_fechamento text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view games
CREATE POLICY "Users can view games"
ON public.games
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow admins to manage games
CREATE POLICY "Admins manage games"
ON public.games
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));


-- Create bets table to persist all bets
CREATE TABLE IF NOT EXISTS public.bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  tipo_jogo text NOT NULL CHECK (tipo_jogo IN ('milhar', 'centena', 'dezena')),
  numero text NOT NULL,
  valor numeric NOT NULL,
  data_hora timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'cancelada', 'paga')),
  codigo text NOT NULL,
  apostador_nome text,
  apostador_telefone text
);

ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- Sellers can manage their own bets; admins can manage all
CREATE POLICY "Sellers manage own bets"
ON public.bets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = bets.vendedor_id
      AND p.auth_user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = bets.vendedor_id
      AND p.auth_user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);


-- Create blocked_numbers table for blocked numbers per game
CREATE TABLE IF NOT EXISTS public.blocked_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  numero text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, numero)
);

ALTER TABLE public.blocked_numbers ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view blocked numbers
CREATE POLICY "Users can view blocked numbers"
ON public.blocked_numbers
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can modify blocked numbers
CREATE POLICY "Admins manage blocked numbers"
ON public.blocked_numbers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));