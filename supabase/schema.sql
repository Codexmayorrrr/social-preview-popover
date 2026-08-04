-- ====================================================================
-- DOCK.BIO / LIQUID BIO - SUPABASE DATABASE MIGRATION & SCHEMA
-- ====================================================================

-- 1. Create Users Table (Profile & Subdomain Handle Mapping)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for instant handle lookups (e.g. dock.bio/@mayowa)
CREATE INDEX IF NOT EXISTS idx_users_handle ON public.users(handle);

-- 2. Create Links Table (Dock Items)
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  platform_key TEXT NOT NULL,
  url TEXT NOT NULL,
  position INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching links ordered by position
CREATE INDEX IF NOT EXISTS idx_links_user_position ON public.links(user_id, position ASC);

-- ====================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Public Read Access for Profiles
CREATE POLICY "Public profiles are readable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Public Read Access for Active Links
CREATE POLICY "Public links are readable by everyone" 
ON public.links FOR SELECT 
USING (is_active = true);

-- Owner Write Access for Links
CREATE POLICY "Users can insert their own links" 
ON public.links FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links" 
ON public.links FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" 
ON public.links FOR DELETE 
USING (auth.uid() = user_id);
