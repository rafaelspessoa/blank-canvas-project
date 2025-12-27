-- 1) Create app_role enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'vendedor');
  END IF;
END $$;

-- 2) Create user_roles table (no FK to auth.users per guidelines)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 4) RLS policies for user_roles
-- Only admins can see and manage roles; users can see their own roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view own roles'
  ) THEN
    CREATE POLICY "Users can view own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins manage roles'
  ) THEN
    CREATE POLICY "Admins manage roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- 5) Profiles table to store app-specific user info (separate from auth schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,
  nome TEXT,
  usuario TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'ativo', -- 'ativo' | 'bloqueado'
  comissao NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6) RLS policies for profiles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users view own profile'
  ) THEN
    CREATE POLICY "Users view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = auth_user_id OR public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Admins manage profiles'
  ) THEN
    CREATE POLICY "Admins manage profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;