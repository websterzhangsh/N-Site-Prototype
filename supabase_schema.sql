-- ============================================================
-- Supabase Schema: Customer Design Intake
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. Main intake submissions table
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_intakes (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Step 1: Basic Info
    client_name             TEXT        NOT NULL,
    email                   TEXT        NOT NULL,
    phone                   TEXT        NOT NULL,
    project_address         TEXT,
    project_type            TEXT        NOT NULL CHECK (project_type IN ('sunroom', 'pavilion', 'windproof', 'combo', 'other')),
    communication_preference TEXT       CHECK (communication_preference IN ('phone', 'email', 'wechat', '')),
    
    -- Step 2: Project Requirements
    budget_range            TEXT        NOT NULL CHECK (budget_range IN ('under_100k', '100k_300k', '300k_700k', 'over_700k')),
    start_date              DATE,
    completion_date         DATE,
    household_size          INTEGER     CHECK (household_size IS NULL OR (household_size >= 1 AND household_size <= 20)),
    entertaining_frequency  TEXT        CHECK (entertaining_frequency IN ('rarely', 'monthly', 'weekly', 'daily', '')),
    space_needs             TEXT[]      DEFAULT '{}',
    project_goals           TEXT,
    
    -- Step 3: Design Preferences
    style_preferences       TEXT[]      DEFAULT '{}',
    pain_points             TEXT[]      DEFAULT '{}',
    sustainability          TEXT[]      DEFAULT '{}',
    materials_colors        TEXT,
    additional_comments     TEXT,
    
    -- Metadata
    language                TEXT        DEFAULT 'en' CHECK (language IN ('en', 'zh')),
    status                  TEXT        DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'completed', 'archived')),
    assigned_to             UUID,
    internal_notes          TEXT,
    
    -- Timestamps
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Indexes for common queries
-- ============================================================
CREATE INDEX idx_intakes_email       ON customer_intakes (email);
CREATE INDEX idx_intakes_status      ON customer_intakes (status);
CREATE INDEX idx_intakes_project_type ON customer_intakes (project_type);
CREATE INDEX idx_intakes_created_at  ON customer_intakes (created_at DESC);
CREATE INDEX idx_intakes_budget      ON customer_intakes (budget_range);

-- ============================================================
-- 3. Auto-update updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON customer_intakes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. Row Level Security (RLS)
-- ============================================================
ALTER TABLE customer_intakes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (public form submission)
CREATE POLICY "Allow anonymous inserts"
    ON customer_intakes
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Only authenticated users can read
CREATE POLICY "Authenticated users can read"
    ON customer_intakes
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only authenticated users can update
CREATE POLICY "Authenticated users can update"
    ON customer_intakes
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 5. Optional: Intake images table (for future image uploads)
-- ============================================================
CREATE TABLE IF NOT EXISTS intake_images (
    id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    intake_id       UUID NOT NULL REFERENCES customer_intakes(id) ON DELETE CASCADE,
    image_url       TEXT NOT NULL,
    image_type      TEXT NOT NULL CHECK (image_type IN ('inspiration', 'disliked', 'site_photo')),
    caption         TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intake_images_intake_id ON intake_images (intake_id);

ALTER TABLE intake_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous image inserts"
    ON intake_images
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Authenticated users can read images"
    ON intake_images
    FOR SELECT
    TO authenticated
    USING (true);
