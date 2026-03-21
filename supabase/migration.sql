-- HawkLaunch Database Schema
-- Run this in your Supabase SQL editor

-- Store TikTok OAuth tokens
CREATE TABLE IF NOT EXISTS tiktok_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  advertiser_ids TEXT[] DEFAULT '{}',
  bc_ids TEXT[] DEFAULT '{}',
  scope TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad accounts linked to BC
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  advertiser_id TEXT NOT NULL UNIQUE,
  advertiser_name TEXT,
  bc_id TEXT,
  status TEXT DEFAULT 'active',
  currency TEXT DEFAULT 'BRL',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  balance DECIMAL(12,2) DEFAULT 0,
  identity_id TEXT,
  identity_type TEXT,
  pixel_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign launch history
CREATE TABLE IF NOT EXISTS launch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL,
  config JSONB NOT NULL,
  accounts_count INT DEFAULT 0,
  campaigns_created INT DEFAULT 0,
  adgroups_created INT DEFAULT 0,
  ads_created INT DEFAULT 0,
  errors INT DEFAULT 0,
  status TEXT DEFAULT 'pending',
  logs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Presets (saved campaign configs)
CREATE TABLE IF NOT EXISTS presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  campaign_type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spark Ads profiles cache
CREATE TABLE IF NOT EXISTS spark_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  advertiser_id TEXT NOT NULL,
  identity_id TEXT NOT NULL,
  identity_type TEXT NOT NULL,
  display_name TEXT,
  profile_image TEXT,
  tt_user_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(advertiser_id, identity_id)
);

-- Row Level Security
ALTER TABLE tiktok_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users see own tokens" ON tiktok_tokens FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own accounts" ON ad_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own launches" ON launch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own presets" ON presets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users see own profiles" ON spark_profiles FOR ALL USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_ad_accounts_advertiser ON ad_accounts(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_bc ON ad_accounts(bc_id);
CREATE INDEX IF NOT EXISTS idx_launch_history_user ON launch_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spark_profiles_adv ON spark_profiles(advertiser_id);
