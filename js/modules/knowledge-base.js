/**
 * knowledge-base.js — 知识库管理
 * Phase 3.4: Knowledge Base Functions
 * 依赖: helpers.js, supabase-config.js, supabase-storage.js
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.modules = N.modules || {};

    // ===== Knowledge Base Functions =====
    const kbState = {
        documents: [],
        currentCategory: 'all',
        currentPage: 1,
        pageSize: 10,
        uploadTags: [],
        selectedFiles: []
    };

    const kbCategoryMeta = {
        installation: { label: 'Installation & Technical', icon: 'fa-tools', color: 'blue' },
        compliance: { label: 'Compliance & Regulatory', icon: 'fa-gavel', color: 'red' },
        sales: { label: 'Sales & Marketing', icon: 'fa-chart-line', color: 'green' },
        training: { label: 'Training Materials', icon: 'fa-graduation-cap', color: 'yellow' },
        aftersales: { label: 'After-Sales & Warranty', icon: 'fa-life-ring', color: 'orange' },
        design: { label: 'Design References', icon: 'fa-palette', color: 'purple' }
    };

    const kbAgentMeta = {
        designer: { label: 'AI Designer', icon: 'fa-paint-brush', color: 'blue' },
        pricing: { label: 'Pricing Agent', icon: 'fa-calculator', color: 'green' },
        compliance: { label: 'Compliance', icon: 'fa-gavel', color: 'red' },
        service: { label: 'Customer Service', icon: 'fa-headset', color: 'orange' }
    };

    // Dummy knowledge base data
    const kbDummyDocuments = [
        { id: 'kb-001', name: 'Pergola Installation Manual v3.2.pdf', category: 'installation', size: 4520000, type: 'pdf', status: 'indexed', agents: ['designer', 'service'], tags: ['pergola', 'installation', 'manual'], uploaded: '2026-03-10', description: 'Complete installation guide for residential pergola systems' },
        { id: 'kb-002', name: 'Maryland Building Code - Outdoor Structures 2026.pdf', category: 'compliance', size: 12800000, type: 'pdf', status: 'indexed', agents: ['compliance'], tags: ['Maryland', 'building code', 'pergola', 'sunroom'], uploaded: '2026-03-09', description: 'MD COMAR 09.12 requirements for outdoor structures' },
        { id: 'kb-003', name: 'Sales Pitch Deck - Residential Pergola.pptx', category: 'sales', size: 8900000, type: 'doc', status: 'indexed', agents: ['service', 'pricing'], tags: ['pergola', 'sales', 'residential'], uploaded: '2026-03-09', description: 'Client-facing sales presentation for residential pergola line' },
        { id: 'kb-004', name: 'Sunroom Engineering Specs - A100 Series.pdf', category: 'installation', size: 3200000, type: 'pdf', status: 'indexed', agents: ['designer'], tags: ['sunroom', 'engineering', 'A100'], uploaded: '2026-03-08', description: 'Structural engineering specifications for A100 series sunrooms' },
        { id: 'kb-005', name: 'FL Wind Zone Requirements.pdf', category: 'compliance', size: 2100000, type: 'pdf', status: 'indexed', agents: ['compliance'], tags: ['Florida', 'wind zone', 'building code'], uploaded: '2026-03-08', description: 'Florida wind load requirements for outdoor structures' },
        { id: 'kb-006', name: 'Material Cost Baseline Q1 2026.xlsx', category: 'sales', size: 890000, type: 'xls', status: 'indexed', agents: ['pricing'], tags: ['pricing', 'materials', 'cost'], uploaded: '2026-03-07', description: 'Quarterly material cost tracking spreadsheet' },
        { id: 'kb-007', name: 'New Employee Onboarding Guide.pdf', category: 'training', size: 5600000, type: 'pdf', status: 'indexed', agents: ['service'], tags: ['onboarding', 'training', 'new hire'], uploaded: '2026-03-07', description: 'Complete onboarding manual for new team members' },
        { id: 'kb-008', name: 'Warranty Policy v2.1.pdf', category: 'aftersales', size: 1200000, type: 'pdf', status: 'indexed', agents: ['service', 'compliance'], tags: ['warranty', 'policy', 'after-sales'], uploaded: '2026-03-06', description: '10-year warranty terms and conditions' },
        { id: 'kb-009', name: 'HOA Approval Checklist Template.docx', category: 'compliance', size: 340000, type: 'doc', status: 'indexed', agents: ['compliance', 'service'], tags: ['HOA', 'checklist', 'approval'], uploaded: '2026-03-06', description: 'Standard checklist for HOA architectural review submissions' },
        { id: 'kb-010', name: 'Design Style Guide - Modern Series.pdf', category: 'design', size: 15600000, type: 'pdf', status: 'indexed', agents: ['designer'], tags: ['design', 'modern', 'style guide'], uploaded: '2026-03-05', description: 'Visual style guide for modern product line designs' },
        { id: 'kb-011', name: 'Competitor Pricing Analysis Q1.xlsx', category: 'sales', size: 2300000, type: 'xls', status: 'indexed', agents: ['pricing'], tags: ['competitor', 'pricing', 'analysis'], uploaded: '2026-03-05', description: 'Regional competitor pricing comparison' },
        { id: 'kb-012', name: 'Zip Blinds Technical Specs.pdf', category: 'installation', size: 4100000, type: 'pdf', status: 'processing', agents: ['designer', 'service'], tags: ['zip blinds', 'specs', 'technical'], uploaded: '2026-03-12', description: 'Technical specifications for all Zip Blinds models' },
        { id: 'kb-013', name: 'Customer Objection Handling Playbook.pdf', category: 'sales', size: 3400000, type: 'pdf', status: 'indexed', agents: ['service'], tags: ['sales', 'objections', 'scripts'], uploaded: '2026-03-04', description: 'Common customer objections and recommended responses' },
        { id: 'kb-014', name: 'ADU Permit Application Guide - Montgomery County MD.pdf', category: 'compliance', size: 6700000, type: 'pdf', status: 'indexed', agents: ['compliance'], tags: ['ADU', 'permit', 'Montgomery County', 'Maryland'], uploaded: '2026-03-03', description: 'Step-by-step ADU permit application for Montgomery County, MD' },
        { id: 'kb-015', name: 'Troubleshooting Guide - Motor Systems.pdf', category: 'aftersales', size: 2800000, type: 'pdf', status: 'indexed', agents: ['service'], tags: ['troubleshooting', 'motor', 'repair'], uploaded: '2026-03-03', description: 'Diagnostic and repair guide for motorized systems' },
        { id: 'kb-016', name: 'Product Photography Standards.pdf', category: 'design', size: 7200000, type: 'pdf', status: 'indexed', agents: ['designer'], tags: ['photography', 'standards', 'marketing'], uploaded: '2026-03-02', description: 'Photography guidelines for product catalogs' },
        { id: 'kb-017', name: 'Supplier Catalog - Aluminum Alloy.pdf', category: 'installation', size: 9800000, type: 'pdf', status: 'processing', agents: ['pricing', 'designer'], tags: ['supplier', 'aluminum', 'materials'], uploaded: '2026-03-12', description: 'Primary supplier product catalog and specs' },
        { id: 'kb-018', name: 'Regional Labor Cost Data 2026.xlsx', category: 'sales', size: 1500000, type: 'xls', status: 'indexed', agents: ['pricing'], tags: ['labor', 'cost', 'regional'], uploaded: '2026-03-01', description: 'Installation labor costs by US state/region' },
        { id: 'kb-019', name: 'Sunroom Maintenance Guide.pdf', category: 'aftersales', size: 1800000, type: 'pdf', status: 'indexed', agents: ['service'], tags: ['sunroom', 'maintenance', 'cleaning'], uploaded: '2026-02-28', description: 'Homeowner maintenance guide for sunroom products' },
        { id: 'kb-020', name: 'Smart Home Integration Manual.pdf', category: 'installation', size: 3900000, type: 'pdf', status: 'processing', agents: ['designer', 'service'], tags: ['smart home', 'integration', 'IoT'], uploaded: '2026-03-11', description: 'Integration guide for HomeKit, Alexa, Google Home' },
        { id: 'kb-021', name: 'MD Building Code Updates 2026.pdf', category: 'compliance', size: 4200000, type: 'pdf', status: 'processing', agents: ['compliance'], tags: ['Maryland', 'building code', 'update'], uploaded: '2026-03-12', description: 'Latest Maryland building code amendments for outdoor structures' },
        { id: 'kb-022', name: 'Product Training Video Script - Pergola.docx', category: 'training', size: 890000, type: 'doc', status: 'indexed', agents: ['service'], tags: ['training', 'pergola', 'video'], uploaded: '2026-02-27', description: 'Script for partner product training video' },
        { id: 'kb-023', name: 'Color Palette Guide 2026.pdf', category: 'design', size: 5400000, type: 'pdf', status: 'indexed', agents: ['designer'], tags: ['color', 'palette', 'design'], uploaded: '2026-02-26', description: 'Annual color palette and finish options' },
        { id: 'kb-024', name: 'FAQ Library - Top 200 Questions.xlsx', category: 'training', size: 670000, type: 'xls', status: 'indexed', agents: ['service'], tags: ['FAQ', 'customer questions', 'answers'], uploaded: '2026-02-25', description: 'Most frequently asked customer questions with approved answers' },
        { id: 'kb-025', name: 'Installation Safety Protocol.pdf', category: 'installation', size: 2100000, type: 'pdf', status: 'indexed', agents: ['compliance', 'service'], tags: ['safety', 'installation', 'protocol'], uploaded: '2026-02-24', description: 'OSHA-compliant safety procedures for field installation' },
        { id: 'kb-026', name: 'Structural Load Calculations - Pergola.xlsx', category: 'installation', size: 1400000, type: 'xls', status: 'indexed', agents: ['designer', 'compliance'], tags: ['structural', 'load', 'pergola', 'engineering'], uploaded: '2026-02-23', description: 'Engineering load calculation templates for pergola systems' },
        { id: 'kb-027', name: 'Customer Success Stories - 2025 Annual.pdf', category: 'sales', size: 18200000, type: 'pdf', status: 'indexed', agents: ['service', 'pricing'], tags: ['case study', 'testimonial', 'success'], uploaded: '2026-02-22', description: 'Annual compilation of customer success stories and testimonials' },
        { id: 'kb-028', name: 'Warranty Claim Processing SOP.pdf', category: 'aftersales', size: 1600000, type: 'pdf', status: 'indexed', agents: ['service'], tags: ['warranty', 'claim', 'SOP'], uploaded: '2026-02-21', description: 'Standard operating procedure for warranty claim handling' },
        { id: 'kb-029', name: 'Partner Onboarding Checklist.pdf', category: 'training', size: 980000, type: 'pdf', status: 'indexed', agents: ['service'], tags: ['partner', 'onboarding', 'checklist'], uploaded: '2026-02-20', description: 'New partner onboarding requirements and timeline' },
        { id: 'kb-030', name: 'Material Compatibility Matrix.xlsx', category: 'design', size: 420000, type: 'xls', status: 'indexed', agents: ['designer', 'pricing'], tags: ['material', 'compatibility', 'reference'], uploaded: '2026-02-19', description: 'Cross-reference matrix for material and finish combinations' },
        { id: 'kb-031', name: 'Seasonal Demand Forecast Model.xlsx', category: 'sales', size: 3100000, type: 'xls', status: 'processing', agents: ['pricing'], tags: ['forecast', 'seasonal', 'demand'], uploaded: '2026-03-11', description: 'AI-assisted demand forecasting model by region and season' },
        { id: 'kb-032', name: 'Snow & Wind Load Design Guide - MD.pdf', category: 'compliance', size: 5800000, type: 'pdf', status: 'indexed', agents: ['compliance', 'designer'], tags: ['snow load', 'wind load', 'Maryland', 'design'], uploaded: '2026-02-18', description: 'Snow and wind load design requirements for Maryland installations' },
        { id: 'kb-033', name: 'Customer Journey Map Template.pdf', category: 'training', size: 2300000, type: 'pdf', status: 'indexed', agents: ['service'], tags: ['customer journey', 'template', 'training'], uploaded: '2026-02-17', description: 'Full lifecycle customer journey mapping template' },
        { id: 'kb-034', name: 'Glass Specification Reference.pdf', category: 'installation', size: 3700000, type: 'pdf', status: 'indexed', agents: ['designer'], tags: ['glass', 'specs', 'Low-E', 'tempered'], uploaded: '2026-02-16', description: 'Comprehensive glass type specifications and applications' },
        { id: 'kb-035', name: 'Insurance Requirements by State.pdf', category: 'compliance', size: 2900000, type: 'pdf', status: 'indexed', agents: ['compliance'], tags: ['insurance', 'liability', 'state'], uploaded: '2026-02-15', description: 'Contractor insurance requirements by US state' },
        { id: 'kb-036', name: 'Upselling Strategies Guide.pdf', category: 'sales', size: 1700000, type: 'pdf', status: 'indexed', agents: ['service', 'pricing'], tags: ['upselling', 'strategy', 'revenue'], uploaded: '2026-02-14', description: 'Proven upselling techniques for accessories and upgrades' },
        { id: 'kb-037', name: 'After-Sales Follow-up Schedule.xlsx', category: 'aftersales', size: 340000, type: 'xls', status: 'indexed', agents: ['service'], tags: ['follow-up', 'schedule', 'retention'], uploaded: '2026-02-13', description: 'Post-installation follow-up timeline and communication templates' },
        { id: 'kb-038', name: 'Brand Guidelines 2026.pdf', category: 'design', size: 12400000, type: 'pdf', status: 'indexed', agents: ['designer'], tags: ['brand', 'guidelines', 'identity'], uploaded: '2026-02-12', description: 'Official brand identity guidelines, logos, and usage rules' },
        { id: 'kb-039', name: 'ADU Product Training Deck.pptx', category: 'training', size: 24500000, type: 'doc', status: 'indexed', agents: ['service', 'designer'], tags: ['ADU', 'training', 'product'], uploaded: '2026-02-11', description: 'Comprehensive ADU product knowledge training presentation' },
        { id: 'kb-040', name: 'Roofing Material Options Guide.pdf', category: 'installation', size: 6100000, type: 'pdf', status: 'indexed', agents: ['designer', 'pricing'], tags: ['roofing', 'materials', 'polycarbonate'], uploaded: '2026-02-10', description: 'Guide to roofing material options for sunrooms and pergolas' },
        { id: 'kb-041', name: 'FEMA Flood Zone Reference Map - FL.pdf', category: 'compliance', size: 8900000, type: 'pdf', status: 'indexed', agents: ['compliance'], tags: ['FEMA', 'flood zone', 'Florida'], uploaded: '2026-02-09', description: 'Florida FEMA flood zone maps and BFE data' },
        { id: 'kb-042', name: 'Pricing Strategy - Premium vs Value.pdf', category: 'sales', size: 2200000, type: 'pdf', status: 'indexed', agents: ['pricing'], tags: ['pricing', 'strategy', 'tiers'], uploaded: '2026-02-08', description: 'Three-tier pricing strategy analysis and recommendations' },
        { id: 'kb-043', name: 'Maintenance Service Checklist.pdf', category: 'aftersales', size: 780000, type: 'pdf', status: 'indexed', agents: ['service'], tags: ['maintenance', 'checklist', 'service'], uploaded: '2026-02-07', description: 'Annual maintenance service checklist for field technicians' },
        { id: 'kb-044', name: 'Pergola Configuration Tool Specs.pdf', category: 'installation', size: 4300000, type: 'pdf', status: 'indexed', agents: ['designer'], tags: ['pergola', 'configuration', 'specs'], uploaded: '2026-02-06', description: 'Technical specs for online pergola configurator tool' },
        { id: 'kb-045', name: 'Sales Territory Mapping - US.pdf', category: 'sales', size: 7600000, type: 'pdf', status: 'indexed', agents: ['pricing', 'service'], tags: ['territory', 'mapping', 'sales region'], uploaded: '2026-02-05', description: 'US sales territory assignments and market data' },
        { id: 'kb-046', name: 'Quality Control Inspection Form.pdf', category: 'training', size: 560000, type: 'pdf', status: 'indexed', agents: ['compliance', 'service'], tags: ['QC', 'inspection', 'quality'], uploaded: '2026-02-04', description: 'Pre-delivery and post-installation QC inspection form' },
        { id: 'kb-047', name: 'Successful Project Portfolio 2025.pdf', category: 'design', size: 32000000, type: 'pdf', status: 'indexed', agents: ['designer', 'service'], tags: ['portfolio', 'projects', 'showcase'], uploaded: '2026-02-03', description: 'Annual portfolio of completed projects with photos and specs' }
    ];

    function getFileIcon(type) {
        const icons = { pdf: 'fa-file-pdf text-red-500', doc: 'fa-file-word text-blue-500', xls: 'fa-file-excel text-green-500', img: 'fa-file-image text-purple-500', video: 'fa-file-video text-pink-500' };
        return icons[type] || 'fa-file text-gray-400';
    }

    function formatFileSize(bytes) {
        if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
        return (bytes / 1024).toFixed(0) + ' KB';
    }

    function getStatusBadge(status) {
        const map = {
            indexed: '<span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium"><i class="fas fa-check-circle mr-1"></i>Indexed</span>',
            processing: '<span class="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium"><i class="fas fa-spinner fa-spin mr-1"></i>Processing</span>',
            failed: '<span class="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium"><i class="fas fa-exclamation-circle mr-1"></i>Failed</span>'
        };
        return map[status] || '';
    }

    function renderKBDocuments() {
        const list = document.getElementById('kbDocumentsList');
        if (!list) return;

        let docs = [...kbState.documents];
        const search = document.getElementById('kbSearchInput')?.value.toLowerCase() || '';
        const sort = document.getElementById('kbSortSelect')?.value || 'newest';
        const statusFilter = document.getElementById('kbStatusSelect')?.value || 'all';

        // Filter by category
        if (kbState.currentCategory !== 'all') {
            docs = docs.filter(d => d.category === kbState.currentCategory);
        }

        // Filter by search
        if (search) {
            docs = docs.filter(d =>
                d.name.toLowerCase().includes(search) ||
                d.tags.some(t => t.toLowerCase().includes(search)) ||
                (d.description && d.description.toLowerCase().includes(search))
            );
        }

        // Filter by status
        if (statusFilter !== 'all') {
            docs = docs.filter(d => d.status === statusFilter);
        }

        // Sort
        if (sort === 'newest') docs.sort((a, b) => b.uploaded.localeCompare(a.uploaded));
        if (sort === 'oldest') docs.sort((a, b) => a.uploaded.localeCompare(b.uploaded));
        if (sort === 'name') docs.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'size') docs.sort((a, b) => b.size - a.size);

        // Paginate
        const start = (kbState.currentPage - 1) * kbState.pageSize;
        const pageDocs = docs.slice(start, start + kbState.pageSize);
        const totalPages = Math.ceil(docs.length / kbState.pageSize);

        document.getElementById('kbPagInfo').textContent = `Showing ${start + 1}-${Math.min(start + kbState.pageSize, docs.length)} of ${docs.length} documents`;

        list.innerHTML = pageDocs.map(doc => {
            const cat = kbCategoryMeta[doc.category];
            const agentBadges = doc.agents.map(a => {
                const meta = kbAgentMeta[a];
                return `<span class="px-1.5 py-0.5 bg-${meta.color}-50 text-${meta.color}-700 rounded text-[10px] font-medium"><i class="fas ${meta.icon} mr-0.5"></i>${meta.label}</span>`;
            }).join(' ');

            const tagBadges = doc.tags.slice(0, 3).map(t =>
                `<span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">${t}</span>`
            ).join(' ') + (doc.tags.length > 3 ? `<span class="text-[10px] text-gray-400">+${doc.tags.length - 3}</span>` : '');

            return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-5 py-3">
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas ${getFileIcon(doc.type)}"></i>
                            </div>
                            <div class="min-w-0">
                                <div class="font-medium text-gray-900 text-sm truncate max-w-[240px]" title="${doc.name}">${doc.name}</div>
                                <div class="text-[11px] text-gray-400">${formatFileSize(doc.size)}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-5 py-3 hidden md:table-cell">
                        <span class="px-2 py-0.5 bg-${cat.color}-50 text-${cat.color}-700 rounded-full text-[11px] font-medium">
                            <i class="fas ${cat.icon} mr-1"></i>${cat.label}
                        </span>
                    </td>
                    <td class="px-5 py-3 hidden md:table-cell">
                        <div class="flex flex-wrap gap-1">${tagBadges}</div>
                    </td>
                    <td class="px-5 py-3 hidden lg:table-cell">
                        <div class="flex flex-wrap gap-1">${agentBadges}</div>
                    </td>
                    <td class="px-5 py-3">${getStatusBadge(doc.status)}</td>
                    <td class="px-5 py-3 hidden lg:table-cell">
                        <span class="text-xs text-gray-500">${doc.uploaded}</span>
                    </td>
                    <td class="px-5 py-3 text-right">
                        <div class="flex items-center justify-end gap-1">
                            <button onclick="Nestopia.modules.knowledgeBase.viewKBDoc('${doc.id}')" class="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center transition" title="View">
                                <i class="fas fa-eye text-gray-400 text-xs"></i>
                            </button>
                            <button onclick="Nestopia.modules.knowledgeBase.deleteKBDoc('${doc.id}')" class="w-7 h-7 rounded-md hover:bg-red-50 flex items-center justify-center transition" title="Delete">
                                <i class="fas fa-trash text-gray-400 text-xs hover:text-red-500"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function filterKBDocuments() {
        kbState.currentPage = 1;
        renderKBDocuments();
    }

    function kbPrevPage() {
        if (kbState.currentPage > 1) { kbState.currentPage--; renderKBDocuments(); }
    }
    function kbNextPage() {
        kbState.currentPage++;
        renderKBDocuments();
    }

    // Category filter click
    document.querySelectorAll('.kb-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.kb-cat-btn').forEach(b => {
                b.classList.remove('active', 'bg-gray-900', 'text-white');
                b.classList.add('bg-white', 'border', 'border-gray-200', 'text-gray-600');
            });
            btn.classList.add('active', 'bg-gray-900', 'text-white');
            btn.classList.remove('bg-white', 'border', 'border-gray-200', 'text-gray-600');
            kbState.currentCategory = btn.dataset.cat;
            filterKBDocuments();
        });
    });

    // Upload Modal
    function openKBUploadModal() {
        document.getElementById('kbUploadModal').classList.remove('hidden');
        kbState.uploadTags = [];
        kbState.selectedFiles = [];
        document.getElementById('kbTagsContainer').innerHTML = '';
        document.getElementById('kbFilePreview').classList.add('hidden');
        document.getElementById('kbFileList').innerHTML = '';
        document.getElementById('kbUploadCategory').value = '';
        document.getElementById('kbUploadDesc').value = '';
        document.querySelectorAll('.kb-agent-check').forEach(c => c.checked = false);
    }

    function closeKBUploadModal() {
        document.getElementById('kbUploadModal').classList.add('hidden');
    }

    function handleKBFileSelect(event) {
        const files = Array.from(event.target.files);
        kbState.selectedFiles = files;
        const preview = document.getElementById('kbFilePreview');
        const list = document.getElementById('kbFileList');

        if (files.length > 0) {
            preview.classList.remove('hidden');
            list.innerHTML = files.map((f, i) => `
                <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <i class="fas fa-file text-gray-400 text-sm"></i>
                        <span class="text-sm text-gray-700 truncate">${f.name}</span>
                        <span class="text-xs text-gray-400">${formatFileSize(f.size)}</span>
                    </div>
                    <button onclick="Nestopia.modules.knowledgeBase.removeKBFile(${i})" class="text-gray-400 hover:text-red-500 transition"><i class="fas fa-times text-xs"></i></button>
                </div>
            `).join('');
        } else {
            preview.classList.add('hidden');
        }
    }

    function removeKBFile(index) {
        kbState.selectedFiles.splice(index, 1);
        const list = document.getElementById('kbFileList');
        list.innerHTML = kbState.selectedFiles.map((f, i) => `
            <div class="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div class="flex items-center gap-2 min-w-0">
                    <i class="fas fa-file text-gray-400 text-sm"></i>
                    <span class="text-sm text-gray-700 truncate">${f.name}</span>
                    <span class="text-xs text-gray-400">${formatFileSize(f.size)}</span>
                </div>
                <button onclick="Nestopia.modules.knowledgeBase.removeKBFile(${i})" class="text-gray-400 hover:text-red-500 transition"><i class="fas fa-times text-xs"></i></button>
            </div>
        `).join('');
        if (kbState.selectedFiles.length === 0) {
            document.getElementById('kbFilePreview').classList.add('hidden');
        }
    }

    // Tag functions
    function addKBTag() {
        const input = document.getElementById('kbTagInput');
        const tag = input.value.trim().toLowerCase();
        if (tag && !kbState.uploadTags.includes(tag)) {
            kbState.uploadTags.push(tag);
            renderKBTags();
        }
        input.value = '';
    }

    function addKBSuggestedTag(tag) {
        if (!kbState.uploadTags.includes(tag)) {
            kbState.uploadTags.push(tag);
            renderKBTags();
        }
    }

    function removeKBTag(tag) {
        kbState.uploadTags = kbState.uploadTags.filter(t => t !== tag);
        renderKBTags();
    }

    function renderKBTags() {
        const container = document.getElementById('kbTagsContainer');
        container.innerHTML = kbState.uploadTags.map(tag =>
            `<span class="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                ${tag}
                <button onclick="Nestopia.modules.knowledgeBase.removeKBTag('${tag}')" class="text-gray-400 hover:text-red-500"><i class="fas fa-times text-[10px]"></i></button>
            </span>`
        ).join('');
    }

    function submitKBUpload() {
        const category = document.getElementById('kbUploadCategory').value;
        if (!category) { showToast('Please select a category', 'error'); return; }
        if (kbState.selectedFiles.length === 0) { showToast('Please select files to upload', 'error'); return; }

        const agents = Array.from(document.querySelectorAll('.kb-agent-check:checked')).map(c => c.value);
        const desc = document.getElementById('kbUploadDesc').value;
        const tags = [...kbState.uploadTags];
        const files = [...kbState.selectedFiles];

        showToast('Uploading ' + files.length + ' file(s)...', 'success');
        closeKBUploadModal();

        // 如果 Supabase 已连接，上传到云端
        if (typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            var uploadPromises = files.map(function(f) {
                return NestopiaStorage.uploadTenantFile(f, {
                    category: category,
                    description: desc,
                    tags: tags,
                    aiAgents: agents,
                    productLine: 'general'
                });
            });
            Promise.all(uploadPromises).then(function(results) {
                var successCount = results.filter(function(r){ return r !== null; }).length;
                showToast(successCount + ' file(s) uploaded to cloud successfully!', 'success');
                // 重新加载 KB 数据
                initKnowledgeBase();
            }).catch(function(err) {
                showToast('Upload error: ' + err.message, 'error');
                console.error('[KB] Upload failed:', err);
            });
        } else {
            // 回退到内存模式
            files.forEach(function(f) {
                var ext = f.name.split('.').pop().toLowerCase();
                var type = 'pdf';
                if (['doc', 'docx', 'pptx'].indexOf(ext) >= 0) type = 'doc';
                if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) type = 'xls';
                if (['jpg', 'jpeg', 'png', 'webp'].indexOf(ext) >= 0) type = 'img';
                if (['mp4', 'mov'].indexOf(ext) >= 0) type = 'video';
                kbState.documents.unshift({
                    id: 'kb-new-' + Date.now() + Math.random().toString(36).substr(2, 5),
                    name: f.name, category: category, size: f.size, type: type,
                    status: 'processing', agents: agents, tags: tags,
                    uploaded: new Date().toISOString().split('T')[0], description: desc
                });
            });
            renderKBDocuments();
        }
    }

    function viewKBDoc(id) {
        const doc = kbState.documents.find(d => d.id === id);
        if (!doc) return;
        // 如果有 file_url 且是 Supabase 文件，获取签名 URL 并打开
        if (doc.storage_path && typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            var bucket = NestopiaDB.getBucket('tenantFiles');
            NestopiaStorage.storage.getFileUrl(bucket, doc.storage_path, true).then(function(url) {
                if (url) { window.open(url, '_blank'); }
                else { showToast('Could not generate file URL', 'error'); }
            }).catch(function(err) {
                showToast('Error: ' + err.message, 'error');
            });
        } else if (doc.file_url) {
            window.open(doc.file_url, '_blank');
        } else {
            var cat = kbCategoryMeta[doc.category] || { label: doc.category };
            var agentLabels = (doc.agents || []).map(function(a){ return (kbAgentMeta[a] || {}).label || a; }).join(', ');
            alert('Document: ' + doc.name + '\n\nCategory: ' + cat.label + '\nSize: ' + formatFileSize(doc.size) + '\nStatus: ' + doc.status + '\nTags: ' + (doc.tags || []).join(', ') + '\nAgents: ' + agentLabels + '\n\nDescription: ' + (doc.description || 'No description'));
        }
    }

    function deleteKBDoc(id) {
        if (!confirm('Are you sure you want to remove this document from the Knowledge Base?')) return;
        var doc = kbState.documents.find(function(d){ return d.id === id; });
        // 从 UI 列表中移除
        kbState.documents = kbState.documents.filter(function(d){ return d.id !== id; });
        renderKBDocuments();
        // 如果是 Supabase 文档，执行云端软删除
        if (doc && doc.storage_path && typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            NestopiaStorage.documents.softDelete(id).then(function(ok) {
                showToast(ok ? 'Document removed from Knowledge Base' : 'Removed locally (cloud sync pending)', ok ? 'success' : 'warning');
            }).catch(function(err) {
                showToast('Removed locally. Cloud error: ' + err.message, 'warning');
            });
        } else {
            showToast('Document removed from Knowledge Base', 'success');
        }
    }

    function initKnowledgeBase() {
        // 尝试从 Supabase 加载租户级 KB 文档
        if (typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            NestopiaStorage.documents.getTenantFiles().then(function(rows) {
                if (rows && rows.length > 0) {
                    kbState.documents = rows.map(function(row) {
                        // 映射 DB 字段到 UI 字段
                        var ext = (row.file_type || '').toLowerCase();
                        var type = 'pdf';
                        if (['doc','docx','pptx'].indexOf(ext) >= 0) type = 'doc';
                        if (['xls','xlsx','csv'].indexOf(ext) >= 0) type = 'xls';
                        if (['jpg','jpeg','png','webp','gif'].indexOf(ext) >= 0) type = 'img';
                        if (['mp4','mov'].indexOf(ext) >= 0) type = 'video';
                        return {
                            id: row.id,
                            name: row.name,
                            category: row.category || 'installation',
                            size: row.file_size_bytes || 0,
                            type: type,
                            status: row.status === 'uploaded' ? 'indexed' : (row.status || 'processing'),
                            agents: row.ai_agents || [],
                            tags: row.tags || [],
                            uploaded: (row.created_at || '').substring(0, 10),
                            description: row.description || '',
                            file_url: row.file_url,
                            storage_path: row.storage_path
                        };
                    });
                    // 更新统计
                    var total = kbState.documents.length;
                    var indexed = kbState.documents.filter(function(d){ return d.status === 'indexed'; }).length;
                    var processing = kbState.documents.filter(function(d){ return d.status === 'processing'; }).length;
                    var cats = new Set(kbState.documents.map(function(d){ return d.category; }));
                    var el;
                    el = document.getElementById('kbTotalDocs'); if (el) el.textContent = total;
                    el = document.getElementById('kbProcessed'); if (el) el.textContent = indexed;
                    el = document.getElementById('kbPending'); if (el) el.textContent = processing;
                    el = document.getElementById('kbCategories'); if (el) el.textContent = cats.size;
                    console.log('[KB] Loaded ' + total + ' documents from Supabase');
                } else {
                    console.log('[KB] No Supabase docs, using demo data');
                    kbState.documents = [...kbDummyDocuments];
                }
                renderKBDocuments();
            }).catch(function(err) {
                console.warn('[KB] Supabase load failed, using demo data:', err.message);
                kbState.documents = [...kbDummyDocuments];
                renderKBDocuments();
            });
        } else {
            console.log('[KB] Supabase not connected, using demo data');
            kbState.documents = [...kbDummyDocuments];
            renderKBDocuments();
        }
    }

    // ===== 模块注册 =====
    N.modules.knowledgeBase = {
        kbState: kbState,
        kbCategoryMeta: kbCategoryMeta,
        kbAgentMeta: kbAgentMeta,
        kbDummyDocuments: kbDummyDocuments,
        getFileIcon: getFileIcon,
        formatFileSize: formatFileSize,
        getStatusBadge: getStatusBadge,
        initKnowledgeBase: initKnowledgeBase,
        renderKBDocuments: renderKBDocuments,
        filterKBDocuments: filterKBDocuments,
        kbPrevPage: kbPrevPage,
        kbNextPage: kbNextPage,
        openKBUploadModal: openKBUploadModal,
        closeKBUploadModal: closeKBUploadModal,
        handleKBFileSelect: handleKBFileSelect,
        removeKBFile: removeKBFile,
        addKBTag: addKBTag,
        addKBSuggestedTag: addKBSuggestedTag,
        removeKBTag: removeKBTag,
        renderKBTags: renderKBTags,
        submitKBUpload: submitKBUpload,
        viewKBDoc: viewKBDoc,
        deleteKBDoc: deleteKBDoc
    };

    // ===== 全局别名（供 HTML onclick 等调用） =====
    window.kbState = kbState;
    window.kbCategoryMeta = kbCategoryMeta;
    window.kbDummyDocuments = kbDummyDocuments;
    window.kbAgentMeta = kbAgentMeta;
    window.initKnowledgeBase = initKnowledgeBase;
    window.renderKBDocuments = renderKBDocuments;
    window.filterKBDocuments = filterKBDocuments;
    window.kbPrevPage = kbPrevPage;
    window.kbNextPage = kbNextPage;
    window.openKBUploadModal = openKBUploadModal;
    window.closeKBUploadModal = closeKBUploadModal;
    window.handleKBFileSelect = handleKBFileSelect;
    window.removeKBFile = removeKBFile;
    window.addKBTag = addKBTag;
    window.addKBSuggestedTag = addKBSuggestedTag;
    window.removeKBTag = removeKBTag;
    window.renderKBTags = renderKBTags;
    window.submitKBUpload = submitKBUpload;
    window.viewKBDoc = viewKBDoc;
    window.deleteKBDoc = deleteKBDoc;
    window.getFileIcon = getFileIcon;
    window.formatFileSize = formatFileSize;
    window.getStatusBadge = getStatusBadge;
    window.filterKBByCategory = filterKBDocuments;
    window.searchKBDocuments = filterKBDocuments;
    window.loadKBDocumentsFromSupabase = initKnowledgeBase;

})();
