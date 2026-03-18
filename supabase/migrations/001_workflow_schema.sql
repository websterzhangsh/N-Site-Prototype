-- ============================================================
-- Migration 001: 6-Step Workflow Schema Extension
-- Based on: docs/business-workflow.md v3.0
-- Date: 2026-03-18
-- Purpose:
--   1. Extend projects table with workflow step tracking
--   2. Add project_questionnaire table (Appendix A: 8 modules)
--   3. Add project_checklist_items table (Appendix B: 6 phases)
--   4. Expand documents.doc_type for 18 file upload types
--   5. Expand payments.payment_type for 4-phase payment
--   6. Update orders.payment_plan from 3-phase to 4-phase
-- ============================================================

-- ============================================================
-- 1. EXTEND PROJECTS TABLE: Workflow Step Tracking
-- ============================================================

-- Current workflow step (1-6)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workflow_step INTEGER DEFAULT 1
    CHECK (workflow_step BETWEEN 1 AND 6);

-- Step milestone timestamps
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step1_completed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step2_completed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step3_completed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step4_completed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step5_completed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS step6_completed_at TIMESTAMPTZ;

-- Payment milestone timestamps (4-phase)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS intent_fee_paid_at TIMESTAMPTZ;     -- Step 1: $100
ALTER TABLE projects ADD COLUMN IF NOT EXISTS design_fee_paid_at TIMESTAMPTZ;     -- Step 2: $500-$1,000
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ;        -- Step 4: 50%
ALTER TABLE projects ADD COLUMN IF NOT EXISTS production_paid_at TIMESTAMPTZ;     -- Step 5: 40%
ALTER TABLE projects ADD COLUMN IF NOT EXISTS final_paid_at TIMESTAMPTZ;          -- Step 6: 10%

-- Questionnaire reference (FK added after table creation)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS questionnaire_id UUID;

-- Measurement data (Step 3)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS measurement_data JSONB DEFAULT '{}'::jsonb;
/*
measurement_data example:
{
    "method": "manual",                     -- "manual" | "laser_3d"
    "surveyor": "John Smith",
    "survey_date": "2026-03-10",
    "dimensions": {
        "length_ft": 25.5,
        "width_ft": 18.0,
        "height_ft": 10.2,
        "wall_height_ft": 8.5
    },
    "structure_assessment": {
        "wall_bearing": "adequate",
        "foundation": "concrete_slab",
        "connection_points": ["north_wall", "east_wall"],
        "notes": "Minor settling on east side"
    },
    "obstacles": [
        {"type": "downspout", "location": "NE corner", "offset_in": 6},
        {"type": "gas_line", "location": "along north wall", "depth_in": 24}
    ],
    "compliance_prescreening": {
        "setback_ok": true,
        "drainage_ok": true,
        "neighbor_boundary_ok": true,
        "notes": "5ft setback required, current: 8ft"
    }
}
*/

