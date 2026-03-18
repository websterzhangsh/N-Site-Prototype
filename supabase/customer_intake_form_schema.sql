-- ============================================================
-- Supabase Schema: Client Design Intake Questionnaire
-- Aligned with Appendix A of business-workflow.md (8 Modules)
-- Multi-tenant enabled, linked to projects table
-- Version: 2.0.0 | Updated: 2026-03-18
-- ============================================================
-- MIGRATION NOTE: This replaces the v1 customer_intakes table.
-- Run DROP TABLE IF EXISTS customer_intakes, intake_images CASCADE;
-- before applying this migration in a fresh environment.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. intake_questionnaires — Main questionnaire per project
--    One-to-one with projects table (each project has one intake)
-- ============================================================
CREATE TABLE IF NOT EXISTS intake_questionnaires (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id),

    -- ========================================================
    -- A.1 Customer Basics (客户基本信息)
    -- Note: Core contact info lives in customers table.
    -- These fields capture intake-specific extras.
    -- ========================================================
    a1_preferred_contact    VARCHAR(20) CHECK (a1_preferred_contact IN ('phone', 'sms', 'email', 'video')),
    a1_other_decision_makers JSONB DEFAULT '[]'::jsonb,
        -- e.g. [{"name": "Jane", "relationship": "spouse"}]

    -- ========================================================
    -- A.2 Project Overview (项目概况)
    -- ========================================================
    a2_usage_scenario       VARCHAR(50) NOT NULL
        CHECK (a2_usage_scenario IN (
            'residential_house', 'residential_apartment',
            'commercial_restaurant', 'commercial_cafe',
            'office', 'hotel_resort', 'poolside', 'other'
        )),
    a2_usage_scenario_other TEXT,
    a2_install_location     VARCHAR(50) NOT NULL
        CHECK (a2_install_location IN (
            'patio_ground', 'terrace_upper', 'raised_platform',
            'rooftop', 'commercial_space', 'other'
        )),
    a2_install_location_other TEXT,
    a2_primary_usage        TEXT[] DEFAULT '{}',
        -- multi-select: leisure, gym, study, dining, kids_play, pets,
        -- garden, pool_cover, other
    a2_wall_connected       BOOLEAN NOT NULL DEFAULT FALSE,
    a2_wall_connected_detail TEXT,
        -- e.g. "attached to main house south wall"
    a2_dimension_length_ft  DECIMAL(8,2),
    a2_dimension_width_ft   DECIMAL(8,2),
    a2_dimension_height_ft  DECIMAL(8,2),
    a2_special_constraints  TEXT,

    -- ========================================================
    -- A.3 Usage & Lifestyle (使用需求与生活方式)
    -- ========================================================
    a3_usage_duration       VARCHAR(30) NOT NULL
        CHECK (a3_usage_duration IN ('year_round', 'three_season', 'seasonal')),
    a3_household_size       INTEGER CHECK (a3_household_size >= 1),
    a3_frequent_visitors    BOOLEAN DEFAULT FALSE,
    a3_activities           TEXT[] DEFAULT '{}',
        -- multi-select: reading, dining, exercise, gardening,
        -- kids_play, entertaining, other
    a3_functional_needs     TEXT[] DEFAULT '{}',
        -- multi-select: shade_blinds, motorized_windows, smart_control,
        -- lighting, hvac, outdoor_kitchen, solar

    -- ========================================================
    -- A.4 Budget & Timeline (预算与时间)
    -- ========================================================
    a4_budget_range         VARCHAR(30) NOT NULL
        CHECK (a4_budget_range IN (
            '10k_20k', '20k_35k', '35k_50k',
            '50k_75k', '75k_100k', '100k_plus'
        )),
    a4_ideal_start          VARCHAR(30)
        CHECK (a4_ideal_start IN ('asap', '1_3_months', '3_6_months', 'undecided')),
    a4_important_dates      TEXT,

    -- ========================================================
    -- A.5 Community & HOA Compliance (社区与合规)
    -- ========================================================
    a5_has_hoa              VARCHAR(20) NOT NULL
        CHECK (a5_has_hoa IN ('yes', 'no', 'unsure')),
    a5_hoa_name             VARCHAR(200),
    a5_hoa_design_guidelines VARCHAR(30)
        CHECK (a5_hoa_design_guidelines IN ('has_can_provide', 'has_need_lookup', 'none', 'unsure')),
    a5_setback_awareness    VARCHAR(20)
        CHECK (a5_setback_awareness IN ('aware', 'need_help')),

    -- ========================================================
    -- A.6 Style & Aesthetic Preferences (风格与审美偏好)
    -- ========================================================
    a6_style_preference     TEXT,
        -- free text or product matrix selection
    a6_color_preference     TEXT,
    -- Note: Reference images (liked/disliked) stored in project_documents table

    -- ========================================================
    -- A.7 Decision Process (决策流程)
    -- ========================================================
    a7_decision_maker       VARCHAR(30)
        CHECK (a7_decision_maker IN ('self', 'spouse', 'family_joint', 'other')),
    a7_decision_maker_other TEXT,
    a7_decision_timeline    VARCHAR(30)
        CHECK (a7_decision_timeline IN ('within_1_week', '2_4_weeks', '1_3_months', 'undecided')),

    -- ========================================================
    -- A.8 Additional Notes (其他补充信息)
    -- ========================================================
    a8_additional_notes     TEXT,

    -- ========================================================
    -- Module Completion Tracking
    -- ========================================================
    modules_completed       JSONB DEFAULT '{
        "a1": false, "a2": false, "a3": false, "a4": false,
        "a5": false, "a6": false, "a7": false, "a8": false
    }'::jsonb,

    -- ========================================================
    -- Metadata
    -- ========================================================
    status          VARCHAR(20) DEFAULT 'draft'
        CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
    completed_at    TIMESTAMPTZ,
    filled_by       VARCHAR(20) DEFAULT 'sales'
        CHECK (filled_by IN ('sales', 'customer', 'ai_agent')),
    internal_notes  TEXT,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    is_deleted      BOOLEAN DEFAULT FALSE,

    UNIQUE(tenant_id, project_id)
);

