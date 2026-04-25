/**
 * projects.js — 项目管理页面
 * Phase 3.7: Projects Page Functions
 * 依赖: helpers.js, supabase-config.js, router.js, data/seed-projects.js
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.modules = N.modules || {};

    // ===== Create New Project Modal & Logic =====
    function generateProjectId() {
        const date = new Date();
        const ds = date.getFullYear().toString() + String(date.getMonth()+1).padStart(2,'0') + String(date.getDate()).padStart(2,'0');
        const seq = String(allProjectsData.length + 1).padStart(3, '0');
        return `PRJ-${ds}-${seq}`;
    }

    function openCreateProjectModal() {
        if (document.getElementById('createProjectOverlay')) return;
        const today = new Date().toISOString().split('T')[0];
        const overlay = document.createElement('div');
        overlay.id = 'createProjectOverlay';
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4';
        overlay.style.animation = 'fadeIn 0.2s ease';
        overlay.onclick = (e) => { if (e.target === overlay) closeCreateProjectModal(); };
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl" style="animation: slideUp 0.3s ease">
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h3 class="text-lg font-bold text-gray-900">Create New Project</h3>
                        <p class="text-xs text-gray-500 mt-0.5">New project starts at Step 1 — Intent</p>
                    </div>
                    <button onclick="Nestopia.modules.projects.closeCreateProjectModal()" class="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition">
                        <i class="fas fa-times text-gray-400"></i>
                    </button>
                </div>
                <div class="px-6 py-5 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <form id="createProjectForm" onsubmit="return false;">
                        <!-- Project Name -->
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Project Name <span class="text-red-500">*</span></label>
                            <input type="text" id="np_name" class="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="e.g. Johnson Residence Sunroom" required>
                        </div>
                        <!-- Product Type -->
                        <div class="mb-4">
                            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Product Type <span class="text-red-500">*</span></label>
                            <div class="grid grid-cols-4 gap-2" id="np_type_group">
                                <label class="np-type-option flex flex-col items-center gap-1.5 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition text-center" data-type="Sunroom">
                                    <input type="radio" name="np_type" value="Sunroom" class="hidden">
                                    <i class="fas fa-sun text-lg text-gray-400"></i>
                                    <span class="text-xs font-medium text-gray-600">Sunroom</span>
                                </label>
                                <label class="np-type-option flex flex-col items-center gap-1.5 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition text-center" data-type="Pergola">
                                    <input type="radio" name="np_type" value="Pergola" class="hidden">
                                    <i class="fas fa-warehouse text-lg text-gray-400"></i>
                                    <span class="text-xs font-medium text-gray-600">Pergola</span>
                                </label>
                                <label class="np-type-option flex flex-col items-center gap-1.5 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition text-center" data-type="Zip Blinds">
                                    <input type="radio" name="np_type" value="Zip Blinds" class="hidden">
                                    <i class="fas fa-wind text-lg text-gray-400"></i>
                                    <span class="text-xs font-medium text-gray-600">Zip Blinds</span>
                                </label>
                                <label class="np-type-option flex flex-col items-center gap-1.5 p-3 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition text-center" data-type="ADU">
                                    <input type="radio" name="np_type" value="ADU" class="hidden">
                                    <i class="fas fa-home text-lg text-gray-400"></i>
                                    <span class="text-xs font-medium text-gray-600">ADU</span>
                                </label>
                            </div>
                        </div>
                        <!-- Customer Info Section -->
                        <div class="mb-4 pt-3 border-t border-gray-100">
                            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Customer Information</div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Customer Name <span class="text-red-500">*</span></label>
                                    <input type="text" id="np_customer" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="Mr. / Ms. Name" required>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Phone <span class="text-red-500">*</span></label>
                                    <input type="tel" id="np_phone" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="(555) 123-4567" required>
                                </div>
                            </div>
                            <div class="mt-3">
                                <label class="block text-sm font-medium text-gray-600 mb-1">Email <span class="text-red-500">*</span></label>
                                <input type="email" id="np_email" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="customer@email.com" required>
                            </div>
                            <div class="mt-3">
                                <label class="block text-sm font-medium text-gray-600 mb-1">Project Address</label>
                                <input type="text" id="np_address" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none" placeholder="123 Main St, City, State ZIP">
                            </div>
                        </div>
                        <!-- Budget & Timeline Section -->
                        <div class="mb-4 pt-3 border-t border-gray-100">
                            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Budget & Timeline</div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Budget Range</label>
                                    <select id="np_budget" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none bg-white">
                                        <option value="15000">$10K – $20K</option>
                                        <option value="27500">$20K – $35K</option>
                                        <option value="42500" selected>$35K – $50K</option>
                                        <option value="62500">$50K – $75K</option>
                                        <option value="87500">$75K – $100K</option>
                                        <option value="120000">$100K+</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-600 mb-1">Ideal Start</label>
                                    <select id="np_timeline" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none bg-white">
                                        <option value="ASAP">ASAP (within 1 month)</option>
                                        <option value="1-3 months" selected>1 – 3 months</option>
                                        <option value="3-6 months">3 – 6 months</option>
                                        <option value="TBD">Not determined</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <!-- Notes -->
                        <div class="mb-2 pt-3 border-t border-gray-100">
                            <label class="block text-sm font-medium text-gray-600 mb-1">Notes <span class="text-xs text-gray-400">(optional)</span></label>
                            <textarea id="np_notes" class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none resize-none" rows="2" placeholder="Any initial remarks..."></textarea>
                        </div>
                    </form>
                </div>
                <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                    <div class="flex items-center gap-2 text-xs text-gray-400">
                        <i class="fas fa-info-circle"></i>
                        <span>Initializes Step 1 checklist, questionnaire & payment tracking</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="Nestopia.modules.projects.closeCreateProjectModal()" class="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-100 transition">Cancel</button>
                        <button onclick="Nestopia.modules.projects.submitCreateProject()" class="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition shadow-sm">
                            <i class="fas fa-plus mr-1"></i>Create Project
                        </button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        // Product type toggle logic
        overlay.querySelectorAll('.np-type-option').forEach(opt => {
            opt.addEventListener('click', () => {
                overlay.querySelectorAll('.np-type-option').forEach(o => {
                    o.classList.remove('border-blue-500', 'bg-blue-50');
                    o.classList.add('border-gray-200');
                    o.querySelector('i').classList.remove('text-blue-600');
                    o.querySelector('i').classList.add('text-gray-400');
                });
                opt.classList.add('border-blue-500', 'bg-blue-50');
                opt.classList.remove('border-gray-200');
                opt.querySelector('i').classList.add('text-blue-600');
                opt.querySelector('i').classList.remove('text-gray-400');
                opt.querySelector('input').checked = true;
            });
        });

        // Focus first field
        setTimeout(() => document.getElementById('np_name')?.focus(), 200);
    }

    function closeCreateProjectModal() {
        const overlay = document.getElementById('createProjectOverlay');
        if (overlay) overlay.remove();
    }

    function submitCreateProject() {
        const name = document.getElementById('np_name')?.value.trim();
        const customer = document.getElementById('np_customer')?.value.trim();
        const email = document.getElementById('np_email')?.value.trim();
        const phone = document.getElementById('np_phone')?.value.trim();
        const address = document.getElementById('np_address')?.value.trim();
        const typeRadio = document.querySelector('input[name="np_type"]:checked');
        const budget = parseInt(document.getElementById('np_budget')?.value || '42500');
        const timeline = document.getElementById('np_timeline')?.value || '1-3 months';
        const notes = document.getElementById('np_notes')?.value.trim();

        // Validation
        if (!name) { alert('Please enter a project name.'); document.getElementById('np_name')?.focus(); return; }
        if (!typeRadio) { alert('Please select a product type.'); return; }
        if (!customer) { alert('Please enter the customer name.'); document.getElementById('np_customer')?.focus(); return; }
        if (!phone) { alert('Please enter the customer phone.'); document.getElementById('np_phone')?.focus(); return; }
        if (!email) { alert('Please enter the customer email.'); document.getElementById('np_email')?.focus(); return; }

        const type = typeRadio.value;
        const projectId = generateProjectId();
        const today = new Date().toISOString().split('T')[0];

        // Build the new project object — starts at Step 1 (Intent)
        const newProject = {
            id: projectId,
            name: name,
            customer: customer,
            customerEmail: email,
            customerPhone: phone,
            customerAddress: address || 'TBD',
            type: type,
            workflowStep: 1,
            stage: 'intent',
            riskLevel: 'low',
            budget: budget,
            paid: 0,
            timeline: timeline,
            startDate: today,
            risks: [],
            issues: [],
            order: { id: '', product: type, total: '$0', status: 'New', date: today },
            // Step 1 sub-components initialized
            _step1: {
                checklist: {
                    initial_communication: false,
                    intake_questionnaire: false,
                    hoa_precheck: false,
                    intent_fee_collected: false,
                    client_signoff: false
                },
                questionnaire: {
                    status: 'not_started', // not_started | in_progress | completed
                    modules: { a1: false, a2: false, a3: false, a4: false, a5: false, a6: false, a7: false, a8: false }
                },
                payments: {
                    intent_fee: { amount: 100, status: 'pending', date: null }
                },
                documents: [],
                notes: notes || ''
            }
        };

        // Add to array and refresh list
        allProjectsData.unshift(newProject);
        persistProjectToDB(newProject);
        renderProjectList();
        closeCreateProjectModal();

        // Auto-select the new project
        setTimeout(() => selectProject(projectId), 150);
    }

    // ── Supabase Project 持久化 ──────────────────────────
    function persistProjectToDB(project) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) {
            console.warn('[Project] Supabase not connected — project not persisted to DB');
            return;
        }
        var tenantId = NestopiaDB.getTenantId();
        var payload = {
            tenant_id: tenantId,
            project_number: project.id,
            title: project.name,
            client_name: project.customer,
            client_email: project.customerEmail || null,
            client_phone: project.customerPhone || null,
            client_address: (project.customerAddress && project.customerAddress !== 'TBD') ? project.customerAddress : null,
            status: project.stage === 'intent' ? 'pending' : 'in_progress',
            project_type: 'residential',
            project_subtype: project.type,
            workflow_step: project.workflowStep || 1,
            budget_range: project.budget ? String(project.budget) : null,
            preferred_timeline: project.timeline || null,
            is_deleted: false,
            created_by: 'e20592c6-57da-464a-aecf-0d9c65b36a42',
            product_config: {
                tenant_slug: (typeof getCurrentTenantSlug === 'function') ? getCurrentTenantSlug() : 'default',
                product_type: project.type,
                stage: project.stage,
                riskLevel: project.riskLevel,
                budget: project.budget,
                paid: project.paid,
                timeline: project.timeline,
                startDate: project.startDate,
                risks: project.risks,
                issues: project.issues,
                order: project.order,
                _step1: project._step1
            }
        };
        NestopiaDB.getClient()
            .from('projects')
            .insert(payload)
            .then(function(res) {
                if (res.error) {
                    console.error('[Project] DB save error:', res.error.message);
                } else {
                    console.log('[Project] ✅ Saved to DB:', project.id);
                }
            })
            .catch(function(err) {
                console.error('[Project] DB save failed:', err.message);
            });
    }

    function loadProjectsFromDB() {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return;
        if (_projectsDbLoaded) return;
        _projectsDbLoaded = true;
        var tenantId = NestopiaDB.getTenantId();
        NestopiaDB.getClient()
            .from('projects')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_deleted', false)
            .not('project_number', 'is', null)
            .order('created_at', { ascending: false })
            .then(function(res) {
                if (res.error) {
                    console.warn('[Project] DB load error:', res.error.message);
                    _projectsDbLoaded = false;
                    return;
                }
                var rows = res.data || [];
                // Filter by tenant slug — isolate sub-tenants sharing same tenant_id
                var currentSlug = (typeof getCurrentTenantSlug === 'function') ? getCurrentTenantSlug() : 'default';
                rows = rows.filter(function(row) {
                    var cfg = row.product_config || {};
                    // Strict tenant isolation: only show projects tagged for this tenant
                    if (!cfg.tenant_slug) return false;
                    // Greenscape family: default/partner1/partner2 are equivalent sub-tenants
                    var greenscapeSlugs = ['default', 'partner1', 'partner2'];
                    if (greenscapeSlugs.indexOf(currentSlug) >= 0) {
                        return greenscapeSlugs.indexOf(cfg.tenant_slug) >= 0;
                    }
                    return cfg.tenant_slug === currentSlug;
                });
                // Build lookup of existing in-memory project IDs
                var existingIds = {};
                allProjectsData.forEach(function(p) { existingIds[p.id] = true; });
                var added = 0;
                rows.forEach(function(row) {
                    // Skip if this project_number already exists in memory (hardcoded demo data)
                    if (existingIds[row.project_number]) return;
                    var cfg = row.product_config || {};
                    var project = {
                        id: row.project_number,
                        name: row.title || 'Untitled',
                        customer: row.client_name || 'Unknown',
                        customerEmail: row.client_email || '',
                        customerPhone: row.client_phone || '',
                        customerAddress: row.client_address || 'TBD',
                        type: cfg.product_type || row.project_subtype || 'Sunroom',
                        workflowStep: row.workflow_step || 1,
                        stage: cfg.stage || 'intent',
                        riskLevel: cfg.riskLevel || 'low',
                        budget: cfg.budget || parseInt(String(row.budget_range || '0').replace(/[^0-9]/g, '')) || 0,
                        paid: cfg.paid || 0,
                        timeline: row.preferred_timeline || cfg.timeline || '',
                        startDate: cfg.startDate || (row.created_at ? row.created_at.split('T')[0] : ''),
                        risks: cfg.risks || [],
                        issues: cfg.issues || [],
                        order: cfg.order || null,
                        _step1: cfg._step1 || {
                            checklist: { initial_communication: false, intake_questionnaire: false, hoa_precheck: false, intent_fee_collected: false, client_signoff: false },
                            questionnaire: { status: 'not_started', modules: { a1: false, a2: false, a3: false, a4: false, a5: false, a6: false, a7: false, a8: false } },
                            payments: { intent_fee: { amount: 100, status: 'pending', date: null } },
                            documents: [],
                            notes: ''
                        },
                        _fromDB: true
                    };
                    allProjectsData.unshift(project);
                    existingIds[row.project_number] = true;
                    added++;
                });
                if (added > 0) {
                    console.log('[Project] ✅ Loaded ' + added + ' project(s) from DB');
                    renderProjectList();
                }
            })
            .catch(function(err) {
                console.warn('[Project] DB load failed:', err.message);
                _projectsDbLoaded = false;
            });
    }

    // ===== Projects Page: Master-Detail =====
    // Seed Projects (→ js/data/seed-projects.js)
    const greenscapeProjects = Nestopia.data.seedProjects.greenscapeProjects;
    const omeyaSinProjects = Nestopia.data.seedProjects.omeyaSinProjects;
    const nestopiaChnProjects = Nestopia.data.seedProjects.nestopiaChnProjects;
    const tenantProjectsMap = Nestopia.data.seedProjects.tenantProjectsMap;
    let allProjectsData = tenantProjectsMap[getCurrentTenantSlug()] || greenscapeProjects;
    var _projectsDbLoaded = false;

    let currentProjectFilter = 'all';

    function renderProjectList() {
        // v1.2.0: Old project list panel removed; sync sidebar instead
        renderSidebarProjects();
        const container = document.getElementById('projectListContainer');
        if (!container) return;
        const searchVal = (document.getElementById('projectListSearch')?.value || '').toLowerCase();
        const filtered = allProjectsData.filter(p => !p.hidden).filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchVal) || p.customer.toLowerCase().includes(searchVal);
            const matchesFilter = currentProjectFilter === 'all' || 
                (currentProjectFilter === 'active' && p.workflowStep < 6) ||
                (currentProjectFilter === 'completed' && p.workflowStep === 6 && p.stage === 'installation');
            return matchesSearch && matchesFilter;
        });

        const riskColors = { high: 'red', medium: 'amber', low: 'green' };
        const stepNames = ['', 'Intent', 'Design', 'Measurement', 'Quotation', 'Production', 'Installation'];

        container.innerHTML = filtered.map(p => {
            const isZB = p.type === 'Zip Blinds';
            const progressPct = isZB ? 50 : Math.round((p.workflowStep / 6) * 100);
            const stepLabel = isZB ? 'Measure & Quote' : 'Step ' + p.workflowStep + '/6';
            return `
            <div class="project-list-item p-4 border-b border-gray-100 hover:bg-blue-50/40 cursor-pointer transition" data-project-id="${p.id}" onclick="Nestopia.modules.projects.selectProject('${p.id}')">
                <div class="flex items-start justify-between mb-1.5">
                    <div class="font-medium text-sm text-gray-900 leading-tight">${p.name}</div>
                    <div class="w-2 h-2 rounded-full bg-${riskColors[p.riskLevel]}-500 flex-shrink-0 mt-1.5 ml-2"></div>
                </div>
                <div class="text-xs text-gray-500 mb-2">${p.customer} &middot; ${p.type}</div>
                <div class="flex items-center gap-2">
                    <div class="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div class="bg-blue-500 rounded-full h-1.5 transition-all" style="width:${progressPct}%"></div>
                    </div>
                    <span class="text-xs text-gray-400 flex-shrink-0">${stepLabel}</span>
                </div>
            </div>`;
        }).join('');

        if (filtered.length === 0) {
            container.innerHTML = '<div class="p-6 text-center text-gray-400 text-sm">No projects found</div>';
        }
    }

    function filterProjectList() { renderProjectList(); }

    function filterProjectListByStatus(status) {
        currentProjectFilter = status;
        document.querySelectorAll('.proj-filter-btn').forEach(btn => {
            btn.classList.toggle('bg-gray-900', btn.dataset.filter === status);
            btn.classList.toggle('text-white', btn.dataset.filter === status);
            btn.classList.toggle('bg-white', btn.dataset.filter !== status);
            btn.classList.toggle('border', btn.dataset.filter !== status);
            btn.classList.toggle('text-gray-500', btn.dataset.filter !== status);
        });
        renderProjectList();
    }

    let projectListCollapsed = false;

    function toggleProjectListPanel() {
        const panel = document.getElementById('projectListPanel');
        const headerFull = document.getElementById('projListHeaderFull');
        const headerCollapsed = document.getElementById('projListHeaderCollapsed');
        const listFull = document.getElementById('projectListContainer');
        const listCollapsed = document.getElementById('projectListCollapsed');
        const toggleBtn = document.getElementById('projListToggleBtn');

        projectListCollapsed = !projectListCollapsed;

        if (projectListCollapsed) {
            panel.classList.remove('w-80');
            panel.classList.add('w-16');
            headerFull.classList.add('hidden');
            headerCollapsed.classList.remove('hidden');
            headerCollapsed.classList.add('flex');
            listFull.classList.add('hidden');
            listCollapsed.classList.remove('hidden');
            if (toggleBtn) toggleBtn.title = 'Expand project list';
            renderCollapsedProjectList();
        } else {
            panel.classList.remove('w-16');
            panel.classList.add('w-80');
            headerFull.classList.remove('hidden');
            headerCollapsed.classList.add('hidden');
            headerCollapsed.classList.remove('flex');
            listFull.classList.remove('hidden');
            listCollapsed.classList.add('hidden');
            if (toggleBtn) toggleBtn.title = 'Collapse project list';
        }
    }

    function collapseProjectListPanel() {
        if (!projectListCollapsed) {
            toggleProjectListPanel();
        }
    }

    function renderCollapsedProjectList() {
        const container = document.getElementById('projectListCollapsed');
        if (!container) return;
        const riskColors = { high: 'red', medium: 'amber', low: 'green' };
        const selectedId = document.querySelector('.project-list-item.bg-blue-50')?.dataset?.projectId;

        container.innerHTML = allProjectsData.filter(p => !p.hidden).map(p => {
            const initials = p.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
            const isSelected = p.id === selectedId;
            const ringClass = isSelected ? `ring-2 ring-blue-500 bg-blue-100 text-blue-700` : `bg-gray-100 text-gray-600 hover:bg-gray-200`;
            return `
                <div class="flex flex-col items-center py-2 cursor-pointer transition-all" onclick="Nestopia.modules.projects.selectProject('${p.id}')" title="${p.name}\n${p.customer}">
                    <div class="relative">
                        <div class="w-9 h-9 rounded-full ${ringClass} flex items-center justify-center text-xs font-bold transition-all">
                            ${initials}
                        </div>
                        <div class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-${riskColors[p.riskLevel]}-500 border-2 border-white"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function selectProject(projectId) {
        const project = allProjectsData.find(p => p.id === projectId);
        if (!project) return;

        // v1.2.0: Update sidebar selection + track current project
        currentSelectedProjectId = projectId;
        renderSidebarProjects();

        // Close any open agent panel when switching projects
        if (typeof closeAgentPanel === 'function') closeAgentPanel();

        // Show detail panel
        const emptyEl = document.getElementById('projectDetailEmpty');
        const contentEl = document.getElementById('projectDetailContent');
        if (emptyEl) emptyEl.classList.add('hidden');
        if (contentEl) contentEl.classList.remove('hidden');

        // Header
        const nameEl = document.getElementById('projDetailName');
        const metaEl = document.getElementById('projDetailMeta');
        if (nameEl) nameEl.textContent = project.name;
        if (metaEl) metaEl.textContent = `${project.customer} · ${project.type} · Started ${project.startDate}` + (project.budget ? ` · Budget $${project.budget.toLocaleString()}` : '');
        const statusEl = document.getElementById('projDetailStatus');
        const riskColors = { high: 'bg-red-50 text-red-700', medium: 'bg-amber-50 text-amber-700', low: 'bg-green-50 text-green-700' };
        if (statusEl) {
            statusEl.className = 'text-xs font-medium px-3 py-1 rounded-full ' + (riskColors[project.riskLevel] || 'bg-gray-100 text-gray-700');
            statusEl.textContent = project.riskLevel.charAt(0).toUpperCase() + project.riskLevel.slice(1) + ' Risk';
        }

        // Service Workflow
        renderProjectWorkflow(project);

        // 异步刷新项目文件签名 URL（Private Bucket 签名 URL 1 小时过期）
        syncProjectFilesFromCloud(projectId);

        // 预加载 Intake 表单数据（确保进度条反映 DB 中的真实完成状态，而非硬编码种子数据）
        if (!_intakeDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            _intakeDbLoaded[projectId] = true;
            loadIntakeFromDB(projectId).then(function(dbData) {
                if (dbData && typeof dbData === 'object') {
                    var local = getIntakeData(projectId);
                    Object.keys(dbData).forEach(function(k) {
                        if (k === '_uploadedFiles') return;
                        local[k] = dbData[k];
                    });
                    if (dbData._uploadedFiles && typeof dbData._uploadedFiles === 'object') {
                        var localFiles = getUploadedFiles(projectId);
                        Object.keys(dbData._uploadedFiles).forEach(function(fk) {
                            if (!localFiles[fk] || localFiles[fk].length === 0) {
                                localFiles[fk] = dbData._uploadedFiles[fk];
                            }
                        });
                    }
                    // 如果当前有展开的 Step Detail，重新渲染以刷新进度条
                    if (expandedStep && currentDetailProject && currentDetailProject.id === projectId) {
                        toggleStepDetail(expandedStep, currentDetailProject);
                        toggleStepDetail(expandedStep, currentDetailProject);
                    }
                }
            });
        }

        // Risk List
        renderProjectRisks(project);

        // Issue List
        renderProjectIssues(project);

        // Customer
        renderProjectCustomer(project);

        // Order
        renderProjectOrder(project);

        // Revenue
        renderProjectRevenue(project);
    }

    function renderProjectWorkflow(project) {
        const container = document.getElementById('projWorkflowSteps');
        const isZipBlinds = project.type === 'Zip Blinds';

        // Reset expanded step
        expandedStep = null;
        currentDetailProject = project;
        const detailContainer = document.getElementById('projStepDetail');
        if (detailContainer) { detailContainer.classList.add('hidden'); detailContainer.innerHTML = ''; }

        // ---- Zip Blinds: 4-step workflow (Measurement → Quotation → Verification → Order & Install) ----
        if (isZipBlinds) {
            container.innerHTML = ZB_WORKFLOW_STEPS.map((s, i) => {
                const isCompleted = s.step < project.workflowStep;
                const isCurrent = s.step === project.workflowStep;
                const isFuture = s.step > project.workflowStep;
                const isLocked = s.step === 4; // Order & Install always locked
                const baseColor = s.color;

                let classes = 'flex-1 flex flex-col items-center p-3 rounded-xl transition ';
                if (isLocked) {
                    classes += 'opacity-30 cursor-default';
                } else if (isCurrent) {
                    classes += 'bg-' + baseColor + '-50 border-2 border-' + baseColor + '-300 cursor-pointer hover:shadow-md';
                } else if (isCompleted) {
                    classes += 'bg-green-50/50 cursor-pointer hover:shadow-md hover:bg-green-50';
                } else {
                    classes += 'opacity-40 cursor-pointer hover:opacity-60';
                }

                const icon = isCompleted ? 'fa-check-circle text-green-500' : isLocked ? s.icon + ' text-gray-400' : s.icon + ' text-' + baseColor + '-500';
                const statusLabel = isLocked ? 'Coming Soon' : isCompleted ? 'Completed' : isCurrent ? 'Active' : 'Pending';
                const statusClass = isLocked ? 'text-gray-400' : isCompleted ? 'text-green-500 font-medium' : isCurrent ? 'text-' + baseColor + '-500 font-medium' : 'text-gray-400';
                const clickable = !isLocked;

                return '<div class="' + classes + '" ' + (clickable ? 'onclick="toggleStepDetail(' + s.step + ', currentDetailProject)"' : '') + ' title="' + (isLocked ? 'Coming Soon' : s.desc) + '">' +
                        '<i class="fas ' + icon + ' text-lg mb-1.5"></i>' +
                        '<span class="text-xs font-semibold text-gray-700">' + s.name + '</span>' +
                        '<span class="text-[10px] ' + statusClass + ' mt-0.5">' + statusLabel + '</span>' +
                    '</div>' +
                    (i < ZB_WORKFLOW_STEPS.length - 1 ? '<div class="flex items-center"><i class="fas fa-chevron-right text-gray-300 text-xs"></i></div>' : '');
            }).join('');
            return;
        }

        // ---- Non-Zip Blinds: original 6-step workflow ----
        const stepNames = ['Intent', 'Design', 'Measurement', 'Quotation', 'Production', 'Installation'];
        const stepIcons = ['fa-handshake', 'fa-palette', 'fa-ruler-combined', 'fa-file-contract', 'fa-industry', 'fa-tools'];
        const stepColors = ['blue', 'indigo', 'purple', 'orange', 'yellow', 'green'];

        container.innerHTML = stepNames.map((name, i) => {
            const step = i + 1;
            const isCompleted = step < project.workflowStep;
            const isCurrent = step === project.workflowStep;
            const isFuture = step > project.workflowStep;
            const baseColor = stepColors[i];

            let classes = 'flex-1 flex flex-col items-center p-3 rounded-xl transition cursor-pointer hover:shadow-md ';
            if (isCurrent) classes += `bg-${baseColor}-50 border-2 border-${baseColor}-300`;
            else if (isCompleted) classes += 'bg-green-50/50 hover:bg-green-50';
            else classes += 'opacity-40 hover:opacity-60';

            const icon = isCompleted ? 'fa-check-circle text-green-500' : `${stepIcons[i]} text-${baseColor}-500`;

            return `
                <div class="${classes}" onclick="toggleStepDetail(${step}, currentDetailProject)" title="Click to view Step ${step} details">
                    <i class="fas ${icon} text-lg mb-1.5"></i>
                    <span class="text-xs font-semibold text-gray-700">${name}</span>
                    <span class="text-[10px] text-gray-400 mt-0.5">Step ${step}</span>
                </div>
                ${step < 6 ? '<div class="flex items-center"><i class="fas fa-chevron-right text-gray-300 text-xs"></i></div>' : ''}
            `;
        }).join('');
    }

    function renderProjectRisks(project) {
        const container = document.getElementById('projRiskList');
        document.getElementById('projRiskCount').textContent = project.risks.length + ' risk(s)';
        if (project.risks.length === 0) {
            container.innerHTML = '<div class="p-4 text-sm text-gray-400 text-center">No risks identified</div>';
            return;
        }
        const sevColors = { high: 'red', medium: 'amber', low: 'green' };
        container.innerHTML = project.risks.map(r => `
            <div class="flex items-center justify-between px-5 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-2 h-2 rounded-full bg-${sevColors[r.severity]}-500"></div>
                    <span class="text-sm text-gray-700">${r.title}</span>
                </div>
                <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 bg-${sevColors[r.severity]}-50 text-${sevColors[r.severity]}-700 text-xs font-medium rounded-full">${r.severity}</span>
                    <span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">${r.status}</span>
                </div>
            </div>
        `).join('');
    }

    function renderProjectIssues(project) {
        const container = document.getElementById('projIssueList');
        document.getElementById('projIssueCount').textContent = project.issues.length + ' issue(s)';
        if (project.issues.length === 0) {
            container.innerHTML = '<div class="p-4 text-sm text-gray-400 text-center">No open issues</div>';
            return;
        }
        const prioColors = { high: 'red', medium: 'amber', low: 'green' };
        container.innerHTML = project.issues.map(iss => `
            <div class="flex items-center justify-between px-5 py-3">
                <div class="flex items-center gap-3 flex-1 min-w-0">
                    <span class="w-1.5 h-1.5 rounded-full bg-${prioColors[iss.priority]}-500 flex-shrink-0"></span>
                    <span class="text-sm text-gray-700 truncate">${iss.title}</span>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span class="text-xs text-gray-500">${iss.assignedTo}</span>
                    <span class="px-2 py-0.5 ${iss.status === 'open' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} text-xs rounded-full">${iss.status}</span>
                </div>
            </div>
        `).join('');
    }

    function renderProjectCustomer(project) {
        document.getElementById('projCustomerInfo').innerHTML = `
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">${project.customer.charAt(project.customer.indexOf(' ') + 1) || project.customer.charAt(0)}</div>
                <div class="flex-1 grid grid-cols-2 gap-y-2 gap-x-6">
                    <div><div class="text-xs text-gray-400">Name</div><div class="text-sm font-medium text-gray-900">${project.customer}</div></div>
                    <div><div class="text-xs text-gray-400">Email</div><div class="text-sm text-gray-700">${project.customerEmail}</div></div>
                    <div><div class="text-xs text-gray-400">Phone</div><div class="text-sm text-gray-700">${project.customerPhone}</div></div>
                    <div><div class="text-xs text-gray-400">Address</div><div class="text-sm text-gray-700">${project.customerAddress}</div></div>
                </div>
            </div>
        `;
    }

    function renderProjectOrder(project) {
        const o = project.order;
        const statusColors = { 'In Production': 'blue', 'Pending': 'amber', 'Shipped': 'purple', 'Completed': 'green', 'Confirmed': 'blue' };
        const sc = statusColors[o.status] || 'gray';
        document.getElementById('projOrderInfo').innerHTML = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><div class="text-xs text-gray-400">Order ID</div><div class="text-sm font-medium text-gray-900">${o.id}</div></div>
                <div><div class="text-xs text-gray-400">Product</div><div class="text-sm text-gray-700">${o.product}</div></div>
                <div><div class="text-xs text-gray-400">Total</div><div class="text-sm font-bold text-gray-900">${o.total}</div></div>
                <div><div class="text-xs text-gray-400">Status</div><span class="px-2.5 py-0.5 bg-${sc}-50 text-${sc}-700 text-xs font-medium rounded-full">${o.status}</span></div>
            </div>
        `;
    }

    function renderProjectRevenue(project) {
        const paidPct = project.budget > 0 ? Math.round((project.paid / project.budget) * 100) : 0;
        const remaining = project.budget - project.paid;
        document.getElementById('projRevenueInfo').innerHTML = `
            <div class="grid grid-cols-3 gap-4 mb-4">
                <div><div class="text-xs text-gray-400">Budget</div><div class="text-lg font-bold text-gray-900">$${project.budget.toLocaleString()}</div></div>
                <div><div class="text-xs text-gray-400">Collected</div><div class="text-lg font-bold text-green-600">$${project.paid.toLocaleString()}</div></div>
                <div><div class="text-xs text-gray-400">Remaining</div><div class="text-lg font-bold text-amber-600">$${remaining.toLocaleString()}</div></div>
            </div>
            <div class="flex items-center gap-3">
                <div class="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div class="bg-green-500 rounded-full h-2.5 transition-all" style="width:${paidPct}%"></div>
                </div>
                <span class="text-sm font-medium text-gray-600">${paidPct}%</span>
            </div>
        `;
    }

    function initCompanyOverview() {
        // Company Overview is ready with static HTML; detail sections populated on click
    }

    function initNewProjectsPage() {
        renderProjectList();
    }

    // ===== Projects Management (Risk & Issues) =====
    function getProjectsDummyData() {
        var slug = getCurrentTenantSlug();
        if (slug === 'omeya-sin') return [
            { id: 'OMY-001', name: 'MX Zip Blinds', customer: 'Miss Xu', type: 'Zip Blinds', stage: 'design', budget: 6500, timeline: '3 weeks', riskLevel: 'low', issues: 0 }
        ];
        if (slug === 'nestopia-chn') return [
            { id: 'CHN-001', name: 'LZ Sunroom', customer: 'Larry Zhang', type: 'Sunroom', stage: 'design', budget: 50000, timeline: '8 weeks', riskLevel: 'low', issues: 0 },
            { id: 'CHN-002', name: 'LZ Pergola', customer: 'Larry Zhang', type: 'Pergola', stage: 'design', budget: 15000, timeline: '4 weeks', riskLevel: 'low', issues: 0 },
            { id: 'CHN-003', name: 'LZ Zip Blinds', customer: 'Larry Zhang', type: 'Zip Blinds', stage: 'design', budget: 8000, timeline: '3 weeks', riskLevel: 'low', issues: 0 }
        ];
        return [
            { id: 'PRJ-001', name: 'Johnson Residence', customer: 'Robert Johnson', type: 'Pergola', stage: 'permit', budget: 35000, timeline: '6 weeks', riskLevel: 'high', issues: 2 },
            { id: 'PRJ-002', name: 'Martinez ADU', customer: 'Carlos Martinez', type: 'ADU', stage: 'design', budget: 125000, timeline: '14 weeks', riskLevel: 'high', issues: 1 },
            { id: 'PRJ-003', name: 'Smith Sunroom', customer: 'Jennifer Smith', type: 'Sunroom', stage: 'manufacturing', budget: 58000, timeline: '8 weeks', riskLevel: 'medium', issues: 1 },
            { id: 'PRJ-004', name: 'Chen Pergola', customer: 'David Chen', type: 'Pergola', stage: 'installation', budget: 42000, timeline: '4 weeks', riskLevel: 'medium', issues: 0 },
            { id: 'PRJ-005', name: 'Davis Commercial', customer: 'ABC Restaurant', type: 'Commercial Pergola', stage: 'design', budget: 95000, timeline: '10 weeks', riskLevel: 'medium', issues: 1 },
            { id: 'PRJ-006', name: 'Wilson Residence', customer: 'Sarah Wilson', type: 'Sunroom', stage: 'installation', budget: 52000, timeline: '6 weeks', riskLevel: 'low', issues: 0 },
            { id: 'PRJ-007', name: 'Taylor Backyard', customer: 'Michael Taylor', type: 'Pergola', stage: 'completed', budget: 38000, timeline: '5 weeks', riskLevel: 'low', issues: 0 },
            { id: 'PRJ-008', name: 'Anderson Patio', customer: 'Lisa Anderson', type: 'Zip Blinds', stage: 'completed', budget: 12000, timeline: '2 weeks', riskLevel: 'low', issues: 0 },
            { id: 'PRJ-009', name: 'Thomas Deck', customer: 'James Thomas', type: 'Pergola', stage: 'permit', budget: 45000, timeline: '7 weeks', riskLevel: 'low', issues: 0 },
            { id: 'PRJ-010', name: 'Brown Garden', customer: 'Patricia Brown', type: 'Sunroom', stage: 'design', budget: 67000, timeline: '9 weeks', riskLevel: 'low', issues: 0 },
            { id: 'PRJ-011', name: 'Garcia Outdoor', customer: 'Maria Garcia', type: 'ADU', stage: 'manufacturing', budget: 135000, timeline: '15 weeks', riskLevel: 'low', issues: 0 },
            { id: 'PRJ-012', name: 'Lee Pavilion', customer: 'Steven Lee', type: 'Pergola', stage: 'installation', budget: 48000, timeline: '6 weeks', riskLevel: 'low', issues: 0 }
        ];
    }
    const projectsDummyData = getProjectsDummyData();

    function getIssuesDummyData() {
        var slug = getCurrentTenantSlug();
        if (slug === 'omeya-sin' || slug === 'nestopia-chn') return [];
        return [
            { id: 'ISS-001', projectId: 'PRJ-001', title: 'Permit approval delayed by city', priority: 'high', status: 'open', assignedTo: 'John Smith', dueDate: '2026-03-15' },
            { id: 'ISS-002', projectId: 'PRJ-001', title: 'HOA requires additional documentation', priority: 'medium', status: 'in_progress', assignedTo: 'Emily Davis', dueDate: '2026-03-18' },
            { id: 'ISS-003', projectId: 'PRJ-002', title: 'HOA architectural review pending', priority: 'high', status: 'open', assignedTo: 'John Smith', dueDate: '2026-03-14' },
            { id: 'ISS-004', projectId: 'PRJ-003', title: 'Material delivery delayed 1 week', priority: 'medium', status: 'in_progress', assignedTo: 'Mike Johnson', dueDate: '2026-03-20' },
            { id: 'ISS-005', projectId: 'PRJ-005', title: 'Budget review with client needed', priority: 'medium', status: 'open', assignedTo: 'Emily Davis', dueDate: '2026-03-16' }
        ];
    }
    const issuesDummyData = getIssuesDummyData();

    function renderProjectsTable() {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;
        tbody.innerHTML = projectsDummyData.map(project => `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="py-3 px-4"><div class="font-medium text-gray-900">${project.name}</div><div class="text-xs text-gray-500">${project.id}</div></td>
                <td class="py-3 px-4 text-sm text-gray-700">${project.customer}</td>
                <td class="py-3 px-4 text-sm text-gray-700">${project.type}</td>
                <td class="py-3 px-4">${getStageBadge(project.stage)}</td>
                <td class="py-3 px-4 text-sm font-medium text-gray-900">$${project.budget.toLocaleString()}</td>
                <td class="py-3 px-4 text-sm text-gray-700">${project.timeline}</td>
                <td class="py-3 px-4">${getRiskBadge(project.riskLevel)}</td>
                <td class="py-3 px-4"><button class="text-gray-400 hover:text-gray-600 transition" onclick="Nestopia.modules.projects.viewProject('${project.id}')"><i class="fas fa-ellipsis-v"></i></button></td>
            </tr>
        `).join('');
    }

    function renderIssuesTable() {
        const tbody = document.getElementById('issuesTableBody');
        if (!tbody) return;
        tbody.innerHTML = issuesDummyData.map(issue => `
            <tr class="border-b border-gray-100 hover:bg-gray-50 transition">
                <td class="py-3 px-4"><div class="font-medium text-gray-900">${issue.id}</div></td>
                <td class="py-3 px-4 text-sm text-gray-700">${projectsDummyData.find(p => p.id === issue.projectId)?.name || 'Unknown'}</td>
                <td class="py-3 px-4 text-sm text-gray-900">${issue.title}</td>
                <td class="py-3 px-4">${getPriorityBadge(issue.priority)}</td>
                <td class="py-3 px-4">${getIssuStatusBadge(issue.status)}</td>
                <td class="py-3 px-4 text-sm text-gray-700">${issue.assignedTo}</td>
                <td class="py-3 px-4 text-sm text-gray-700">${issue.dueDate}</td>
                <td class="py-3 px-4"><button class="text-gray-400 hover:text-gray-600 transition" onclick="Nestopia.modules.projects.viewIssue('${issue.id}')"><i class="fas fa-edit"></i></button></td>
            </tr>
        `).join('');
    }

    function viewProject(id) {
        const project = projectsDummyData.find(p => p.id === id);
        if (project) {
            alert('Project: ' + project.name + ' (' + project.id + ')\n\nCustomer: ' + project.customer + '\nType: ' + project.type + '\nStage: ' + project.stage + '\nBudget: $' + project.budget.toLocaleString() + '\nTimeline: ' + project.timeline + '\nRisk Level: ' + project.riskLevel + '\n\n(Project detail modal pending backend integration)');
        }
    }

    function viewIssue(id) {
        const issue = issuesDummyData.find(i => i.id === id);
        if (issue) {
            alert('Issue: ' + issue.title + ' (' + issue.id + ')\n\nProject: ' + (projectsDummyData.find(p => p.id === issue.projectId)?.name || '') + '\nPriority: ' + issue.priority + '\nStatus: ' + issue.status + '\nAssigned To: ' + issue.assignedTo + '\nDue Date: ' + issue.dueDate + '\n\n(Issue detail modal pending backend integration)');
        }
    }

    function openIssueModal() {
        alert('Report Issue modal will be implemented here with:\n- Project selection\n- Issue title and description\n- Priority level\n- Assignment\n- Due date\n\nThis will be a full modal dialog for creating new issues.');
    }

    function initProjectsPage() {
        renderWorkflowPipeline();
        renderWorkflowProjects();
        renderProjectsTable();
        renderIssuesTable();
        // Update workflow stats dynamically based on tenant data
        var wfTotal = document.getElementById('wfStatTotal');
        var wfRevenue = document.getElementById('wfStatRevenue');
        var wfDocs = document.getElementById('wfStatDocs');
        var wfChecklist = document.getElementById('wfStatChecklist');
        if (wfTotal) wfTotal.textContent = workflowProjects.length;
        if (wfRevenue) {
            var totalBudget = 0;
            workflowProjects.forEach(function(p) {
                if (p.contractTotal) totalBudget += p.contractTotal;
                else {
                    var b = String(p.budget).replace(/[^0-9]/g, '');
                    if (b) totalBudget += parseInt(b);
                }
            });
            wfRevenue.textContent = totalBudget >= 1000 ? '$' + Math.round(totalBudget / 1000) + 'K' : '$' + totalBudget;
        }
        if (wfDocs) {
            var totalDocs = 0;
            workflowProjects.forEach(function(p) { Object.values(p.documents || {}).forEach(function(d) { totalDocs += d; }); });
            wfDocs.textContent = totalDocs;
        }
        if (wfChecklist) {
            var totalItems = 0, doneItems = 0;
            workflowProjects.forEach(function(p) { Object.values(p.checklist || {}).forEach(function(c) { totalItems += c.total || 0; doneItems += c.done || 0; }); });
            wfChecklist.textContent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) + '%' : '0%';
        }
    }

    // ── 注册模块 & 全局别名 ──────────────────────────
    N.modules.projects = {
        generateProjectId: generateProjectId,
        openCreateProjectModal: openCreateProjectModal,
        closeCreateProjectModal: closeCreateProjectModal,
        submitCreateProject: submitCreateProject,
        persistProjectToDB: persistProjectToDB,
        loadProjectsFromDB: loadProjectsFromDB,
        renderProjectList: renderProjectList,
        filterProjectList: filterProjectList,
        filterProjectListByStatus: filterProjectListByStatus,
        toggleProjectListPanel: toggleProjectListPanel,
        collapseProjectListPanel: collapseProjectListPanel,
        renderCollapsedProjectList: renderCollapsedProjectList,
        selectProject: selectProject,
        renderProjectWorkflow: renderProjectWorkflow,
        renderProjectRisks: renderProjectRisks,
        renderProjectIssues: renderProjectIssues,
        renderProjectCustomer: renderProjectCustomer,
        renderProjectOrder: renderProjectOrder,
        renderProjectRevenue: renderProjectRevenue,
        initCompanyOverview: initCompanyOverview,
        initNewProjectsPage: initNewProjectsPage,
        getProjectsDummyData: getProjectsDummyData,
        getIssuesDummyData: getIssuesDummyData,
        renderProjectsTable: renderProjectsTable,
        renderIssuesTable: renderIssuesTable,
        viewProject: viewProject,
        viewIssue: viewIssue,
        openIssueModal: openIssueModal,
        initProjectsPage: initProjectsPage
    };

    // 全局别名 — 供 HTML onclick / 其他模块直接调用
    window.generateProjectId = generateProjectId;
    window.openCreateProjectModal = openCreateProjectModal;
    window.closeCreateProjectModal = closeCreateProjectModal;
    window.submitCreateProject = submitCreateProject;
    window.persistProjectToDB = persistProjectToDB;
    window.loadProjectsFromDB = loadProjectsFromDB;
    window.renderProjectList = renderProjectList;
    window.filterProjectList = filterProjectList;
    window.filterProjectListByStatus = filterProjectListByStatus;
    window.toggleProjectListPanel = toggleProjectListPanel;
    window.collapseProjectListPanel = collapseProjectListPanel;
    window.renderCollapsedProjectList = renderCollapsedProjectList;
    window.selectProject = selectProject;
    window.renderProjectWorkflow = renderProjectWorkflow;
    window.renderProjectRisks = renderProjectRisks;
    window.renderProjectIssues = renderProjectIssues;
    window.renderProjectCustomer = renderProjectCustomer;
    window.renderProjectOrder = renderProjectOrder;
    window.renderProjectRevenue = renderProjectRevenue;
    window.initCompanyOverview = initCompanyOverview;
    window.initNewProjectsPage = initNewProjectsPage;
    window.getProjectsDummyData = getProjectsDummyData;
    window.getIssuesDummyData = getIssuesDummyData;
    window.renderProjectsTable = renderProjectsTable;
    window.renderIssuesTable = renderIssuesTable;
    window.viewProject = viewProject;
    window.viewIssue = viewIssue;
    window.openIssueModal = openIssueModal;
    window.initProjectsPage = initProjectsPage;

    // 全局状态/数据别名
    window.allProjectsData = allProjectsData;
    window.projectsDummyData = projectsDummyData;
    window.issuesDummyData = issuesDummyData;
})();