-- Contract and quotation reference
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_total DECIMAL(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quotation_data JSONB DEFAULT '{}'::jsonb;

-- Product configuration (Step 4 selections)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS product_config JSONB DEFAULT '{}'::jsonb;
/*
product_config example:
{
    "product_sku": "SR-R-001",
    "frame_color": "RAL 9016 Traffic White",
    "glass_type": "low_e_tempered",
    "shading": {"type": "electric", "fabric": "sunbrella_charcoal"},
    "operation_mode": "smart_control",
    "add_ons": ["led_lighting", "heating_floor", "smart_lock"],
    "pv_module": false
}
*/

CREATE INDEX IF NOT EXISTS idx_projects_workflow ON projects(tenant_id, workflow_step);

COMMENT ON COLUMN projects.workflow_step IS '当前工作流步骤: 1=意向接洽, 2=概念设计, 3=精准测量, 4=报价合同, 5=生产物流, 6=安装验收';

-- ============================================================
-- 2. PROJECT QUESTIONNAIRE TABLE (Appendix A: 8 Modules)
-- ============================================================

CREATE TABLE IF NOT EXISTS project_questionnaires (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    customer_id     UUID REFERENCES customers(id),

    -- A.1 Client Basic Info
    client_name         VARCHAR(100) NOT NULL,
    project_address     TEXT NOT NULL,
    city                VARCHAR(100),
    state               VARCHAR(50),
    zip_code            VARCHAR(10),
    phone               VARCHAR(20) NOT NULL,
    email               VARCHAR(255) NOT NULL,
    preferred_contact   VARCHAR(30) DEFAULT 'phone'
                        CHECK (preferred_contact IN ('phone', 'text', 'email', 'video')),
    other_decision_makers JSONB DEFAULT '[]'::jsonb,
    -- e.g. [{"name": "Jane Smith", "relationship": "Spouse"}]

    -- A.2 Project Overview
    usage_scenario      VARCHAR(50)
                        CHECK (usage_scenario IN (
                            'residential_villa', 'residential_apartment',
                            'commercial_restaurant', 'commercial_cafe',
                            'office', 'hotel_resort', 'poolside', 'other'
                        )),
    installation_location VARCHAR(50)
                        CHECK (installation_location IN (
                            'backyard_ground', 'deck_elevated', 'platform_raised',
                            'rooftop', 'commercial_space', 'other'
                        )),
    primary_uses        JSONB DEFAULT '[]'::jsonb,
    -- e.g. ["lounge", "gym", "study", "dining", "kids_play", "pet_area", "garden", "pool_cover"]
    attached_to_wall    BOOLEAN,
    attached_wall_desc  TEXT,
    -- "Attached to north wall of main house / garage"
    desired_dimensions  JSONB DEFAULT '{}'::jsonb,
    -- {"length_ft": 20, "width_ft": 15, "height_ft": 10}
    site_constraints    TEXT,

    -- A.3 Lifestyle & Usage Needs
    usage_duration      VARCHAR(30)
                        CHECK (usage_duration IN ('year_round', 'three_season', 'seasonal')),
    household_size      INTEGER CHECK (household_size IS NULL OR household_size BETWEEN 1 AND 20),
    frequent_guests     BOOLEAN DEFAULT FALSE,
    desired_activities  JSONB DEFAULT '[]'::jsonb,
    -- e.g. ["reading", "dining", "yoga", "gardening", "kids_play", "entertaining"]
    functional_needs    JSONB DEFAULT '[]'::jsonb,
    -- e.g. ["electric_shading", "smart_control", "lighting", "floor_heating", "ac", "outdoor_kitchen", "pv_storage"]

    -- A.4 Budget & Timeline
    budget_range        VARCHAR(30)
                        CHECK (budget_range IN (
                            '10k_20k', '20k_35k', '35k_50k',
                            '50k_75k', '75k_100k', '100k_plus'
                        )),
    ideal_start_time    VARCHAR(30)
                        CHECK (ideal_start_time IN ('asap', '1_3_months', '3_6_months', 'undecided')),
    important_dates     TEXT,

    -- A.5 HOA & Compliance
    has_hoa             VARCHAR(20)
                        CHECK (has_hoa IN ('yes', 'no', 'unsure')),
    hoa_name            VARCHAR(200),
    hoa_has_guidelines  VARCHAR(30)
                        CHECK (hoa_has_guidelines IN ('yes_can_provide', 'yes_need_lookup', 'no', 'unsure')),
    knows_setback_rules BOOLEAN DEFAULT FALSE,

    -- A.6 Style & Aesthetic Preferences
    preferred_style     TEXT,
    color_preference    VARCHAR(100),
    reference_photos    JSONB DEFAULT '[]'::jsonb,
    -- URLs/file_ids of liked reference images (3-5)
    disliked_photos     JSONB DEFAULT '[]'::jsonb,
    -- URLs/file_ids of disliked reference images (1-2)

    -- A.7 Decision Process
    decision_maker      VARCHAR(50)
                        CHECK (decision_maker IN ('self', 'spouse', 'family', 'other')),
    decision_timeline   VARCHAR(30)
                        CHECK (decision_timeline IN ('within_week', '2_4_weeks', '1_3_months', 'undecided')),

    -- A.8 Additional Notes
    additional_notes    TEXT,

    -- Metadata
    status              VARCHAR(20) DEFAULT 'draft'
                        CHECK (status IN ('draft', 'submitted', 'reviewed', 'archived')),
    submitted_at        TIMESTAMPTZ,
    reviewed_by         UUID REFERENCES users(id),
    reviewed_at         TIMESTAMPTZ,

    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_questionnaire_tenant ON project_questionnaires(tenant_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_project ON project_questionnaires(project_id);
CREATE INDEX IF NOT EXISTS idx_questionnaire_customer ON project_questionnaires(customer_id);

COMMENT ON TABLE project_questionnaires IS '客户设计需求表 (附件A) - 8模块结构化问卷，对应 Step 1/Step 2';

-- Add FK from projects to questionnaires
ALTER TABLE projects
    ADD CONSTRAINT fk_projects_questionnaire
    FOREIGN KEY (questionnaire_id) REFERENCES project_questionnaires(id)
    ON DELETE SET NULL;

-- ============================================================
-- 3. PROJECT CHECKLIST TABLE (Appendix B: 6 Phases)
-- ============================================================

CREATE TABLE IF NOT EXISTS project_checklist_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Checklist definition
    phase           INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 6),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    task_key        VARCHAR(100) NOT NULL,
    task_label      TEXT NOT NULL,
    responsible     VARCHAR(50),
    -- e.g. 'sales', 'customer', 'designer', 'surveyor', 'factory', 'logistics', 'installer', 'company'
    input_required  TEXT,
    output_expected TEXT,

    -- Completion tracking
    is_completed    BOOLEAN DEFAULT FALSE,
    completed_by    UUID REFERENCES users(id),
    completed_at    TIMESTAMPTZ,
    completion_notes TEXT,

    -- File upload reference (📎 items)
    requires_upload BOOLEAN DEFAULT FALSE,
    document_id     UUID REFERENCES documents(id),

    -- Phase sign-off
    is_signoff_item BOOLEAN DEFAULT FALSE,

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, project_id, task_key)
);