-- Indexes
CREATE INDEX idx_iq_tenant      ON intake_questionnaires(tenant_id);
CREATE INDEX idx_iq_project     ON intake_questionnaires(project_id);
CREATE INDEX idx_iq_customer    ON intake_questionnaires(customer_id);
CREATE INDEX idx_iq_status      ON intake_questionnaires(tenant_id, status);
CREATE INDEX idx_iq_created     ON intake_questionnaires(created_at DESC);

COMMENT ON TABLE intake_questionnaires IS
    'Client Design Intake Questionnaire — 8 modules (A.1–A.8), one per project, tenant-scoped';

-- Auto-update trigger
CREATE TRIGGER set_iq_updated_at
    BEFORE UPDATE ON intake_questionnaires
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. project_documents — Unified document/file upload table
--    Stores references to files in Supabase Storage
--    Used for: HOA docs, reference images, receipts, photos, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS project_documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Document identity
    doc_category    VARCHAR(50) NOT NULL
        CHECK (doc_category IN (
            -- Step 1 documents
            'intake_ref_image_liked',       -- A.6 liked reference images
            'intake_ref_image_disliked',    -- A.6 disliked reference images
            'hoa_design_guidelines',        -- A.5 HOA documents
            'intent_fee_receipt',           -- Intent fee payment voucher
            'phase1_signoff',               -- Phase 1 client sign-off
            -- Step 2 documents
            'site_photo',                   -- Client site photos
            'floor_plan',                   -- Floor plan upload
            'concept_design',               -- AI-generated concept design
            'design_fee_receipt',           -- Design fee payment voucher
            'phase2_signoff',               -- Phase 2 client sign-off
            -- Step 3 documents
            'measurement_report',           -- On-site measurement report
            'measurement_photo',            -- Measurement photos
            'phase3_signoff',
            -- Step 4 documents
            'quotation_doc',                -- Formal quotation
            'contract',                     -- Signed contract
            'deposit_receipt',              -- 50% deposit receipt
            'phase4_signoff',
            -- Step 5 documents
            'production_photo',             -- Factory production photos
            'shipping_doc',                 -- Shipping / logistics doc
            'balance_receipt',              -- 40% balance receipt
            'phase5_signoff',
            -- Step 6 documents
            'installation_photo',           -- Installation progress photos
            'completion_photo',             -- Completed project photos
            'final_receipt',                -- 10% final payment receipt
            'warranty_doc',                 -- Warranty document
            'phase6_signoff',
            -- General
            'other'
        )),
    doc_name        VARCHAR(300) NOT NULL,
    doc_description TEXT,
    file_path       TEXT NOT NULL,
        -- Supabase Storage path: {tenant_id}/{project_id}/{category}/{filename}
    file_url        TEXT,
        -- Public or signed URL for display
    file_type       VARCHAR(50),
        -- MIME type: image/jpeg, application/pdf, etc.
    file_size_bytes BIGINT,

    -- Linking
    intake_id       UUID REFERENCES intake_questionnaires(id),
        -- Optional: link to specific intake questionnaire
    workflow_step   INTEGER CHECK (workflow_step >= 1 AND workflow_step <= 6),
        -- Which workflow step this document belongs to

    -- Metadata
    uploaded_by     UUID REFERENCES users(id),
    tags            TEXT[] DEFAULT '{}',
    is_deleted      BOOLEAN DEFAULT FALSE,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_pd_tenant      ON project_documents(tenant_id);
CREATE INDEX idx_pd_project     ON project_documents(project_id);
CREATE INDEX idx_pd_category    ON project_documents(tenant_id, doc_category);
CREATE INDEX idx_pd_step        ON project_documents(project_id, workflow_step);
CREATE INDEX idx_pd_intake      ON project_documents(intake_id);

COMMENT ON TABLE project_documents IS
    'Unified document store for all project lifecycle files — references Supabase Storage paths';

CREATE TRIGGER set_pd_updated_at
    BEFORE UPDATE ON project_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. Row Level Security (RLS)
-- ============================================================

-- intake_questionnaires RLS
ALTER TABLE intake_questionnaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "iq_tenant_isolation_select"
    ON intake_questionnaires FOR SELECT TO authenticated
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY "iq_tenant_isolation_insert"
    ON intake_questionnaires FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "iq_tenant_isolation_update"
    ON intake_questionnaires FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- project_documents RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pd_tenant_isolation_select"
    ON project_documents FOR SELECT TO authenticated
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY "pd_tenant_isolation_insert"
    ON project_documents FOR INSERT TO authenticated
    WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "pd_tenant_isolation_update"
    ON project_documents FOR UPDATE TO authenticated
    USING (tenant_id = get_current_tenant_id())
    WITH CHECK (tenant_id = get_current_tenant_id());

-- ============================================================
-- 4. Supabase Storage Bucket Configuration (run manually)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('project-files', 'project-files', false);
--
-- Storage path convention:
--   project-files/{tenant_id}/{project_id}/{doc_category}/{filename}
--
-- Example:
--   project-files/t-001/prj-001/intake_ref_image_liked/living-room-ref.jpg
--   project-files/t-001/prj-001/hoa_design_guidelines/hoa-rules-2026.pdf
--   project-files/t-001/prj-001/intent_fee_receipt/payment-100.pdf
-- ============================================================
