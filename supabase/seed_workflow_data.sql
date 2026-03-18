-- ============================================================
-- Seed Data: 6-Step Workflow with US Market Convention
-- Based on: docs/business-workflow.md v3.0
-- Date: 2026-03-18
-- Purpose: Populate realistic US-market sample data for
--          projects at various workflow stages (Steps 1-6)
-- ============================================================

-- ============================================================
-- PREREQUISITE: Run schema.sql + migrations/001_workflow_schema.sql first
-- Uses tenant 'default' created in schema.sql seed data
-- ============================================================

-- --------------------------------------------------------
-- Helper: Get default tenant ID
-- --------------------------------------------------------
DO $$
DECLARE
    v_tenant UUID;
    v_admin  UUID;
    -- Customer IDs
    v_cust_johnson UUID;
    v_cust_chen    UUID;
    v_cust_smith   UUID;
    v_cust_garcia  UUID;
    v_cust_williams UUID;
    -- Project IDs
    v_proj_johnson UUID;
    v_proj_chen    UUID;
    v_proj_smith   UUID;
    v_proj_garcia  UUID;
    v_proj_williams UUID;
    -- Questionnaire IDs
    v_q_johnson UUID;
    v_q_chen    UUID;
    v_q_smith   UUID;
    v_q_garcia  UUID;
    v_q_williams UUID;
    -- Design IDs
    v_dsn_chen   UUID;
    v_dsn_smith  UUID;
    v_dsn_garcia UUID;
    -- Order IDs
    v_ord_smith  UUID;
    v_ord_garcia UUID;
    -- Product ID
    v_prod_sunroom UUID;
    v_prod_pergola UUID;