CREATE INDEX IF NOT EXISTS idx_checklist_tenant ON project_checklist_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checklist_project ON project_checklist_items(project_id);
CREATE INDEX IF NOT EXISTS idx_checklist_phase ON project_checklist_items(project_id, phase);

COMMENT ON TABLE project_checklist_items IS '项目全流程管理点检表 (附件B) - 6阶段任务跟踪，含签字确认和文件上传';

-- Phase sign-off records (customer signatures at end of each phase)
CREATE TABLE IF NOT EXISTS project_phase_signoffs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    phase           INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 6),
    signoff_text    TEXT NOT NULL,
    -- e.g. "I have reviewed Phase 1, agree to pay intent fee and proceed."

    signed_by_name  VARCHAR(100),
    signed_by_role  VARCHAR(50),
    -- 'customer', 'company_rep', 'both'
    signature_url   TEXT,
    -- URL to uploaded signature image/document

    signed_at       TIMESTAMPTZ,
    ip_address      INET,

    created_at      TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(tenant_id, project_id, phase)
);

CREATE INDEX IF NOT EXISTS idx_signoffs_project ON project_phase_signoffs(project_id);

COMMENT ON TABLE project_phase_signoffs IS '阶段签字确认记录 - 每阶段末尾客户签字';

-- ============================================================
-- 4. EXPAND DOCUMENTS TABLE: doc_type Enum
-- ============================================================

-- Drop and recreate the CHECK constraint on doc_type to include all 18+ types
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_doc_type_check;

