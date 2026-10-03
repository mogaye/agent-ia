-- =============================================================================
-- SMG Flow - Schéma SQL Supabase PostgreSQL & Politiques RLS Multi-Tenant
-- Domaine : https://smgflow.pro
-- =============================================================================

-- 1. Table des Entreprises (Tenants)
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  agent_name TEXT DEFAULT 'Nova',
  industry TEXT DEFAULT 'Commerce & Services',
  email TEXT,
  phone TEXT,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  data_space_id TEXT UNIQUE NOT NULL,
  monthly_credits_limit INTEGER DEFAULT 2500,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Utilisateurs & Rôles
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'company_user' CHECK (role IN ('super_admin', 'company_admin', 'company_user')),
  company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Demandes de Code OTP (Hashés cryptographiquement, jamais en clair)
CREATE TABLE IF NOT EXISTS public.otp_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL,
  hashed_code TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour suppression et vérification rapide des OTP
CREATE INDEX IF NOT EXISTS idx_otp_identifier ON public.otp_requests(identifier);

-- 4. Table des Contextes d'Agents IA (Strictement isolés par entreprise)
CREATE TABLE IF NOT EXISTS public.ai_agent_context (
  company_id TEXT PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  agent_name TEXT DEFAULT 'Nova',
  industry TEXT,
  services JSONB,
  documents_context TEXT,
  instructions TEXT,
  strict_rules TEXT,
  opening_hours TEXT,
  address TEXT,
  pricing_rules TEXT,
  personal_contact_name TEXT,
  personal_contact_phone TEXT,
  response_latency_seconds INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des Journaux WhatsApp (Isolés par entreprise, contenus masqués)
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  message_body TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_company ON public.whatsapp_logs(company_id, created_at DESC);

-- 6. Table de Gestion des Consentements & Désabonnements WhatsApp (STOP / RGPD)
CREATE TABLE IF NOT EXISTS public.whatsapp_opt_outs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  reason TEXT DEFAULT 'Demande client',
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, phone_number)
);

-- 7. Table des Transactions et Paiements
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  ref_command TEXT UNIQUE NOT NULL,
  gateway TEXT NOT NULL CHECK (gateway IN ('paytech', 'paydunya', 'direct')),
  plan_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  credits_added INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
  payment_method TEXT NOT NULL,
  company_id TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name TEXT,
  client_name TEXT,
  client_phone TEXT,
  token TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_company ON public.transactions(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_ref ON public.transactions(ref_command);

-- =============================================================================
-- POLITIQUES DE SÉCURITÉ AU NIVEAU DE LA LIGNE (ROW LEVEL SECURITY - RLS)
-- =============================================================================

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_opt_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_requests ENABLE ROW LEVEL SECURITY;

-- Note : Le backend Express utilise la SERVICE_ROLE_KEY de Supabase qui contourne
-- le RLS pour exécuter les opérations validées par les middlewares d'autorisation serveur.
-- Les politiques ci-dessous protègent l'accès direct des clients (ANON_KEY).

-- Accès direct restreint par défaut
CREATE POLICY "Accès refusé direct pour les clés anonymes" ON public.otp_requests
  FOR ALL TO anon USING (false);

CREATE POLICY "Lecture isolée du contexte agent" ON public.ai_agent_context
  FOR SELECT TO authenticated USING (auth.jwt() ->> 'company_id' = company_id);

CREATE POLICY "Lecture isolée des logs whatsapp" ON public.whatsapp_logs
  FOR SELECT TO authenticated USING (auth.jwt() ->> 'company_id' = company_id);

CREATE POLICY "Lecture isolée des transactions" ON public.transactions
  FOR SELECT TO authenticated USING (auth.jwt() ->> 'company_id' = company_id);
