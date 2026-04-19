/**
 * Nestopia - Step 4: Quotation & Pricing
 * 命名空间: Nestopia.steps.step4
 *
 * 从 company-operations.html 提取的 Step 4 报价与定价面板功能。
 * 包含：状态管理、Supabase 持久化、定价计算、面板 UI 刷新。
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.steps = N.steps || {};

    // ===== Step 4: Quotation & Pricing Panel Functions =====
    var step4QuotationState = {};
    var _step4DbLoaded = {};  // 标记已从 DB 加载的项目
    var _quotDbLoaded = {};   // 报价列表已从 DB 加载的项目

    // ── Supabase Quotation 持久化 ──────────────────────────
    function loadStep4FromDB(projectId) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
        return NestopiaDB.getClient()
            .from('project_quotations')
            .select('quotation_data')
            .eq('tenant_id', NestopiaDB.getTenantId())
            .eq('project_key', projectId)
            .maybeSingle()
            .then(function(res) {
                if (res.error) { console.warn('[Quotation] DB load error:', res.error.message); return null; }
                return (res.data && res.data.quotation_data) ? res.data.quotation_data : null;
            })
            .catch(function(err) { console.warn('[Quotation] DB load failed:', err.message); return null; });
    }

    function saveStep4ToDBAuto(projectId, stateObj) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
        var payload = {
            tenant_id: NestopiaDB.getTenantId(),
            project_key: projectId,
            quotation_data: JSON.parse(JSON.stringify({
                step4State: {
                    pricingMode: stateObj.pricingMode,
                    productTier: stateObj.productTier,
                    selectedQuote: stateObj.selectedQuote,
                    discount: stateObj.discount,
                    quantity: stateObj.quantity,
                    widthM: stateObj.widthM,
                    heightM: stateObj.heightM,
                    unitArea: stateObj.unitArea,
                    fabric: stateObj.fabric,
                    driveSystem: stateObj.driveSystem,
                    lengthFt: stateObj.lengthFt,
                    widthFt: stateObj.widthFt,
                    areaSqft: stateObj.areaSqft,
                    glassType: stateObj.glassType,
                    louverType: stateObj.louverType
                }
            })),
            updated_at: new Date().toISOString()
        };
        return NestopiaDB.getClient()
            .from('project_quotations')
            .upsert(payload, { onConflict: 'tenant_id,project_key' })
            .then(function(res) {
                if (res.error) { console.warn('[Quotation] DB save error:', res.error.message); return false; }
                console.log('[Quotation] Step4 state saved to Supabase:', projectId);
                return true;
            })
            .catch(function(err) { console.warn('[Quotation] DB save failed:', err.message); return false; });
    }

    function saveQuotListToDB(projectId, quotList) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
        // 读取现有记录并合并 savedQuotations 字段
        return loadStep4FromDB(projectId).then(function(existing) {
            var data = (existing && typeof existing === 'object') ? existing : {};
            data.savedQuotations = quotList;
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                quotation_data: JSON.parse(JSON.stringify(data)),
                updated_at: new Date().toISOString()
            };
            return NestopiaDB.getClient()
                .from('project_quotations')
                .upsert(payload, { onConflict: 'tenant_id,project_key' })
                .then(function(res) {
                    if (res.error) { console.warn('[Quotation] DB save list error:', res.error.message); return false; }
                    console.log('[Quotation] Quotation list saved to Supabase:', projectId);
                    return true;
                });
        }).catch(function(err) { console.warn('[Quotation] DB save list failed:', err.message); return false; });
    }

    function getStep4State(projectId) {
        if (!step4QuotationState[projectId]) {
            var project = allProjectsData.find(p => p.id === projectId);
            // Read from Step 3 live state first, fallback to hardcoded seed data
            var step3St = (typeof step3MeasurementState !== 'undefined' && step3MeasurementState[projectId]) ? step3MeasurementState[projectId] : null;
            var mData = (step3St && step3St.measurementData) ? step3St.measurementData : (project && project.measurement ? project.measurement : {});
            var isZB = project && project.type === 'Zip Blinds';
            var isSR = project && project.type === 'Sunroom';

            var state = {
                pricingMode: 'retail',
                productTier: isZB ? 'better' : (isSR ? 'premium' : 'modern'),
                selectedQuote: 'recommended',
                discount: 5
            };

            if (isZB) {
                // Auto-populate from Step 3 per-opening measurement data
                state.quantity = Number(mData.openings) || 1;
                state.openings = [];
                for (var oi = 1; oi <= state.quantity; oi++) {
                    var oW = Number(mData['opening_' + oi + '_width_in']) || Number(mData.opening_width_in) || 72;
                    var oH = Number(mData['opening_' + oi + '_height_in']) || Number(mData.opening_height_in) || 96;
                    var oFab = mData['opening_' + oi + '_fabric'] || mData.fabric || 'np4000';
                    var oMot = mData['opening_' + oi + '_motor'] || mData.motor || 'electric-std';
                    var oMnt = mData['opening_' + oi + '_mounting'] || mData.mounting || '';
                    state.openings.push({
                        widthIn: oW, heightIn: oH,
                        widthM: oW * 0.0254, heightM: oH * 0.0254,
                        area: (oW * 0.0254) * (oH * 0.0254),
                        fabric: oFab, motor: oMot, mounting: oMnt
                    });
                }
                // Backward compat — widthM/heightM/unitArea from opening 1
                var first = state.openings[0];
                state.widthM = first.widthM;
                state.heightM = first.heightM;
                state.unitArea = first.area;
                state.totalArea = state.openings.reduce(function(s, o) { return s + o.area; }, 0);
                state.fabric = first.fabric;
                state.driveSystem = first.motor === 'motorized_solar' ? 'solar-kit' : first.motor === 'motorized_wired' ? 'electric-std' : first.motor === 'manual_crank' ? 'bead-chain' : 'electric-std';
            } else {
                // Sunroom / Pergola — from Step 3 dims
                var dims = mData.dims || '';
                var parts = dims.replace(/'/g, '').split(/\s*x\s*/i);
                var lenFt = parts.length >= 1 ? parseFloat(parts[0]) || 20 : 20;
                var widFt = parts.length >= 2 ? parseFloat(parts[1]) || 16 : 16;
                state.lengthFt = lenFt;
                state.widthFt = widFt;
                state.areaSqft = Math.round(lenFt * widFt);
                state.glassType = 'standard';
                state.louverType = 'fixed';
                state.quantity = 1;
            }

            // Calculate initial pricing
            state.costSummary = calcStep4Cost(project, state);
            step4QuotationState[projectId] = state;
        }
        return step4QuotationState[projectId];
    }

    function calcStep4Cost(project, state) {
        var isZB = project && project.type === 'Zip Blinds';
        var isSR = project && project.type === 'Sunroom';
        var mode = state.pricingMode;
        var cs = {};

        if (isZB) {
            var tierData = zbProductTiers[state.productTier];
            cs.tierName = tierData ? tierData.name : state.productTier;
            var driveData = zbDriveSystems[state.driveSystem];
            cs.driveName = driveData ? driveData.name : state.driveSystem;
            // Per-opening cost aggregation
            var openings = state.openings || [{ area: state.unitArea, heightM: state.heightM }];
            var numO = openings.length || state.quantity || 1;
            cs.fabricCost = 0; cs.driveCost = 0; cs.fabricUpgrade = 0;
            cs.heightSurcharge = 0; cs.minChargeCost = 0;
            for (var oi = 0; oi < numO; oi++) {
                var op = openings[oi] || openings[0];
                var rawArea = op.area;
                var effArea = rawArea < 1 && rawArea > 0 ? 1 : rawArea;
                var tierRow = tierData ? tierData.tiers.find(function(t) { return effArea <= t.maxArea; }) || tierData.tiers[tierData.tiers.length - 1] : { retail: 52, wholesale: 43 };
                var rate = tierRow[mode] || tierRow.retail;
                cs.fabricCost += Math.round(rate * effArea);
                cs.driveCost += Math.round(driveData ? (driveData[mode] || driveData.retail) : 68);
                var fabUpg = zbFabricUpgrades[state.fabric];
                cs.fabricUpgrade += Math.round((fabUpg ? fabUpg.surcharge : 0) * effArea);
                var hSur = getHeightSurcharge(op.heightM);
                cs.heightSurcharge += Math.round((hSur ? hSur.surcharge : 0) * effArea);
                var minAdj = (rawArea < 1 && rawArea > 0) ? (1 - rawArea) : 0;
                var fTier = tierData ? tierData.tiers[0] : { retail: 52, wholesale: 43 };
                cs.minChargeCost += minAdj > 0 ? Math.round(minAdj * (fTier[mode] || fTier.retail)) : 0;
            }
            cs.installCost = Math.round(45 * numO);
            cs.hardwareCost = Math.round(zbHardwareCostPerUnit * numO);
            var subtotal = cs.fabricCost + cs.driveCost + cs.fabricUpgrade + cs.heightSurcharge + cs.minChargeCost + cs.installCost + cs.hardwareCost;
            cs.discountAmt = Math.round(subtotal * (state.discount / 100));
            cs.totalCost = subtotal - cs.discountAmt;
        } else {
            var area = state.areaSqft || 320;
            var prices = isSR
                ? { standard: 85, premium: 120, luxury: 165 }
                : { classic: 45, modern: 62, premium: 85 };
            var baseRate = prices[state.productTier] || (isSR ? 120 : 62);
            cs.tierName = state.productTier.charAt(0).toUpperCase() + state.productTier.slice(1);
            cs.materialCost = Math.round(baseRate * area);
            var upgRates = isSR
                ? { standard: 0, lowE: 12, triplePane: 28 }
                : { fixed: 0, adjustable: 18, motorized: 35 };
            var upgKey = isSR ? (state.glassType || 'standard') : (state.louverType || 'fixed');
            cs.upgradeCost = Math.round((upgRates[upgKey] || 0) * area);
            cs.laborCost = Math.round((isSR ? 25 : 15) * area);
            cs.equipmentCost = Math.round((isSR ? 8 : 5) * area);
            cs.permitCost = isSR ? 850 : 450;
            cs.totalCost = cs.materialCost + cs.upgradeCost + cs.laborCost + cs.equipmentCost + cs.permitCost;
            cs.fabricCost = 0; cs.driveCost = 0; cs.fabricUpgrade = 0; cs.heightSurcharge = 0; cs.installCost = 0; cs.hardwareCost = 0; cs.discountAmt = 0; cs.driveName = '';
        }

        // Quote options (margins synced with Pricing Agent)
        cs.quoteConservative = Math.round(cs.totalCost * 1.10).toLocaleString();
        cs.quoteRecommended = Math.round(cs.totalCost * 1.18).toLocaleString();
        cs.quotePremium = Math.round(cs.totalCost * 1.35).toLocaleString();

        // Selected quote profit
        var margins = { conservative: 0.10, recommended: 0.18, premium: 0.35 };
        var m = margins[state.selectedQuote] || 0.18;
        cs.profit = Math.round(cs.totalCost * m).toLocaleString();
        cs.marginPct = Math.round(m * 100);

        return cs;
    }

    function toggleStep4Panel(projectId) {
        var panel = document.getElementById('step4QuotationPanel_' + projectId);
        var btn = document.getElementById('step4LaunchBtn_' + projectId);
        if (!panel) return;
        if (panel.classList.contains('hidden')) {
            // Warn if project is at Step 5 or 6 — contract re-generation risk
            var project = allProjectsData.find(function(p) { return p.id === projectId; });
            if (project && project.workflowStep >= 5) {
                var stepNames = { 5: 'Production', 6: 'Installation' };
                if (!confirm('⚠️ This project is currently at Step ' + project.workflowStep + ' (' + (stepNames[project.workflowStep] || '') + ').\n\nRe-opening the Quotation panel at this stage may trigger Contract Re-generation, which could affect production schedules, material orders, and existing agreements.\n\nAre you sure you want to proceed?')) {
                    return;
                }
            }
            // 打开前先从 Supabase 加载最新 Step4 状态（仅首次）
            if (!_step4DbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                _step4DbLoaded[projectId] = true;
                loadStep4FromDB(projectId).then(function(dbData) {
                    if (dbData && dbData.step4State && typeof dbData.step4State === 'object') {
                        var state = getStep4State(projectId);
                        var s4 = dbData.step4State;
                        // 合并 DB 数据到内存（DB 优先）
                        if (s4.pricingMode) state.pricingMode = s4.pricingMode;
                        if (s4.productTier) state.productTier = s4.productTier;
                        if (s4.selectedQuote) state.selectedQuote = s4.selectedQuote;
                        if (s4.discount !== undefined) state.discount = s4.discount;
                        if (s4.quantity !== undefined) state.quantity = s4.quantity;
                        if (s4.widthM !== undefined) state.widthM = s4.widthM;
                        if (s4.heightM !== undefined) state.heightM = s4.heightM;
                        if (s4.unitArea !== undefined) state.unitArea = s4.unitArea;
                        if (s4.fabric) state.fabric = s4.fabric;
                        if (s4.driveSystem) state.driveSystem = s4.driveSystem;
                        if (s4.lengthFt !== undefined) state.lengthFt = s4.lengthFt;
                        if (s4.widthFt !== undefined) state.widthFt = s4.widthFt;
                        if (s4.areaSqft !== undefined) state.areaSqft = s4.areaSqft;
                        if (s4.glassType) state.glassType = s4.glassType;
                        if (s4.louverType) state.louverType = s4.louverType;
                        // 重新计算定价
                        var proj = allProjectsData.find(function(p) { return p.id === projectId; });
                        state.costSummary = calcStep4Cost(proj, state);
                        console.log('[Quotation] Step4 state loaded from Supabase for', projectId);
                        refreshStep4Panel(projectId);
                    }
                });
            }
            panel.classList.remove('hidden');
            if (btn) { btn.innerHTML = '<i class="fas fa-times text-[10px]"></i> Close Panel'; btn.classList.replace('bg-orange-600', 'bg-gray-600'); btn.classList.replace('hover:bg-orange-700', 'hover:bg-gray-700'); }
        } else {
            panel.classList.add('hidden');
            if (btn) { btn.innerHTML = '<i class="fas fa-calculator text-[10px]"></i> Open Quotation'; btn.classList.replace('bg-gray-600', 'bg-orange-600'); btn.classList.replace('hover:bg-gray-700', 'hover:bg-orange-700'); }
        }
    }

    function toggleStep4Mode(projectId) {
        var state = getStep4State(projectId);
        state.pricingMode = state.pricingMode === 'retail' ? 'wholesale' : 'retail';
        state.costSummary = calcStep4Cost(allProjectsData.find(p => p.id === projectId), state);
        refreshStep4Panel(projectId);
    }

    function selectStep4Tier(projectId, tier) {
        var state = getStep4State(projectId);
        state.productTier = tier;
        state.costSummary = calcStep4Cost(allProjectsData.find(p => p.id === projectId), state);
        refreshStep4Panel(projectId);
    }

    function selectStep4Quote(projectId, level) {
        var state = getStep4State(projectId);
        state.selectedQuote = level;
        state.costSummary = calcStep4Cost(allProjectsData.find(p => p.id === projectId), state);
        refreshStep4Panel(projectId);
    }

    function adjustStep4Qty(projectId, delta) {
        var state = getStep4State(projectId);
        state.quantity = Math.max(1, state.quantity + delta);
        state.costSummary = calcStep4Cost(allProjectsData.find(p => p.id === projectId), state);
        refreshStep4Panel(projectId);
    }

    function updateStep4Config(projectId) {
        var state = getStep4State(projectId);
        var project = allProjectsData.find(p => p.id === projectId);
        var isZB = project && project.type === 'Zip Blinds';
        var isSR = project && project.type === 'Sunroom';
        if (isZB) {
            var fabEl = document.getElementById('step4Fabric_' + projectId);
            var driveEl = document.getElementById('step4Drive_' + projectId);
            var discEl = document.getElementById('step4Discount_' + projectId);
            if (fabEl) state.fabric = fabEl.value;
            if (driveEl) state.driveSystem = driveEl.value;
            if (discEl) state.discount = parseInt(discEl.value) || 0;
        } else if (isSR) {
            var glassEl = document.getElementById('step4Glass_' + projectId);
            if (glassEl) state.glassType = glassEl.value;
        } else {
            var louverEl = document.getElementById('step4Louver_' + projectId);
            if (louverEl) state.louverType = louverEl.value;
        }
        state.costSummary = calcStep4Cost(project, state);
        refreshStep4Panel(projectId);
        // 自动同步到 Supabase
        saveStep4ToDBAuto(projectId, state);
    }

    function calculateStep4Pricing(projectId) {
        var state = getStep4State(projectId);
        state.costSummary = calcStep4Cost(allProjectsData.find(p => p.id === projectId), state);
        refreshStep4Panel(projectId);
        showToast('Pricing recalculated', 'success');
    }

    function refreshStep4Panel(projectId) {
        // Targeted DOM updates — no full re-render, no scroll jump
        var state = step4QuotationState[projectId];
        if (!state || !state.costSummary) return;
        var cs = state.costSummary;
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        if (!project) return;
        var isZB = project.type === 'Zip Blinds';
        var isSR = project.type === 'Sunroom';

        // 1) Update tier card selection styling
        var tierEl = document.getElementById('step4TierCards_' + projectId);
        if (tierEl) {
            var cards = tierEl.children;
            for (var i = 0; i < cards.length; i++) {
                var card = cards[i];
                var cardTier = card.getAttribute('onclick') || '';
                var isSelected = cardTier.indexOf("'" + state.productTier + "'") !== -1;
                card.className = card.className
                    .replace(/border-(orange|gray)-\d+/g, isSelected ? 'border-orange-500' : 'border-gray-200')
                    .replace(/bg-(orange|white)-?\d*\/?\d*/g, isSelected ? 'bg-orange-50' : 'bg-white')
                    .replace(/shadow-sm/g, '');
                if (isSelected) card.className += ' shadow-sm';
                // Update price text color
                var priceDiv = card.querySelector('.text-xs.font-semibold');
                if (priceDiv) priceDiv.className = priceDiv.className.replace(/text-(orange|gray)-\d+/g, isSelected ? 'text-orange-600' : 'text-gray-600');
            }
        }

        // 2) Update quantity display (ZB only)
        var qtyEl = document.getElementById('step4Qty_' + projectId);
        if (qtyEl) qtyEl.textContent = state.quantity;

        // 3) Update cost breakdown
        var costEl = document.getElementById('step4CostBreakdown_' + projectId);
        if (costEl) {
            if (isZB) {
                costEl.innerHTML =
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Fabric (' + cs.tierName + ')</span><span class="font-medium text-gray-800">$' + cs.fabricCost + '</span></div>' +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Drive System (' + cs.driveName + ')</span><span class="font-medium text-gray-800">$' + cs.driveCost + '</span></div>' +
                    (cs.fabricUpgrade > 0 ? '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Fabric Upgrade</span><span class="font-medium text-amber-600">+$' + cs.fabricUpgrade + '</span></div>' : '') +
                    (cs.heightSurcharge > 0 ? '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Height Surcharge</span><span class="font-medium text-amber-600">+$' + cs.heightSurcharge + '</span></div>' : '') +
                    (cs.minChargeCost > 0 ? '<div class="flex justify-between text-[10px]"><span class="text-red-600">Min Charge Adj.</span><span class="font-medium text-red-600">+$' + cs.minChargeCost + '</span></div>' : '') +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Installation</span><span class="font-medium text-gray-800">$' + cs.installCost + '</span></div>' +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Hardware</span><span class="font-medium text-gray-800">$' + cs.hardwareCost + '</span></div>' +
                    (cs.discountAmt > 0 ? '<div class="flex justify-between text-[10px]"><span class="text-green-600">Dealer Discount (' + state.discount + '%)</span><span class="font-medium text-green-600">-$' + cs.discountAmt + '</span></div>' : '') +
                    '<div class="border-t border-gray-300 pt-1.5 mt-1.5 flex justify-between text-xs"><span class="font-bold text-gray-800">Total Cost (COGS)</span><span class="font-bold text-orange-600">$' + cs.totalCost + '</span></div>';
            } else {
                var upgLabel = isSR ? 'Glass Upgrade' : 'Louver Upgrade';
                costEl.innerHTML =
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Materials (' + cs.tierName + ')</span><span class="font-medium text-gray-800">$' + cs.materialCost + '</span></div>' +
                    (cs.upgradeCost > 0 ? '<div class="flex justify-between text-[10px]"><span class="text-gray-600">' + upgLabel + '</span><span class="font-medium text-amber-600">+$' + cs.upgradeCost + '</span></div>' : '') +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Labor</span><span class="font-medium text-gray-800">$' + cs.laborCost + '</span></div>' +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Equipment</span><span class="font-medium text-gray-800">$' + cs.equipmentCost + '</span></div>' +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Permits</span><span class="font-medium text-gray-800">$' + cs.permitCost + '</span></div>' +
                    '<div class="border-t border-gray-300 pt-1.5 mt-1.5 flex justify-between text-xs"><span class="font-bold text-gray-800">Total Cost (COGS)</span><span class="font-bold text-orange-600">$' + cs.totalCost + '</span></div>';
            }
        }

        // 4) Update quote cards (values + selection styling)
        var quoteEl = document.getElementById('step4QuoteCards_' + projectId);
        if (quoteEl) {
            var qSel = state.selectedQuote;
            var qStyles = {
                conservative: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', off: 'hover:border-blue-300' },
                recommended: { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', off: 'hover:border-orange-300' },
                premium: { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', off: 'hover:border-emerald-300' }
            };
            var qValues = {
                conservative: { label: 'Conservative', amount: '$' + cs.quoteConservative, margin: '10% margin' },
                recommended: { label: 'Recommended', amount: '$' + cs.quoteRecommended, margin: '18% margin' },
                premium: { label: 'Premium', amount: '$' + cs.quotePremium, margin: '35% margin' }
            };
            var qKeys = ['conservative', 'recommended', 'premium'];
            quoteEl.innerHTML = qKeys.map(function(key) {
                var s = qStyles[key]; var v = qValues[key]; var sel = qSel === key;
                var extra = key === 'recommended' ? '<div class="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">BEST</div>' : '';
                return '<div onclick="Nestopia.steps.step4.selectQuote(\'' + projectId + '\',\'' + key + '\')" class="cursor-pointer p-2.5 rounded-lg border-2 transition text-center ' + (key === 'recommended' ? 'relative ' : '') + (sel ? s.border + ' ' + s.bg + ' shadow-sm' : 'border-gray-200 ' + s.off) + '">' +
                    extra +
                    '<div class="text-[9px] text-gray-500 font-medium">' + v.label + '</div>' +
                    '<div class="text-sm font-bold ' + (sel ? s.text : 'text-gray-800') + '">' + v.amount + '</div>' +
                    '<div class="text-[9px] text-gray-400">' + v.margin + '</div>' +
                '</div>';
            }).join('');
        }

        // 5) Update profit analysis bar
        var profitEl = document.getElementById('step4ProfitBar_' + projectId);
        if (profitEl) {
            var pColor = cs.marginPct >= 15 ? 'green' : cs.marginPct >= 10 ? 'amber' : 'red';
            profitEl.className = 'p-3 rounded-lg border bg-' + pColor + '-50/50 border-' + pColor + '-200';
            profitEl.innerHTML =
                '<div class="flex items-center justify-between text-[10px] mb-1.5">' +
                    '<span class="font-semibold text-' + pColor + '-700"><i class="fas fa-chart-line mr-1"></i>Profit Analysis</span>' +
                    '<span class="font-bold">' + cs.marginPct + '% margin</span>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<div class="flex-1 bg-gray-200 rounded-full h-2"><div class="h-2 rounded-full transition-all bg-' + pColor + '-500" style="width:' + Math.min(cs.marginPct * 2.5, 100) + '%"></div></div>' +
                    '<span class="text-[10px] font-bold text-' + pColor + '-700">$' + cs.profit + ' net</span>' +
                '</div>';
        }

        // 6) Update strategy badges (ZB only)
        var stratEl = document.getElementById('step4Strategies_' + projectId);
        if (stratEl && isZB) {
            var minActive = state.unitArea < 1;
            var hActive = cs.heightSurcharge > 0;
            stratEl.innerHTML =
                '<span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><i class="fas fa-puzzle-piece mr-1"></i>Modular</span>' +
                '<span class="text-[9px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200"><i class="fas fa-layer-group mr-1"></i>Volume Tier</span>' +
                '<span class="text-[9px] px-2 py-0.5 rounded-full ' + (minActive ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-400 border border-gray-200') + '"><i class="fas fa-arrow-down mr-1"></i>Min Charge</span>' +
                '<span class="text-[9px] px-2 py-0.5 rounded-full ' + (hActive ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-50 text-gray-400 border border-gray-200') + '"><i class="fas fa-arrows-alt-v mr-1"></i>Height +</span>' +
                '<span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fas fa-star mr-1"></i>Product Tier</span>' +
                '<span class="text-[9px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200"><i class="fas fa-tags mr-1"></i>' + (state.pricingMode === 'retail' ? 'Retail' : 'Wholesale') + '</span>';
        }
    }

    // ── 命名空间导出 ──────────────────────────
    N.steps.step4 = {
        state:              step4QuotationState,
        _dbLoaded:          _step4DbLoaded,
        _quotDbLoaded:      _quotDbLoaded,
        loadFromDB:         loadStep4FromDB,
        saveToDBAuto:       saveStep4ToDBAuto,
        saveQuotListToDB:   saveQuotListToDB,
        getState:           getStep4State,
        calcCost:           calcStep4Cost,
        togglePanel:        toggleStep4Panel,
        toggleMode:         toggleStep4Mode,
        selectTier:         selectStep4Tier,
        selectQuote:        selectStep4Quote,
        adjustQty:          adjustStep4Qty,
        updateConfig:       updateStep4Config,
        calculatePricing:   calculateStep4Pricing,
        refreshPanel:       refreshStep4Panel
    };

    // ── 全局别名（向后兼容 HTML onclick 等调用） ──────────────────────────
    window.step4QuotationState   = step4QuotationState;
    window._step4DbLoaded        = _step4DbLoaded;
    window._quotDbLoaded         = _quotDbLoaded;
    window.loadStep4FromDB       = loadStep4FromDB;
    window.saveStep4ToDBAuto     = saveStep4ToDBAuto;
    window.saveQuotListToDB      = saveQuotListToDB;
    window.getStep4State         = getStep4State;
    window.calcStep4Cost         = calcStep4Cost;
    window.toggleStep4Panel      = toggleStep4Panel;
    window.toggleStep4Mode       = toggleStep4Mode;
    window.selectStep4Tier       = selectStep4Tier;
    window.selectStep4Quote      = selectStep4Quote;
    window.adjustStep4Qty        = adjustStep4Qty;
    window.updateStep4Config     = updateStep4Config;
    window.calculateStep4Pricing = calculateStep4Pricing;
    window.refreshStep4Panel     = refreshStep4Panel;
})();
