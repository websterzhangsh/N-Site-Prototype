/**
 * Nestopia - Compliance Manager
 * 命名空间: Nestopia.agents.compliance
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.agents = N.agents || {};

    // ===== Compliance Manager Page Functions =====
    const complianceState = {
        selectedProject: 'proj-001',
        structureSize: 'medium',
        height: 12,
        setbacks: { front: 25, back: 15, left: 8, right: 10 },
        foundation: 'concrete',
        utilities: { electrical: true, plumbing: false, hvac: false },
        special: { historic: false, flood: false, seismic: false }
    };

    // Compliance rules database (dummy)
    const complianceRules = {
        'proj-001': {
            jurisdiction: 'Montgomery County, MD',
            hoa: 'Silver Spring Civic HOA',
            hoaEmail: 'arc@silverspringcivic.org',
            setbacks: { front: 25, side: 7.5, rear: 20 },
            heightLimit: 35,
            seismicZone: false,
            floodZone: false,
            historicDistrict: false
        },
        'proj-002': {
            jurisdiction: 'Santa Clara County',
            hoa: 'Riverside Community HOA',
            hoaEmail: 'arch@riversidehoa.org',
            setbacks: { front: 25, side: 8, rear: 15 },
            heightLimit: 16,
            seismicZone: true,
            floodZone: false,
            historicDistrict: false
        },
        'proj-003': {
            jurisdiction: 'San Diego County',
            hoa: null,
            hoaEmail: null,
            setbacks: { front: 20, side: 5, rear: 10 },
            heightLimit: 14,
            seismicZone: true,
            floodZone: false,
            historicDistrict: false
        },
        'proj-004': {
            jurisdiction: 'Sacramento County',
            hoa: 'Lakeside Property Association',
            hoaEmail: 'hoa@lakesideassoc.org',
            setbacks: { front: 25, side: 6, rear: 12 },
            heightLimit: 15,
            seismicZone: false,
            floodZone: true,
            historicDistrict: false
        }
    };

    // Initialize Compliance Manager page
    function initCompliancePage() {
        // Project selector
        const projectSelect = document.getElementById('complianceProjectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', function() {
                complianceState.selectedProject = this.value;
                updateComplianceProjectInfo(this.value);
            });
        }

        // Structure size
        const sizeSelect = document.getElementById('structureSize');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', function() {
                complianceState.structureSize = this.value;
            });
        }

        // Height input
        const heightInput = document.getElementById('structureHeight');
        if (heightInput) {
            heightInput.addEventListener('input', function() {
                complianceState.height = parseFloat(this.value) || 0;
            });
        }

        // Setback inputs
        ['setbackFront', 'setbackBack', 'setbackLeft', 'setbackRight'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', function() {
                    const key = id.replace('setback', '').toLowerCase();
                    complianceState.setbacks[key] = parseFloat(this.value) || 0;
                });
            }
        });

        // Foundation selection
        document.querySelectorAll('.foundation-card').forEach(card => {
            card.addEventListener('click', function() {
                document.querySelectorAll('.foundation-card > div').forEach(c => {
                    c.classList.remove('border-indigo-500', 'bg-indigo-50');
                    c.classList.add('border-gray-200');
                });
                this.querySelector('div').classList.remove('border-gray-200');
                this.querySelector('div').classList.add('border-indigo-500', 'bg-indigo-50');
                complianceState.foundation = this.dataset.foundation;
            });
        });

        // Utility checkboxes
        ['utilElectrical', 'utilPlumbing', 'utilHVAC'].forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', function() {
                    const key = id.replace('util', '').toLowerCase();
                    complianceState.utilities[key] = this.checked;
                });
            }
        });

        // Special consideration checkboxes
        ['specialHistoric', 'specialFlood', 'specialSeismic'].forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', function() {
                    const key = id.replace('special', '').toLowerCase();
                    complianceState.special[key] = this.checked;
                });
            }
        });

        // Check compliance button
        const checkBtn = document.getElementById('checkComplianceBtn');
        if (checkBtn) {
            checkBtn.addEventListener('click', handleCheckCompliance);
        }

        // Start permit process button
        const permitBtn = document.getElementById('startPermitProcessBtn');
        if (permitBtn) {
            permitBtn.addEventListener('click', () => {
                showToast('Permit process initiation will be implemented. This will start the permit application workflow.', 'info');
            });
        }
    }

    function updateComplianceProjectInfo(projectId) {
        const project = dummyProjects[projectId];
        const rules = complianceRules[projectId];
        if (!project || !rules) return;

        const infoContainer = document.getElementById('complianceProjectInfo');
        if (infoContainer) {
            const hoaText = rules.hoa ? rules.hoa : 'None';
            const hoaClass = rules.hoa ? 'text-amber-600' : 'text-gray-900';

            infoContainer.innerHTML = `
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span class="text-gray-500">Address:</span>
                        <span class="font-medium text-gray-900 ml-2">${project.address.split(',')[0]}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Product:</span>
                        <span class="font-medium text-gray-900 ml-2">${project.type.charAt(0).toUpperCase() + project.type.slice(1)}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Jurisdiction:</span>
                        <span class="font-medium text-gray-900 ml-2">${rules.jurisdiction}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">HOA:</span>
                        <span class="font-medium ${hoaClass} ml-2">${hoaText}</span>
                    </div>
                </div>
            `;
        }
    }

    function handleCheckCompliance() {
        const btn = document.getElementById('checkComplianceBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Checking...';

        // Simulate compliance check
        setTimeout(() => {
            const rules = complianceRules[complianceState.selectedProject];
            let passed = 0;
            let warnings = 0;
            let failed = 0;
            const issues = [];

            // Check setbacks
            if (complianceState.setbacks.front >= rules.setbacks.front) {
                passed++;
            } else {
                failed++;
                issues.push(`Front setback must be at least ${rules.setbacks.front}'`);
            }

            if (complianceState.setbacks.back >= rules.setbacks.rear) {
                passed++;
            } else {
                failed++;
                issues.push(`Rear setback must be at least ${rules.setbacks.rear}'`);
            }

            if (complianceState.setbacks.left >= rules.setbacks.side && complianceState.setbacks.right >= rules.setbacks.side) {
                passed++;
            } else {
                failed++;
                issues.push(`Side setbacks must be at least ${rules.setbacks.side}'`);
            }

            // Check height
            if (complianceState.height <= rules.heightLimit) {
                passed++;
            } else {
                failed++;
                issues.push(`Height exceeds ${rules.heightLimit}' limit`);
            }

            // Check utilities
            if (complianceState.utilities.electrical) {
                warnings++; // Electrical permit required
            }

            // Check special considerations
            if (rules.hoa) {
                warnings++; // HOA approval needed
            }

            if (rules.seismicZone && complianceState.special.seismic) {
                passed++; // Seismic compliance acknowledged
            }

            // Calculate overall compliance
            const total = passed + warnings + failed;
            const compliancePercent = Math.round((passed / (total || 1)) * 100);

            // Update badge
            const badge = document.getElementById('complianceBadge');
            if (badge) {
                if (failed > 0) {
                    badge.className = 'px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full';
                    badge.innerHTML = '<i class="fas fa-times-circle mr-1"></i>Issues Found';
                } else if (warnings > 0) {
                    badge.className = 'px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full';
                    badge.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i>Review Needed';
                } else {
                    badge.className = 'px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full';
                    badge.innerHTML = '<i class="fas fa-check-circle mr-1"></i>Compliant';
                }
            }

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-shield-check mr-2"></i>Check Compliance';

            if (issues.length > 0) {
                showToast('Compliance issues found: ' + issues[0], 'error');
            } else {
                showToast('Compliance check completed!', 'success');
            }
        }, 2000);
    }

    // 命名空间导出
    N.agents.compliance = {
        complianceState: complianceState,
        complianceRules: complianceRules,
        initCompliancePage: initCompliancePage,
        updateComplianceProjectInfo: updateComplianceProjectInfo,
        handleCheckCompliance: handleCheckCompliance
    };

    // 全局别名（保持向后兼容）
    window.complianceState = complianceState;
    window.complianceRules = complianceRules;
    window.initCompliancePage = initCompliancePage;
    window.updateComplianceProjectInfo = updateComplianceProjectInfo;
    window.handleCheckCompliance = handleCheckCompliance;
})();
