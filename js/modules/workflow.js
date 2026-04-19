/**
 * workflow.js — 项目6步工作流
 * Phase 3.8: Projects Management (6-Step Workflow)
 * 依赖: helpers.js, supabase-storage.js, data/step-config.js
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.modules = N.modules || {};

    // ===== Projects Management (6-Step Workflow) =====
    const WORKFLOW_STEPS = [
        { step: 1, name: 'Intent', icon: 'fa-handshake', color: 'blue', payment: '$100 Intent Fee', desc: 'Initial inquiry & questionnaire' },
        { step: 2, name: 'Design', icon: 'fa-palette', color: 'indigo', payment: '$500-$1K Design Fee', desc: 'AI concept design & style selection' },
        { step: 3, name: 'Measurement', icon: 'fa-ruler-combined', color: 'purple', payment: '\u2014', desc: 'Precision measurement & detailed design' },
        { step: 4, name: 'Quotation', icon: 'fa-file-contract', color: 'orange', payment: '50% Deposit', desc: 'Quote, contract & compliance package' },
        { step: 5, name: 'Production', icon: 'fa-industry', color: 'yellow', payment: '40% Pre-ship', desc: 'Factory production, QC & logistics' },
        { step: 6, name: 'Installation', icon: 'fa-tools', color: 'green', payment: '10% Final', desc: 'Install, inspection & acceptance' }
    ];

    const STEP_UPLOADS = {
        1: [
            { key: 'payment_receipt_intent', label: 'Intent Fee Receipt ($100)', icon: 'fa-receipt', required: true, accept: '.pdf,.jpg,.png' },
            { key: 'signature_phase1', label: 'Phase 1 Customer Sign-off', icon: 'fa-signature', required: true }
        ],
        2: [
            { key: 'customer_site_photo', label: 'Site Photos (multi-angle)', icon: 'fa-camera', required: true },
            { key: 'customer_reference_photo', label: 'Style Reference Photos', icon: 'fa-images', required: false },
            { key: 'concept_design', label: 'AI Concept Design Renderings', icon: 'fa-paint-brush', required: true },
            { key: 'payment_receipt_design', label: 'Design Fee Receipt ($500-$1K)', icon: 'fa-receipt', required: true },
            { key: 'signature_phase2', label: 'Phase 2 Customer Sign-off', icon: 'fa-signature', required: true }
        ],
        3: [
            { key: 'measurement_data', label: 'Measurement Report', icon: 'fa-ruler', required: true },
            { key: 'site_plan', label: 'Site Plan Drawing', icon: 'fa-drafting-compass', required: true },
            { key: 'rendering', label: 'Schematic Design Renderings', icon: 'fa-image', required: true },
            { key: 'elevation_drawing', label: 'Elevation Drawings', icon: 'fa-building', required: true },
            { key: 'structural_calculation', label: 'Structural Calculation', icon: 'fa-calculator', required: false },
            { key: 'signature_phase3', label: 'Phase 3 Customer Sign-off', icon: 'fa-signature', required: true }
        ],
        4: [
            { key: 'quotation', label: 'Detailed Quotation', icon: 'fa-file-invoice-dollar', required: true },
            { key: 'contract', label: 'Signed Contract', icon: 'fa-file-contract', required: true },
            { key: 'payment_receipt_deposit', label: 'Deposit Receipt (50%)', icon: 'fa-receipt', required: true },
            { key: 'compliance_package', label: 'Compliance Package', icon: 'fa-shield-alt', required: true },
            { key: 'signature_phase4', label: 'Phase 4 Customer Sign-off', icon: 'fa-signature', required: true }
        ],
        5: [
            { key: 'qc_report', label: 'Factory QC Report', icon: 'fa-clipboard-check', required: true },
            { key: 'pre_acceptance_photo', label: 'Pre-Assembly Photos', icon: 'fa-camera-retro', required: true },
            { key: 'payment_receipt_production', label: 'Production Payment (40%)', icon: 'fa-receipt', required: true },
            { key: 'delivery_receipt', label: 'Delivery Receipt', icon: 'fa-truck', required: true },
            { key: 'signature_phase5', label: 'Phase 5 Sign-off', icon: 'fa-signature', required: true }
        ],
        6: [
            { key: 'installation_progress_photo', label: 'Install Progress Photos', icon: 'fa-hard-hat', required: true },
            { key: 'co_certificate', label: 'Certificate of Occupancy', icon: 'fa-certificate', required: true },
            { key: 'inspection_report', label: 'Final Inspection Report', icon: 'fa-search', required: true },
            { key: 'signature_phase6', label: 'Final Acceptance Sign-off', icon: 'fa-signature', required: true },
            { key: 'payment_receipt_final', label: 'Final Payment (10%)', icon: 'fa-receipt', required: true },
            { key: 'warranty_document', label: 'Warranty & Manuals', icon: 'fa-book', required: true }
        ]
    };

    const greenscapeWorkflowProjects = [
        {
            id: 'PRJ-20260316-W001', name: 'Williams Residence - Retractable Sunroom',
            customer: 'David Williams', phone: '(310) 555-0567', email: 'david.williams@gmail.com',
            address: '582 S Orange Grove Blvd, Pasadena, CA 91105', type: 'Sunroom', workflowStep: 1,
            budget: '$35K-$50K', contractTotal: null, sqft: 452, createdAt: '2026-03-16',
            payments: { intent: null, design: null, deposit: null, production: null, final: null },
            checklist: { 1: { total: 5, done: 1 } }, documents: { 1: 0 },
            hoa: 'Yes (Pasadena HOA)', questionnaire: 'draft',
            notes: 'New inquiry from Pasadena exhibition. Interested in retractable sunroom for backyard entertaining.'
        },
        {
            id: 'PRJ-20260304-J001', name: 'Johnson Residence - Pergola & Outdoor Living',
            customer: 'Robert Johnson', phone: '(415) 555-0123', email: 'robert.johnson@gmail.com',
            address: '2847 Lombard St, San Francisco, CA 94123', type: 'Pergola', workflowStep: 2,
            budget: '$20K-$35K', contractTotal: null, sqft: 350, createdAt: '2026-03-04',
            payments: { intent: { amount: 100, date: '2026-03-04', method: 'Credit Card' }, design: null, deposit: null, production: null, final: null },
            checklist: { 1: { total: 5, done: 5 }, 2: { total: 5, done: 2 } }, documents: { 1: 1, 2: 4 },
            hoa: 'Yes (Marina District HOA)', questionnaire: 'submitted',
            notes: 'Louvered pergola for year-round outdoor dining. Monthly wine tastings. Anniversary party June 15.'
        },
        {
            id: 'PRJ-20260221-C001', name: 'Chen Villa - Retractable Sunroom',
            customer: 'Lisa Chen', phone: '(408) 555-0456', email: 'lisa.chen@outlook.com',
            address: '1456 Lincoln Ave, San Jose, CA 95125', type: 'Sunroom', workflowStep: 3,
            budget: '$50K-$75K', contractTotal: null, sqft: 520, createdAt: '2026-02-21',
            payments: { intent: { amount: 100, date: '2026-02-21', method: 'Credit Card' }, design: { amount: 800, date: '2026-02-28', method: 'Credit Card' }, deposit: null, production: null, final: null },
            checklist: { 1: { total: 5, done: 5 }, 2: { total: 5, done: 5 }, 3: { total: 5, done: 3 } }, documents: { 1: 2, 2: 4, 3: 4 },
            hoa: 'Yes (Willow Glen)', questionnaire: 'reviewed',
            measurement: { method: 'Manual precision', surveyor: 'John Martinez (#948721)', date: '2026-03-08', dims: "26.2' x 18.5' x 10.5'", foundation: 'Concrete slab 4"', wallBearing: 'Adequate - wood frame', obstacles: ['Downspout NE corner', 'Gas meter E wall', 'Oak tree 6ft NW'], setback: '12ft (5ft req) OK', drainage: '2.1% slope OK' },
            notes: 'Zen garden sunroom, north wall. Family of 5, yoga/garden/kids. Willow Glen Historic District.'
        },
        {
            id: 'PRJ-20260118-S001', name: 'Smith Estate - Premium Retractable Sunroom',
            customer: 'Michael Smith', phone: '(858) 555-0789', email: 'mike.smith@yahoo.com',
            address: '7920 Prospect Pl, La Jolla, CA 92037', type: 'Sunroom', workflowStep: 5,
            budget: '$75K-$100K', contractTotal: 87500, sqft: 680, createdAt: '2026-01-18',
            payments: { intent: { amount: 100, date: '2026-01-18', method: 'Credit Card' }, design: { amount: 1000, date: '2026-01-26', method: 'Credit Card' }, deposit: { amount: 43750, date: '2026-02-18', method: 'Wire Transfer' }, production: null, final: null },
            checklist: { 1: { total: 5, done: 5 }, 2: { total: 5, done: 5 }, 3: { total: 5, done: 5 }, 4: { total: 7, done: 7 }, 5: { total: 6, done: 2 } },
            documents: { 1: 2, 2: 2, 3: 4, 4: 5, 5: 2 }, hoa: 'Yes (La Jolla CPA)', questionnaire: 'reviewed',
            config: { frame: 'RAL 7016 Anthracite Grey', glass: 'Low-E Tempered Double', shading: 'Electric Motorized (Sunbrella)', control: 'Smart (App + Voice)', addons: ['LED Strip', 'Radiant Floor', 'Smart Lock', 'Rain Sensor', 'Wind Sensor'] },
            notes: 'Ocean-facing La Jolla. Premium build, panoramic glass, coastal protection. Contract $87,500.'
        },
        {
            id: 'PRJ-20251218-G001', name: 'Garcia Family - Sunroom + Pergola',
            customer: 'Maria Garcia', phone: '(916) 555-0234', email: 'maria.garcia@icloud.com',
            address: '3412 J St, Sacramento, CA 95816', type: 'Sunroom + Pergola', workflowStep: 6,
            budget: '$50K-$75K', contractTotal: 62800, sqft: 600, createdAt: '2025-12-18',
            payments: { intent: { amount: 100, date: '2025-12-18', method: 'Zelle' }, design: { amount: 500, date: '2025-12-26', method: 'Credit Card' }, deposit: { amount: 31400, date: '2026-01-18', method: 'Check' }, production: { amount: 25120, date: '2026-02-26', method: 'Wire Transfer' }, final: null },
            checklist: { 1: { total: 5, done: 5 }, 2: { total: 5, done: 5 }, 3: { total: 5, done: 5 }, 4: { total: 7, done: 7 }, 5: { total: 6, done: 6 }, 6: { total: 7, done: 2 } },
            documents: { 1: 1, 2: 1, 3: 1, 4: 3, 5: 4, 6: 2 }, hoa: 'No', questionnaire: 'reviewed',
            installation: { team: 'Pacific Outdoor Installations (#924567)', startDate: '2026-03-10', status: 'Day 5 of 7', accessNotes: 'Park on street. Back gate unlocked.' },
            notes: 'East Sacramento craftsman. Combined sunroom + separate pergola for BBQ. Family of 6. Contract $62,800.'
        }
    ];

    function getWorkflowProjects() {
        var slug = getCurrentTenantSlug();
        if (slug === 'omeya-sin') return [
            {
                id: 'OMY-WF-001', name: 'MX Zip Blinds',
                customer: 'Miss Xu', phone: '+65 9123-4567', email: 'miss.xu@email.com',
                address: '88 Orchard Road, #12-01, Singapore 238839', type: 'Zip Blinds', workflowStep: 1,
                budget: '$6,500', contractTotal: null, sqft: 120, createdAt: '2026-04-01',
                payments: { intent: null, design: null, deposit: null, production: null, final: null },
                checklist: { 1: { total: 5, done: 0 } }, documents: { 1: 0 },
                hoa: 'N/A', questionnaire: 'draft',
                notes: 'New client inquiry for motorized zip blinds installation at Orchard Road condo.'
            }
        ];
        if (slug === 'nestopia-chn') return [
            {
                id: 'CHN-WF-001', name: 'LZ Sunroom',
                customer: 'Larry Zhang', phone: '+86 138-0000-0001', email: 'larry.zhang@email.com',
                address: '1288 Nanjing West Rd, Jing\'an District, Shanghai, China', type: 'Sunroom', workflowStep: 1,
                budget: '$50,000', contractTotal: null, sqft: 400, createdAt: '2026-04-01',
                payments: { intent: null, design: null, deposit: null, production: null, final: null },
                checklist: { 1: { total: 5, done: 0 } }, documents: { 1: 0 },
                hoa: 'N/A', questionnaire: 'draft',
                notes: 'Premium sunroom project for Larrr Zhang residence in Shanghai. L-Classic model preferred.'
            },
            {
                id: 'CHN-WF-002', name: 'LZ Pergola',
                customer: 'Larry Zhang', phone: '+86 138-0000-0001', email: 'larry.zhang@email.com',
                address: '1288 Nanjing West Rd, Jing\'an District, Shanghai, China', type: 'Pergola', workflowStep: 1,
                budget: '$15,000', contractTotal: null, sqft: 200, createdAt: '2026-04-01',
                payments: { intent: null, design: null, deposit: null, production: null, final: null },
                checklist: { 1: { total: 5, done: 0 } }, documents: { 1: 0 },
                hoa: 'N/A', questionnaire: 'draft',
                notes: 'Pergola for outdoor dining area at Zhang residence. Pergola Basic model.'
            },
            {
                id: 'CHN-WF-003', name: 'LZ Zip Blinds',
                customer: 'Larry Zhang', phone: '+86 138-0000-0001', email: 'larry.zhang@email.com',
                address: '1288 Nanjing West Rd, Jing\'an District, Shanghai, China', type: 'Zip Blinds', workflowStep: 1,
                budget: '$8,000', contractTotal: null, sqft: 80, createdAt: '2026-04-01',
                payments: { intent: null, design: null, deposit: null, production: null, final: null },
                checklist: { 1: { total: 5, done: 0 } }, documents: { 1: 0 },
                hoa: 'N/A', questionnaire: 'draft',
                notes: 'Zip blinds for pergola area wind protection. Standard manual model.'
            }
        ];
        return greenscapeWorkflowProjects;
    }
    const workflowProjects = getWorkflowProjects();
    var _workflowDbLoaded = false;  // 标记是否已从 DB 加载

    // ── Supabase Workflow 持久化 ──────────────────────────
    function loadWorkflowFromDB() {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
        return NestopiaDB.getClient()
            .from('project_workflow_state')
            .select('project_key,workflow_data')
            .eq('tenant_id', NestopiaDB.getTenantId())
            .then(function(res) {
                if (res.error) { console.warn('[Workflow] DB load error:', res.error.message); return null; }
                return res.data || [];
            })
            .catch(function(err) { console.warn('[Workflow] DB load failed:', err.message); return null; });
    }

    function saveWorkflowToDB(projectId) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
        var project = workflowProjects.find(function(p) { return p.id === projectId; });
        if (!project) return Promise.resolve(false);
        var payload = {
            tenant_id: NestopiaDB.getTenantId(),
            project_key: projectId,
            workflow_data: JSON.parse(JSON.stringify({
                workflowStep: project.workflowStep,
                payments: project.payments,
                checklist: project.checklist,
                documents: project.documents,
                questionnaire: project.questionnaire,
                hoa: project.hoa,
                notes: project.notes,
                config: project.config,
                installation: project.installation
            })),
            updated_at: new Date().toISOString()
        };
        return NestopiaDB.getClient()
            .from('project_workflow_state')
            .upsert(payload, { onConflict: 'tenant_id,project_key' })
            .then(function(res) {
                if (res.error) { console.warn('[Workflow] DB save error:', res.error.message); return false; }
                console.log('[Workflow] Saved to Supabase:', projectId);
                return true;
            })
            .catch(function(err) { console.warn('[Workflow] DB save failed:', err.message); return false; });
    }

    function applyWorkflowOverrides(dbRows) {
        if (!dbRows || !Array.isArray(dbRows)) return;
        dbRows.forEach(function(row) {
            var project = workflowProjects.find(function(p) { return p.id === row.project_key; });
            if (!project || !row.workflow_data) return;
            var d = row.workflow_data;
            if (d.workflowStep !== undefined) project.workflowStep = d.workflowStep;
            if (d.payments) project.payments = d.payments;
            if (d.checklist) project.checklist = d.checklist;
            if (d.documents) project.documents = d.documents;
            if (d.questionnaire) project.questionnaire = d.questionnaire;
            if (d.hoa !== undefined) project.hoa = d.hoa;
            if (d.notes !== undefined) project.notes = d.notes;
            if (d.config) project.config = d.config;
            if (d.installation) project.installation = d.installation;
        });
        console.log('[Workflow] Applied', dbRows.length, 'overrides from Supabase');
    }

    function getStepMeta(step) { return WORKFLOW_STEPS.find(s => s.step === step) || WORKFLOW_STEPS[0]; }

    function getStepBadgeHTML(step, size) {
        const meta = getStepMeta(step);
        const cm = { blue:'bg-blue-50 text-blue-700 border-blue-200', indigo:'bg-indigo-50 text-indigo-700 border-indigo-200', purple:'bg-purple-50 text-purple-700 border-purple-200', orange:'bg-orange-50 text-orange-700 border-orange-200', yellow:'bg-yellow-50 text-yellow-700 border-yellow-200', green:'bg-green-50 text-green-700 border-green-200' };
        const pad = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
        return '<span class="' + (cm[meta.color]||cm.blue) + ' ' + pad + ' rounded-full font-medium border inline-flex items-center gap-1"><i class="fas ' + meta.icon + ' text-[0.65rem]"></i>Step ' + step + ': ' + meta.name + '</span>';
    }

    function renderWorkflowPipeline() {
        const el = document.getElementById('workflowPipeline');
        if (!el) return;
        // 首次渲染时从 Supabase 加载覆写数据
        if (!_workflowDbLoaded && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            _workflowDbLoaded = true;
            loadWorkflowFromDB().then(function(rows) {
                if (rows && rows.length > 0) {
                    applyWorkflowOverrides(rows);
                    renderWorkflowPipeline();  // 重新渲染
                    renderWorkflowTable();
                }
            });
        }
        el.innerHTML = WORKFLOW_STEPS.map(function(ws) {
            var count = workflowProjects.filter(function(p) { return p.workflowStep === ws.step; }).length;
            var cm = { blue:{ bg:'bg-blue-50',border:'border-blue-200',text:'text-blue-700',dot:'bg-blue-500',num:'text-blue-600' }, indigo:{ bg:'bg-indigo-50',border:'border-indigo-200',text:'text-indigo-700',dot:'bg-indigo-500',num:'text-indigo-600' }, purple:{ bg:'bg-purple-50',border:'border-purple-200',text:'text-purple-700',dot:'bg-purple-500',num:'text-purple-600' }, orange:{ bg:'bg-orange-50',border:'border-orange-200',text:'text-orange-700',dot:'bg-orange-500',num:'text-orange-600' }, yellow:{ bg:'bg-yellow-50',border:'border-yellow-200',text:'text-yellow-700',dot:'bg-yellow-500',num:'text-yellow-600' }, green:{ bg:'bg-green-50',border:'border-green-200',text:'text-green-700',dot:'bg-green-500',num:'text-green-600' } };
            var c = cm[ws.color];
            return '<div class="' + c.bg + ' ' + c.border + ' border rounded-xl p-3 cursor-pointer hover:shadow-md transition" onclick="document.getElementById(\'wfStepFilter\').value=\'' + ws.step + '\';Nestopia.modules.workflow.filterWorkflowProjects()">' +
                '<div class="flex items-center gap-2 mb-1"><div class="w-6 h-6 ' + c.dot + ' rounded-full flex items-center justify-center"><span class="text-white text-xs font-bold">' + ws.step + '</span></div><span class="' + c.text + ' text-xs font-semibold">' + ws.name + '</span></div>' +
                '<div class="' + c.num + ' text-2xl font-bold">' + count + '</div>' +
                '<div class="text-gray-500 text-[0.65rem] mt-0.5">' + ws.payment + '</div></div>';
        }).join('');
    }

    function getChecklistProgress(project) {
        var total = 0, done = 0;
        Object.values(project.checklist || {}).forEach(function(phase) { total += phase.total || 0; done += phase.done || 0; });
        return { total: total, done: done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
    }

    function getPaymentSummary(project) {
        var p = project.payments, paid = 0;
        if (p.intent) paid += p.intent.amount;
        if (p.design) paid += p.design.amount;
        if (p.deposit) paid += p.deposit.amount;
        if (p.production) paid += p.production.amount;
        if (p.final) paid += p.final.amount;
        var total = project.contractTotal || 0;
        return { paid: paid, total: total, pct: total > 0 ? Math.round((paid / total) * 100) : 0 };
    }

    function renderWorkflowProjects() {
        var container = document.getElementById('workflowProjectsList');
        if (!container) return;
        var search = (document.getElementById('wfSearchInput') ? document.getElementById('wfSearchInput').value : '').toLowerCase();
        var stepFilter = document.getElementById('wfStepFilter') ? document.getElementById('wfStepFilter').value : '';

        var filtered = workflowProjects.filter(function(p) {
            if (stepFilter && p.workflowStep !== parseInt(stepFilter)) return false;
            if (search && p.name.toLowerCase().indexOf(search) === -1 && p.customer.toLowerCase().indexOf(search) === -1 && p.address.toLowerCase().indexOf(search) === -1) return false;
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="text-center py-12 text-gray-400"><i class="fas fa-search text-3xl mb-3"></i><p>No projects match your filter.</p></div>';
            return;
        }

        container.innerHTML = filtered.map(function(project) {
            var cl = getChecklistProgress(project);
            var pay = getPaymentSummary(project);
            var meta = getStepMeta(project.workflowStep);
            var currentDocs = project.documents[project.workflowStep] || 0;
            var requiredUploads = STEP_UPLOADS[project.workflowStep] || [];

            var stepDots = WORKFLOW_STEPS.map(function(ws) {
                var isActive = ws.step === project.workflowStep;
                var isDone = ws.step < project.workflowStep;
                var dotColor = isDone ? 'bg-green-500' : isActive ? 'bg-' + meta.color + '-500 ring-2 ring-' + meta.color + '-200' : 'bg-gray-200';
                var lineColor = isDone ? 'bg-green-400' : 'bg-gray-200';
                return '<div class="flex items-center ' + (ws.step < 6 ? 'flex-1' : '') + '">' +
                    '<div class="relative"><div class="w-5 h-5 ' + dotColor + ' rounded-full flex items-center justify-center">' +
                    (isDone ? '<i class="fas fa-check text-white text-[0.5rem]"></i>' : '<span class="text-[0.55rem] font-bold ' + (isActive ? 'text-white' : 'text-gray-400') + '">' + ws.step + '</span>') +
                    '</div><div class="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.55rem] ' + (isActive ? 'text-gray-700 font-semibold' : 'text-gray-400') + '">' + ws.name + '</div></div>' +
                    (ws.step < 6 ? '<div class="flex-1 h-0.5 ' + lineColor + ' mx-1"></div>' : '') + '</div>';
            }).join('');

            return '<div class="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer" onclick="Nestopia.modules.workflow.openProjectDetail(\'' + project.id + '\')">' +
                '<div class="p-5">' +
                '<div class="flex items-start justify-between mb-4"><div class="flex-1 min-w-0">' +
                '<div class="flex items-center gap-2 flex-wrap"><h3 class="text-base font-bold text-gray-900 truncate">' + project.name + '</h3>' + getStepBadgeHTML(project.workflowStep, 'sm') + '</div>' +
                '<div class="flex items-center gap-4 mt-1 text-sm text-gray-500"><span><i class="fas fa-user mr-1"></i>' + project.customer + '</span><span><i class="fas fa-map-marker-alt mr-1"></i>' + project.address.split(',').slice(-2).join(',').trim() + '</span></div>' +
                '</div><div class="text-right flex-shrink-0 ml-4">' +
                (project.contractTotal ? '<div class="text-lg font-bold text-gray-900">$' + project.contractTotal.toLocaleString() + '</div>' : '<div class="text-sm text-gray-400">' + project.budget + '</div>') +
                '<div class="text-xs text-gray-400">' + project.id + '</div></div></div>' +
                '<div class="flex items-center mb-8 px-2">' + stepDots + '</div>' +
                '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">' +
                '<div><div class="text-gray-500 text-xs mb-1">Checklist</div><div class="flex items-center gap-2"><div class="flex-1 bg-gray-100 rounded-full h-1.5"><div class="bg-green-500 h-1.5 rounded-full" style="width:' + cl.pct + '%"></div></div><span class="text-xs font-medium text-gray-700">' + cl.done + '/' + cl.total + '</span></div></div>' +
                '<div><div class="text-gray-500 text-xs mb-1">Paid</div><div class="flex items-center gap-2">' +
                (pay.total > 0 ? '<div class="flex-1 bg-gray-100 rounded-full h-1.5"><div class="bg-blue-500 h-1.5 rounded-full" style="width:' + pay.pct + '%"></div></div><span class="text-xs font-medium text-gray-700">$' + pay.paid.toLocaleString() + '</span>' : '<span class="text-xs text-gray-400">' + (pay.paid > 0 ? '$' + pay.paid.toLocaleString() : 'N/A') + '</span>') +
                '</div></div>' +
                '<div><div class="text-gray-500 text-xs mb-1">Docs (Step ' + project.workflowStep + ')</div><span class="text-xs font-medium text-gray-700">' + currentDocs + ' / ' + requiredUploads.length + ' required</span></div>' +
                '<div><div class="text-gray-500 text-xs mb-1">HOA</div><span class="text-xs font-medium ' + (project.hoa.startsWith('Yes') ? 'text-orange-600' : 'text-green-600') + '">' + project.hoa + '</span></div>' +
                '</div></div></div>';
        }).join('');
    }

    function filterWorkflowProjects() { renderWorkflowProjects(); }

    function openProjectDetail(projectId) {
        var project = workflowProjects.find(function(p) { return p.id === projectId; });
        if (!project) return;
        var modal = document.getElementById('projectDetailModal');
        var content = document.getElementById('wfProjectDetailContent');
        var meta = getStepMeta(project.workflowStep);
        var cl = getChecklistProgress(project);
        var uploads = STEP_UPLOADS[project.workflowStep] || [];

        var uploadHTML = uploads.map(function(u) {
            return '<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition group">' +
                '<div class="flex items-center gap-3"><div class="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center group-hover:bg-blue-50"><i class="fas ' + u.icon + ' text-gray-400 group-hover:text-blue-500 text-sm"></i></div>' +
                '<div><div class="text-sm font-medium text-gray-700">' + u.label + '</div><div class="text-[0.65rem] text-gray-400">' + (u.required ? 'Required' : 'Optional') + '</div></div></div>' +
                '<button class="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center gap-1" onclick="event.stopPropagation();Nestopia.modules.workflow.handleStepFileUpload(\'' + project.id + '\',\'' + u.key + '\')"><i class="fas fa-cloud-upload-alt"></i> Upload</button></div>';
        }).join('');

        var paymentPhases = [
            { key: 'intent', label: 'Intent Fee', amount: '$100', step: 1 },
            { key: 'design', label: 'Design Fee', amount: '$500-$1K', step: 2 },
            { key: 'deposit', label: 'Deposit (50%)', amount: project.contractTotal ? '$' + (project.contractTotal * 0.5).toLocaleString() : 'TBD', step: 4 },
            { key: 'production', label: 'Pre-ship (40%)', amount: project.contractTotal ? '$' + (project.contractTotal * 0.4).toLocaleString() : 'TBD', step: 5 },
            { key: 'final', label: 'Final (10%)', amount: project.contractTotal ? '$' + (project.contractTotal * 0.1).toLocaleString() : 'TBD', step: 6 }
        ];
        var paymentHTML = paymentPhases.map(function(pp) {
            var paid = project.payments[pp.key];
            return '<div class="flex items-center justify-between py-2 ' + (paid ? '' : 'opacity-50') + '">' +
                '<div class="flex items-center gap-2"><div class="w-5 h-5 rounded-full ' + (paid ? 'bg-green-500' : 'bg-gray-200') + ' flex items-center justify-center">' +
                (paid ? '<i class="fas fa-check text-white text-[0.5rem]"></i>' : '<span class="text-[0.5rem] text-gray-400">' + pp.step + '</span>') +
                '</div><span class="text-sm ' + (paid ? 'text-gray-900 font-medium' : 'text-gray-400') + '">' + pp.label + '</span></div>' +
                '<div class="text-right">' + (paid ? '<span class="text-sm font-medium text-green-600">$' + paid.amount.toLocaleString() + '</span><br><span class="text-[0.6rem] text-gray-400">' + paid.date + ' \u00b7 ' + paid.method + '</span>' : '<span class="text-xs text-gray-400">' + pp.amount + '</span>') + '</div></div>';
        }).join('');

        var measurementHTML = '';
        if (project.measurement) {
            var m = project.measurement;
            measurementHTML = '<div class="mt-6"><h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-ruler-combined text-purple-500"></i> Measurement Data</h4>' +
                '<div class="grid grid-cols-2 gap-3 text-sm">' +
                '<div><span class="text-gray-500">Method:</span> <span class="font-medium">' + m.method + '</span></div>' +
                '<div><span class="text-gray-500">Surveyor:</span> <span class="font-medium">' + m.surveyor + '</span></div>' +
                '<div><span class="text-gray-500">Date:</span> <span class="font-medium">' + m.date + '</span></div>' +
                '<div><span class="text-gray-500">Dims:</span> <span class="font-medium">' + m.dims + '</span></div>' +
                '<div><span class="text-gray-500">Foundation:</span> <span class="font-medium">' + m.foundation + '</span></div>' +
                '<div><span class="text-gray-500">Wall:</span> <span class="font-medium">' + m.wallBearing + '</span></div>' +
                '<div><span class="text-gray-500">Setback:</span> <span class="font-medium">' + m.setback + '</span></div>' +
                '<div><span class="text-gray-500">Drainage:</span> <span class="font-medium">' + m.drainage + '</span></div></div>' +
                (m.obstacles.length > 0 ? '<div class="mt-2"><span class="text-gray-500 text-sm">Obstacles:</span> <span class="text-sm font-medium">' + m.obstacles.join(' | ') + '</span></div>' : '') + '</div>';
        }

        var configHTML = '';
        if (project.config) {
            var c = project.config;
            configHTML = '<div class="mt-6"><h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-cog text-orange-500"></i> Configuration</h4>' +
                '<div class="grid grid-cols-2 gap-3 text-sm">' +
                '<div><span class="text-gray-500">Frame:</span> <span class="font-medium">' + c.frame + '</span></div>' +
                '<div><span class="text-gray-500">Glass:</span> <span class="font-medium">' + c.glass + '</span></div>' +
                '<div><span class="text-gray-500">Shading:</span> <span class="font-medium">' + c.shading + '</span></div>' +
                '<div><span class="text-gray-500">Control:</span> <span class="font-medium">' + c.control + '</span></div></div>' +
                (c.addons.length > 0 ? '<div class="mt-2 flex flex-wrap gap-1">' + c.addons.map(function(a) { return '<span class="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">' + a + '</span>'; }).join('') + '</div>' : '') + '</div>';
        }

        var installHTML = '';
        if (project.installation) {
            var inst = project.installation;
            installHTML = '<div class="mt-6"><h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-hard-hat text-green-500"></i> Installation</h4>' +
                '<div class="grid grid-cols-2 gap-3 text-sm">' +
                '<div><span class="text-gray-500">Team:</span> <span class="font-medium">' + inst.team + '</span></div>' +
                '<div><span class="text-gray-500">Start:</span> <span class="font-medium">' + inst.startDate + '</span></div>' +
                '<div><span class="text-gray-500">Status:</span> <span class="font-medium text-green-600">' + inst.status + '</span></div>' +
                '<div><span class="text-gray-500">Access:</span> <span class="font-medium">' + inst.accessNotes + '</span></div></div></div>';
        }

        var checklistHTML = WORKFLOW_STEPS.filter(function(ws) { return project.checklist[ws.step]; }).map(function(ws) {
            var phase = project.checklist[ws.step];
            var pct = phase.total > 0 ? Math.round((phase.done / phase.total) * 100) : 0;
            return '<div class="flex items-center gap-3"><div class="w-16 text-xs text-gray-500">Phase ' + ws.step + '</div>' +
                '<div class="flex-1 bg-gray-100 rounded-full h-2"><div class="' + (pct === 100 ? 'bg-green-500' : 'bg-blue-400') + ' h-2 rounded-full" style="width:' + pct + '%"></div></div>' +
                '<div class="w-16 text-xs text-right ' + (pct === 100 ? 'text-green-600 font-medium' : 'text-gray-500') + '">' + phase.done + '/' + phase.total + '</div></div>';
        }).join('');

        content.innerHTML = '<div class="flex items-start justify-between p-6 border-b border-gray-200"><div>' +
            '<div class="flex items-center gap-3 flex-wrap"><h2 class="text-xl font-bold text-gray-900">' + project.name + '</h2>' + getStepBadgeHTML(project.workflowStep, 'lg') + '</div>' +
            '<div class="flex items-center gap-4 mt-2 text-sm text-gray-500"><span><i class="fas fa-user mr-1"></i>' + project.customer + '</span><span><i class="fas fa-phone mr-1"></i>' + project.phone + '</span><span><i class="fas fa-map-marker-alt mr-1"></i>' + project.address + '</span></div>' +
            '</div><button onclick="Nestopia.modules.workflow.closeProjectDetail()" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"><i class="fas fa-times text-gray-500"></i></button></div>' +
            '<div class="p-6 grid md:grid-cols-2 gap-6"><div>' +
            '<div class="mb-6"><h4 class="text-sm font-semibold text-gray-900 mb-3">Project Info</h4>' +
            '<div class="grid grid-cols-2 gap-3 text-sm">' +
            '<div><span class="text-gray-500">Type:</span> <span class="font-medium">' + project.type + '</span></div>' +
            '<div><span class="text-gray-500">Area:</span> <span class="font-medium">' + project.sqft + ' sq ft</span></div>' +
            '<div><span class="text-gray-500">Budget:</span> <span class="font-medium">' + project.budget + '</span></div>' +
            '<div><span class="text-gray-500">HOA:</span> <span class="font-medium">' + project.hoa + '</span></div>' +
            '<div><span class="text-gray-500">Questionnaire:</span> <span class="font-medium capitalize">' + project.questionnaire + '</span></div>' +
            '<div><span class="text-gray-500">Created:</span> <span class="font-medium">' + project.createdAt + '</span></div></div>' +
            '<div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600"><i class="fas fa-sticky-note text-gray-400 mr-1"></i> ' + project.notes + '</div></div>' +
            '<div class="mb-6"><h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-dollar-sign text-green-500"></i> Payment Milestones</h4><div class="divide-y divide-gray-100">' + paymentHTML + '</div></div>' +
            measurementHTML + configHTML + installHTML +
            '</div><div>' +
            '<h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-cloud-upload-alt text-blue-500"></i> Step ' + project.workflowStep + ' Document Uploads <span class="text-xs text-gray-400 font-normal">(' + uploads.length + ' items)</span></h4>' +
            '<div class="space-y-2">' + uploadHTML + '</div>' +
            '<div class="mt-6"><h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-tasks text-purple-500"></i> Checklist Progress</h4><div class="space-y-2">' + checklistHTML + '</div></div>' +
            '</div></div>' +
            '<div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl"><div class="text-sm text-gray-500">' + meta.desc + '</div>' +
            '<div class="flex items-center gap-3"><button onclick="Nestopia.modules.workflow.closeProjectDetail()" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition">Close</button>' +
            '<button class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" onclick="Nestopia.utils.quotEditor.openQuotationEditor(\'' + project.id + '\')"><i class="fas fa-file-invoice-dollar mr-1"></i>Generate Quotation</button>' +
            (project.workflowStep < 6 ? '<button class="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition" onclick="Nestopia.modules.workflow.advanceStep(\'' + project.id + '\')"><i class="fas fa-arrow-right mr-1"></i>Advance to Step ' + (project.workflowStep + 1) + '</button>' : '') +
            '</div></div>';

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeProjectDetail() {
        document.getElementById('projectDetailModal').classList.add('hidden');
        document.body.style.overflow = '';
    }

    function handleStepFileUpload(projectId, docType) {
        var uploadDef = Object.values(STEP_UPLOADS).flat().find(function(u) { return u.key === docType; });
        var accept = (uploadDef && uploadDef.accept) || '.pdf,.doc,.docx,.jpg,.png';
        // 创建隐藏 file input 并触发
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.style.display = 'none';
        input.onchange = function() {
            if (!input.files || !input.files.length) return;
            var file = input.files[0];
            var useCloud = (typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected());
            if (useCloud) {
                showToast('Uploading ' + file.name + '...', 'info');
                NestopiaStorage.uploadProjectFile(projectId, file, { category: 'step-docs/' + docType })
                    .then(function(record) {
                        showToast(file.name + ' uploaded successfully', 'success');
                        // 更新 project document count
                        var project = workflowProjects.find(function(p) { return p.id === projectId; });
                        if (project) {
                            var step = project.workflowStep;
                            if (!project.documents[step]) project.documents[step] = 0;
                            project.documents[step]++;
                            saveWorkflowToDB(projectId);
                        }
                    })
                    .catch(function(err) {
                        showToast('Upload failed: ' + err.message, 'error');
                    });
            } else {
                showToast(file.name + ' — connect Supabase for cloud upload', 'warning');
            }
            input.remove();
        };
        document.body.appendChild(input);
        input.click();
    }

    function advanceStep(projectId) {
        var project = workflowProjects.find(function(p) { return p.id === projectId; });
        if (!project || project.workflowStep >= 6) return;
        var fromStep = project.workflowStep;
        var toStep = fromStep + 1;
        if (!confirm('Advance project "' + project.name + '" from Step ' + fromStep + ' (' + getStepMeta(fromStep).name + ') to Step ' + toStep + ' (' + getStepMeta(toStep).name + ')?')) return;
        project.workflowStep = toStep;
        // 初始化新步骤的 checklist
        if (!project.checklist[toStep]) project.checklist[toStep] = { total: 5, done: 0 };
        if (!project.documents[toStep]) project.documents[toStep] = 0;
        // 保存到 Supabase
        saveWorkflowToDB(projectId);
        // 重新渲染
        renderWorkflowPipeline();
        renderWorkflowTable();
        showToast('Project advanced to Step ' + toStep + ': ' + getStepMeta(toStep).name, 'success');
    }

    function openNewProjectModal() {
        alert('New Project\n\n1. Select/create customer\n2. Fill project info\n3. Start Intake Questionnaire (Appendix A)\n4. Project starts at Step 1: Intent\n\n(Backend integration pending)');
    }

    // ── 模块注册 ──────────────────────────
    N.modules.workflow = {
        WORKFLOW_STEPS: WORKFLOW_STEPS,
        STEP_UPLOADS: STEP_UPLOADS,
        greenscapeWorkflowProjects: greenscapeWorkflowProjects,
        workflowProjects: workflowProjects,
        getWorkflowProjects: getWorkflowProjects,
        loadWorkflowFromDB: loadWorkflowFromDB,
        saveWorkflowToDB: saveWorkflowToDB,
        applyWorkflowOverrides: applyWorkflowOverrides,
        getStepMeta: getStepMeta,
        getStepBadgeHTML: getStepBadgeHTML,
        renderWorkflowPipeline: renderWorkflowPipeline,
        getChecklistProgress: getChecklistProgress,
        getPaymentSummary: getPaymentSummary,
        renderWorkflowProjects: renderWorkflowProjects,
        filterWorkflowProjects: filterWorkflowProjects,
        openProjectDetail: openProjectDetail,
        closeProjectDetail: closeProjectDetail,
        handleStepFileUpload: handleStepFileUpload,
        advanceStep: advanceStep,
        openNewProjectModal: openNewProjectModal
    };

    // ── 全局别名（兼容 inline onclick 等调用） ──────────────────────────
    window.WORKFLOW_STEPS = WORKFLOW_STEPS;
    window.STEP_UPLOADS = STEP_UPLOADS;
    window.greenscapeWorkflowProjects = greenscapeWorkflowProjects;
    window.workflowProjects = workflowProjects;
    window.getWorkflowProjects = getWorkflowProjects;
    window.loadWorkflowFromDB = loadWorkflowFromDB;
    window.saveWorkflowToDB = saveWorkflowToDB;
    window.applyWorkflowOverrides = applyWorkflowOverrides;
    window.getStepMeta = getStepMeta;
    window.getStepBadgeHTML = getStepBadgeHTML;
    window.renderWorkflowPipeline = renderWorkflowPipeline;
    window.getChecklistProgress = getChecklistProgress;
    window.getPaymentSummary = getPaymentSummary;
    window.renderWorkflowProjects = renderWorkflowProjects;
    window.filterWorkflowProjects = filterWorkflowProjects;
    window.openProjectDetail = openProjectDetail;
    window.closeProjectDetail = closeProjectDetail;
    window.handleStepFileUpload = handleStepFileUpload;
    window.advanceStep = advanceStep;
    window.openNewProjectModal = openNewProjectModal;

})();
