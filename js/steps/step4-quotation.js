/**
 * Nestopia - Step 4: Quotation & Pricing
 * 命名空间: Nestopia.steps.step4
 *
 * v3.0 重写 — 基于利润测算公式的定价引擎。
 *
 * 核心公式（来源：方小姐防风卷帘利润测算表20260414.xlsx）:
 *   折后单价 = 供应商单价 × supplierDiscountRate (0.9)
 *   运费清关 = 折后单价 × shippingCostRate (0.30)
 *   安装费   = installationFeePerSqm (191 RMB/m²)
 *   成本单价 = 折后单价 + 运费 + 安装费
 *   市场价   = 成本单价 × marketMarkup (2.92)
 *   优惠价   = 市场价 × preferentialDiscount (0.50)
 *   电机售价 = 供应商价 × (1 + accessoryMarkupRate) (1.13)
 *
 * 数据源: pricing-data.js v3.0 (zbSKUCatalog, zbDriveSystemCatalog, zbBusinessParams)
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.steps = N.steps || {};

    // ===== State =====
    var step4QuotationState = {};
    var _step4DbLoaded = {};
    var _quotDbLoaded = {};

    // ===== Data Sources (from pricing-data.js) =====
    var _pricing = N.data && N.data.pricing ? N.data.pricing : {};
    var zbSKUCatalog = _pricing.zbSKUCatalog || {};
    var zbDriveSystemCatalog = _pricing.zbDriveSystemCatalog || {};
    var zbBusinessParams = _pricing.zbBusinessParams || {};
    var SKU_KEYS = Object.keys(zbSKUCatalog);
    var DRIVE_KEYS = Object.keys(zbDriveSystemCatalog);
    var DEFAULT_SKU = SKU_KEYS[0] || 'WR100A-63';
    var DEFAULT_RATES = _pricing.defaultExchangeRates || { USD: 7.25, SGD: 5.3612 };
    var _calcOpeningCost = _pricing.calcOpeningCost || function() { return null; };
    var _calcAccessoryPrice = _pricing.calcAccessoryPrice || function(p) { return Math.round(p * 1.13); };
    var _lookupUnitPrice = _pricing.lookupUnitPrice || function() { return 0; };

    // Legacy
    var zbProductTiers = _pricing.zbProductTiers || {};

    // ══════════════════════════════════════════════════════════
    //  Auto-Select Helpers
    // ══════════════════════════════════════════════════════════

    /** 根据 opening 尺寸自动匹配最佳 SKU（符合尺寸限制、优先低价） */
    function autoSelectSKU(widthMM, heightMM) {
        var candidates = [];
        for (var i = 0; i < SKU_KEYS.length; i++) {
            var key = SKU_KEYS[i];
            var sku = zbSKUCatalog[key];
            if (widthMM <= sku.maxWidthMM && heightMM <= sku.maxHeightMM) {
                candidates.push({ key: key, sku: sku });
            }
        }
        if (candidates.length === 0) return 'WR120A-78'; // Largest fallback
        // Sort: prefer WR100 < WR110 < WR120, then cheaper first
        var seriesOrder = { 'WR100': 1, 'WR110': 2, 'WR120': 3, 'Special': 4 };
        candidates.sort(function(a, b) {
            var sa = seriesOrder[a.sku.series] || 5;
            var sb = seriesOrder[b.sku.series] || 5;
            if (sa !== sb) return sa - sb;
            return a.sku.priceTiers[0].price - b.sku.priceTiers[0].price;
        });
        return candidates[0].key;
    }

    /** 根据宽度和电机类型自动匹配驱动系统 */
    function autoSelectDrive(widthMM, motor) {
        var isManual = motor && motor.indexOf('manual') >= 0;
        if (isManual) {
            return widthMM <= 4000 ? 'SPRING-SM' : 'SPRING-LG';
        }
        return 'AOK-45'; // Default motorized
    }

    // ══════════════════════════════════════════════════════════
    //  Format Helpers
    // ══════════════════════════════════════════════════════════

    function fmtRMB(val) {
        return '\u00a5' + Math.round(val).toLocaleString();
    }

    function fmtForeign(val, currency) {
        var sym = currency === 'SGD' ? 'S$' : '$';
        return sym + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // ══════════════════════════════════════════════════════════
    //  Supabase DB Persistence
    // ══════════════════════════════════════════════════════════

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
                    // v3.0 new fields
                    businessParams: stateObj.businessParams,
                    openingSKUs: (stateObj.openings || []).map(function(o) { return o.sku; }),
                    openingDrives: (stateObj.openings || []).map(function(o) { return o.driveSystem; }),
                    // Legacy compat
                    pricingMode: stateObj.pricingMode,
                    productTier: stateObj.productTier,
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

    // ══════════════════════════════════════════════════════════
    //  State Initialization
    // ══════════════════════════════════════════════════════════

    function getStep4State(projectId) {
        if (!step4QuotationState[projectId]) {
            var project = allProjectsData.find(function(p) { return p.id === projectId; });
            var step3St = (typeof step3MeasurementState !== 'undefined' && step3MeasurementState[projectId]) ? step3MeasurementState[projectId] : null;
            var mData = (step3St && step3St.measurementData) ? step3St.measurementData : (project && project.measurement ? project.measurement : {});
            var isZB = project && project.type === 'Zip Blinds';
            var isSR = project && project.type === 'Sunroom';

            var state = {
                selectedQuote: 'preferential',
                currency: 'SGD',
                exchangeRate: DEFAULT_RATES.SGD || 5.3612,
                discount: 0,
                // Legacy compat
                pricingMode: 'retail',
                productTier: isZB ? 'better' : (isSR ? 'premium' : 'modern'),
                // v3.0: Editable business parameters (clone from global defaults)
                businessParams: {
                    supplierDiscountRate: zbBusinessParams.supplierDiscountRate || 0.9,
                    shippingCostRate: zbBusinessParams.shippingCostRate || 0.30,
                    installationFeePerSqm: zbBusinessParams.installationFeePerSqm || 191,
                    marketMarkup: zbBusinessParams.marketMarkup || 2.92,
                    preferentialDiscount: zbBusinessParams.preferentialDiscount || 0.50,
                    accessoryMarkupRate: zbBusinessParams.accessoryMarkupRate || 0.13
                }
            };

            if (isZB) {
                // ★ v3.0: Per-opening with SKU + drive system
                state.quantity = Number(mData.openings) || 1;
                state.openings = [];
                for (var oi = 1; oi <= state.quantity; oi++) {
                    var oW = Number(mData['opening_' + oi + '_width_in']) || Number(mData.opening_width_in) || 72;
                    var oH = Number(mData['opening_' + oi + '_height_in']) || Number(mData.opening_height_in) || 96;
                    var oMot = mData['opening_' + oi + '_motor'] || mData.motor || 'motorized_wired';
                    var oMnt = mData['opening_' + oi + '_mounting'] || mData.mounting || '';
                    var widthMM = Math.round(oW * 25.4);
                    var heightMM = Math.round(oH * 25.4);
                    var bestSKU = autoSelectSKU(widthMM, heightMM);
                    var bestDrive = autoSelectDrive(widthMM, oMot);
                    var area = (oW * 0.0254) * (oH * 0.0254);
                    state.openings.push({
                        widthIn: oW, heightIn: oH,
                        widthMM: widthMM, heightMM: heightMM,
                        widthM: oW * 0.0254, heightM: oH * 0.0254,
                        area: area,
                        motor: oMot, mounting: oMnt,
                        sku: bestSKU,
                        driveSystem: bestDrive,
                        unitPrice: _lookupUnitPrice(bestSKU, Math.max(area, zbBusinessParams.minBillableArea || 3))
                    });
                }
                state.selectedSKU = state.openings[0].sku;
                var first = state.openings[0];
                state.widthM = first.widthM;
                state.heightM = first.heightM;
                state.unitArea = first.area;
                state.totalArea = state.openings.reduce(function(s, o) { return s + o.area; }, 0);
            } else {
                // Sunroom / Pergola — legacy
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

    // ══════════════════════════════════════════════════════════
    //  Core Pricing Engine v3.0
    // ══════════════════════════════════════════════════════════

    function calcStep4Cost(project, state) {
        var isZB = project && project.type === 'Zip Blinds';
        var isSR = project && project.type === 'Sunroom';
        var cs = {};

        if (isZB) {
            var openings = state.openings || [];
            var numO = openings.length || state.quantity || 1;
            var bp = state.businessParams || zbBusinessParams;

            cs.perOpeningCosts = [];
            cs.totalCOGS = 0;
            cs.totalMarket = 0;
            cs.totalPref = 0;
            cs.totalDriveCost = 0;
            cs.totalDriveSell = 0;

            for (var oi = 0; oi < numO; oi++) {
                var op = openings[oi] || openings[0];
                var skuKey = op.sku || state.selectedSKU || DEFAULT_SKU;
                var driveKey = op.driveSystem || 'AOK-45';
                var driveData = zbDriveSystemCatalog[driveKey];
                var driveCost = driveData ? driveData.price : 0;
                var driveSell = _calcAccessoryPrice(driveCost, bp);

                // Use calcOpeningCost from pricing-data.js
                var oc = _calcOpeningCost(skuKey, op.widthMM, op.heightMM, bp);
                if (!oc) {
                    // Fallback if calcOpeningCost not available
                    var fallbackArea = op.area || 1;
                    var fallbackBilled = Math.max(fallbackArea, bp.minBillableArea || 3);
                    oc = {
                        area: fallbackArea, billedArea: fallbackBilled,
                        supplierUnit: 0, discountedUnit: 0, shippingUnit: 0,
                        installUnit: bp.installationFeePerSqm || 191,
                        cogsUnit: bp.installationFeePerSqm || 191,
                        marketUnit: (bp.installationFeePerSqm || 191) * (bp.marketMarkup || 2.92),
                        prefUnit: (bp.installationFeePerSqm || 191) * (bp.marketMarkup || 2.92) * (bp.preferentialDiscount || 0.50),
                        totalCOGS: 0, totalMarket: 0, totalPref: 0
                    };
                }

                cs.perOpeningCosts.push({
                    idx: oi + 1,
                    sku: skuKey,
                    skuModel: (zbSKUCatalog[skuKey] || {}).model || skuKey,
                    skuName: (zbSKUCatalog[skuKey] || {}).nameZh || skuKey,
                    driveSystem: driveKey,
                    driveName: driveData ? driveData.name : driveKey,
                    driveNameZh: driveData ? (driveData.nameZh || driveData.name) : '',
                    widthMM: op.widthMM,
                    heightMM: op.heightMM,
                    area: oc.area,
                    billedArea: oc.billedArea,
                    supplierUnit: oc.supplierUnit,
                    discountedUnit: oc.discountedUnit,
                    shippingUnit: oc.shippingUnit,
                    installUnit: oc.installUnit,
                    cogsUnit: oc.cogsUnit,
                    marketUnit: oc.marketUnit,
                    prefUnit: oc.prefUnit,
                    totalCOGS: oc.totalCOGS,
                    totalMarket: oc.totalMarket,
                    totalPref: oc.totalPref,
                    driveCost: driveCost,
                    driveSell: driveSell
                });

                cs.totalCOGS += oc.totalCOGS;
                cs.totalMarket += oc.totalMarket;
                cs.totalPref += oc.totalPref;
                cs.totalDriveCost += driveCost;
                cs.totalDriveSell += driveSell;
            }

            // Grand totals (blinds + drives)
            cs.grandTotalCOGS = cs.totalCOGS + cs.totalDriveCost;
            cs.grandTotalMarket = cs.totalMarket + cs.totalDriveSell;
            cs.grandTotalPref = cs.totalPref + cs.totalDriveSell;

            // Profit & margin (based on preferential selling price)
            cs.profitRaw = cs.grandTotalPref - cs.grandTotalCOGS;
            cs.marginPct = cs.grandTotalPref > 0 ? Math.round((cs.profitRaw / cs.grandTotalPref) * 100) : 0;

            // Currency conversion
            var rate = state.exchangeRate || DEFAULT_RATES.SGD;
            var curr = state.currency || 'SGD';
            cs.grandTotalPrefForeign = cs.grandTotalPref / rate;
            cs.grandTotalCOGSForeign = cs.grandTotalCOGS / rate;
            cs.profitForeign = cs.profitRaw / rate;

            // ── Legacy compat fields (for quotation-editor.js and other consumers) ──
            cs.productSubtotal = cs.totalCOGS;
            cs.totalCostRMB = cs.grandTotalCOGS;
            cs.discountAmt = 0;
            cs.discountPct = 0;
            cs.profit = Math.round(cs.profitRaw).toLocaleString();

            // Map old "Smart Quote" fields to new formula outputs
            cs.quoteConservativeRaw = cs.grandTotalCOGS;    // COGS
            cs.quoteRecommendedRaw  = cs.grandTotalPref;    // Preferential (sell)
            cs.quotePremiumRaw      = cs.grandTotalMarket;  // Market (list)
            cs.quoteConservative = Math.round(cs.quoteConservativeRaw).toLocaleString();
            cs.quoteRecommended  = Math.round(cs.quoteRecommendedRaw).toLocaleString();
            cs.quotePremium      = Math.round(cs.quotePremiumRaw).toLocaleString();

            cs.totalCost = cs.totalCostRMB;
            cs.fabricCost = 0; cs.driveCost = cs.totalDriveCost; cs.fabricUpgrade = 0;
            cs.heightSurcharge = 0; cs.installCost = 0; cs.hardwareCost = 0;
            cs.minChargeCost = 0; cs.driveName = '';
            cs.tierName = '';

        } else {
            // ── Sunroom / Pergola — legacy pricing (USD) ──
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
            cs.totalCost = cs.totalCostRMB;

            // Smart Quote (legacy)
            var totalRMB = cs.totalCostRMB;
            cs.quoteConservativeRaw = Math.round(totalRMB * 1.10);
            cs.quoteRecommendedRaw  = Math.round(totalRMB * 1.18);
            cs.quotePremiumRaw      = Math.round(totalRMB * 1.35);
            cs.quoteConservative = cs.quoteConservativeRaw.toLocaleString();
            cs.quoteRecommended  = cs.quoteRecommendedRaw.toLocaleString();
            cs.quotePremium      = cs.quotePremiumRaw.toLocaleString();

            var margins = { conservative: 0.10, recommended: 0.18, premium: 0.35 };
            var m = margins[state.selectedQuote] || 0.18;
            cs.profitRaw = Math.round(totalRMB * m);
            cs.profit = cs.profitRaw.toLocaleString();
            cs.marginPct = Math.round(m * 100);

            cs.fabricCost = 0; cs.driveCost = 0; cs.fabricUpgrade = 0;
            cs.heightSurcharge = 0; cs.installCost = 0; cs.hardwareCost = 0;
            cs.minChargeCost = 0; cs.driveName = '';
        }

        return cs;
    }

    // ══════════════════════════════════════════════════════════
    //  Panel Toggle
    // ══════════════════════════════════════════════════════════

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

            // ★ 首次打开：链式加载 measurement → step4 DB config
            if (!_step4DbLoaded[projectId]) {
                _step4DbLoaded[projectId] = true;
                showInheritedLoading(projectId);
                showPanelLoading(projectId);

                var loadMeas = (typeof ensureMeasurementLoaded === 'function')
                    ? ensureMeasurementLoaded(projectId)
                    : Promise.resolve();

                loadMeas.then(function() {
                    delete step4QuotationState[projectId];
                    getStep4State(projectId);
                    if (typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                        return loadStep4FromDB(projectId);
                    }
                    return null;
                }).then(function(dbData) {
                    if (dbData && dbData.step4State && typeof dbData.step4State === 'object') {
                        var state = getStep4State(projectId);
                        var s4 = dbData.step4State;
                        if (s4.selectedSKU) state.selectedSKU = s4.selectedSKU;
                        if (s4.selectedQuote) state.selectedQuote = s4.selectedQuote;
                        if (s4.discount !== undefined) state.discount = s4.discount;
                        if (s4.currency) state.currency = s4.currency;
                        if (s4.exchangeRate) state.exchangeRate = s4.exchangeRate;
                        // v3.0 fields
                        if (s4.businessParams && typeof s4.businessParams === 'object') {
                            state.businessParams = s4.businessParams;
                        }
                        if (s4.openingSKUs && state.openings) {
                            for (var i = 0; i < Math.min(s4.openingSKUs.length, state.openings.length); i++) {
                                if (zbSKUCatalog[s4.openingSKUs[i]]) {
                                    state.openings[i].sku = s4.openingSKUs[i];
                                }
                            }
                        }
                        if (s4.openingDrives && state.openings) {
                            for (var i = 0; i < Math.min(s4.openingDrives.length, state.openings.length); i++) {
                                if (zbDriveSystemCatalog[s4.openingDrives[i]]) {
                                    state.openings[i].driveSystem = s4.openingDrives[i];
                                }
                            }
                        }
                        // Legacy
                        if (s4.productTier) state.productTier = s4.productTier;
                        if (s4.glassType) state.glassType = s4.glassType;
                        if (s4.louverType) state.louverType = s4.louverType;

                        var proj = allProjectsData.find(function(p) { return p.id === projectId; });
                        state.costSummary = calcStep4Cost(proj, state);
                        console.log('[Quotation] Step4 state loaded from Supabase for', projectId);
                    }
                    refreshStep4Panel(projectId);
                    refreshInheritedMeasurement(projectId);
                });
            } else {
                // ★ DB 已加载过，但模板可能因导航被重新渲染 — 从内存 state 刷新 DOM
                refreshStep4Panel(projectId);
                refreshInheritedMeasurement(projectId);
            }

            panel.classList.remove('hidden');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-times text-[10px]"></i> Close Panel';
                btn.classList.replace('bg-orange-600', 'bg-gray-600');
                btn.classList.replace('hover:bg-orange-700', 'hover:bg-gray-700');
            }
        } else {
            panel.classList.add('hidden');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-calculator text-[10px]"></i> Open Quotation';
                btn.classList.replace('bg-gray-600', 'bg-orange-600');
                btn.classList.replace('hover:bg-gray-700', 'hover:bg-orange-700');
            }
        }
    }

    // ══════════════════════════════════════════════════════════
    //  Per-Opening Selection Actions
    // ══════════════════════════════════════════════════════════

    /** 更改单个 opening 的 SKU */
    function selectOpeningSKU(projectId, openingIdx, skuKey) {
        var state = getStep4State(projectId);
        if (state.openings && state.openings[openingIdx]) {
            state.openings[openingIdx].sku = skuKey;
            state.openings[openingIdx].unitPrice = _lookupUnitPrice(skuKey, Math.max(state.openings[openingIdx].area, zbBusinessParams.minBillableArea || 3));
            // Check drive compatibility
            var sku = zbSKUCatalog[skuKey];
            if (sku && sku.drives && sku.drives.indexOf(state.openings[openingIdx].driveSystem) < 0) {
                // Current drive not compatible, auto-select first compatible
                state.openings[openingIdx].driveSystem = sku.drives[0] || 'AOK-45';
            }
        }
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        state.costSummary = calcStep4Cost(project, state);
        refreshStep4Panel(projectId);
        saveStep4ToDBAuto(projectId, state);
    }

    /** 更改单个 opening 的驱动系统 */
    function selectOpeningDrive(projectId, openingIdx, driveKey) {
        var state = getStep4State(projectId);
        if (state.openings && state.openings[openingIdx]) {
            state.openings[openingIdx].driveSystem = driveKey;
        }
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        state.costSummary = calcStep4Cost(project, state);
        refreshStep4Panel(projectId);
        saveStep4ToDBAuto(projectId, state);
    }

    /** 批量应用第一个 opening 的 SKU 到所有 opening */
    function applyAllSKU(projectId) {
        var state = getStep4State(projectId);
        if (!state.openings || state.openings.length < 2) return;
        var firstSKU = state.openings[0].sku;
        for (var i = 1; i < state.openings.length; i++) {
            state.openings[i].sku = firstSKU;
            state.openings[i].unitPrice = _lookupUnitPrice(firstSKU, Math.max(state.openings[i].area, zbBusinessParams.minBillableArea || 3));
        }
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        state.costSummary = calcStep4Cost(project, state);
        refreshStep4Panel(projectId);
        saveStep4ToDBAuto(projectId, state);
    }

    /** 批量应用第一个 opening 的驱动到所有 opening */
    function applyAllDrive(projectId) {
        var state = getStep4State(projectId);
        if (!state.openings || state.openings.length < 2) return;
        var firstDrive = state.openings[0].driveSystem;
        for (var i = 1; i < state.openings.length; i++) {
            state.openings[i].driveSystem = firstDrive;
        }
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        state.costSummary = calcStep4Cost(project, state);
        refreshStep4Panel(projectId);
        saveStep4ToDBAuto(projectId, state);
    }

    // ══════════════════════════════════════════════════════════
    //  Business Parameter Updates
    // ══════════════════════════════════════════════════════════

    /** 更新单个业务参数 */
    function updateBusinessParam(projectId, paramKey, value) {
        var state = getStep4State(projectId);
        if (!state.businessParams) state.businessParams = {};
        var numVal = parseFloat(value);
        if (isNaN(numVal)) return;
        state.businessParams[paramKey] = numVal;
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        state.costSummary = calcStep4Cost(project, state);
        refreshStep4Panel(projectId);
        saveStep4ToDBAuto(projectId, state);
    }

    /** 重置业务参数为默认值 */
    function resetBusinessParams(projectId) {
        var state = getStep4State(projectId);
        state.businessParams = {
            supplierDiscountRate: zbBusinessParams.supplierDiscountRate || 0.9,
            shippingCostRate: zbBusinessParams.shippingCostRate || 0.30,
            installationFeePerSqm: zbBusinessParams.installationFeePerSqm || 191,
            marketMarkup: zbBusinessParams.marketMarkup || 2.92,
            preferentialDiscount: zbBusinessParams.preferentialDiscount || 0.50,
            accessoryMarkupRate: zbBusinessParams.accessoryMarkupRate || 0.13
        };
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        state.costSummary = calcStep4Cost(project, state);
        refreshStep4Panel(projectId);
        // Also update the param inputs
        _refreshBusinessParamInputs(projectId, state.businessParams);
        saveStep4ToDBAuto(projectId, state);
    }

    function _refreshBusinessParamInputs(projectId, bp) {
        var fields = {
            'step4ParamDisc_': 'supplierDiscountRate',
            'step4ParamShip_': 'shippingCostRate',
            'step4ParamInstall_': 'installationFeePerSqm',
            'step4ParamMarkup_': 'marketMarkup',
            'step4ParamPref_': 'preferentialDiscount',
            'step4ParamAcc_': 'accessoryMarkupRate'
        };
        for (var prefix in fields) {
            var el = document.getElementById(prefix + projectId);
            if (el) el.value = bp[fields[prefix]];
        }
    }

    // ══════════════════════════════════════════════════════════
    //  Config Updates (Currency, Exchange Rate)
    // ══════════════════════════════════════════════════════════

    function updateStep4Config(projectId) {
        var state = getStep4State(projectId);
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        var isZB = project && project.type === 'Zip Blinds';
        var isSR = project && project.type === 'Sunroom';

        if (isZB) {
            var currEl = document.getElementById('step4Currency_' + projectId);
            var rateEl = document.getElementById('step4ExRate_' + projectId);
            if (currEl) {
                state.currency = currEl.value;
                // Auto-fill default rate
                if (state.currency === 'RMB') {
                    state.exchangeRate = 1;
                    if (rateEl) { rateEl.value = 1; rateEl.disabled = true; }
                } else if (state.currency === 'SGD') {
                    state.exchangeRate = DEFAULT_RATES.SGD;
                    if (rateEl) { rateEl.value = DEFAULT_RATES.SGD; rateEl.disabled = false; }
                } else if (state.currency === 'USD') {
                    state.exchangeRate = DEFAULT_RATES.USD;
                    if (rateEl) { rateEl.value = DEFAULT_RATES.USD; rateEl.disabled = false; }
                }
            }
            if (rateEl && !rateEl.disabled) state.exchangeRate = parseFloat(rateEl.value) || DEFAULT_RATES.SGD;
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

    // ══════════════════════════════════════════════════════════
    //  Legacy Compat Functions (Sunroom/Pergola + old UI)
    // ══════════════════════════════════════════════════════════

    function selectStep4SKU(projectId, skuKey) {
        var state = getStep4State(projectId);
        state.selectedSKU = skuKey;
        if (state.openings) {
            for (var i = 0; i < state.openings.length; i++) {
                state.openings[i].sku = skuKey;
                state.openings[i].unitPrice = _lookupUnitPrice(skuKey, Math.max(state.openings[i].area, zbBusinessParams.minBillableArea || 3));
            }
        }
        state.costSummary = calcStep4Cost(allProjectsData.find(function(p) { return p.id === projectId; }), state);
        refreshStep4Panel(projectId);
        saveStep4ToDBAuto(projectId, state);
    }

    function selectStep4Quote(projectId, level) {
        var state = getStep4State(projectId);
        state.selectedQuote = level;
        state.costSummary = calcStep4Cost(allProjectsData.find(function(p) { return p.id === projectId; }), state);
        refreshStep4Panel(projectId);
    }

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

    // ══════════════════════════════════════════════════════════
    //  UI: Refresh Panel (v3.0 — dynamic rendering)
    // ══════════════════════════════════════════════════════════

    function refreshStep4Panel(projectId) {
        var state = step4QuotationState[projectId];
        if (!state || !state.costSummary) return;
        var cs = state.costSummary;
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        if (!project) return;
        var isZB = project.type === 'Zip Blinds';
        var isSR = project.type === 'Sunroom';

        var curr = state.currency || 'SGD';
        var rate = state.exchangeRate || DEFAULT_RATES.SGD;
        var showForeign = curr !== 'RMB';

        if (isZB) {
            _refreshZBPanel(projectId, state, cs, curr, rate, showForeign);
        } else {
            _refreshLegacyPanel(projectId, state, cs, isSR, curr, rate, showForeign);
        }
    }

    function _refreshZBPanel(projectId, state, cs, curr, rate, showForeign) {
        // ── 1. Per-Opening Details ──
        var openingsEl = document.getElementById('step4OpeningsBody_' + projectId);
        if (openingsEl && cs.perOpeningCosts) {
            var oHtml = '<div class="flex items-center justify-between mb-2">' +
                '<span class="text-xs font-semibold text-gray-700"><i class="fas fa-th-list text-orange-400 mr-1.5"></i>Per-Opening Details</span>';
            if (cs.perOpeningCosts.length > 1) {
                oHtml += '<div class="flex gap-1">' +
                    '<button onclick="Nestopia.steps.step4.applyAllSKU(\'' + projectId + '\')" class="text-[9px] text-orange-600 hover:text-orange-800 font-medium px-1.5 py-0.5 bg-orange-50 rounded" title="Apply #1 SKU to all">Apply SKU to All</button>' +
                    '<button onclick="Nestopia.steps.step4.applyAllDrive(\'' + projectId + '\')" class="text-[9px] text-orange-600 hover:text-orange-800 font-medium px-1.5 py-0.5 bg-orange-50 rounded" title="Apply #1 Drive to all">Apply Drive to All</button>' +
                '</div>';
            }
            oHtml += '</div><div class="space-y-2.5">';

            for (var ci = 0; ci < cs.perOpeningCosts.length; ci++) {
                var poc = cs.perOpeningCosts[ci];
                var curSKU = poc.sku;
                var curDrive = poc.driveSystem;

                // SKU dropdown options
                var skuOpts = '';
                for (var si = 0; si < SKU_KEYS.length; si++) {
                    var sk = SKU_KEYS[si];
                    var skuD = zbSKUCatalog[sk];
                    var fits = (poc.widthMM <= skuD.maxWidthMM && poc.heightMM <= skuD.maxHeightMM);
                    skuOpts += '<option value="' + sk + '"' + (sk === curSKU ? ' selected' : '') +
                        (!fits ? ' class="text-gray-400"' : '') + '>' +
                        sk + (fits ? '' : ' (oversized)') + '</option>';
                }

                // Drive dropdown options (filtered by SKU compatibility)
                var skuInfo = zbSKUCatalog[curSKU] || {};
                var compatDrives = skuInfo.drives || DRIVE_KEYS;
                var driveOpts = '';
                for (var di = 0; di < DRIVE_KEYS.length; di++) {
                    var dk = DRIVE_KEYS[di];
                    var dd = zbDriveSystemCatalog[dk];
                    var isCompat = compatDrives.indexOf(dk) >= 0;
                    if (!isCompat) continue; // Only show compatible drives
                    driveOpts += '<option value="' + dk + '"' + (dk === curDrive ? ' selected' : '') + '>' +
                        dk + ' (\u00a5' + dd.price + ')</option>';
                }

                oHtml += '<div class="p-3 bg-gray-50/70 rounded-lg border border-gray-100">' +
                    // Header: number, dimensions, area
                    '<div class="flex items-center gap-2 mb-2">' +
                        '<span class="w-5 h-5 bg-orange-100 rounded flex items-center justify-center text-[9px] font-bold text-orange-600">' + poc.idx + '</span>' +
                        '<span class="text-[10px] text-gray-600 font-medium">' + poc.widthMM + ' \u00d7 ' + poc.heightMM + ' mm</span>' +
                        '<span class="text-[10px] font-semibold text-orange-600">' + poc.area.toFixed(2) + ' m\u00b2</span>' +
                        (poc.billedArea > poc.area ? '<span class="text-[9px] text-gray-400">(billed: ' + poc.billedArea.toFixed(1) + ')</span>' : '') +
                    '</div>' +
                    // Dropdowns: SKU + Drive
                    '<div class="grid grid-cols-2 gap-2 mb-2">' +
                        '<div>' +
                            '<label class="text-[9px] text-gray-400 block mb-0.5">Product SKU</label>' +
                            '<select class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] bg-white focus:ring-1 focus:ring-orange-300 focus:border-orange-300" onchange="Nestopia.steps.step4.selectOpeningSKU(\'' + projectId + '\',' + ci + ',this.value)">' + skuOpts + '</select>' +
                        '</div>' +
                        '<div>' +
                            '<label class="text-[9px] text-gray-400 block mb-0.5">Drive System</label>' +
                            '<select class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] bg-white focus:ring-1 focus:ring-orange-300 focus:border-orange-300" onchange="Nestopia.steps.step4.selectOpeningDrive(\'' + projectId + '\',' + ci + ',this.value)">' + driveOpts + '</select>' +
                        '</div>' +
                    '</div>' +
                    // Cost summary row
                    '<div class="grid grid-cols-4 gap-1 text-center">' +
                        '<div><div class="text-[8px] text-gray-400">COGS</div><div class="text-[10px] font-semibold text-gray-600">' + fmtRMB(poc.totalCOGS) + '</div></div>' +
                        '<div><div class="text-[8px] text-gray-400">Market</div><div class="text-[10px] font-semibold text-gray-600">' + fmtRMB(poc.totalMarket) + '</div></div>' +
                        '<div><div class="text-[8px] text-gray-400">Sell</div><div class="text-[10px] font-bold text-orange-600">' + fmtRMB(poc.totalPref) + '</div></div>' +
                        '<div><div class="text-[8px] text-gray-400">Drive</div><div class="text-[10px] font-semibold text-gray-600">' + fmtRMB(poc.driveSell) + '</div></div>' +
                    '</div>' +
                    // Unit price detail (collapsible small text)
                    '<div class="mt-1.5 pt-1.5 border-t border-gray-100 text-[9px] text-gray-400 flex flex-wrap gap-x-3">' +
                        '<span>Supplier: \u00a5' + poc.supplierUnit + '/m\u00b2</span>' +
                        '<span>\u00d7' + (state.businessParams.supplierDiscountRate || 0.9) + ' = \u00a5' + poc.discountedUnit.toFixed(1) + '</span>' +
                        '<span>+Ship: \u00a5' + poc.shippingUnit.toFixed(1) + '</span>' +
                        '<span>+Install: \u00a5' + poc.installUnit + '</span>' +
                        '<span>= COGS/m\u00b2: \u00a5' + poc.cogsUnit.toFixed(1) + '</span>' +
                    '</div>' +
                '</div>';
            }
            oHtml += '</div>';
            openingsEl.innerHTML = oHtml;
        }

        // ── 2. Summary ──
        var summaryEl = document.getElementById('step4SummaryBody_' + projectId);
        if (summaryEl) {
            var foreignLabel = curr !== 'RMB' ? ' (' + fmtForeign(cs.grandTotalPrefForeign, curr) + ')' : '';
            var cogsF = showForeign ? ' <span class="text-gray-400">(' + fmtForeign(cs.grandTotalCOGSForeign, curr) + ')</span>' : '';

            var sHtml = '<div class="p-3 bg-gradient-to-br from-orange-50/50 to-amber-50/30 rounded-lg border border-orange-200">' +
                '<div class="text-xs font-semibold text-gray-700 mb-2"><i class="fas fa-receipt text-orange-500 mr-1.5"></i>Quotation Summary</div>' +
                '<div class="space-y-1.5 text-[10px]">' +
                    '<div class="flex justify-between"><span class="text-gray-600">Blinds (' + (cs.perOpeningCosts ? cs.perOpeningCosts.length : 0) + ' openings)</span><span class="text-gray-700">COGS ' + fmtRMB(cs.totalCOGS) + ' \u2192 Sell ' + fmtRMB(cs.totalPref) + '</span></div>' +
                    '<div class="flex justify-between"><span class="text-gray-600">Drive Systems (' + (cs.perOpeningCosts ? cs.perOpeningCosts.length : 0) + '\u00d7)</span><span class="text-gray-700">Cost ' + fmtRMB(cs.totalDriveCost) + ' \u2192 Sell ' + fmtRMB(cs.totalDriveSell) + '</span></div>' +
                    '<div class="border-t border-orange-200 pt-1.5 mt-1.5"></div>' +
                    '<div class="flex justify-between text-xs"><span class="font-bold text-gray-800">Grand Total</span><span class="font-bold text-orange-600">' + fmtRMB(cs.grandTotalPref) + foreignLabel + '</span></div>' +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-400">COGS</span><span class="text-gray-500">' + fmtRMB(cs.grandTotalCOGS) + cogsF + '</span></div>' +
                    '<div class="flex justify-between text-[10px]"><span class="text-gray-400">Market (List Price)</span><span class="text-gray-500">' + fmtRMB(cs.grandTotalMarket) + '</span></div>' +
                '</div>' +
            '</div>';
            summaryEl.innerHTML = sHtml;
        }

        // ── 3. Profit Bar ──
        var profitEl = document.getElementById('step4ProfitBar_' + projectId);
        if (profitEl) {
            var pColor = cs.marginPct >= 25 ? 'green' : cs.marginPct >= 15 ? 'amber' : 'red';
            var profitDisplay = fmtRMB(cs.profitRaw);
            if (showForeign) profitDisplay += ' (' + fmtForeign(cs.profitForeign, curr) + ')';
            profitEl.innerHTML =
                '<div class="p-3 rounded-lg border bg-' + pColor + '-50/50 border-' + pColor + '-200">' +
                    '<div class="flex items-center justify-between text-[10px] mb-1.5">' +
                        '<span class="font-semibold text-' + pColor + '-700"><i class="fas fa-chart-line mr-1"></i>Profit Analysis</span>' +
                        '<span class="font-bold">' + cs.marginPct + '% margin</span>' +
                    '</div>' +
                    '<div class="flex items-center gap-2">' +
                        '<div class="flex-1 bg-gray-200 rounded-full h-2"><div class="h-2 rounded-full transition-all bg-' + pColor + '-500" style="width:' + Math.min(cs.marginPct * 2, 100) + '%"></div></div>' +
                        '<span class="text-[10px] font-bold text-' + pColor + '-700">' + profitDisplay + '</span>' +
                    '</div>' +
                '</div>';
        }
    }

    function _refreshLegacyPanel(projectId, state, cs, isSR, curr, rate, showForeign) {
        // ── Sunroom/Pergola — legacy refresh logic ──
        var qtyEl = document.getElementById('step4Qty_' + projectId);
        if (qtyEl) qtyEl.textContent = state.quantity;

        // Cost breakdown
        var costEl = document.getElementById('step4CostBreakdown_' + projectId);
        if (costEl) {
            var upgLabel = isSR ? 'Glass Upgrade' : 'Louver Upgrade';
            costEl.innerHTML =
                '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Materials (' + cs.tierName + ')</span><span class="font-medium text-gray-800">$' + cs.materialCost + '</span></div>' +
                (cs.upgradeCost > 0 ? '<div class="flex justify-between text-[10px]"><span class="text-gray-600">' + upgLabel + '</span><span class="font-medium text-amber-600">+$' + cs.upgradeCost + '</span></div>' : '') +
                '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Labor</span><span class="font-medium text-gray-800">$' + cs.laborCost + '</span></div>' +
                '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Equipment</span><span class="font-medium text-gray-800">$' + cs.equipmentCost + '</span></div>' +
                '<div class="flex justify-between text-[10px]"><span class="text-gray-600">Permits</span><span class="font-medium text-gray-800">$' + cs.permitCost + '</span></div>' +
                '<div class="border-t border-gray-300 pt-1.5 mt-1.5 flex justify-between text-xs"><span class="font-bold text-gray-800">Total Cost (COGS)</span><span class="font-bold text-orange-600">$' + cs.totalCostRMB + '</span></div>';
        }

        // Smart Quote cards (legacy)
        var quoteEl = document.getElementById('step4QuoteCards_' + projectId);
        if (quoteEl) {
            var qSel = state.selectedQuote;
            var qStyles = {
                conservative: { border: 'border-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', off: 'hover:border-blue-300' },
                recommended:  { border: 'border-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', off: 'hover:border-orange-300' },
                premium:      { border: 'border-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', off: 'hover:border-emerald-300' }
            };
            var qValues = {
                conservative: { label: 'Conservative', amount: '\u00a5' + cs.quoteConservative, margin: '10% margin' },
                recommended:  { label: 'Recommended',  amount: '\u00a5' + cs.quoteRecommended,  margin: '18% margin' },
                premium:      { label: 'Premium',      amount: '\u00a5' + cs.quotePremium,      margin: '35% margin' }
            };
            var qKeys = ['conservative', 'recommended', 'premium'];
            quoteEl.innerHTML = qKeys.map(function(key) {
                var s = qStyles[key]; var v = qValues[key]; var sel = qSel === key;
                var extra = key === 'recommended' ? '<div class="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">BEST</div>' : '';
                return '<div onclick="Nestopia.steps.step4.selectQuote(\'' + projectId + '\',\'' + key + '\')" class="cursor-pointer p-2.5 rounded-lg border-2 transition text-center ' + (key === 'recommended' ? 'relative ' : '') + (sel ? s.border + ' ' + s.bg + ' shadow-sm' : 'border-gray-200 ' + s.off) + '">' +
                    extra + '<div class="text-[9px] text-gray-500 font-medium">' + v.label + '</div>' +
                    '<div class="text-sm font-bold ' + (sel ? s.text : 'text-gray-800') + '">' + v.amount + '</div>' +
                    '<div class="text-[9px] text-gray-400">' + v.margin + '</div></div>';
            }).join('');
        }

        // Profit bar (legacy)
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
                    '<span class="text-[10px] font-bold text-' + pColor + '-700">\u00a5' + cs.profit + ' net</span>' +
                '</div>';
        }

        // Tier cards (legacy)
        var tierEl = document.getElementById('step4TierCards_' + projectId);
        if (tierEl) {
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

    // ══════════════════════════════════════════════════════════
    //  Loading Indicators
    // ══════════════════════════════════════════════════════════

    function showInheritedLoading(projectId) {
        var summaryEl = document.getElementById('step4InheritedSummary_' + projectId);
        if (!summaryEl) return;
        summaryEl.innerHTML =
            '<div class="flex items-center gap-2 mb-2">' +
                '<i class="fas fa-arrow-right text-orange-500 text-[10px]"></i>' +
                '<span class="text-xs font-semibold text-orange-700">Inherited from Measurement</span>' +
                '<span class="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium animate-pulse">' +
                    '<i class="fas fa-spinner fa-spin mr-1"></i>Loading...' +
                '</span>' +
            '</div>' +
            '<div class="space-y-2 animate-pulse">' +
                '<div class="flex items-center gap-3"><div class="w-4 h-4 bg-gray-200 rounded"></div><div class="h-3 bg-gray-200 rounded w-24"></div><div class="h-3 bg-gray-200 rounded w-20"></div><div class="h-3 bg-gray-200 rounded w-14"></div></div>' +
                '<div class="flex items-center gap-3"><div class="w-4 h-4 bg-gray-200 rounded"></div><div class="h-3 bg-gray-200 rounded w-28"></div><div class="h-3 bg-gray-200 rounded w-16"></div><div class="h-3 bg-gray-200 rounded w-14"></div></div>' +
            '</div>';
    }

    function showPanelLoading(projectId) {
        var panel = document.getElementById('step4QuotationPanel_' + projectId);
        if (!panel) return;
        if (panel.querySelector('.step4-loading-overlay')) return;
        var overlay = document.createElement('div');
        overlay.className = 'step4-loading-overlay absolute inset-0 bg-white/80 backdrop-blur-[1px] rounded-lg flex items-center justify-center z-10';
        overlay.innerHTML =
            '<div class="flex items-center gap-2 text-xs text-gray-500">' +
                '<i class="fas fa-spinner fa-spin text-orange-500"></i>' +
                '<span>Loading measurement data...</span>' +
            '</div>';
        panel.style.position = 'relative';
        panel.appendChild(overlay);
    }

    function hidePanelLoading(projectId) {
        var panel = document.getElementById('step4QuotationPanel_' + projectId);
        if (!panel) return;
        var overlay = panel.querySelector('.step4-loading-overlay');
        if (overlay) overlay.remove();
    }

    // ══════════════════════════════════════════════════════════
    //  Refresh Inherited Measurement Summary
    // ══════════════════════════════════════════════════════════

    function refreshInheritedMeasurement(projectId) {
        delete step4QuotationState[projectId];
        var state = getStep4State(projectId);
        var summaryEl = document.getElementById('step4InheritedSummary_' + projectId);
        if (!summaryEl) return;

        var badge = '<div class="flex items-center gap-2 mb-2">' +
            '<i class="fas fa-arrow-right text-orange-500 text-[10px]"></i>' +
            '<span class="text-xs font-semibold text-orange-700">Inherited from Measurement</span>' +
            '<span class="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">' +
                state.quantity + ' opening' + (state.quantity > 1 ? 's' : '') +
            '</span></div>';

        var body = '';
        if (state.openings && state.openings.length > 1) {
            body = '<div class="space-y-1.5">';
            for (var i = 0; i < state.openings.length; i++) {
                var op = state.openings[i];
                body += '<div class="flex items-center gap-3 text-[10px]">' +
                    '<span class="w-4 h-4 bg-indigo-100 rounded flex items-center justify-center text-[9px] font-bold text-indigo-600">' + (i + 1) + '</span>' +
                    '<span class="text-gray-600">' + op.widthIn + '" \u00d7 ' + op.heightIn + '"</span>' +
                    '<span class="text-gray-500">' + op.widthMM + 'mm \u00d7 ' + op.heightMM + 'mm</span>' +
                    '<span class="text-orange-600 font-semibold">' + op.area.toFixed(2) + ' m\u00b2</span>' +
                    '<span class="text-[9px] text-gray-400 ml-auto">' + op.sku + '</span>' +
                '</div>';
            }
            body += '<div class="border-t border-orange-200 pt-1.5 mt-1 flex items-center gap-3 text-[10px]">' +
                '<span class="w-4 h-4"></span>' +
                '<span class="text-gray-700 font-semibold">Total Area</span>' +
                '<span class="text-orange-700 font-bold">' + state.totalArea.toFixed(2) + ' m\u00b2</span>' +
            '</div></div>';
        } else {
            var first = state.openings ? state.openings[0] : null;
            body = '<div class="grid grid-cols-4 gap-3 text-center">' +
                '<div><div class="text-[10px] text-gray-500">Openings</div><div class="text-sm font-bold text-gray-800">' + state.quantity + '</div></div>' +
                '<div><div class="text-[10px] text-gray-500">Width</div><div class="text-sm font-bold text-gray-800">' + (first ? first.widthIn : '72') + '"</div></div>' +
                '<div><div class="text-[10px] text-gray-500">Height</div><div class="text-sm font-bold text-gray-800">' + (first ? first.heightIn : '96') + '"</div></div>' +
                '<div><div class="text-[10px] text-gray-500">Area</div><div class="text-sm font-bold text-orange-600">' + (state.unitArea ? state.unitArea.toFixed(2) : '0.00') + ' m\u00b2</div></div>' +
            '</div>';
        }

        summaryEl.innerHTML = badge + body;
        hidePanelLoading(projectId);
        console.log('[Quotation] Inherited measurement refreshed:', state.quantity, 'openings');
    }

    // ══════════════════════════════════════════════════════════
    //  Namespace Exports
    // ══════════════════════════════════════════════════════════

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
        refreshInheritedMeasurement: refreshInheritedMeasurement,
        showInheritedLoading: showInheritedLoading,
        showPanelLoading:    showPanelLoading,
        hidePanelLoading:    hidePanelLoading,
        // v3.0 new exports
        selectOpeningSKU:    selectOpeningSKU,
        selectOpeningDrive:  selectOpeningDrive,
        updateParam:         updateBusinessParam,
        resetParams:         resetBusinessParams,
        applyAllSKU:         applyAllSKU,
        applyAllDrive:       applyAllDrive,
        // Legacy compat
        toggleMode:         toggleStep4Mode,
        selectTier:         selectStep4Tier,
        adjustQty:          adjustStep4Qty
    };

    // ── Global Aliases ──
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
    window.refreshInheritedMeasurement = refreshInheritedMeasurement;
    window.showInheritedLoading  = showInheritedLoading;

    console.log('[Nestopia] step4-quotation.js v3.0 loaded \u2014 Profit Calculation Engine');
})();