ALTER TABLE documents ADD CONSTRAINT documents_doc_type_check
    CHECK (doc_type IN (
        -- Original types
        'floor_plan', 'rendering', 'structural_drawing',
        'installation_guide', 'contract', 'invoice',
        'site_photo', 'completion_photo', 'certificate',
        'brochure', 'quotation', 'other',
        -- NEW: Payment receipts (4 phases)
        'payment_receipt_intent',       -- Step 1: $100 intent fee receipt
        'payment_receipt_design',       -- Step 2: $500-$1K design fee receipt
        'payment_receipt_deposit',      -- Step 4: 50% deposit receipt
        'payment_receipt_production',   -- Step 5: 40% production payment receipt
        'payment_receipt_final',        -- Step 6: 10% final payment receipt
        -- NEW: Customer-uploaded photos
        'customer_site_photo',          -- Step 2: Customer backyard/site photos
        'customer_reference_photo',     -- Step 1/2: Style reference photos
        -- NEW: Signature confirmations
        'signature_phase1',             -- Step 1 sign-off
        'signature_phase2',             -- Step 2 sign-off
        'signature_phase3',             -- Step 3 sign-off
        'signature_phase4',             -- Step 4 sign-off
        'signature_phase5',             -- Step 5: delivery sign-off
        'signature_phase6',             -- Step 6: final acceptance sign-off
        -- NEW: Factory/QC documents
        'qc_report',                    -- Step 5: factory quality check report
        'pre_acceptance_photo',         -- Step 5: pre-assembly/remote acceptance photos
        -- NEW: Delivery/Installation
        'delivery_receipt',             -- Step 5: delivery/arrival signature
        'installation_progress_photo',  -- Step 6: daily installation progress photos
        -- NEW: Government/Compliance
        'co_certificate',               -- Step 6: Certificate of Occupancy
        'compliance_package',           -- Step 4: full compliance document package
        'structural_calculation',       -- Step 3/4: structural engineering report
        -- NEW: Completion
        'warranty_document',            -- Step 6: warranty card, manuals, etc.
        'inspection_report',            -- Step 6: government final inspection report
        -- NEW: Design outputs
        'concept_design',               -- Step 2: AI concept renderings
        'site_plan',                    -- Step 3: Site Plan drawing
        'elevation_drawing',            -- Step 3: elevation/facade drawings
        'interior_layout',              -- Step 3: interior furniture layout
        'before_after_animation',       -- Step 2/3: before-after animation video
        'measurement_data'              -- Step 3: measurement data/point cloud
    ));

-- Add workflow_step column to documents for step-level filtering
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workflow_step INTEGER
    CHECK (workflow_step IS NULL OR workflow_step BETWEEN 1 AND 6);

CREATE INDEX IF NOT EXISTS idx_docs_workflow_step ON documents(entity_id, workflow_step)
    WHERE entity_type = 'project';

COMMENT ON COLUMN documents.workflow_step IS '关联的工作流步骤（1-6），便于按步骤筛选文档';

-- ============================================================
-- 5. EXPAND PAYMENTS TABLE: 4-Phase Payment Types
-- ============================================================

-- Drop and recreate the CHECK constraint on payment_type
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;

ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check
    CHECK (payment_type IN (
        -- Original types
        'deposit', 'second_payment', 'final_payment', 'full_payment', 'refund', 'adjustment',
        -- NEW: Workflow-aligned payment types
        'intent_fee',       -- Step 1: $100 intent fee
        'design_fee'        -- Step 2: $500-$1,000 design fee
    ));

-- Expand payment methods for US market
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
    CHECK (payment_method IN (
        -- Original
        'alipay', 'wechat_pay', 'bank_transfer', 'credit_card', 'cash', 'other',
        -- NEW: US market methods
        'check',            -- Personal/business check
        'zelle',            -- Zelle transfer
        'venmo',            -- Venmo
        'wire_transfer',    -- Wire transfer
        'ach'               -- ACH bank transfer
    ));

-- ============================================================
-- 6. UPDATE ORDERS TABLE: 4-Phase Payment Plan
-- ============================================================

-- Add intent/design fee tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS intent_fee DECIMAL(10,2) DEFAULT 100.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_fee DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS intent_fee_paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS design_fee_paid_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS production_payment_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.intent_fee IS 'Step 1 意向金 ($100), 可抵合同款';
COMMENT ON COLUMN orders.design_fee IS 'Step 2 设计费 ($500-$1,000), 可抵合同款';

-- ============================================================
-- 7. RLS POLICIES FOR NEW TABLES
-- ============================================================

ALTER TABLE project_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phase_signoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_questionnaires ON project_questionnaires FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_super_admin());

CREATE POLICY rls_checklist ON project_checklist_items FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_super_admin());

CREATE POLICY rls_signoffs ON project_phase_signoffs FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_super_admin());

-- ============================================================
-- 8. TRIGGERS FOR NEW TABLES
-- ============================================================

