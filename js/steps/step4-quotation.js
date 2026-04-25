/**
 * Nestopia - Step 4: Quotation & Pricing
 * 命名空间: Nestopia.steps.step4
 *
 * v2.0 重写 — 基于产品 SKU 目录价（RMB/m2）的统一定价引擎。
 * 价格来源: zbSKUCatalog（与 quotation-editor.js 的 zbPriceLookup 一致）。
 * 基础货币: RMB，支持 USD/SGD 汇率转换显示。
 * Smart Quote: COGS x 利润率 (10%/18%/35%) — 内部定价参考工具。
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.steps = N.steps || {};

    // ===== Step 4: Quotation & Pricing Panel Functions =====
    var step4QuotationState = {};
    var _step4DbLoaded = {};
    var _quotDbLoaded = {};

    // ── SKU 目录价数据源（来自 pricing-data.js） ──
    var _pricing = N.data && N.data.pricing ? N.data.pricing : {};
    var zbSKUCatalog = _pricing.zbSKUCatalog || {};
    var SKU_KEYS = Object.keys(zbSKUCatalog);
    var DEFAULT_SKU = SKU_KEYS[0] || 'WR110A-78';
    var DEFAULT_RATES = _pricing.defaultExchangeRates || { USD: 7.25, SGD: 5.40 };

    // Legacy Sunroom/Pergola 数据（保留向后兼容）
    var zbProductTiers = _pricing.zbProductTiers || {};

    // ── 辅助：根据 opening 电机类型和高度自动匹配最佳 SKU ──
    function autoSelectSKU(heightMM, motor) {
        var isMotorized = !motor || motor.indexOf('manual') < 0;
        if (isMotorized) {
            return heightMM <= 3800 ? 'WR110B-63' : 'WR110A-78';
        } else {
            return heightMM <= 3800 ? 'WR85-M38' : 'WR85-M55';
        }
    }

    // ── 辅助：格式化 RMB ──
    function fmtRMB(val) {
        return '\u00a5' + Math.round(val).toLocaleString();
    }

    // ── 辅助：格式化外币 ──
    function fmtForeign(val, currency) {
        var sym = currency === 'SGD' ? 'S$' : '$';
        return sym + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

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
                    selectedSKU: stateObj.selectedSKU,
                    selectedQuote: stateObj.selectedQuote,
                    discount: stateObj.discount,
                    quantity: stateObj.quantity,
                    currency: stateObj.currency,
                    exchangeRate: stateObj.exchangeRate,
                    // Legacy compat fields
                    pricingMode: stateObj.pricingMode,
                    productTier: stateObj.productTier,
                    // Sunroom/Pergola
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

    // ── 状态初始化 ──────────────────────────────────────────
    function getStep4State(projectId) {
        if (!step4QuotationState[projectId]) {
            var project = allProjectsData.find(function(p) { return p.id === projectId; });
            var step3St = (typeof step3MeasurementState !== 'undefined' && step3MeasurementState[projectId]) ? step3MeasurementState[projectId] : null;
            var mData = (step3St && step3St.measurementData) ? step3St.measurementData : (project && project.measurement ? project.measurement : {});
            var isZB = project && project.type === 'Zip Blinds';
            var isSR = project && project.type === 'Sunroom';

            var state = {
                selectedQuote: 'recommended',
                discount: 0,
                currency: 'RMB',
                exchangeRate: DEFAULT_RATES.USD || 7.25,
                // Legacy compat
                pricingMode: 'retail',
                productTier: isZB ? 'better' : (isSR ? 'premium' : 'modern')
            };

            if (isZB) {
                // ★ v2.0: Per-opening SKU 选择
                state.quantity = Number(mData.openings) || 1;
                state.openings = [];
                for (var oi = 1; oi <= state.quantity; oi++) {
                    var oW = Number(mData['opening_' + oi + '_width_in']) || Number(mData.opening_width_in) || 72;
                    var oH = Number(mData['opening_' + oi + '_height_in']) || Number(mData.opening_height_in) || 96;
                    var oMot = mData['opening_' + oi + '_motor'] || mData.motor || 'motorized_wired';
                    var oMnt = mData['opening_' + oi + '_mounting'] || mData.mounting || '';
                    var widthMM = Math.round(oW * 25.4);
                    var heightMM = Math.round(oH * 25.4);
                    var bestSKU = autoSelectSKU(heightMM, oMot);
                    var skuData = zbSKUCatalog[bestSKU] || zbSKUCatalog[DEFAULT_SKU];
                    state.openings.push({
                        widthIn: oW, heightIn: oH,
                        widthMM: widthMM, heightMM: heightMM,
                        widthM: oW * 0.0254, heightM: oH * 0.0254,
                        area: (oW * 0.0254) * (oH * 0.0254),
                        motor: oMot, mounting: oMnt,
                        sku: bestSKU,
                        unitPrice: skuData.price
                    });
                }
                // Global SKU: default to first opening's SKU
                state.selectedSKU = state.openings[0].sku;
                // Backward compat
                var first = state.openings[0];
                state.widthM = first.widthM;
                state.heightM = first.heightM;
                state.unitArea = first.area;
                state.totalArea = state.openings.reduce(function(s, o) { return s + o.area; }, 0);
            } else {
                // Sunroom / Pergola — from Step 3 dims (legacy logic)
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

            state.costSummary = calcStep4Cost(project, state);
            step4QuotationState[projectId] = state;
        }
        return step4QuotationState[projectId];
    }

    // ── 核心定价计算 ──────────────────────────────────────────
    // ★ v2.0: 基于 SKU 目录价（RMB/m2），与 quotation-editor 一致
    function calcStep4Cost(project, state) {
        var isZB = project && project.type === 'Zip Blinds';
        var isSR = project && project.type === 'Sunroom';
        var cs = {};

        if (isZB) {
            // Per-opening 成本聚合（RMB）
            var openings = state.openings || [];
            var numO = openings.length || state.quantity || 1;
            cs.perOpeningCosts = [];
            cs.productSubtotal = 0;

            for (var oi = 0; oi < numO; oi++) {
                var op = openings[oi] || openings[0];
                var skuKey = op.sku || state.selectedSKU || DEFAULT_SKU;
                var skuData = zbSKUCatalog[skuKey] || zbSKUCatalog[DEFAULT_SKU];
                var area = op.area;
                var amount = Math.round(area * skuData.price);
                cs.perOpeningCosts.push({
                    idx: oi + 1,
                    sku: skuKey,
                    skuName: skuData.nameShort,
                    area: area,
                    unitPrice: skuData.price,
                    amount: amount
                });
                cs.productSubtotal += amount;
            }

            // 折扣
            cs.discountPct = state.discount || 0;
            cs.discountAmt = Math.round(cs.productSubtotal * (cs.discountPct / 100));
            cs.totalCostRMB = cs.productSubtotal - cs.discountAmt;

        } else {
            // Sunroom / Pergola — legacy pricing (USD)
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
            cs.totalCostRMB = cs.materialCost + cs.upgradeCost + cs.laborCost + cs.equipmentCost + cs.permitCost;
            cs.productSubtotal = cs.totalCostRMB;
            cs.discountAmt = 0;
            cs.discountPct = 0;
            // Legacy compat
            cs.totalCost = cs.totalCostRMB;
        }

        // ── Smart Quote: COGS x 利润率 ──
        var totalRMB = cs.totalCostRMB;
        cs.quoteConservativeRaw = Math.round(totalRMB * 1.10);
        cs.quoteRecommendedRaw  = Math.round(totalRMB * 1.18);
        cs.quotePremiumRaw      = Math.round(totalRMB * 1.35);

        cs.quoteConservative = cs.quoteConservativeRaw.toLocaleString();
        cs.quoteRecommended  = cs.quoteRecommendedRaw.toLocaleString();
        cs.quotePremium      = cs.quotePremiumRaw.toLocaleString();

        // 选中的利润
        var margins = { conservative: 0.10, recommended: 0.18, premium: 0.35 };
        var m = margins[state.selectedQuote] || 0.18;
        cs.profitRaw = Math.round(totalRMB * m);
        cs.profit = cs.profitRaw.toLocaleString();
        cs.marginPct = Math.round(m * 100);

        // Legacy compat
        cs.totalCost = cs.totalCostRMB;
        cs.fabricCost = 0; cs.driveCost = 0; cs.fabricUpgrade = 0;
        cs.heightSurcharge = 0; cs.installCost = 0; cs.hardwareCost = 0;
        cs.minChargeCost = 0; cs.driveName = '';
        cs.tierName = cs.tierName || '';

        return cs;
    }

    // ── UI: 面板 toggle ──────────────────────────────────────
    function toggleStep4Panel(projectId) {
        var panel = document.getElementById('step4QuotationPanel_' + projectId);
        var btn = document.getElementById('step4LaunchBtn_' + projectId);
        if (!panel) return;
        if (panel.classList.contains('hidden')) {
            var project = allProjectsData.find(function(p) { return p.id === projectId; });
            if (project && project.workflowStep >= 5) {
                var stepNames = { 5: 'Production', 6: 'Installation' };
                if (!confirm('\u26a0\ufe0f This project is currently at Step ' + project.workflowStep + ' (' + (stepNames[project.workflowStep] || '') + ').\n\nRe-opening the Quotation panel at this stage may trigger Contract Re-generation.\n\nAre you sure you want to proceed?')) {
                    return;
                }
            }
            // 首次打开：从 Supabase 加载
            if (!_step4DbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                _step4DbLoaded[projectId] = true;
                loadStep4FromDB(projectId).then(function(dbData) {
                    if (dbData && dbData.step4State && typeof dbData.step4State === 'object') {
                        var state = getStep4State(projectId);
                        var s4 = dbData.step4State;
                        if (s4.selectedSKU) state.selectedSKU = s4.selectedSKU;
                        if (s4.selectedQuote) state.selectedQuote = s4.selectedQuote;
                        if (s4.discount !== undefined) state.discount = s4.discount;
                        if (s4.currency) state.currency = s4.currency;
                        if (s4.exchangeRate) state.exchangeRate = s4.exchangeRate;
                        // Sunroom/Pergola legacy
                        if (s4.productTier) state.productTier = s4.productTier;
                        if (s4.glassType) state.glassType = s4.glassType;
                        if (s4.louverType) state.louverType = s4.louverType;
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

    // ── UI: 选择 SKU（所有 opening 统一切换） ──
    function selectStep4SKU(projectId, skuKey) {
        var state = getStep4State(projectId);
        state.selectedSKU = skuKey;
        var skuData = zbSKUCatalog[skuKey] || zbSKUCatalog[DEFAULT_SKU];
        // 更新所有 opening 的 SKU 和单价
        if (state.openings) {
            for (var i = 0; i < state.openings.length; i++) {
                state.openings[i].sku = skuKey;
                state.openings[i].unitPrice = skuData.price;
            }
        }
        state.costSummary = calcStep4Cost(allProjectsData.find(function(p) { return p.id === projectId; }), state);
        refreshStep4Panel(projectId);
        saveStep4ToDBAuto(projectId, state);
    }

    // ── UI: 选择 Smart Quote ──
    function selectStep4Quote(projectId, level) {
        var state = getStep4State(projectId);
        state.selectedQuote = level;
        state.costSummary = calcStep4Cost(allProjectsData.find(function(p) { return p.id === projectId; }), state);
        refreshStep4Panel(projectId);
    }

    // ── UI: 更新配置（折扣、货币、汇率） ──
    function updateStep4Config(projectId) {
        var state = getStep4State(projectId);
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        var isZB = project && project.type === 'Zip Blinds';
        var isSR = project && project.type === 'Sunroom';

        if (isZB) {
            var discEl = document.getElementById('step4Discount_' + projectId);
            var currEl = document.getElementById('step4Currency_' + projectId);
            var rateEl = document.getElementById('step4ExRate_' + projectId);
            if (discEl) state.discount = parseInt(discEl.value) || 0;
            if (currEl) state.currency = currEl.value;
            if (rateEl) state.exchangeRate = parseFloat(rateEl.value) || DEFAULT_RATES.USD;
        } else if (isSR) {
            var glassEl = document.getElementById('step4Glass_' + projectId);
            if (glassEl) state.glassType = glassEl.value;
        } else {
            var louverEl = document.getElementById('step4Louver_' + projectId);
            if (louverEl) state.louverType = louverEl.value;
        }
        state.costSummary = calcStep4Cost(project, state);
        refreshStep4Panel(projectId);
        saveStep4ToDBAuto(projectId, state);
    }

    function calculateStep4Pricing(projectId) {
        var state = getStep4State(projectId);
        state.costSummary = calcStep4Cost(allProjectsData.find(function(p) { return p.id === projectId; }), state);
        refreshStep4Panel(projectId);
        showToast('Pricing recalculated', 'success');
    }

    // ── Legacy compat: selectTier / toggleMode（Sunroom/Pergola 使用） ──
    function selectStep4Tier(projectId, tier) {
        var state = getStep4State(projectId);
        state.productTier = tier;
        state.costSummary = calcStep4Cost(allProjectsData.find(function(p) { return p.id === projectId; }), state);
        refreshStep4Panel(projectId);
    }

    function toggleStep4Mode(projectId) {
        var state = getStep4State(projectId);
        state.pricingMode = state.pricingMode === 'retail' ? 'wholesale' : 'retail';
        state.costSummary = calcStep4Cost(allProjectsData.find(function(p) { return p.id === projectId; }), state);
        refreshStep4Panel(projectId);
    }

    function adjustStep4Qty(projectId, delta) {
        var state = getStep4State(projectId);
        state.quantity = Math.max(1, state.quantity + delta);
        state.costSummary = calcStep4Cost(allProjectsData.find(function(p) { return p.id === projectId; }), state);
        refreshStep4Panel(projectId);
    }

    // ── UI: 刷新面板 DOM（不重新渲染整体布局） ──────────────
    function refreshStep4Panel(projectId) {
        var state = step4QuotationState[projectId];
        if (!state || !state.costSummary) return;
        var cs = state.costSummary;
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        if (!project) return;
        var isZB = project.type === 'Zip Blinds';
        var isSR = project.type === 'Sunroom';

        // 汇率显示辅助
        var curr = state.currency || 'RMB';
        var rate = state.exchangeRate || DEFAULT_RATES.USD;
        var showForeign = curr !== 'RMB';
        function toForeign(rmb) { return showForeign ? rmb / rate : rmb; }
        function fmtVal(rmb) {
            if (showForeign) return fmtForeign(rmb / rate, curr);
            return fmtRMB(rmb);
        }

        // 1) 更新 SKU 选择卡片样式（ZB）
        var skuEl = document.getElementById('step4SKUCards_' + projectId);
        if (skuEl && isZB) {
            var cards = skuEl.children;
            for (var i = 0; i < cards.length; i++) {
                var card = cards[i];
                var cardSKU = card.getAttribute('data-sku');
                var sel = cardSKU === state.selectedSKU;
                card.className = 'cursor-pointer p-2.5 rounded-lg border-2 transition text-center relative ' +
                    (sel ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-orange-300 bg-white');
                var priceSpan = card.querySelector('.sku-price');
                if (priceSpan) priceSpan.className = 'sku-price text-xs font-semibold mt-1 ' + (sel ? 'text-orange-600' : 'text-gray-600');
            }
        }

        // 2) 更新数量（ZB）
        var qtyEl = document.getElementById('step4Qty_' + projectId);
        if (qtyEl) qtyEl.textContent = state.quantity;

        // 3) 更新成本明细（ZB: SKU 目录价 RMB）
        var costEl = document.getElementById('step4CostBreakdown_' + projectId);
        if (costEl) {
            if (isZB) {
                var html = '';
                // Per-opening 明细
                if (cs.perOpeningCosts && cs.perOpeningCosts.length > 0) {
                    for (var ci = 0; ci < cs.perOpeningCosts.length; ci++) {
                        var poc = cs.perOpeningCosts[ci];
                        html += '<div class="flex justify-between text-[10px]">' +
                            '<span class="text-gray-600">#' + poc.idx + ' ' + poc.skuName + ' (' + poc.area.toFixed(2) + 'm\u00b2)</span>' +
                            '<span class="font-medium text-gray-800">' + fmtRMB(poc.amount) + '</span></div>';
                    }
                }
                html += '<div class="border-t border-gray-200 pt-1 mt-1 flex justify-between text-[10px]">' +
                    '<span class="text-gray-600 font-medium">Product Subtotal</span>' +
                    '<span class="font-medium text-gray-800">' + fmtRMB(cs.productSubtotal) + '</span></div>';
                if (cs.discountAmt > 0) {
                    html += '<div class="flex justify-between text-[10px]"><span class="text-green-600">Discount (' + cs.discountPct + '%)</span><span class="font-medium text-green-600">-' + fmtRMB(cs.discountAmt) + '</span></div>';
                }
                html += '<div class="border-t border-gray-300 pt-1.5 mt-1.5 flex justify-between text-xs">' +
                    '<span class="font-bold text-gray-800">Total COGS</span>' +
                    '<span class="font-bold text-orange-600">' + fmtRMB(cs.totalCostRMB) + '</span></div>';
                if (showForeign) {
                    html += '<div class="flex justify-between text-[10px] mt-1">' +
                        '<span class="text-gray-400">= ' + curr + ' (' + rate + ')</span>' +
                        '<span class="font-medium text-gray-500">' + fmtForeign(cs.totalCostRMB / rate, curr) + '</span></div>';
                }
                costEl.innerHTML = html;
            } else {
                // Sunroom/Pergola legacy
                var upgLabel = isSR ? 'Glass Upgrade' : 'Louver Upgrade';
                costEl.innerHTML =
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Materials (' + cs.tierName + ')</span><span class="font-medium text-gray-800">$' + cs.materialCost + '</span></div>' +
                    (cs.upgradeCost > 0 ? '<div class="flex justify-between text-[10px]"><span class="text-gray-600">' + upgLabel + '</span><span class="font-medium text-amber-600">+$' + cs.upgradeCost + '</span></div>' : '') +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Labor</span><span class="font-medium text-gray-800">$' + cs.laborCost + '</span></div>' +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Equipment</span><span class="font-medium text-gray-800">$' + cs.equipmentCost + '</span></div>' +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Permits</span><span class="font-medium text-gray-800">$' + cs.permitCost + '</span></div>' +
                    '<div class="border-t border-gray-300 pt-1.5 mt-1.5 flex justify-between text-xs"><span class="font-bold text-gray-800">Total Cost (COGS)</span><span class="font-bold text-orange-600">$' + cs.totalCostRMB + '</span></div>';
            }
        }

        // 4) 更新 Smart Quote 卡片
        var quoteEl = document.getElementById('step4QuoteCards_' + projectId);
        if (quoteEl) {
            var qSel = state.selectedQuote;
            var qStyles = {
                conservative: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', off: 'hover:border-blue-300' },
                recommended:  { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', off: 'hover:border-orange-300' },
                premium:      { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', off: 'hover:border-emerald-300' }
            };
            // 显示 RMB + 可选外币
            function quoteDisplay(rawRMB) {
                var s = fmtRMB(rawRMB);
                if (showForeign) s += '<div class="text-[8px] text-gray-400 mt-0.5">' + fmtForeign(rawRMB / rate, curr) + '</div>';
                return s;
            }
            var qValues = {
                conservative: { label: 'Conservative', amount: quoteDisplay(cs.quoteConservativeRaw), margin: '10% margin' },
                recommended:  { label: 'Recommended',  amount: quoteDisplay(cs.quoteRecommendedRaw),  margin: '18% margin' },
                premium:      { label: 'Premium',      amount: quoteDisplay(cs.quotePremiumRaw),      margin: '35% margin' }
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

        // 5) 更新 Profit Analysis
        var profitEl = document.getElementById('step4ProfitBar_' + projectId);
        if (profitEl) {
            var pColor = cs.marginPct >= 15 ? 'green' : cs.marginPct >= 10 ? 'amber' : 'red';
            var profitDisplay = fmtRMB(cs.profitRaw);
            if (showForeign) profitDisplay += ' (' + fmtForeign(cs.profitRaw / rate, curr) + ')';
            profitEl.className = 'p-3 rounded-lg border bg-' + pColor + '-50/50 border-' + pColor + '-200';
            profitEl.innerHTML =
                '<div class="flex items-center justify-between text-[10px] mb-1.5">' +
                    '<span class="font-semibold text-' + pColor + '-700"><i class="fas fa-chart-line mr-1"></i>Profit Analysis</span>' +
                    '<span class="font-bold">' + cs.marginPct + '% margin</span>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<div class="flex-1 bg-gray-200 rounded-full h-2"><div class="h-2 rounded-full transition-all bg-' + pColor + '-500" style="width:' + Math.min(cs.marginPct * 2.5, 100) + '%"></div></div>' +
                    '<span class="text-[10px] font-bold text-' + pColor + '-700">' + profitDisplay + ' net</span>' +
                '</div>';
        }

        // 6) 更新 Tier 卡片（Sunroom/Pergola only — legacy）
        var tierEl = document.getElementById('step4TierCards_' + projectId);
        if (tierEl && !isZB) {
            var cards = tierEl.children;
            for (var ti = 0; ti < cards.length; ti++) {
                var card = cards[ti];
                var cardTier = card.getAttribute('onclick') || '';
                var isSelected = cardTier.indexOf("'" + state.productTier + "'") !== -1;
                card.className = card.className
                    .replace(/border-(orange|gray)-\d+/g, isSelected ? 'border-orange-500' : 'border-gray-200')
                    .replace(/bg-(orange|white)-?\d*\/?\d*/g, isSelected ? 'bg-orange-50' : 'bg-white')
                    .replace(/shadow-sm/g, '');
                if (isSelected) card.className += ' shadow-sm';
                var priceDiv = card.querySelector('.text-xs.font-semibold');
                if (priceDiv) priceDiv.className = priceDiv.className.replace(/text-(orange|gray)-\d+/g, isSelected ? 'text-orange-600' : 'text-gray-600');
            }
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
        selectSKU:          selectStep4SKU,
        selectQuote:        selectStep4Quote,
        updateConfig:       updateStep4Config,
        calculatePricing:   calculateStep4Pricing,
        refreshPanel:       refreshStep4Panel,
        // Legacy compat
        toggleMode:         toggleStep4Mode,
        selectTier:         selectStep4Tier,
        adjustQty:          adjustStep4Qty
    };

    // ── 全局别名（向后兼容 HTML onclick 等调用） ──
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
    window.selectStep4SKU        = selectStep4SKU;
    window.selectStep4Quote      = selectStep4Quote;
    window.adjustStep4Qty        = adjustStep4Qty;
    window.updateStep4Config     = updateStep4Config;
    window.calculateStep4Pricing = calculateStep4Pricing;
    window.refreshStep4Panel     = refreshStep4Panel;
})();
