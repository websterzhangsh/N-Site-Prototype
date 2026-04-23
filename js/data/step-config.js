/**
 * step-config.js — 步骤配置 & 工作流定义
 * 从 company-operations.html 提取（Phase 1.4）
 * 命名空间: Nestopia.data.stepConfig
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    // ===== Step Detail Data (per-step core actions & key deliverables) =====
    var STEP_DETAIL_CONFIG = {
        1: {
            name: 'Intent',
            nameEn: 'Intent',
            goal: 'Awaken the customer\'s aspiration for an ideal outdoor lifestyle, build trust, and filter high-intent customers',
            payment: '$100 Intent Fee',
            coreActions: [
                { id: 'a1', label: 'Multi-Channel Acquisition', desc: 'Streaming media distribution; partnerships with builders, designers, agents', icon: 'fa-bullhorn' },
                { id: 'a2', label: 'Initial Communication', desc: 'Phone/video/in-person, 15-20 min to understand basic needs', icon: 'fa-phone-alt' },
                { id: 'a3', label: 'Product Demo', desc: 'Showcase Before-After-Animation to spark interest', icon: 'fa-play-circle' },
                { id: 'a4', label: 'Deep Insight', desc: 'Complete the Client Design Intake Questionnaire (8 modules)', icon: 'fa-clipboard-list' },
                { id: 'a5', label: 'Compliance Pre-check', desc: 'Proactively inquire about HOA/community rules, inform review requirements', icon: 'fa-shield-alt' },
                { id: 'a6', label: 'Collect Intent Fee', desc: '$100 (credited toward contract), lock in customer intent', icon: 'fa-dollar-sign' }
            ],
            keyDeliverables: [
                { id: 'd1', label: 'Client Design Intake Form', desc: '8-module questionnaire', icon: 'fa-clipboard-list', required: true },
                { id: 'd2', label: 'Intent Fee Receipt', desc: '$100 payment voucher', icon: 'fa-receipt', required: true },
                { id: 'd3', label: 'Phase 1 Client Sign-off', desc: 'Client confirms intent and agrees to proceed to Design phase', icon: 'fa-signature', required: true }
            ],
            questionnaire: [
                { module: 'A.1', name: 'Customer Basics', items: 'Name, address, contact info, decision maker', required: true },
                { module: 'A.2', name: 'Project Overview', items: 'Scene, location, usage, wall-mount, dimensions, constraints', required: true },
                { module: 'A.3', name: 'Usage & Lifestyle', items: 'Duration, headcount, activities, functional needs', required: true },
                { module: 'A.4', name: 'Budget & Timeline', items: 'Budget range, start date, key dates', required: true },
                { module: 'A.5', name: 'Community & HOA Compliance', items: 'HOA status, design guidelines, regulation awareness', required: true },
                { module: 'A.6', name: 'Style & Aesthetic Preferences', items: 'Style, colors, reference image upload', required: false },
                { module: 'A.7', name: 'Decision Process', items: 'Decision makers, decision timeline', required: false },
                { module: 'A.8', name: 'Additional Notes', items: 'Open text', required: false }
            ],
            agentSupport: [
                { agent: 'CS Agent', ability: '24/7 auto-reply to inquiries, schedule on-site/video appointments' },
                { agent: 'Knowledge Base', ability: 'Provide HOA FAQ references, product FAQ' },
                { agent: 'Compliance Agent', ability: 'Preliminary HOA restriction lookup by community name' }
            ]
        },
        2: {
            name: 'AI Design',
            nameEn: 'AI Design',
            goal: 'Help customers quickly see possibilities, intensify desire to own the product, and push into formal design',
            payment: '$500–$1,000 Design Fee',
            coreActions: [
                { id: 'a1', label: 'Collect Site Photos', desc: 'Customer uploads multi-angle yard photos with reference objects; provide floor plan if available', icon: 'fa-camera' },
                { id: 'a2', label: 'Product Style Selection', desc: 'Customer selects 2–3 preferred styles from product matrix (e.g. single-slope, multi-slope, curved roof)', icon: 'fa-th-large' },
                { id: 'a3', label: 'AI Concept Rendering', desc: 'System fuses selected product model with customer yard photos to generate 2–3 angle concept designs in ~30 seconds', icon: 'fa-magic' },
                { id: 'a4', label: 'Design Walkthrough', desc: 'Sales consultant reviews concept renderings with customer, discusses feasibility and style fit', icon: 'fa-chalkboard-teacher' },
                { id: 'a5', label: 'Collect Design Fee', desc: '$500–$1,000 (2nd payment, credited toward contract). "Fully refundable if we cannot proceed."', icon: 'fa-dollar-sign' }
            ],
            keyDeliverables: [
                { id: 'd1', label: 'Photorealistic Concept Renderings', desc: 'At least 2 schemes, 2–3 angles each, with product model & basic dimensions', icon: 'fa-image', required: true },
                { id: 'd2', label: 'Concept-Level Site Plan', desc: 'Product placement & surrounding context overview', icon: 'fa-map-marked-alt', required: true },
                { id: 'd3', label: 'Before-After Animation', desc: 'Dynamic transformation from old yard to new product', icon: 'fa-film', required: false },
                { id: 'd4', label: 'Design Fee Receipt', desc: '$500–$1,000 payment voucher (2nd payment)', icon: 'fa-receipt', required: true },
                { id: 'd5', label: 'Phase 2 Client Sign-off', desc: 'Client confirms design direction and agrees to proceed to Measurement phase', icon: 'fa-signature', required: true }
            ],
            aiDesigner: {
                inheritFields: [
                    { key: 'project_type', label: 'Product Type', source: 'project.type' },
                    { key: 'dimensions', label: 'Desired Dimensions', source: 'A.2', field: 'a2_dimension_length_ft,a2_dimension_width_ft,a2_dimension_height_ft' },
                    { key: 'style_pref', label: 'Style Preference', source: 'A.6', field: 'a6_style_preference' },
                    { key: 'color_pref', label: 'Color Preference', source: 'A.6', field: 'a6_color_preference' },
                    { key: 'location', label: 'Install Location', source: 'A.2', field: 'a2_install_location' },
                    { key: 'wall_attached', label: 'Wall Attached', source: 'A.2', field: 'a2_wall_connected' },
                    { key: 'hoa_status', label: 'HOA Status', source: 'A.5', field: 'a5_has_hoa' }
                ],
                photoUpload: { label: 'Yard Site Photos', hint: 'Multi-angle, with reference objects, clear surroundings', accept: 'image/*', multiple: true, maxFiles: 10 },
                styleOptions: [
                    // Sunroom (sr- prefix)
                    { value: 'sr-l-classic', label: 'L-Classic', icon: 'fa-home', sub: 'L-Type · Manual' },
                    { value: 'sr-l-smart', label: 'L-Smart', icon: 'fa-bolt', sub: 'L-Type · Motorized' },
                    { value: 'sr-l-pro', label: 'L-Pro', icon: 'fa-solar-panel', sub: 'L-Type · Solar' },
                    { value: 'sr-m-classic', label: 'M-Classic', icon: 'fa-warehouse', sub: 'M-Type · Manual' },
                    { value: 'sr-m-smart', label: 'M-Smart', icon: 'fa-cogs', sub: 'M-Type · Motorized' },
                    { value: 'sr-m-pro', label: 'M-Pro', icon: 'fa-sun', sub: 'M-Type · Solar' },
                    // Pergola (pg- prefix)
                    { value: 'pg-basic', label: 'Basic', icon: 'fa-campground', sub: 'Fixed Roof · Manual' },
                    { value: 'pg-classic', label: 'Classic', icon: 'fa-warehouse', sub: 'Louvers · Motorized' },
                    // Zip Blinds (zb- prefix)
                    { value: 'zb-manual', label: 'Standard', icon: 'fa-wind', sub: 'Manual' },
                    { value: 'zb-motorized', label: 'Motorized', icon: 'fa-bolt', sub: 'Electric Motor' }
                ]
            },
            agentSupport: [
                { agent: 'AI Designer', ability: 'Core: Real yard photo + product model → 30-sec photorealistic concept rendering' },
                { agent: 'Compliance Agent', ability: 'Auto-filter styles violating HOA restrictions (e.g. roof pitch, color, material)' },
                { agent: 'Knowledge Base', ability: 'Product specs, style references, material options' }
            ]
        },
        3: {
            name: 'Measurement',
            nameEn: 'Measurement',
            goal: 'Lock in design with precise data, eliminate on-site installation deviation risks, and deliver full design enablement matrix',
            payment: '— (included)',
            coreActions: [
                { id: 'a1', label: 'Schedule On-Site Measurement', desc: 'Coordinate with customer, send pre-measurement prep guide (clear site, mark utilities, identify obstacles)', icon: 'fa-calendar-check' },
                { id: 'a2', label: 'Precision On-Site Measurement', desc: 'Professional surveyor measures install area + surrounding structures using tape, laser distance meter, and level', icon: 'fa-ruler-combined' },
                { id: 'a3', label: 'Structural Assessment', desc: 'Analyze wall bearing capacity, foundation condition, and connection points to main structure', icon: 'fa-building' },
                { id: 'a4', label: 'Obstacle Positioning', desc: 'Record all pipes, vents, utilities, downspouts, trees, and underground facilities with precise locations', icon: 'fa-map-marker-alt' },
                { id: 'a5', label: 'Compliance Pre-Check', desc: 'Verify setback distances, drainage slope, neighbor boundaries, and height limits against local codes', icon: 'fa-shield-alt' },
                { id: 'a6', label: 'Detailed Design Generation', desc: 'Generate full design matrix: photorealistic renderings (5-8 angles), site plan, elevation drawings, interior layout, and structural calculations', icon: 'fa-drafting-compass' },
                { id: 'a7', label: 'Design Presentation & Sign-off', desc: 'Present precise design to customer, confirm all details (appearance, layout, connection), and obtain signed approval', icon: 'fa-signature' }
            ],
            keyDeliverables: [
                { id: 'd1', label: 'Photorealistic Renderings', desc: '5–8 angles, product model fused into real yard scene', icon: 'fa-images', required: true },
                { id: 'd2', label: 'Site Plan (Dimensioned)', desc: 'Product position, setback distances, lot boundaries, utility routes', icon: 'fa-map-marked-alt', required: true },
                { id: 'd3', label: 'Interior Layout Plan', desc: 'Furniture placement, functional zones, traffic flow', icon: 'fa-th-large', required: true },
                { id: 'd4', label: 'Elevation Drawings', desc: 'All-side views with dimension annotations', icon: 'fa-building', required: true },
                { id: 'd5', label: 'Before-After Animation', desc: 'Dynamic transformation from existing yard to new product', icon: 'fa-film', required: false },
                { id: 'd6', label: 'Structural Calculation (Preliminary)', desc: 'Foundation loads, wind load, basic engineering data', icon: 'fa-calculator', required: true },
                { id: 'd7', label: 'Foundation Selection Guide', desc: 'Foundation type recommendation and construction approach', icon: 'fa-layer-group', required: true },
                { id: 'd8', label: 'Compliance Guide', desc: 'Local code summary, permit checklist, HOA requirements reference', icon: 'fa-file-contract', required: true },
                { id: 'd9', label: 'Phase 3 Client Sign-off', desc: 'Client confirms design and approves to proceed to Quotation phase', icon: 'fa-signature', required: true }
            ],
            measurementPanel: {
                inheritFields: [
                    { key: 'project_type', label: 'Product Type', source: 'project.type' },
                    { key: 'dimensions', label: 'Requested Dimensions', source: 'A.2', field: 'a2_dimension_length_ft,a2_dimension_width_ft,a2_dimension_height_ft' },
                    { key: 'location', label: 'Install Location', source: 'A.2', field: 'a2_install_location' },
                    { key: 'wall_attached', label: 'Wall Attached', source: 'A.2', field: 'a2_wall_connected' },
                    { key: 'constraints', label: 'Known Constraints', source: 'A.2', field: 'a2_special_constraints' },
                    { key: 'hoa_status', label: 'HOA Status', source: 'A.5', field: 'a5_has_hoa' },
                    { key: 'hoa_name', label: 'HOA Name', source: 'A.5', field: 'a5_hoa_name' }
                ],
                measurementFields: [
                    { key: 'method', label: 'Measurement Method', type: 'select', icon: 'fa-tools', options: [
                        { value: 'manual_precision', label: 'Manual Precision (Tape + Laser)' },
                        { value: 'laser_3d', label: 'Laser 3D Scan (UNRE/Leica)' },
                        { value: 'hybrid', label: 'Hybrid (Manual + Laser Verify)' }
                    ]},
                    { key: 'surveyor', label: 'Surveyor Name & License #', type: 'text', icon: 'fa-user-tie', placeholder: 'e.g. John Martinez (#948721)' },
                    { key: 'date', label: 'Measurement Date', type: 'date', icon: 'fa-calendar' },
                    { key: 'length_ft', label: 'Length (ft)', type: 'number', icon: 'fa-arrows-alt-h', placeholder: 'e.g. 26.2' },
                    { key: 'width_ft', label: 'Width (ft)', type: 'number', icon: 'fa-arrows-alt-v', placeholder: 'e.g. 18.5' },
                    { key: 'height_ft', label: 'Height (ft)', type: 'number', icon: 'fa-arrows-alt', placeholder: 'e.g. 10.5' },
                    { key: 'foundation', label: 'Foundation Type', type: 'select', icon: 'fa-layer-group', options: [
                        { value: 'concrete_slab', label: 'Concrete Slab' },
                        { value: 'pier_beam', label: 'Pier & Beam' },
                        { value: 'helical_pile', label: 'Helical Pile' },
                        { value: 'grade_beam', label: 'Grade Beam' },
                        { value: 'existing_patio', label: 'Existing Patio' },
                        { value: 'other', label: 'Other' }
                    ]},
                    { key: 'foundation_detail', label: 'Foundation Detail', type: 'text', icon: 'fa-info-circle', placeholder: 'e.g. 4" thick, rebar #4 @ 12" OC' },
                    { key: 'wall_bearing', label: 'Wall Bearing Assessment', type: 'select', icon: 'fa-building', options: [
                        { value: 'adequate_wood', label: 'Adequate — Wood Frame' },
                        { value: 'adequate_masonry', label: 'Adequate — Masonry/CMU' },
                        { value: 'adequate_steel', label: 'Adequate — Steel Frame' },
                        { value: 'needs_reinforcement', label: 'Needs Reinforcement' },
                        { value: 'na_freestanding', label: 'N/A — Freestanding' }
                    ]},
                    { key: 'setback_distance', label: 'Setback Distance', type: 'text', icon: 'fa-ruler', placeholder: 'e.g. 12ft actual (5ft required) — OK' },
                    { key: 'drainage_slope', label: 'Drainage Slope', type: 'text', icon: 'fa-water', placeholder: 'e.g. 2.1% slope — OK' }
                ],
                obstacleTypes: [
                    { value: 'downspout', label: 'Downspout', icon: 'fa-faucet' },
                    { value: 'gas_meter', label: 'Gas Meter', icon: 'fa-fire' },
                    { value: 'gas_line', label: 'Gas Line', icon: 'fa-stream' },
                    { value: 'water_line', label: 'Water Line', icon: 'fa-tint' },
                    { value: 'electrical', label: 'Electrical Panel/Line', icon: 'fa-bolt' },
                    { value: 'hvac_unit', label: 'HVAC Unit', icon: 'fa-fan' },
                    { value: 'tree', label: 'Tree', icon: 'fa-tree' },
                    { value: 'vent', label: 'Vent/Chimney', icon: 'fa-wind' },
                    { value: 'septic', label: 'Septic/Sewer', icon: 'fa-toilet' },
                    { value: 'sprinkler', label: 'Sprinkler System', icon: 'fa-shower' },
                    { value: 'other', label: 'Other', icon: 'fa-exclamation-circle' }
                ],
                // Zip Blinds — simpler product, window/opening based measurements
                zipBlindsFields: [
                    { key: 'method', label: 'Measurement Method', type: 'select', icon: 'fa-tools', options: [
                        { value: 'manual_precision', label: 'Manual Precision (Tape + Laser)' },
                        { value: 'laser_3d', label: 'Laser 3D Scan' }
                    ]},
                    { key: 'surveyor', label: 'Installer / Measurer', type: 'text', icon: 'fa-user-tie', placeholder: 'e.g. Tom Baker (#583041)' },
                    { key: 'date', label: 'Measurement Date', type: 'date', icon: 'fa-calendar' },
                    { key: 'openings', label: 'Number of Openings', type: 'number', icon: 'fa-th-large', placeholder: 'e.g. 3', min: 1, step: 1, defaultValue: '1' },
                    { key: 'width_in', label: 'Width (inches)', type: 'number', icon: 'fa-arrows-alt-h', placeholder: 'e.g. 72', perOpening: true, min: 0.01, step: 'any' },
                    { key: 'height_in', label: 'Height (inches)', type: 'number', icon: 'fa-arrows-alt-v', placeholder: 'e.g. 96', perOpening: true, min: 0.01, step: 'any' },
                    { key: 'mounting', label: 'Mounting Type', type: 'select', icon: 'fa-wrench', perOpening: true, defaultValue: 'recessed', options: [
                        { value: 'face_mount', label: 'Face Mount (Surface)' },
                        { value: 'recessed', label: 'Recessed Mount' }
                    ]},
                    { key: 'motor', label: 'Motor Type', type: 'select', icon: 'fa-cog', perOpening: true, defaultValue: 'motorized_wired', options: [
                        { value: 'motorized_wired', label: 'Motorized' },
                        { value: 'manual_crank', label: 'Manual' },
                        { value: 'motorized_solar', label: 'Solar', disabled: true },
                        { value: 'motorized_battery', label: 'Battery', disabled: true }
                    ]},
                    // Fabric Info Group — 面料信息（SKU / 开孔率 / 颜色 / 样品照片）
                    { key: 'fabric_sku', label: 'Fabric SKU', type: 'text', icon: 'fa-barcode', perOpening: true, placeholder: 'e.g. NP33051010SP' },
                    { key: 'fabric_openness', label: 'Openness (%)', type: 'text', icon: 'fa-sun', perOpening: true, placeholder: 'e.g. 5%' },
                    { key: 'fabric_color', label: 'Fabric Color', type: 'text', icon: 'fa-tint', perOpening: true, placeholder: 'e.g. White' },
                    { key: 'fabric_sample', label: 'Fabric Sample Photo', type: 'image_upload', icon: 'fa-camera', perOpening: true, accept: 'image/*', colSpan: 2 },
                    // Frame Color — 项目级公共字段（所有 opening 共用），默认 Coffee Brown
                    // 颜色样板来源：铝合金型材实物色卡（WR 系列）
                    { key: 'frame_color', label: 'Frame Color', type: 'select', icon: 'fa-palette', defaultValue: 'coffee_brown', options: [
                        { value: 'coffee_brown', label: 'Coffee Brown' },
                        { value: 'iron_black', label: 'Iron Black' },
                        { value: 'matte_white', label: 'Matte White' },
                        { value: 'iron_grey', label: 'Iron Grey' },
                        { value: 'matte_black', label: 'Matte Black' }
                    ]}
                ],
                zipBlindsObstacles: [
                    { value: 'electrical', label: 'Electrical Outlet/Line', icon: 'fa-bolt' },
                    { value: 'light_fixture', label: 'Light Fixture', icon: 'fa-lightbulb' },
                    { value: 'camera', label: 'Security Camera', icon: 'fa-video' },
                    { value: 'vent', label: 'Vent/Exhaust', icon: 'fa-wind' },
                    { value: 'gutter', label: 'Gutter/Downspout', icon: 'fa-faucet' },
                    { value: 'other', label: 'Other', icon: 'fa-exclamation-circle' }
                ]
            },
            agentSupport: [
                { agent: 'AI Designer', ability: 'Core: Generate full design enablement matrix from measurement data (renderings, site plan, elevations, layout)' },
                { agent: 'Compliance Agent', ability: 'Auto-verify setback distances, drainage codes, height limits against local regulations' },
                { agent: 'Knowledge Base', ability: 'Regional building codes, structural standards, product specifications & installation guides' }
            ]
        },
        4: {
            name: 'Quotation',
            nameEn: 'Quotation',
            goal: 'Complete pricing, generate contract, collect 50% deposit, deliver compliance package',
            payment: '50% Deposit',
            coreActions: [
                { id: 'a1', label: 'Design Confirmation', desc: 'Customer signs off on Step 3 design renderings, site plan, and layout', icon: 'fa-check-double' },
                { id: 'a2', label: 'Product Configuration', desc: 'Select product tier, fabric, drive system, color, and all optional upgrades', icon: 'fa-sliders-h' },
                { id: 'a3', label: 'Auto-Generate Quote', desc: 'System calculates detailed quote: base + options + labor + permits + tax', icon: 'fa-calculator' },
                { id: 'a4', label: 'Quote Review', desc: 'Sales advisor walks customer through line-by-line quote breakdown', icon: 'fa-search-dollar' },
                { id: 'a5', label: 'Contract Generation', desc: 'System auto-generates formal contract from quote and design package', icon: 'fa-file-contract' },
                { id: 'a6', label: 'Contract Signing', desc: 'Customer signs contract (online or in-person)', icon: 'fa-signature' },
                { id: 'a7', label: 'Collect 50% Deposit', desc: 'Collect deposit to initiate material procurement and permit application', icon: 'fa-money-bill-wave' },
                { id: 'a8', label: 'Deliver Compliance Package', desc: 'Provide complete compliance documentation to customer', icon: 'fa-folder-open' }
            ],
            keyDeliverables: [
                { id: 'd1', label: 'Detailed Quotation', desc: 'Itemized quote with all costs', icon: 'fa-file-invoice-dollar', required: true },
                { id: 'd2', label: 'Signed Contract', desc: 'Formal agreement with terms', icon: 'fa-file-contract', required: true },
                { id: 'd3', label: 'Deposit Receipt (50%)', desc: 'Payment confirmation', icon: 'fa-receipt', required: true },
                { id: 'd4', label: 'Compliance Package', desc: 'Permit & code docs', icon: 'fa-shield-alt', required: true },
                { id: 'd5', label: 'Phase 4 Customer Sign-off', desc: 'Proceed to production', icon: 'fa-signature', required: true }
            ],
            quotationPanel: true,
            agentSupport: [
                { agent: 'Pricing Agent', ability: 'Core: Auto-generate detailed quotation with all hidden costs (materials, labor, permits, tax)' },
                { agent: 'Compliance Agent', ability: 'Auto-generate compliance documentation package from design matrix' },
                { agent: 'AI Designer', ability: 'Export full design matrix drawings for contract attachment' }
            ]
        }
        // Steps 5-6: to be added progressively
    };

    // ===== Zip Blinds: Combined "Measure & Quote" Config (OMEYA SOP-aligned) =====
    // Lightweight product workflow — merge Steps 1-4 into a single step
    // Zip Blinds 3+1 step workflow configs (Measurement → Quotation → Measurement Verification → Order & Install)
    var ZB_STEP_CONFIGS = {
        1: {
            name: 'Measurement',
            nameEn: 'Measurement',
            goal: 'Client consultation & initial site measurement — aligned with OMEYA Blind SOP §1A & §1B',
            payment: '—',
            coreActions: [
                { id: 'a1', label: 'Client Consultation', desc: 'Determine requirements: light control, privacy, aesthetics, child safety (OMEYA SOP §1A)', icon: 'fa-comments' },
                { id: 'a2', label: 'Product Recommendation', desc: 'Recommend fabric, opacity, color, operation style; advise track options & stacking direction', icon: 'fa-lightbulb' },
                { id: 'a3', label: 'Site Measurement', desc: 'On-site measurement: inside/face/ceiling mount, 3-point method, obstacle & utility check (OMEYA SOP §1B)', icon: 'fa-ruler-combined' }
            ],
            keyDeliverables: [
                { id: 'd1', label: 'Measurement Report', desc: 'Opening dimensions, mounting type, obstacles, site photos', icon: 'fa-ruler', required: true },
                { id: 'd2', label: 'Product Configuration', desc: 'Tier, fabric, drive system selections', icon: 'fa-sliders-h', required: true }
            ],
            measurementPanel: STEP_DETAIL_CONFIG[3].measurementPanel,
            agentSupport: [
                { agent: 'Knowledge Base', ability: 'OMEYA measurement SOP, product specs, measurement guides' }
            ]
        },
        2: {
            name: 'Quotation',
            nameEn: 'Quotation',
            goal: 'Product configuration, pricing & client approval — aligned with OMEYA SOP §1C',
            payment: '—',
            coreActions: [
                { id: 'a4', label: 'Product Configuration', desc: 'Select product tier (ZB-100/200/300), fabric screen, drive system, and all optional upgrades', icon: 'fa-sliders-h' },
                { id: 'a5', label: 'Quotation Generation', desc: 'Auto-calculate pricing with 6-strategy engine, generate formal bilingual quotation document', icon: 'fa-file-invoice-dollar' },
                { id: 'a6', label: 'Client Review & Sign-off', desc: 'Walk through line-by-line quotation, confirm specs, obtain client approval (OMEYA SOP §1C)', icon: 'fa-signature' }
            ],
            keyDeliverables: [
                { id: 'd3', label: 'Formal Quotation', desc: 'Formal quotation document', icon: 'fa-file-invoice-dollar', required: true },
                { id: 'd4', label: 'Client Approval', desc: 'Customer sign-off on quotation & specs', icon: 'fa-signature', required: true }
            ],
            quotationPanel: true,
            agentSupport: [
                { agent: 'Pricing Agent', ability: 'Auto-generate detailed quotation with 6-strategy pricing engine' }
            ]
        },
        3: {
            name: 'Measurement Verification',
            nameEn: 'Measurement Verification',
            goal: 'Second on-site measurement to verify & confirm initial data before order placement',
            payment: '—',
            coreActions: [
                { id: 'v1', label: 'Verification Visit', desc: 'Schedule & conduct second on-site visit to re-measure all openings', icon: 'fa-calendar-check' },
                { id: 'v2', label: 'Cross-check Measurements', desc: 'Compare second measurement against initial report; flag any discrepancies > 3mm', icon: 'fa-check-double' },
                { id: 'v3', label: 'Final Confirmation', desc: 'Confirm mounting type, guide rail clearance, motor wiring path, and obstacle clearance', icon: 'fa-clipboard-check' }
            ],
            keyDeliverables: [
                { id: 'v_d1', label: 'Verified Measurement Report', desc: 'Confirmed dimensions with comparison to initial measurement', icon: 'fa-file-circle-check', required: true },
                { id: 'v_d2', label: 'Installation Readiness', desc: 'Site confirmed ready for installation — no obstructions, wiring in place', icon: 'fa-thumbs-up', required: true }
            ],
            verificationPanel: true,
            agentSupport: [
                { agent: 'Knowledge Base', ability: 'OMEYA measurement verification SOP, tolerance specifications' }
            ]
        }
    };

    // Backward compat alias
    var ZB_COMBINED_CONFIG = ZB_STEP_CONFIGS[1];

    // Zip Blinds 4-step workflow definition
    var ZB_WORKFLOW_STEPS = [
        { step: 1, name: 'Measurement', icon: 'fa-ruler-combined', color: 'blue', desc: 'Site measurement & data collection' },
        { step: 2, name: 'Quotation', icon: 'fa-file-invoice-dollar', color: 'orange', desc: 'Product configuration, pricing & approval' },
        { step: 3, name: 'Verification', icon: 'fa-check-double', color: 'purple', desc: 'Second measurement to verify & confirm' },
        { step: 4, name: 'Order & Install', icon: 'fa-truck', color: 'gray', desc: 'Coming soon — order, production, installation' }
    ];

    N.data.stepConfig = {
        STEP_DETAIL_CONFIG: STEP_DETAIL_CONFIG,
        ZB_STEP_CONFIGS: ZB_STEP_CONFIGS,
        ZB_COMBINED_CONFIG: ZB_COMBINED_CONFIG,
        ZB_WORKFLOW_STEPS: ZB_WORKFLOW_STEPS
    };

    console.log('[Nestopia] step-config.js loaded');
})();