CREATE TRIGGER trg_questionnaire_updated BEFORE UPDATE ON project_questionnaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_checklist_updated BEFORE UPDATE ON project_checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit triggers
CREATE TRIGGER audit_questionnaires AFTER INSERT OR UPDATE OR DELETE ON project_questionnaires
    FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_checklist AFTER INSERT OR UPDATE OR DELETE ON project_checklist_items
    FOR EACH ROW EXECUTE FUNCTION log_audit();

-- ============================================================
-- 9. HELPER VIEW: Project Workflow Dashboard
-- ============================================================

CREATE OR REPLACE VIEW v_project_workflow AS
SELECT
    p.id,
    p.tenant_id,
    p.project_number,
    p.title,
    p.workflow_step,
    p.status,
    p.contract_total,
    p.created_at,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.email AS customer_email,
    -- Questionnaire status
    pq.status AS questionnaire_status,
    pq.budget_range,
    pq.has_hoa,
    -- Step completion
    p.step1_completed_at,
    p.step2_completed_at,
    p.step3_completed_at,
    p.step4_completed_at,
    p.step5_completed_at,
    p.step6_completed_at,
    -- Payment milestones
    p.intent_fee_paid_at,
    p.design_fee_paid_at,
    p.deposit_paid_at,
    p.production_paid_at,
    p.final_paid_at,
    -- Checklist progress per phase
    (SELECT COUNT(*) FILTER (WHERE is_completed) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 1)
        AS phase1_completed,
    (SELECT COUNT(*) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 1)
        AS phase1_total,
    (SELECT COUNT(*) FILTER (WHERE is_completed) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 2)
        AS phase2_completed,
    (SELECT COUNT(*) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 2)
        AS phase2_total,
    (SELECT COUNT(*) FILTER (WHERE is_completed) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 3)
        AS phase3_completed,
    (SELECT COUNT(*) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 3)
        AS phase3_total,
    (SELECT COUNT(*) FILTER (WHERE is_completed) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 4)
        AS phase4_completed,
    (SELECT COUNT(*) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 4)
        AS phase4_total,
    (SELECT COUNT(*) FILTER (WHERE is_completed) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 5)
        AS phase5_completed,
    (SELECT COUNT(*) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 5)
        AS phase5_total,
    (SELECT COUNT(*) FILTER (WHERE is_completed) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 6)
        AS phase6_completed,
    (SELECT COUNT(*) FROM project_checklist_items ci WHERE ci.project_id = p.id AND ci.phase = 6)
        AS phase6_total,
    -- Document counts per step
    (SELECT COUNT(*) FROM documents d WHERE d.entity_type = 'project' AND d.entity_id = p.id AND d.workflow_step = 1 AND d.is_deleted = FALSE)
        AS step1_docs,
    (SELECT COUNT(*) FROM documents d WHERE d.entity_type = 'project' AND d.entity_id = p.id AND d.workflow_step = 2 AND d.is_deleted = FALSE)
        AS step2_docs,
    (SELECT COUNT(*) FROM documents d WHERE d.entity_type = 'project' AND d.entity_id = p.id AND d.workflow_step = 3 AND d.is_deleted = FALSE)
        AS step3_docs,
    (SELECT COUNT(*) FROM documents d WHERE d.entity_type = 'project' AND d.entity_id = p.id AND d.workflow_step = 4 AND d.is_deleted = FALSE)
        AS step4_docs,
    (SELECT COUNT(*) FROM documents d WHERE d.entity_type = 'project' AND d.entity_id = p.id AND d.workflow_step = 5 AND d.is_deleted = FALSE)
        AS step5_docs,
    (SELECT COUNT(*) FROM documents d WHERE d.entity_type = 'project' AND d.entity_id = p.id AND d.workflow_step = 6 AND d.is_deleted = FALSE)
        AS step6_docs
FROM projects p
LEFT JOIN customers c ON p.customer_id = c.id
LEFT JOIN project_questionnaires pq ON p.questionnaire_id = pq.id
WHERE p.is_deleted = FALSE;

-- ============================================================
-- END OF MIGRATION 001
-- New Tables: 3 (project_questionnaires, project_checklist_items, project_phase_signoffs)
-- Extended Tables: 3 (projects, documents, payments, orders)
-- New Views: 1 (v_project_workflow)
-- ============================================================