BEGIN
    SELECT id INTO v_tenant FROM tenants WHERE slug = 'default';
    SELECT id INTO v_admin FROM users WHERE email = 'admin@nestopia.com' AND tenant_id = v_tenant;

    -- ========================================================
    -- A. SAMPLE CUSTOMERS (5 US-based)
    -- ========================================================

    INSERT INTO customers (id, tenant_id, name, email, phone, province, city, district, address, postal_code, site_type, site_area, source, customer_type, status, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Robert Johnson', 'robert.johnson@gmail.com', '(415) 555-0123',
     'California', 'San Francisco', 'Marina District', '2847 Lombard St, San Francisco, CA 94123', '94123',
     'villa', 350.00, 'website', 'standard', 'active', v_admin)
    RETURNING id INTO v_cust_johnson;

    INSERT INTO customers (id, tenant_id, name, email, phone, province, city, district, address, postal_code, site_type, site_area, source, customer_type, status, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Lisa Chen', 'lisa.chen@outlook.com', '(408) 555-0456',
     'California', 'San Jose', 'Willow Glen', '1456 Lincoln Ave, San Jose, CA 95125', '95125',
     'villa', 520.00, 'referral', 'vip', 'active', v_admin)
    RETURNING id INTO v_cust_chen;

    INSERT INTO customers (id, tenant_id, name, email, phone, province, city, district, address, postal_code, site_type, site_area, source, customer_type, status, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Michael Smith', 'mike.smith@yahoo.com', '(858) 555-0789',
     'California', 'San Diego', 'La Jolla', '7920 Prospect Pl, La Jolla, CA 92037', '92037',
     'villa', 680.00, 'partner', 'vip', 'active', v_admin)
    RETURNING id INTO v_cust_smith;

    INSERT INTO customers (id, tenant_id, name, email, phone, province, city, district, address, postal_code, site_type, site_area, source, customer_type, status, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Maria Garcia', 'maria.garcia@icloud.com', '(916) 555-0234',
     'California', 'Sacramento', 'East Sacramento', '3412 J St, Sacramento, CA 95816', '95816',
     'villa', 410.00, 'social_media', 'standard', 'active', v_admin)
    RETURNING id INTO v_cust_garcia;

    INSERT INTO customers (id, tenant_id, name, email, phone, province, city, district, address, postal_code, site_type, site_area, source, customer_type, status, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'David Williams', 'david.williams@gmail.com', '(310) 555-0567',
     'California', 'Los Angeles', 'Pasadena', '582 S Orange Grove Blvd, Pasadena, CA 91105', '91105',
     'villa', 450.00, 'exhibition', 'standard', 'prospect', v_admin)
    RETURNING id INTO v_cust_williams;

    -- ========================================================
    -- B. SAMPLE PRODUCTS (if not existing)
    -- ========================================================

    INSERT INTO products (id, tenant_id, category_id, sku, name, name_en, description, specs, status, is_customizable, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant,
     (SELECT id FROM product_categories WHERE tenant_id = v_tenant AND name_en = 'Retractable Sunroom' LIMIT 1),
     'SR-R-001', 'Retractable Sunroom A Series', 'Retractable Sunroom A Series',
     'Premium retractable sunroom with motorized roof panels. Aluminum alloy frame with tempered glass.',
     '{
         "material": "aluminum_alloy_6063_t5",
         "glass_type": "tempered_low_e",
         "frame_colors": ["RAL 9016 Traffic White", "RAL 7016 Anthracite Grey", "RAL 9005 Jet Black", "RAL 8014 Sepia Brown"],
         "min_width_mm": 3000,
         "max_width_mm": 12000,
         "min_depth_mm": 3000,
         "max_depth_mm": 6000,
         "min_height_mm": 2500,
         "max_height_mm": 4000,
         "weight_per_sqm_kg": 28,
         "wind_load_rating": "ASTM E330 certified",
         "snow_load_psf": 30,
         "operation_modes": ["manual", "electric", "smart_control"]
     }'::jsonb,
     'active', TRUE, v_admin)
    RETURNING id INTO v_prod_sunroom;

    INSERT INTO products (id, tenant_id, category_id, sku, name, name_en, description, specs, status, is_customizable, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant,
     (SELECT id FROM product_categories WHERE tenant_id = v_tenant AND name = '配件与附件' LIMIT 1),
     'PG-M-001', 'Motorized Louvered Pergola', 'Motorized Louvered Pergola',
     'Adjustable louvered pergola with rain sensor and app control. Premium powder-coated aluminum.',
     '{
         "material": "aluminum_alloy_6063_t5",
         "louver_type": "motorized_adjustable",
         "frame_colors": ["RAL 9016 Traffic White", "RAL 7016 Anthracite Grey", "RAL 9005 Jet Black"],
         "min_width_mm": 3000,
         "max_width_mm": 7000,
         "min_depth_mm": 3000,
         "max_depth_mm": 5000,
         "min_height_mm": 2500,
         "max_height_mm": 3500,
         "weight_per_sqm_kg": 22,
         "wind_load_rating": "ASTM E330 certified",
         "features": ["rain_sensor", "wind_sensor", "app_control", "led_integrated"]
     }'::jsonb,
     'active', TRUE, v_admin)
    RETURNING id INTO v_prod_pergola;

    -- ========================================================
    -- C. SAMPLE PROJECTS AT VARIOUS WORKFLOW STAGES
    -- ========================================================

    -- PROJECT 1: Williams - Step 1 (Intent Inquiry, just started)
    INSERT INTO projects (id, tenant_id, title, description, status, project_type, customer_id,
        client_name, client_email, client_phone, client_address,
        budget_range, square_meters, workflow_step, assigned_to, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Williams Residence - Retractable Sunroom',
     'New inquiry from Pasadena exhibition. Interested in a retractable sunroom for backyard entertaining.',
     'pending', 'sunroom', v_cust_williams,
     'David Williams', 'david.williams@gmail.com', '(310) 555-0567',
     '582 S Orange Grove Blvd, Pasadena, CA 91105',
     '$35K-$50K', 42.00, 1, v_admin, v_admin)
    RETURNING id INTO v_proj_williams;

    -- PROJECT 2: Johnson - Step 2 (AI Concept Design, intent fee paid)
    INSERT INTO projects (id, tenant_id, title, description, status, project_type, customer_id,
        client_name, client_email, client_phone, client_address,
        budget_range, square_meters, workflow_step,
        intent_fee_paid_at, step1_completed_at,
        assigned_to, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Johnson Residence - Pergola & Outdoor Living',
     'Marina District single-family home. Wants a louvered pergola covering the rear patio for year-round outdoor dining.',
     'in_progress', 'pergola', v_cust_johnson,
     'Robert Johnson', 'robert.johnson@gmail.com', '(415) 555-0123',
     '2847 Lombard St, San Francisco, CA 94123',
     '$20K-$35K', 32.50, 2,
     NOW() - INTERVAL '12 days', NOW() - INTERVAL '10 days',
     v_admin, v_admin)
    RETURNING id INTO v_proj_johnson;

    -- PROJECT 3: Chen - Step 3 (Precision Measurement, design fee paid)
    INSERT INTO projects (id, tenant_id, title, description, status, project_type, customer_id,
        client_name, client_email, client_phone, client_address,
        budget_range, square_meters, workflow_step,
        intent_fee_paid_at, design_fee_paid_at, step1_completed_at, step2_completed_at,
        measurement_data,
        assigned_to, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Chen Villa - Retractable Sunroom',
     'Willow Glen luxury home. Large backyard with mature oak trees. Wants year-round sunroom attached to main house north wall.',
     'in_progress', 'sunroom', v_cust_chen,
     'Lisa Chen', 'lisa.chen@outlook.com', '(408) 555-0456',
     '1456 Lincoln Ave, San Jose, CA 95125',
     '$50K-$75K', 48.30, 3,
     NOW() - INTERVAL '25 days', NOW() - INTERVAL '18 days',
     NOW() - INTERVAL '20 days', NOW() - INTERVAL '14 days',
     '{
         "method": "manual",
         "surveyor": "John Martinez (Licensed Contractor #948721)",
         "survey_date": "2026-03-08",
         "dimensions": {
             "length_ft": 26.2,
             "width_ft": 18.5,
             "height_ft": 10.5,
             "wall_height_ft": 9.0,
             "eave_height_ft": 11.2
         },
         "structure_assessment": {
             "wall_bearing": "adequate - wood frame with concrete foundation",
             "foundation": "concrete_slab_4inch",
             "connection_points": ["north_wall_main_house"],
             "roof_pitch": "4:12",
             "notes": "North wall in good condition. Foundation level. No visible cracks."
         },
         "obstacles": [
             {"type": "downspout", "location": "NE corner", "offset_in": 8},
             {"type": "gas_meter", "location": "east wall, 15ft from corner", "offset_in": 12},
             {"type": "oak_tree", "location": "NW, 6ft from proposed footprint", "canopy_radius_ft": 12}
         ],
         "compliance_prescreening": {
             "setback_ok": true,
             "setback_required_ft": 5,
             "setback_actual_ft": 12,
             "drainage_ok": true,
             "drainage_slope_pct": 2.1,
             "neighbor_boundary_ok": true,
             "boundary_distance_ft": 15,
             "hoa_review_needed": true,
             "notes": "Willow Glen Historic District - need architectural review. Setback well within limits."
         }
     }'::jsonb,
     v_admin, v_admin)
    RETURNING id INTO v_proj_chen;

    -- PROJECT 4: Smith - Step 5 (Production & Logistics, contract signed, deposit paid)
    INSERT INTO projects (id, tenant_id, title, description, status, project_type, customer_id,
        client_name, client_email, client_phone, client_address,
        budget_range, square_meters, workflow_step,
        intent_fee_paid_at, design_fee_paid_at, deposit_paid_at,
        step1_completed_at, step2_completed_at, step3_completed_at, step4_completed_at,
        contract_total, contract_signed_at,
        measurement_data, product_config,
        assigned_to, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Smith Estate - Premium Retractable Sunroom',
     'La Jolla oceanview property. High-end retractable sunroom with smart controls, heated floor, and integrated lighting.',
     'in_progress', 'sunroom', v_cust_smith,
     'Michael Smith', 'mike.smith@yahoo.com', '(858) 555-0789',
     '7920 Prospect Pl, La Jolla, CA 92037',
     '$75K-$100K', 63.20, 5,
     NOW() - INTERVAL '60 days', NOW() - INTERVAL '52 days', NOW() - INTERVAL '28 days',
     NOW() - INTERVAL '55 days', NOW() - INTERVAL '45 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '28 days',
     87500.00, NOW() - INTERVAL '28 days',
     '{
         "method": "manual",
         "surveyor": "Carlos Rivera (Licensed Contractor #812345)",
         "survey_date": "2026-02-10",
         "dimensions": {"length_ft": 32.0, "width_ft": 19.8, "height_ft": 11.0, "wall_height_ft": 9.5},
         "structure_assessment": {"wall_bearing": "excellent - reinforced concrete", "foundation": "concrete_slab_6inch"},
         "compliance_prescreening": {"setback_ok": true, "drainage_ok": true, "neighbor_boundary_ok": true}
     }'::jsonb,
     '{
         "product_sku": "SR-R-001",
         "frame_color": "RAL 7016 Anthracite Grey",
         "glass_type": "low_e_tempered_double",
         "shading": {"type": "electric_motorized", "fabric": "sunbrella_stucco_beige"},
         "operation_mode": "smart_control",
         "add_ons": ["led_strip_warm_white", "heated_floor_radiant", "smart_lock", "rain_sensor", "wind_sensor"],
         "pv_module": false,
         "custom_notes": "Client requests ocean-facing panoramic panels with minimal frame obstruction"
     }'::jsonb,
     v_admin, v_admin)
    RETURNING id INTO v_proj_smith;

    -- PROJECT 5: Garcia - Step 6 (Installation & Acceptance)
    INSERT INTO projects (id, tenant_id, title, description, status, project_type, customer_id,
        client_name, client_email, client_phone, client_address,
        budget_range, square_meters, workflow_step,
        intent_fee_paid_at, design_fee_paid_at, deposit_paid_at, production_paid_at,
        step1_completed_at, step2_completed_at, step3_completed_at, step4_completed_at, step5_completed_at,
        contract_total, contract_signed_at,
        measurement_data, product_config,
        assigned_to, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, 'Garcia Family - Retractable Sunroom + Pergola',
     'East Sacramento craftsman home. Combined project: retractable sunroom for family room extension + separate louvered pergola for backyard BBQ area.',
     'in_progress', 'sunroom', v_cust_garcia,
     'Maria Garcia', 'maria.garcia@icloud.com', '(916) 555-0234',
     '3412 J St, Sacramento, CA 95816',
     '$50K-$75K', 55.80, 6,
     NOW() - INTERVAL '90 days', NOW() - INTERVAL '82 days', NOW() - INTERVAL '58 days', NOW() - INTERVAL '20 days',
     NOW() - INTERVAL '85 days', NOW() - INTERVAL '75 days', NOW() - INTERVAL '65 days', NOW() - INTERVAL '58 days', NOW() - INTERVAL '15 days',
     62800.00, NOW() - INTERVAL '58 days',
     '{
         "method": "manual",
         "surveyor": "John Martinez (Licensed Contractor #948721)",
         "survey_date": "2026-01-15",
         "dimensions": {"length_ft": 28.5, "width_ft": 19.6, "height_ft": 10.0, "wall_height_ft": 8.5},
         "structure_assessment": {"wall_bearing": "good - wood frame, stucco exterior", "foundation": "raised_foundation"},
         "compliance_prescreening": {"setback_ok": true, "drainage_ok": true, "neighbor_boundary_ok": true, "hoa_review_needed": false}
     }'::jsonb,
     '{
         "product_sku": "SR-R-001",
         "frame_color": "RAL 9016 Traffic White",
         "glass_type": "low_e_tempered",
         "shading": {"type": "manual_retractable", "fabric": "sunbrella_natural_canvas"},
         "operation_mode": "electric",
         "add_ons": ["led_strip_warm_white", "ceiling_fan_x2"],
         "pv_module": false
     }'::jsonb,
     v_admin, v_admin)
    RETURNING id INTO v_proj_garcia;

    -- ========================================================
    -- D. QUESTIONNAIRES FOR EACH PROJECT
    -- ========================================================

    -- Williams (Step 1) - Draft questionnaire, partially filled
    INSERT INTO project_questionnaires (id, tenant_id, project_id, customer_id,
        client_name, project_address, city, state, zip_code, phone, email, preferred_contact,
        usage_scenario, installation_location, primary_uses, attached_to_wall,
        usage_duration, budget_range, ideal_start_time, has_hoa,
        preferred_style, decision_maker, decision_timeline,
        status)
    VALUES
    (uuid_generate_v4(), v_tenant, v_proj_williams, v_cust_williams,
     'David Williams', '582 S Orange Grove Blvd', 'Pasadena', 'CA', '91105',
     '(310) 555-0567', 'david.williams@gmail.com', 'text',
     'residential_villa', 'backyard_ground',
     '["dining", "entertaining", "reading"]'::jsonb, TRUE,
     'three_season', '35k_50k', '1_3_months', 'yes',
     'Modern minimalist with warm tones', 'family', '2_4_weeks',
     'draft')
    RETURNING id INTO v_q_williams;

    UPDATE projects SET questionnaire_id = v_q_williams WHERE id = v_proj_williams;

    -- Johnson (Step 2) - Submitted questionnaire
    INSERT INTO project_questionnaires (id, tenant_id, project_id, customer_id,
        client_name, project_address, city, state, zip_code, phone, email, preferred_contact,
        other_decision_makers,
        usage_scenario, installation_location, primary_uses, attached_to_wall,
        desired_dimensions, site_constraints,
        usage_duration, household_size, frequent_guests, desired_activities, functional_needs,
        budget_range, ideal_start_time, important_dates,
        has_hoa, hoa_name, hoa_has_guidelines, knows_setback_rules,
        preferred_style, color_preference,
        decision_maker, decision_timeline,
        additional_notes,
        status, submitted_at)
    VALUES
    (uuid_generate_v4(), v_tenant, v_proj_johnson, v_cust_johnson,
     'Robert Johnson', '2847 Lombard St', 'San Francisco', 'CA', '94123',
     '(415) 555-0123', 'robert.johnson@gmail.com', 'email',
     '[{"name": "Sarah Johnson", "relationship": "Spouse"}]'::jsonb,
     'residential_villa', 'backyard_ground',
     '["dining", "entertaining", "reading", "gardening"]'::jsonb, FALSE,
     '{"length_ft": 18, "width_ft": 16, "height_ft": 10}'::jsonb,
     'Rear fence 3ft from property line. Underground sprinkler system.',
     'three_season', 4, TRUE,
     '["outdoor_dining", "wine_tasting", "reading", "small_gatherings"]'::jsonb,
     '["electric_shading", "lighting", "smart_control"]'::jsonb,
     '20k_35k', 'asap', 'Anniversary party June 15',
     'yes', 'Marina District HOA', 'yes_need_lookup', FALSE,
     'Contemporary with coastal influence', 'White frame, natural wood accents',
     'spouse', 'within_week',
     'We host wine tastings monthly and want a covered area that feels open but protected. Important: our dog needs to be able to go in and out freely.',
     'submitted', NOW() - INTERVAL '10 days')
    RETURNING id INTO v_q_johnson;

    UPDATE projects SET questionnaire_id = v_q_johnson WHERE id = v_proj_johnson;

    -- Chen (Step 3) - Reviewed questionnaire
    INSERT INTO project_questionnaires (id, tenant_id, project_id, customer_id,
        client_name, project_address, city, state, zip_code, phone, email, preferred_contact,
        other_decision_makers,
        usage_scenario, installation_location, primary_uses, attached_to_wall, attached_wall_desc,
        desired_dimensions, site_constraints,
        usage_duration, household_size, frequent_guests, desired_activities, functional_needs,
        budget_range, ideal_start_time,
        has_hoa, hoa_name, hoa_has_guidelines, knows_setback_rules,
        preferred_style, color_preference, reference_photos,
        decision_maker, decision_timeline,
        additional_notes,
        status, submitted_at, reviewed_by, reviewed_at)
    VALUES
    (uuid_generate_v4(), v_tenant, v_proj_chen, v_cust_chen,
     'Lisa Chen', '1456 Lincoln Ave', 'San Jose', 'CA', '95125',
     '(408) 555-0456', 'lisa.chen@outlook.com', 'video',
     '[{"name": "Kevin Chen", "relationship": "Husband"}, {"name": "Grace Chen", "relationship": "Mother-in-law"}]'::jsonb,
     'residential_villa', 'backyard_ground',
     '["lounge", "dining", "yoga", "garden", "kids_play"]'::jsonb,
     TRUE, 'North wall of main house, between kitchen bay window and master bedroom',
     '{"length_ft": 26, "width_ft": 18, "height_ft": 10}'::jsonb,
     'Large oak tree 6ft from NW corner. Gas meter on east wall.',
     'year_round', 5, TRUE,
     '["yoga", "reading", "dining", "gardening", "kids_play", "entertaining"]'::jsonb,
     '["electric_shading", "smart_control", "lighting", "floor_heating", "ac"]'::jsonb,
     '50k_75k', 'asap',
     'yes', 'Willow Glen Neighborhood Association', 'yes_can_provide', TRUE,
     'Modern zen with natural materials', 'Anthracite frame, warm wood accents, bamboo touches',
     '["ref_img_zen_sunroom_01.jpg", "ref_img_modern_glass_02.jpg", "ref_img_garden_room_03.jpg"]'::jsonb,
     'family', 'within_week',
     'We practice yoga every morning and want this space to feel like a garden sanctuary. Need good ventilation and temperature control for year-round use. Children (ages 5 and 8) play here too.',
     'reviewed', NOW() - INTERVAL '20 days', v_admin, NOW() - INTERVAL '16 days')
    RETURNING id INTO v_q_chen;

    UPDATE projects SET questionnaire_id = v_q_chen WHERE id = v_proj_chen;

    -- Smith (Step 5) - Reviewed questionnaire
    INSERT INTO project_questionnaires (id, tenant_id, project_id, customer_id,
        client_name, project_address, city, state, zip_code, phone, email, preferred_contact,
        usage_scenario, installation_location, primary_uses, attached_to_wall, attached_wall_desc,
        desired_dimensions,
        usage_duration, household_size, frequent_guests, desired_activities, functional_needs,
        budget_range, ideal_start_time,
        has_hoa, hoa_name, hoa_has_guidelines, knows_setback_rules,
        preferred_style, color_preference,
        decision_maker, decision_timeline,
        additional_notes,
        status, submitted_at, reviewed_by, reviewed_at)
    VALUES
    (uuid_generate_v4(), v_tenant, v_proj_smith, v_cust_smith,
     'Michael Smith', '7920 Prospect Pl', 'La Jolla', 'CA', '92037',
     '(858) 555-0789', 'mike.smith@yahoo.com', 'phone',
     'residential_villa', 'deck_elevated',
     '["lounge", "dining", "entertaining"]'::jsonb,
     TRUE, 'West-facing wall overlooking Pacific Ocean',
     '{"length_ft": 32, "width_ft": 20, "height_ft": 11}'::jsonb,
     'year_round', 2, TRUE,
     '["dining", "entertaining", "wine_tasting", "reading"]'::jsonb,
     '["electric_shading", "smart_control", "lighting", "floor_heating", "outdoor_kitchen"]'::jsonb,
     '75k_100k', 'asap',
     'yes', 'La Jolla Community Planning Association', 'yes_can_provide', TRUE,
     'Ultra-modern with frameless glass aesthetic', 'Anthracite grey, minimal visible structure',
     'self', 'within_week',
     'Ocean-facing property. Want maximum glass panels with minimal frame obstruction for panoramic views. Must withstand coastal wind and salt air. Premium materials only.',
     'reviewed', NOW() - INTERVAL '55 days', v_admin, NOW() - INTERVAL '50 days')
    RETURNING id INTO v_q_smith;

    UPDATE projects SET questionnaire_id = v_q_smith WHERE id = v_proj_smith;

    -- Garcia (Step 6) - Reviewed questionnaire
    INSERT INTO project_questionnaires (id, tenant_id, project_id, customer_id,
        client_name, project_address, city, state, zip_code, phone, email, preferred_contact,
        usage_scenario, installation_location, primary_uses, attached_to_wall, attached_wall_desc,
        desired_dimensions,
        usage_duration, household_size, frequent_guests, desired_activities, functional_needs,
        budget_range, ideal_start_time,
        has_hoa, knows_setback_rules,
        preferred_style, color_preference,
        decision_maker, decision_timeline,
        status, submitted_at, reviewed_by, reviewed_at)
    VALUES
    (uuid_generate_v4(), v_tenant, v_proj_garcia, v_cust_garcia,
     'Maria Garcia', '3412 J St', 'Sacramento', 'CA', '95816',
     '(916) 555-0234', 'maria.garcia@icloud.com', 'text',
     'residential_villa', 'backyard_ground',
     '["dining", "entertaining", "kids_play", "garden"]'::jsonb,
     TRUE, 'South-facing wall of craftsman home',
     '{"length_ft": 28, "width_ft": 20, "height_ft": 10}'::jsonb,
     'three_season', 6, TRUE,
     '["bbq", "family_dinner", "kids_play", "gardening"]'::jsonb,
     '["electric_shading", "lighting", "ceiling_fan"]'::jsonb,
     '50k_75k', '1_3_months',
     'no', TRUE,
     'Craftsman-style integration with existing home', 'White frame, dark bronze hardware',
     'spouse', '2_4_weeks',
     'reviewed', NOW() - INTERVAL '85 days', v_admin, NOW() - INTERVAL '80 days')
    RETURNING id INTO v_q_garcia;

    UPDATE projects SET questionnaire_id = v_q_garcia WHERE id = v_proj_garcia;

    -- ========================================================
    -- E. DESIGNS (for Step 3+ projects)
    -- ========================================================

    INSERT INTO designs (id, tenant_id, customer_id, project_id, product_id,
        name, version, width, depth, height, area,
        options, documents, ai_prompt,
        quoted_price, price_breakdown,
        status, submitted_at, reviewed_by, reviewed_at,
        compliance_status, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, v_cust_chen, v_proj_chen, v_prod_sunroom,
     'Chen Villa - Zen Garden Sunroom v2', 2, 7986, 5639, 3200, 45.03,
     '{
         "frame_color": "RAL 7016 Anthracite Grey",
         "glass_type": "low_e_tempered",
         "shading": {"type": "electric", "fabric": "sunbrella_charcoal"},
         "operation_mode": "smart_control",
         "add_ons": ["led_strip_warm_white", "floor_heating", "smart_lock"]
     }'::jsonb,
     '{
         "floor_plan": "designs/chen_villa_floorplan_v2.pdf",
         "renderings": ["designs/chen_villa_render_01.jpg", "designs/chen_villa_render_02.jpg", "designs/chen_villa_render_03.jpg"],
         "structural_drawing": "designs/chen_villa_structural_v2.pdf",
         "site_plan": "designs/chen_villa_siteplan_v2.pdf"
     }'::jsonb,
     'Modern zen retractable sunroom attached to north wall. Anthracite grey frame with warm wood accents. Floor-to-ceiling glass panels for garden view. Incorporate mature oak tree as landscape feature.',
     62500.00,
     '{
         "base_structure": 28000,
         "glass_panels": 12500,
         "motorized_system": 6000,
         "shading_system": 3500,
         "smart_control": 2800,
         "floor_heating": 4200,
         "lighting": 1800,
         "installation_labor": 5500,
         "permit_fee_estimate": 1200,
         "shipping": 3000,
         "subtotal": 68500,
         "discount": -6000,
         "total": 62500
     }'::jsonb,
     'approved', NOW() - INTERVAL '14 days', v_admin, NOW() - INTERVAL '12 days',
     'passed', v_admin)
    RETURNING id INTO v_dsn_chen;

    INSERT INTO designs (id, tenant_id, customer_id, project_id, product_id,
        name, version, width, depth, height, area,
        options, quoted_price, price_breakdown,
        status, compliance_status, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, v_cust_smith, v_proj_smith, v_prod_sunroom,
     'Smith Estate - Ocean View Premium Sunroom', 3, 9754, 6035, 3353, 58.87,
     '{
         "frame_color": "RAL 7016 Anthracite Grey",
         "glass_type": "low_e_tempered_double",
         "shading": {"type": "electric_motorized", "fabric": "sunbrella_stucco_beige"},
         "operation_mode": "smart_control",
         "add_ons": ["led_strip_warm_white", "heated_floor_radiant", "smart_lock", "rain_sensor", "wind_sensor"]
     }'::jsonb,
     87500.00,
     '{
         "base_structure": 38000,
         "premium_glass_panels": 18500,
         "motorized_system": 8000,
         "shading_system": 4500,
         "smart_control_premium": 4200,
         "heated_floor_radiant": 5800,
         "weather_sensors": 1500,
         "lighting_system": 2200,
         "installation_labor": 7500,
         "permit_fee": 1800,
         "coastal_protection_coating": 2500,
         "shipping": 3500,
         "subtotal": 98000,
         "vip_discount": -10500,
         "total": 87500
     }'::jsonb,
     'approved', 'passed', v_admin)
    RETURNING id INTO v_dsn_smith;

    INSERT INTO designs (id, tenant_id, customer_id, project_id, product_id,
        name, version, width, depth, height, area,
        options, quoted_price, price_breakdown,
        status, compliance_status, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, v_cust_garcia, v_proj_garcia, v_prod_sunroom,
     'Garcia Family - Craftsman Sunroom + Pergola', 2, 8687, 5974, 3048, 51.89,
     '{
         "frame_color": "RAL 9016 Traffic White",
         "glass_type": "low_e_tempered",
         "shading": {"type": "manual_retractable", "fabric": "sunbrella_natural_canvas"},
         "operation_mode": "electric",
         "add_ons": ["led_strip_warm_white", "ceiling_fan_x2"],
         "separate_pergola": {"sku": "PG-M-001", "size": "16x12ft", "color": "white"}
     }'::jsonb,
     62800.00,
     '{
         "sunroom_base": 26000,
         "glass_panels": 11000,
         "motorized_system": 5500,
         "shading_manual": 2000,
         "lighting": 1600,
         "ceiling_fans": 1200,
         "pergola_separate": 8500,
         "installation_labor_combined": 8000,
         "permit_fee": 1200,
         "shipping": 2800,
         "subtotal": 67800,
         "bundle_discount": -5000,
         "total": 62800
     }'::jsonb,
     'approved', 'passed', v_admin)
    RETURNING id INTO v_dsn_garcia;

    -- ========================================================
    -- F. ORDERS & PAYMENTS (for Step 4+ projects)
    -- ========================================================

    -- Smith Order (Step 5: in production)
    INSERT INTO orders (id, tenant_id, customer_id, project_id, design_id,
        subtotal, tax_amount, shipping_fee, total, currency,
        payment_plan,
        intent_fee, design_fee, intent_fee_paid_at, design_fee_paid_at,
        status,
        confirmed_at, deposit_paid_at, production_started_at,
        contract_number, contract_signed_at,
        installation_address,
        sales_rep_id, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, v_cust_smith, v_proj_smith, v_dsn_smith,
     87500.00, 7656.25, 3500.00, 98656.25, 'USD',
     '{
         "intent_fee": {"amount": 100, "status": "paid", "paid_at": "2026-01-18"},
         "design_fee": {"amount": 1000, "status": "paid", "paid_at": "2026-01-26"},
         "deposit":    {"percent": 50, "amount": 43750, "status": "paid", "paid_at": "2026-02-18", "note": "Intent + design fees credited"},
         "production": {"percent": 40, "amount": 35000, "status": "pending", "due_date": "2026-03-25"},
         "final":      {"percent": 10, "amount": 8750, "status": "pending", "due_date": "2026-04-15"}
     }'::jsonb,
     100.00, 1000.00,
     NOW() - INTERVAL '60 days', NOW() - INTERVAL '52 days',
     'in_production',
     NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days', NOW() - INTERVAL '20 days',
     'CTR-20260218-SM001', NOW() - INTERVAL '28 days',
     '{"street": "7920 Prospect Pl", "city": "La Jolla", "state": "CA", "zip": "92037", "access_notes": "Gate code: #4521"}'::jsonb,
     v_admin, v_admin)
    RETURNING id INTO v_ord_smith;

    -- Garcia Order (Step 6: installing)
    INSERT INTO orders (id, tenant_id, customer_id, project_id, design_id,
        subtotal, tax_amount, shipping_fee, total, currency,
        payment_plan,
        intent_fee, design_fee, intent_fee_paid_at, design_fee_paid_at,
        status,
        confirmed_at, deposit_paid_at, production_started_at, production_completed_at,
        quality_checked_at, shipped_at, delivered_at,
        production_payment_at,
        contract_number, contract_signed_at,
        installation_address, installation_date, installation_team,
        sales_rep_id, created_by)
    VALUES
    (uuid_generate_v4(), v_tenant, v_cust_garcia, v_proj_garcia, v_dsn_garcia,
     62800.00, 5495.00, 2800.00, 71095.00, 'USD',
     '{
         "intent_fee": {"amount": 100, "status": "paid", "paid_at": "2025-12-18"},
         "design_fee": {"amount": 500, "status": "paid", "paid_at": "2025-12-26"},
         "deposit":    {"percent": 50, "amount": 31400, "status": "paid", "paid_at": "2026-01-18"},
         "production": {"percent": 40, "amount": 25120, "status": "paid", "paid_at": "2026-02-26"},
         "final":      {"percent": 10, "amount": 6280, "status": "pending", "due_date": "2026-03-25"}
     }'::jsonb,
     100.00, 500.00,
     NOW() - INTERVAL '90 days', NOW() - INTERVAL '82 days',
     'installing',
     NOW() - INTERVAL '60 days', NOW() - INTERVAL '58 days', NOW() - INTERVAL '50 days', NOW() - INTERVAL '22 days',
     NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', NOW() - INTERVAL '10 days',
     NOW() - INTERVAL '20 days',
     'CTR-20260118-GA001', NOW() - INTERVAL '58 days',
     '{"street": "3412 J St", "city": "Sacramento", "state": "CA", "zip": "95816", "access_notes": "Park on street. Back gate unlocked."}'::jsonb,
     '2026-03-10', 'Pacific Outdoor Installations (License #924567)',
     v_admin, v_admin)
    RETURNING id INTO v_ord_garcia;

    -- ========================================================
    -- G. PAYMENT RECORDS
    -- ========================================================

    -- Smith payments
    INSERT INTO payments (tenant_id, order_id, customer_id, payment_type, amount, currency, payment_method, status, paid_at, created_by)
    VALUES
    (v_tenant, v_ord_smith, v_cust_smith, 'intent_fee', 100.00, 'USD', 'credit_card', 'completed', NOW() - INTERVAL '60 days', v_admin),
    (v_tenant, v_ord_smith, v_cust_smith, 'design_fee', 1000.00, 'USD', 'credit_card', 'completed', NOW() - INTERVAL '52 days', v_admin),
    (v_tenant, v_ord_smith, v_cust_smith, 'deposit', 43750.00, 'USD', 'wire_transfer', 'completed', NOW() - INTERVAL '28 days', v_admin);

    -- Garcia payments
    INSERT INTO payments (tenant_id, order_id, customer_id, payment_type, amount, currency, payment_method, status, paid_at, created_by)
    VALUES
    (v_tenant, v_ord_garcia, v_cust_garcia, 'intent_fee', 100.00, 'USD', 'zelle', 'completed', NOW() - INTERVAL '90 days', v_admin),
    (v_tenant, v_ord_garcia, v_cust_garcia, 'design_fee', 500.00, 'USD', 'credit_card', 'completed', NOW() - INTERVAL '82 days', v_admin),
    (v_tenant, v_ord_garcia, v_cust_garcia, 'deposit', 31400.00, 'USD', 'check', 'completed', NOW() - INTERVAL '58 days', v_admin),
    (v_tenant, v_ord_garcia, v_cust_garcia, 'second_payment', 25120.00, 'USD', 'wire_transfer', 'completed', NOW() - INTERVAL '20 days', v_admin);

    -- ========================================================
    -- H. SAMPLE DOCUMENTS (File Upload Placeholders)
    -- ========================================================

    -- Johnson (Step 2): Customer site photos + concept designs
    INSERT INTO documents (tenant_id, entity_type, entity_id, doc_type, name, file_url, file_type, workflow_step, uploaded_by)
    VALUES
    (v_tenant, 'project', v_proj_johnson, 'payment_receipt_intent', 'Johnson Intent Fee Receipt - $100.pdf',
     '/uploads/projects/johnson/receipts/intent_fee_receipt.pdf', 'pdf', 1, v_admin),
    (v_tenant, 'project', v_proj_johnson, 'customer_site_photo', 'Johnson Backyard - Front View.jpg',
     '/uploads/projects/johnson/site_photos/backyard_front.jpg', 'image', 2, v_admin),
    (v_tenant, 'project', v_proj_johnson, 'customer_site_photo', 'Johnson Backyard - Side View.jpg',
     '/uploads/projects/johnson/site_photos/backyard_side.jpg', 'image', 2, v_admin),
    (v_tenant, 'project', v_proj_johnson, 'concept_design', 'Johnson Pergola Concept - Option A.jpg',
     '/uploads/projects/johnson/designs/concept_option_a.jpg', 'image', 2, v_admin),
    (v_tenant, 'project', v_proj_johnson, 'concept_design', 'Johnson Pergola Concept - Option B.jpg',
     '/uploads/projects/johnson/designs/concept_option_b.jpg', 'image', 2, v_admin);

    -- Chen (Step 3): Full measurement + design documents
    INSERT INTO documents (tenant_id, entity_type, entity_id, doc_type, name, file_url, file_type, workflow_step, uploaded_by)
    VALUES
    (v_tenant, 'project', v_proj_chen, 'payment_receipt_intent', 'Chen Intent Fee Receipt.pdf',
     '/uploads/projects/chen/receipts/intent_fee.pdf', 'pdf', 1, v_admin),
    (v_tenant, 'project', v_proj_chen, 'signature_phase1', 'Chen Phase 1 Sign-off.pdf',
     '/uploads/projects/chen/signatures/phase1_signoff.pdf', 'pdf', 1, v_admin),
    (v_tenant, 'project', v_proj_chen, 'payment_receipt_design', 'Chen Design Fee Receipt - $800.pdf',
     '/uploads/projects/chen/receipts/design_fee.pdf', 'pdf', 2, v_admin),
    (v_tenant, 'project', v_proj_chen, 'customer_site_photo', 'Chen Backyard Panorama.jpg',
     '/uploads/projects/chen/site_photos/panorama.jpg', 'image', 2, v_admin),
    (v_tenant, 'project', v_proj_chen, 'concept_design', 'Chen Zen Sunroom Concept v2.jpg',
     '/uploads/projects/chen/designs/concept_v2.jpg', 'image', 2, v_admin),
    (v_tenant, 'project', v_proj_chen, 'signature_phase2', 'Chen Phase 2 Sign-off.pdf',
     '/uploads/projects/chen/signatures/phase2_signoff.pdf', 'pdf', 2, v_admin),
    (v_tenant, 'project', v_proj_chen, 'measurement_data', 'Chen Villa Measurement Report.pdf',
     '/uploads/projects/chen/measurement/measurement_report.pdf', 'pdf', 3, v_admin),
    (v_tenant, 'project', v_proj_chen, 'site_plan', 'Chen Villa Site Plan v2.pdf',
     '/uploads/projects/chen/designs/site_plan_v2.pdf', 'pdf', 3, v_admin),
    (v_tenant, 'project', v_proj_chen, 'rendering', 'Chen Zen Sunroom Render - Garden View.jpg',
     '/uploads/projects/chen/designs/render_garden_view.jpg', 'image', 3, v_admin),
    (v_tenant, 'project', v_proj_chen, 'elevation_drawing', 'Chen Villa Elevation Drawing.pdf',
     '/uploads/projects/chen/designs/elevation.pdf', 'pdf', 3, v_admin);

    -- Smith (Step 5): Full document set through production
    INSERT INTO documents (tenant_id, entity_type, entity_id, doc_type, name, file_url, file_type, workflow_step, uploaded_by)
    VALUES
    (v_tenant, 'project', v_proj_smith, 'payment_receipt_intent', 'Smith Intent Fee Receipt.pdf',
     '/uploads/projects/smith/receipts/intent_fee.pdf', 'pdf', 1, v_admin),
    (v_tenant, 'project', v_proj_smith, 'signature_phase1', 'Smith Phase 1 Sign-off.pdf',
     '/uploads/projects/smith/signatures/phase1_signoff.pdf', 'pdf', 1, v_admin),
    (v_tenant, 'project', v_proj_smith, 'payment_receipt_design', 'Smith Design Fee Receipt - $1000.pdf',
     '/uploads/projects/smith/receipts/design_fee.pdf', 'pdf', 2, v_admin),
    (v_tenant, 'project', v_proj_smith, 'signature_phase2', 'Smith Phase 2 Sign-off.pdf',
     '/uploads/projects/smith/signatures/phase2_signoff.pdf', 'pdf', 2, v_admin),
    (v_tenant, 'project', v_proj_smith, 'measurement_data', 'Smith Estate Measurement Report.pdf',
     '/uploads/projects/smith/measurement/measurement_report.pdf', 'pdf', 3, v_admin),
    (v_tenant, 'project', v_proj_smith, 'site_plan', 'Smith Estate Site Plan.pdf',
     '/uploads/projects/smith/designs/site_plan.pdf', 'pdf', 3, v_admin),
    (v_tenant, 'project', v_proj_smith, 'structural_calculation', 'Smith Structural Engineering Report.pdf',
     '/uploads/projects/smith/compliance/structural_calc.pdf', 'pdf', 3, v_admin),
    (v_tenant, 'project', v_proj_smith, 'signature_phase3', 'Smith Phase 3 Sign-off.pdf',
     '/uploads/projects/smith/signatures/phase3_signoff.pdf', 'pdf', 3, v_admin),
    (v_tenant, 'project', v_proj_smith, 'quotation', 'Smith Final Quotation - $87,500.pdf',
     '/uploads/projects/smith/contracts/quotation_final.pdf', 'pdf', 4, v_admin),
    (v_tenant, 'project', v_proj_smith, 'contract', 'Smith Construction Contract CTR-20260218-SM001.pdf',
     '/uploads/projects/smith/contracts/contract_signed.pdf', 'pdf', 4, v_admin),
    (v_tenant, 'project', v_proj_smith, 'payment_receipt_deposit', 'Smith Deposit Receipt - $43,750.pdf',
     '/uploads/projects/smith/receipts/deposit.pdf', 'pdf', 4, v_admin),
    (v_tenant, 'project', v_proj_smith, 'compliance_package', 'Smith Compliance Package.zip',
     '/uploads/projects/smith/compliance/compliance_package.zip', 'document', 4, v_admin),
    (v_tenant, 'project', v_proj_smith, 'signature_phase4', 'Smith Phase 4 Sign-off.pdf',
     '/uploads/projects/smith/signatures/phase4_signoff.pdf', 'pdf', 4, v_admin),
    (v_tenant, 'project', v_proj_smith, 'qc_report', 'Smith Factory QC Report.pdf',
     '/uploads/projects/smith/production/qc_report.pdf', 'pdf', 5, v_admin),
    (v_tenant, 'project', v_proj_smith, 'pre_acceptance_photo', 'Smith Pre-Assembly Photo 1.jpg',
     '/uploads/projects/smith/production/pre_assembly_01.jpg', 'image', 5, v_admin);

    -- Garcia (Step 6): Complete document set
    INSERT INTO documents (tenant_id, entity_type, entity_id, doc_type, name, file_url, file_type, workflow_step, uploaded_by)
    VALUES
    (v_tenant, 'project', v_proj_garcia, 'payment_receipt_intent', 'Garcia Intent Fee Receipt.pdf',
     '/uploads/projects/garcia/receipts/intent_fee.pdf', 'pdf', 1, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'payment_receipt_design', 'Garcia Design Fee Receipt.pdf',
     '/uploads/projects/garcia/receipts/design_fee.pdf', 'pdf', 2, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'measurement_data', 'Garcia Measurement Report.pdf',
     '/uploads/projects/garcia/measurement/report.pdf', 'pdf', 3, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'contract', 'Garcia Contract CTR-20260118-GA001.pdf',
     '/uploads/projects/garcia/contracts/contract.pdf', 'pdf', 4, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'payment_receipt_deposit', 'Garcia Deposit Receipt - $31,400.pdf',
     '/uploads/projects/garcia/receipts/deposit.pdf', 'pdf', 4, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'compliance_package', 'Garcia Compliance Package.zip',
     '/uploads/projects/garcia/compliance/package.zip', 'document', 4, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'qc_report', 'Garcia Factory QC Report.pdf',
     '/uploads/projects/garcia/production/qc_report.pdf', 'pdf', 5, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'pre_acceptance_photo', 'Garcia Pre-Assembly Photo.jpg',
     '/uploads/projects/garcia/production/pre_assembly.jpg', 'image', 5, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'payment_receipt_production', 'Garcia Production Payment - $25,120.pdf',
     '/uploads/projects/garcia/receipts/production_payment.pdf', 'pdf', 5, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'delivery_receipt', 'Garcia Delivery Receipt.pdf',
     '/uploads/projects/garcia/logistics/delivery_receipt.pdf', 'pdf', 5, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'signature_phase5', 'Garcia Delivery Sign-off.pdf',
     '/uploads/projects/garcia/signatures/delivery_signoff.pdf', 'pdf', 5, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'installation_progress_photo', 'Garcia Install Day 1.jpg',
     '/uploads/projects/garcia/installation/day1.jpg', 'image', 6, v_admin),
    (v_tenant, 'project', v_proj_garcia, 'installation_progress_photo', 'Garcia Install Day 3.jpg',
     '/uploads/projects/garcia/installation/day3.jpg', 'image', 6, v_admin);

    -- ========================================================
    -- I. CHECKLIST ITEMS (For all projects, appropriate to step)
    -- ========================================================

    -- === PHASE 1 checklist items (all projects) ===
    -- Williams (Step 1 - in progress)
    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, input_required, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_williams, 1, 1, 'p1_initial_comm', 'Initial communication & product demo', 'sales', 'Client contact info', 'Understand basic needs & use case', TRUE, NOW() - INTERVAL '2 days', FALSE),
    (v_tenant, v_proj_williams, 1, 2, 'p1_questionnaire', 'Fill Client Design Intake Questionnaire (Appendix A)', 'customer', 'Questionnaire form', 'Completed Questionnaire', FALSE, NULL, FALSE),
    (v_tenant, v_proj_williams, 1, 3, 'p1_hoa_precheck', 'HOA/Community compliance pre-communication', 'sales', 'Community name & address', 'Record HOA restrictions', FALSE, NULL, FALSE),
    (v_tenant, v_proj_williams, 1, 4, 'p1_intent_fee', 'Collect intent fee ($100)', 'customer', NULL, 'Payment receipt', FALSE, NULL, TRUE),
    (v_tenant, v_proj_williams, 1, 5, 'p1_signoff', 'Customer Phase 1 sign-off', 'customer', NULL, 'Signed confirmation', FALSE, NULL, TRUE);

    -- Johnson (Step 2 - phase 1 complete, phase 2 in progress)
    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_johnson, 1, 1, 'p1_initial_comm', 'Initial communication & product demo', 'sales', 'Understand basic needs', TRUE, NOW() - INTERVAL '12 days', FALSE),
    (v_tenant, v_proj_johnson, 1, 2, 'p1_questionnaire', 'Fill Client Design Intake Questionnaire', 'customer', 'Completed Questionnaire', TRUE, NOW() - INTERVAL '11 days', FALSE),
    (v_tenant, v_proj_johnson, 1, 3, 'p1_hoa_precheck', 'HOA compliance pre-communication', 'sales', 'Record HOA restrictions', TRUE, NOW() - INTERVAL '11 days', FALSE),
    (v_tenant, v_proj_johnson, 1, 4, 'p1_intent_fee', 'Collect intent fee ($100)', 'customer', 'Payment receipt', TRUE, NOW() - INTERVAL '12 days', TRUE),
    (v_tenant, v_proj_johnson, 1, 5, 'p1_signoff', 'Customer Phase 1 sign-off', 'customer', 'Signed confirmation', TRUE, NOW() - INTERVAL '10 days', TRUE);

    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, input_required, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_johnson, 2, 1, 'p2_site_photos', 'Provide site photos (multi-angle, clear)', 'customer', 'Clear backyard photos with reference objects', 'Photos uploaded to system', TRUE, NOW() - INTERVAL '8 days', TRUE),
    (v_tenant, v_proj_johnson, 2, 2, 'p2_product_select', 'Select 2-3 product styles', 'customer', 'Browse product matrix', 'Selected styles', TRUE, NOW() - INTERVAL '7 days', FALSE),
    (v_tenant, v_proj_johnson, 2, 3, 'p2_ai_concept', 'AI generate concept design renderings', 'platform', 'Photos + styles', 'Photorealistic Concept Design', FALSE, NULL, FALSE),
    (v_tenant, v_proj_johnson, 2, 4, 'p2_design_fee', 'Collect design fee ($500-$1,000)', 'customer', NULL, 'Payment receipt', FALSE, NULL, TRUE),
    (v_tenant, v_proj_johnson, 2, 5, 'p2_signoff', 'Customer Phase 2 sign-off', 'customer', NULL, 'Signed confirmation', FALSE, NULL, TRUE);

    -- Smith (Step 5 - phases 1-4 complete, phase 5 in progress)
    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_smith, 1, 1, 'p1_initial_comm', 'Initial communication & product demo', 'sales', 'Understand basic needs', TRUE, NOW() - INTERVAL '58 days', FALSE),
    (v_tenant, v_proj_smith, 1, 2, 'p1_questionnaire', 'Fill Client Design Intake Questionnaire', 'customer', 'Completed Questionnaire', TRUE, NOW() - INTERVAL '57 days', FALSE),
    (v_tenant, v_proj_smith, 1, 3, 'p1_hoa_precheck', 'HOA compliance pre-communication', 'sales', 'Record HOA restrictions', TRUE, NOW() - INTERVAL '57 days', FALSE),
    (v_tenant, v_proj_smith, 1, 4, 'p1_intent_fee', 'Collect intent fee ($100)', 'customer', 'Payment receipt', TRUE, NOW() - INTERVAL '60 days', TRUE),
    (v_tenant, v_proj_smith, 1, 5, 'p1_signoff', 'Customer Phase 1 sign-off', 'customer', 'Signed confirmation', TRUE, NOW() - INTERVAL '55 days', TRUE);

    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_smith, 2, 1, 'p2_site_photos', 'Provide site photos', 'customer', 'Photos uploaded', TRUE, NOW() - INTERVAL '50 days', TRUE),
    (v_tenant, v_proj_smith, 2, 2, 'p2_product_select', 'Select product styles', 'customer', 'Selected styles', TRUE, NOW() - INTERVAL '49 days', FALSE),
    (v_tenant, v_proj_smith, 2, 3, 'p2_ai_concept', 'AI generate concept design', 'platform', 'Concept Design', TRUE, NOW() - INTERVAL '47 days', FALSE),
    (v_tenant, v_proj_smith, 2, 4, 'p2_design_fee', 'Collect design fee', 'customer', 'Payment receipt', TRUE, NOW() - INTERVAL '52 days', TRUE),
    (v_tenant, v_proj_smith, 2, 5, 'p2_signoff', 'Customer Phase 2 sign-off', 'customer', 'Signed confirmation', TRUE, NOW() - INTERVAL '45 days', TRUE);

    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_smith, 3, 1, 'p3_schedule', 'Schedule on-site measurement', 'customer', 'Confirmed date', TRUE, NOW() - INTERVAL '40 days', FALSE),
    (v_tenant, v_proj_smith, 3, 2, 'p3_measure', 'On-site precision measurement', 'surveyor', 'Precise dimension data', TRUE, NOW() - INTERVAL '38 days', FALSE),
    (v_tenant, v_proj_smith, 3, 3, 'p3_struct_assess', 'Structural assessment & compliance screening', 'designer', 'Assessment report', TRUE, NOW() - INTERVAL '37 days', FALSE),
    (v_tenant, v_proj_smith, 3, 4, 'p3_deep_design', 'Detailed design (Site Plan + Schematic)', 'designer', 'Site Plan + Renderings', TRUE, NOW() - INTERVAL '36 days', FALSE),
    (v_tenant, v_proj_smith, 3, 5, 'p3_signoff', 'Customer Phase 3 sign-off', 'customer', 'Signed design confirmation', TRUE, NOW() - INTERVAL '35 days', TRUE);

    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_smith, 4, 1, 'p4_config', 'Product configuration (color, shading, smart, etc.)', 'customer', 'Full configuration', TRUE, NOW() - INTERVAL '30 days', FALSE),
    (v_tenant, v_proj_smith, 4, 2, 'p4_quotation', 'Generate detailed quotation', 'system', 'Detailed quotation', TRUE, NOW() - INTERVAL '30 days', FALSE),
    (v_tenant, v_proj_smith, 4, 3, 'p4_quote_confirm', 'Customer confirm quotation', 'customer', 'Signed quotation', TRUE, NOW() - INTERVAL '29 days', TRUE),
    (v_tenant, v_proj_smith, 4, 4, 'p4_contract', 'Generate & sign contract', 'both', 'Signed contract', TRUE, NOW() - INTERVAL '28 days', TRUE),
    (v_tenant, v_proj_smith, 4, 5, 'p4_deposit', 'Collect 50% deposit', 'customer', 'Payment receipt', TRUE, NOW() - INTERVAL '28 days', TRUE),
    (v_tenant, v_proj_smith, 4, 6, 'p4_compliance', 'Deliver compliance package', 'company', 'Full permit application docs', TRUE, NOW() - INTERVAL '27 days', FALSE),
    (v_tenant, v_proj_smith, 4, 7, 'p4_signoff', 'Customer Phase 4 sign-off', 'customer', 'Signed confirmation', TRUE, NOW() - INTERVAL '28 days', TRUE);

    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_smith, 5, 1, 'p5_production', 'Production scheduling & tracking', 'factory', 'Production progress report', TRUE, NOW() - INTERVAL '18 days', FALSE),
    (v_tenant, v_proj_smith, 5, 2, 'p5_qc', 'Factory QC (pre-assembly & remote acceptance)', 'qc_team', 'QC report + photos', TRUE, NOW() - INTERVAL '10 days', TRUE),
    (v_tenant, v_proj_smith, 5, 3, 'p5_prod_payment', 'Collect 40% production payment', 'customer', 'Payment receipt', FALSE, NULL, TRUE),
    (v_tenant, v_proj_smith, 5, 4, 'p5_shipping', 'Logistics & shipping', 'logistics', 'Tracking number + ETA', FALSE, NULL, FALSE),
    (v_tenant, v_proj_smith, 5, 5, 'p5_delivery', 'Delivery confirmation & inspection', 'customer', 'Delivery receipt', FALSE, NULL, TRUE),
    (v_tenant, v_proj_smith, 5, 6, 'p5_signoff', 'Customer Phase 5 sign-off', 'customer', 'Signed confirmation', FALSE, NULL, TRUE);

    -- Garcia (Step 6 - phases 1-5 complete, phase 6 in progress)
    -- (Abbreviated: only phase 5-6 shown, phases 1-4 similar to Smith)
    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_garcia, 5, 1, 'p5_production', 'Production scheduling & tracking', 'factory', 'Progress report', TRUE, NOW() - INTERVAL '25 days', FALSE),
    (v_tenant, v_proj_garcia, 5, 2, 'p5_qc', 'Factory QC', 'qc_team', 'QC report + photos', TRUE, NOW() - INTERVAL '20 days', TRUE),
    (v_tenant, v_proj_garcia, 5, 3, 'p5_prod_payment', 'Collect 40% production payment', 'customer', 'Payment receipt', TRUE, NOW() - INTERVAL '20 days', TRUE),
    (v_tenant, v_proj_garcia, 5, 4, 'p5_shipping', 'Logistics & shipping', 'logistics', 'Tracking number', TRUE, NOW() - INTERVAL '18 days', FALSE),
    (v_tenant, v_proj_garcia, 5, 5, 'p5_delivery', 'Delivery confirmation', 'customer', 'Delivery receipt', TRUE, NOW() - INTERVAL '10 days', TRUE),
    (v_tenant, v_proj_garcia, 5, 6, 'p5_signoff', 'Customer Phase 5 sign-off', 'customer', 'Signed confirmation', TRUE, NOW() - INTERVAL '10 days', TRUE);

    INSERT INTO project_checklist_items (tenant_id, project_id, phase, sort_order, task_key, task_label, responsible, output_expected, is_completed, completed_at, requires_upload) VALUES
    (v_tenant, v_proj_garcia, 6, 1, 'p6_prep', 'Pre-installation prep (foundation/utilities)', 'contractor', 'Installation-ready site', TRUE, NOW() - INTERVAL '8 days', FALSE),
    (v_tenant, v_proj_garcia, 6, 2, 'p6_install', 'On-site installation (3-7 days)', 'installer', 'Daily progress photos', FALSE, NULL, TRUE),
    (v_tenant, v_proj_garcia, 6, 3, 'p6_govt_inspect', 'Government final inspection', 'company', 'CO (Certificate of Occupancy)', FALSE, NULL, TRUE),
    (v_tenant, v_proj_garcia, 6, 4, 'p6_final_accept', 'Customer final acceptance', 'customer', 'Signed acceptance form', FALSE, NULL, TRUE),
    (v_tenant, v_proj_garcia, 6, 5, 'p6_final_payment', 'Collect final 10% payment', 'customer', 'Payment receipt', FALSE, NULL, TRUE),
    (v_tenant, v_proj_garcia, 6, 6, 'p6_handover', 'Document handover (warranty, manual, CO)', 'company', 'Warranty + manuals + CO', FALSE, NULL, TRUE),
    (v_tenant, v_proj_garcia, 6, 7, 'p6_followup', 'Customer follow-up & referral program', 'cs_team', 'Review + referral record', FALSE, NULL, FALSE);

    -- ========================================================
    -- J. PHASE SIGN-OFF RECORDS (for completed phases)
    -- ========================================================

    -- Smith sign-offs (Phases 1-4)
    INSERT INTO project_phase_signoffs (tenant_id, project_id, phase, signoff_text, signed_by_name, signed_by_role, signed_at) VALUES
    (v_tenant, v_proj_smith, 1, 'I have reviewed Phase 1 content, understand the process, and agree to pay the $100 intent fee to proceed.', 'Michael Smith', 'customer', NOW() - INTERVAL '55 days'),
    (v_tenant, v_proj_smith, 2, 'I have reviewed the concept design renderings, confirm the design direction, and agree to pay $1,000 design fee to proceed.', 'Michael Smith', 'customer', NOW() - INTERVAL '45 days'),
    (v_tenant, v_proj_smith, 3, 'I have reviewed and confirmed the detailed design (Site Plan, renderings, specifications). I agree to use this as the basis for quotation.', 'Michael Smith', 'customer', NOW() - INTERVAL '35 days'),
    (v_tenant, v_proj_smith, 4, 'I have confirmed the final configuration, quotation ($87,500), and signed the construction contract. I have paid the 50% deposit ($43,750) and agree to start production and permit application.', 'Michael Smith', 'customer', NOW() - INTERVAL '28 days');

    -- Garcia sign-offs (Phases 1-5)
    INSERT INTO project_phase_signoffs (tenant_id, project_id, phase, signoff_text, signed_by_name, signed_by_role, signed_at) VALUES
    (v_tenant, v_proj_garcia, 1, 'I have reviewed Phase 1 and agree to proceed.', 'Maria Garcia', 'customer', NOW() - INTERVAL '85 days'),
    (v_tenant, v_proj_garcia, 2, 'Concept design confirmed. Design fee paid.', 'Maria Garcia', 'customer', NOW() - INTERVAL '75 days'),
    (v_tenant, v_proj_garcia, 3, 'Detailed design reviewed and approved.', 'Maria Garcia', 'customer', NOW() - INTERVAL '65 days'),
    (v_tenant, v_proj_garcia, 4, 'Contract signed, deposit paid. Ready for production.', 'Maria Garcia', 'customer', NOW() - INTERVAL '58 days'),
    (v_tenant, v_proj_garcia, 5, 'Goods received and inspected. No damage. Ready for installation.', 'Maria Garcia', 'customer', NOW() - INTERVAL '10 days');

    RAISE NOTICE 'Workflow seed data inserted successfully!';
    RAISE NOTICE 'Projects created: Williams (Step 1), Johnson (Step 2), Chen (Step 3), Smith (Step 5), Garcia (Step 6)';
END $$;
