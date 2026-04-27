/**
 * Nestopia - Quotation Editor
 * 命名空间: Nestopia.utils.quotEditor
 *
 * 报价编辑器：行项目管理、配件管理、保存/加载（localStorage + Supabase 同步）、
 * 多产品类型（Zip Blinds / Sunroom / Pergola）、预览/打印 HTML 生成。
 *
 * 外部依赖（由其他模块提供）:
 *   - workflowProjects, allProjectsData
 *   - getStep4State, loadStep4FromDB, saveQuotListToDB
 *   - _quotDbLoaded (declared in step4 DB helpers)
 *   - getTenantLanguage, getCurrentTenantSlug, tenantConfigs
 *   - getQuotText, getLocalizedName
 *   - showToast
 *   - NestopiaDB
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.utils = N.utils || {};

    // ===== Quotation Editor =====
    var quotLineItemsData = [];
    var quotAccessoriesData = [];
    var quotCurrentProjectId = null;

    // ★ v3.0: ZB price lookup — dynamically built from zbSKUCatalog (pricing-data.js)
    // Uses preferential selling price (市场价 × 优惠折扣) as consumer-facing unit price
    var _pricingData = (window.Nestopia && Nestopia.data && Nestopia.data.pricing) ? Nestopia.data.pricing : {};
    var _skuCatalog = _pricingData.zbSKUCatalog || {};
    var _driveCatalog = _pricingData.zbDriveSystemCatalog || {};
    var _bizParams = _pricingData.zbBusinessParams || {};
    var _calcOpeningCostFn = _pricingData.calcOpeningCost || null;
    var _calcAccPriceFn = _pricingData.calcAccessoryPrice || function(p) { return Math.round(p * 1.13); };

    var zbPriceLookup = {};
    var _skuKeys = Object.keys(_skuCatalog);
    _skuKeys.forEach(function(key) {
        var sku = _skuCatalog[key];
        // Calculate preferential unit price for a typical 6m² opening
        var prefUnit = 0;
        if (_calcOpeningCostFn) {
            var oc = _calcOpeningCostFn(key, 2000, 3000, _bizParams); // 2m × 3m = 6m²
            prefUnit = oc ? oc.prefUnit : sku.priceTiers[0].price;
        } else {
            prefUnit = sku.priceTiers[0].price;
        }
        var label = key + ' ' + sku.nameZh + ' / ' + sku.name;
        zbPriceLookup[label] = { defaultPrice: Math.round(prefUnit), model: key, skuKey: key };
    });
    var zbProductNames = Object.keys(zbPriceLookup);

    // ★ v3.0: Accessory presets — drive systems from catalog + common accessories
    var zbAccessoryPresets = [];
    Object.keys(_driveCatalog).forEach(function(dk) {
        var d = _driveCatalog[dk];
        var sellPrice = _calcAccPriceFn(d.price, _bizParams);
        zbAccessoryPresets.push({ name: dk + ' ' + d.nameZh + ' / ' + d.name, spec: d.type, defaultPrice: sellPrice });
    });
    // Common non-drive accessories
    zbAccessoryPresets.push({ name: 'WR120 \u8f6c\u89d2\u7acb\u67f1 / Corner Post', spec: '', defaultPrice: _calcAccPriceFn(180, _bizParams) });
    zbAccessoryPresets.push({ name: '\u65b9\u7ba1\u7acb\u67f1 / Square Tube Post', spec: '', defaultPrice: _calcAccPriceFn(120, _bizParams) });
    zbAccessoryPresets.push({ name: '\u591a\u9891\u9065\u63a7\u5668 / Multi-Frequency Remote', spec: '', defaultPrice: _calcAccPriceFn(45, _bizParams) });
    zbAccessoryPresets.push({ name: '\u5b89\u88c5\u8d39 / Installation Fee', spec: '', defaultPrice: 0 });

    // ===== Multi-Product-Type Quotation Support =====
    var sunroomPriceLookup = {
        'Screen Room / \u7eb1\u7a97\u9633\u5149\u623f': { defaultPrice: 1500, model: 'SR-SCREEN' },
        '3-Season Sunroom / \u4e09\u5b63\u9633\u5149\u623f': { defaultPrice: 2500, model: 'SR-3S' },
        '4-Season Sunroom / \u56db\u5b63\u9633\u5149\u623f (Low-E)': { defaultPrice: 3800, model: 'SR-4S' },
        '4-Season Sunroom / \u56db\u5b63\u9633\u5149\u623f (Insulated)': { defaultPrice: 4500, model: 'SR-4S-INS' }
    };
    var sunroomProductNames = Object.keys(sunroomPriceLookup);
    var sunroomAccessoryPresets = [
        { name: 'Roof System / \u5c4b\u9876\u7cfb\u7edf', spec: '', defaultPrice: 0 },
        { name: 'Foundation / \u5730\u57fa\u57fa\u7840', spec: '', defaultPrice: 0 },
        { name: 'Electrical / \u7535\u6c14\u5e03\u7ebf', spec: '', defaultPrice: 0 },
        { name: 'HVAC System / \u6696\u901a\u7a7a\u8c03', spec: '', defaultPrice: 0 },
        { name: 'Installation Fee / \u5b89\u88c5\u8d39', spec: '', defaultPrice: 0 }
    ];

    var pergolaPriceLookup = {
        'Motorized Louvered Pergola / \u7535\u52a8\u767e\u53f6\u51c9\u4ead': { defaultPrice: 2200, model: 'PG-LOUVER' },
        'Fixed Pergola / \u56fa\u5b9a\u51c9\u4ead': { defaultPrice: 1200, model: 'PG-FIXED' },
        'Retractable Pergola / \u53ef\u4f38\u7f29\u51c9\u4ead': { defaultPrice: 1800, model: 'PG-RETRACT' }
    };
    var pergolaProductNames = Object.keys(pergolaPriceLookup);
    var pergolaAccessoryPresets = [
        { name: 'LED Lighting / LED\u706f\u5149\u7cfb\u7edf', spec: '', defaultPrice: 0 },
        { name: 'Rain Sensor / \u96e8\u91cf\u4f20\u611f\u5668', spec: '', defaultPrice: 0 },
        { name: 'Side Screens / \u4fa7\u9762\u7eb1\u7f51', spec: '', defaultPrice: 0 },
        { name: 'Installation Fee / \u5b89\u88c5\u8d39', spec: '', defaultPrice: 0 }
    ];

    var quotProductType = 'zipblinds';

    function getQuotProductNames() {
        if (quotProductType === 'sunroom') return sunroomProductNames;
        if (quotProductType === 'pergola') return pergolaProductNames;
        return zbProductNames;
    }
    function getQuotPriceLookup() {
        if (quotProductType === 'sunroom') return sunroomPriceLookup;
        if (quotProductType === 'pergola') return pergolaPriceLookup;
        return zbPriceLookup;
    }
    function getQuotAccessoryPresets() {
        if (quotProductType === 'sunroom') return sunroomAccessoryPresets;
        if (quotProductType === 'pergola') return pergolaAccessoryPresets;
        return zbAccessoryPresets;
    }
    function getQuotTypeTitle(lang) {
        if (quotProductType === 'sunroom') return lang === 'en' ? 'Sunroom Quotation' : '\u9633\u5149\u623f\u62a5\u4ef7\u5355 / Sunroom Quotation';
        if (quotProductType === 'pergola') return lang === 'en' ? 'Pergola Quotation' : '\u51c9\u4ead\u62a5\u4ef7\u5355 / Pergola Quotation';
        return lang === 'en' ? 'Zip Blinds Quotation' : '\u9632\u98ce\u5377\u5e18\u62a5\u4ef7\u5355 / Zip Blinds Quotation';
    }

    function openQuotationEditor(projectId) {
        quotCurrentProjectId = projectId;
        // Search both workflow projects and company overview projects
        var project = workflowProjects.find(function(p) { return p.id === projectId; });
        if (!project && typeof allProjectsData !== 'undefined') {
            project = allProjectsData.find(function(p) { return p.id === projectId; });
        }
        if (!project) return;

        // Detect product type from project
        var ptype = (project.type || '').toLowerCase();
        if (ptype.indexOf('sunroom') >= 0 || ptype.indexOf('sun room') >= 0) {
            quotProductType = 'sunroom';
        } else if (ptype.indexOf('pergola') >= 0) {
            quotProductType = 'pergola';
        } else {
            quotProductType = 'zipblinds';
        }

        // Apply i18n labels based on tenant language
        applyQuotI18nLabels();
        // Override title with product-type-specific text
        document.getElementById('quotModalTitleText').textContent = getQuotTypeTitle(getTenantLanguage());

        // Set language-aware defaults
        var lang = getTenantLanguage();
        if (lang === 'en') {
            document.getElementById('quotProfileColor').value = 'Coffee';
            document.getElementById('quotFabric').value = 'Polyester+PVC, 5% openness';
            document.getElementById('quotFabricColor').placeholder = 'e.g. NP33054060SP';
        } else {
            document.getElementById('quotProfileColor').value = '\u5496\u5561\u8272 / Coffee';
            document.getElementById('quotFabric').value = '\u805a\u916f\u7ea4\u7ef4+PVC, 5%\u5f00\u5b54\u7387';
            document.getElementById('quotFabricColor').placeholder = 'e.g. NP33054060SP \u9ed1\u5496\u8272';
        }
        // Override material labels/defaults for non-Zip-Blinds products
        if (quotProductType === 'sunroom') {
            document.getElementById('quotLabelProfileColor').textContent = lang === 'en' ? 'Frame Color' : '\u6846\u67b6\u989c\u8272 / Frame Color';
            document.getElementById('quotLabelFabric').textContent = lang === 'en' ? 'Glass Type' : '\u73bb\u7483\u7c7b\u578b / Glass Type';
            document.getElementById('quotProfileColor').value = lang === 'en' ? 'White' : '\u767d\u8272 / White';
            document.getElementById('quotFabric').value = lang === 'en' ? 'Tempered Low-E Glass' : '\u94a2\u5316Low-E\u73bb\u7483 / Tempered Low-E';
            document.getElementById('quotFabricColor').placeholder = 'e.g. Clear, Tinted, Reflective';
        } else if (quotProductType === 'pergola') {
            document.getElementById('quotLabelProfileColor').textContent = lang === 'en' ? 'Frame Color' : '\u6846\u67b6\u989c\u8272 / Frame Color';
            document.getElementById('quotLabelFabric').textContent = lang === 'en' ? 'Louver Material' : '\u767e\u53f6\u6750\u8d28 / Louver Material';
            document.getElementById('quotProfileColor').value = lang === 'en' ? 'Dark Gray' : '\u6df1\u7070\u8272 / Dark Gray';
            document.getElementById('quotFabric').value = lang === 'en' ? 'Aluminum Alloy' : '\u94dd\u5408\u91d1 / Aluminum Alloy';
            document.getElementById('quotFabricColor').placeholder = 'e.g. RAL7016';
        }
        document.getElementById('quotRemarks').value = getQuotText('defaultRemarks');
        var currSel = document.getElementById('quotCurrency');
        if (currSel) {
            currSel.innerHTML = '<option value="SGD">' + getQuotText('optSGD') + '</option>' +
                '<option value="RMB">' + getQuotText('optRMB') + '</option>' +
                '<option value="USD">' + getQuotText('optUSD') + '</option>';
        }
        // Default exchange rate to SGD
        var rateEl = document.getElementById('quotExchangeRate');
        if (rateEl && (!rateEl.value || rateEl.value === '1' || rateEl.value === '5.3937')) {
            rateEl.value = (_pricingData.defaultExchangeRates && _pricingData.defaultExchangeRates.SGD) || 5.3612;
        }

        // Auto-fill client info (handle both data source field names)
        document.getElementById('quotProjectRef').textContent = project.name + ' (' + project.id + ')';
        document.getElementById('quotClientName').value = project.customer || '';
        document.getElementById('quotClientPhone').value = project.phone || project.customerPhone || '';
        document.getElementById('quotCSRep').value = '';

        // Populate line items from per-opening measurement data (v3.0)
        var step4St = typeof getStep4State === 'function' ? getStep4State(projectId) : null;
        if (step4St && step4St.openings && step4St.openings.length > 0 && quotProductType === 'zipblinds') {
            quotLineItemsData = step4St.openings.map(function(op, idx) {
                var wMM = Math.round(op.widthIn * 25.4);
                var hMM = Math.round(op.heightIn * 25.4);
                var skuKey = op.sku || 'WR100A-63';
                // Find matching product name in zbPriceLookup
                var matchedName = getQuotProductNames()[0];
                var allNames = getQuotProductNames();
                for (var pn = 0; pn < allNames.length; pn++) {
                    var lk = getQuotPriceLookup()[allNames[pn]];
                    if (lk && lk.skuKey === skuKey) { matchedName = allNames[pn]; break; }
                }
                var unitPrice = getQuotPriceLookup()[matchedName] ? getQuotPriceLookup()[matchedName].defaultPrice : 0;
                // Use per-opening preferential unit price if available from cost summary
                var cs = step4St.costSummary;
                if (cs && cs.perOpeningCosts && cs.perOpeningCosts[idx]) {
                    unitPrice = Math.round(cs.perOpeningCosts[idx].prefUnit);
                }
                return { product: matchedName, width: wMM, height: hMM, unitPrice: unitPrice, qty: 1 };
            });
            // Auto-add drive systems as accessories
            quotAccessoriesData = [];
            step4St.openings.forEach(function(op, idx) {
                var driveKey = op.driveSystem || 'AOK-45';
                var driveData = _driveCatalog[driveKey];
                if (driveData) {
                    var driveName = driveKey + ' ' + driveData.nameZh + ' / ' + driveData.name;
                    var bp = step4St.businessParams || _bizParams;
                    var sellPrice = _calcAccPriceFn(driveData.price, bp);
                    quotAccessoriesData.push({ name: driveName, spec: '#' + (idx + 1), unitPrice: sellPrice, qty: 1 });
                }
            });
        } else {
            quotLineItemsData = [{ product: getQuotProductNames()[0], width: 3000, height: 2500, unitPrice: getQuotPriceLookup()[getQuotProductNames()[0]].defaultPrice, qty: 1 }];
            quotAccessoriesData = [];
        }
        renderQuotLineItems();
        renderQuotAccessories();
        updateQuotTotals();

        // Close project detail modal if open, then show quotation editor
        var detailModal = document.getElementById('projectDetailModal');
        if (detailModal) detailModal.classList.add('hidden');
        document.getElementById('quotationModal').classList.remove('hidden');
        // Populate load dropdown with saved quotations for this project
        refreshQuotLoadDropdown(projectId);
    }

    function closeQuotationEditor() {
        document.getElementById('quotationModal').classList.add('hidden');
        document.body.style.overflow = '';
        // Close load dropdown if open
        var dd = document.getElementById('quotLoadDropdown');
        if (dd) dd.classList.add('hidden');
    }

    /** Apply i18n labels to the quotation editor modal */
    function applyQuotI18nLabels() {
        var m = {
            'quotModalTitleText':'modalTitle','quotLabelClient':'labelClient','quotLabelContact':'labelContact',
            'quotLabelCS':'labelCS','quotLabelProfileColor':'labelProfileColor','quotLabelFabric':'labelFabric',
            'quotLabelFabricColor':'labelFabricColor','quotLabelProductItems':'labelProductItems',
            'quotBtnAddRow':'btnAddRow','quotThProduct':'thProduct','quotThWidth':'thWidth',
            'quotThHeight':'thHeight','quotThArea':'thArea','quotThUnitPrice':'thUnitPrice',
            'quotThQty':'thQty','quotThAmount':'thAmount','quotLabelAccessories':'labelAccessories',
            'quotBtnAddAccessory':'btnAddAccessory','quotThAccItem':'thAccItem','quotThAccSpec':'thAccSpec',
            'quotThAccUnitPrice':'thAccUnitPrice','quotThAccQty':'thAccQty','quotThAccAmount':'thAccAmount',
            'quotLabelCurrency':'labelCurrency','quotLabelExchangeRate':'labelExchangeRate',
            'quotLabelRemarks':'labelRemarks','quotLabelSummary':'labelSummary',
            'quotLabelSubProducts':'labelSubProducts','quotLabelSubAccessories':'labelSubAccessories',
            'quotLabelTotalRMB':'labelTotalRMB','quotLabelTotalForeign':'labelTotalForeign',
            'quotLabelDiscount':'labelDiscount','quotFooterNote':'footerNote'
        };
        Object.keys(m).forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.textContent = getQuotText(m[id]);
        });
    }

    // ===== Quotation Save / Load (localStorage) =====
    function getQuotStorageKey(projectId) {
        var tenant = typeof getCurrentTenantSlug === 'function' ? getCurrentTenantSlug() : 'default';
        return 'nestopia_quotations_' + tenant + '_' + projectId;
    }

    function getAllSavedQuotations(projectId) {
        try {
            var key = getQuotStorageKey(projectId);
            var data = localStorage.getItem(key);
            var localList = data ? JSON.parse(data) : [];
            // 首次调用时从 Supabase 补充（异步，下次调用生效）
            if (!_quotDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                _quotDbLoaded[projectId] = true;
                loadStep4FromDB(projectId).then(function(dbData) {
                    if (dbData && dbData.savedQuotations && Array.isArray(dbData.savedQuotations)) {
                        var localKey = getQuotStorageKey(projectId);
                        var existingRaw = localStorage.getItem(localKey);
                        var existingList = existingRaw ? JSON.parse(existingRaw) : [];
                        var existingIds = {};
                        existingList.forEach(function(q) { existingIds[q.id] = true; });
                        var merged = existingList.slice();
                        dbData.savedQuotations.forEach(function(q) {
                            if (!existingIds[q.id]) merged.push(q);
                        });
                        // 按时间倒序
                        merged.sort(function(a, b) { return new Date(b.savedAt) - new Date(a.savedAt); });
                        if (merged.length > 20) merged = merged.slice(0, 20);
                        localStorage.setItem(localKey, JSON.stringify(merged));
                        console.log('[Quotation] Synced', dbData.savedQuotations.length, 'quotations from Supabase');
                        refreshQuotLoadDropdown(projectId);
                    }
                });
            }
            return localList;
        } catch(e) { return []; }
    }

    function saveQuotation() {
        if (!quotCurrentProjectId) { showToast('No project selected', 'error'); return; }
        var quotation = {
            id: 'Q-' + Date.now(),
            savedAt: new Date().toISOString(),
            projectId: quotCurrentProjectId,
            clientName: document.getElementById('quotClientName').value,
            clientPhone: document.getElementById('quotClientPhone').value,
            csRep: document.getElementById('quotCSRep').value,
            profileColor: document.getElementById('quotProfileColor').value,
            fabric: document.getElementById('quotFabric').value,
            fabricColor: document.getElementById('quotFabricColor').value,
            currency: document.getElementById('quotCurrency').value,
            exchangeRate: parseFloat(document.getElementById('quotExchangeRate').value),
            discount: parseFloat(document.getElementById('quotDiscount').value) || 0,
            remarks: document.getElementById('quotRemarks').value,
            lineItems: JSON.parse(JSON.stringify(quotLineItemsData)),
            accessories: JSON.parse(JSON.stringify(quotAccessoriesData))
        };
        var list = getAllSavedQuotations(quotCurrentProjectId);
        list.unshift(quotation);
        if (list.length > 20) list = list.slice(0, 20);
        try {
            localStorage.setItem(getQuotStorageKey(quotCurrentProjectId), JSON.stringify(list));
            showToast('Quotation saved \u2713', 'success');
            refreshQuotLoadDropdown(quotCurrentProjectId);
            // 同步到 Supabase
            saveQuotListToDB(quotCurrentProjectId, list);
            // ★ 自动推进: 报价保存后尝试推进到 Step 3
            if (typeof checkAndAdvanceZBStep === 'function') {
                setTimeout(function() { checkAndAdvanceZBStep(quotCurrentProjectId); }, 500);
            }
        } catch(e) {
            showToast('Failed to save: storage full', 'error');
        }
    }

    function loadQuotation(quotId) {
        if (!quotCurrentProjectId) return;
        var list = getAllSavedQuotations(quotCurrentProjectId);
        var q = list.find(function(item) { return item.id === quotId; });
        if (!q) { showToast('Quotation not found', 'error'); return; }
        document.getElementById('quotClientName').value = q.clientName || '';
        document.getElementById('quotClientPhone').value = q.clientPhone || '';
        document.getElementById('quotCSRep').value = q.csRep || '';
        document.getElementById('quotProfileColor').value = q.profileColor || '';
        document.getElementById('quotFabric').value = q.fabric || '';
        document.getElementById('quotFabricColor').value = q.fabricColor || '';
        document.getElementById('quotCurrency').value = q.currency || 'RMB';
        document.getElementById('quotExchangeRate').value = q.exchangeRate || 5.3937;
        document.getElementById('quotDiscount').value = q.discount || 0;
        document.getElementById('quotRemarks').value = q.remarks || '';
        quotLineItemsData = q.lineItems ? JSON.parse(JSON.stringify(q.lineItems)) : [];
        quotAccessoriesData = q.accessories ? JSON.parse(JSON.stringify(q.accessories)) : [];
        renderQuotLineItems();
        renderQuotAccessories();
        updateQuotTotals();
        showToast('Loaded: ' + q.id, 'success');
    }

    function deleteQuotation(quotId) {
        if (!quotCurrentProjectId) return;
        var list = getAllSavedQuotations(quotCurrentProjectId);
        list = list.filter(function(item) { return item.id !== quotId; });
        localStorage.setItem(getQuotStorageKey(quotCurrentProjectId), JSON.stringify(list));
        refreshQuotLoadDropdown(quotCurrentProjectId);
        showToast('Quotation deleted', 'info');
    }

    function refreshQuotLoadDropdown(projectId) {
        var container = document.getElementById('quotLoadDropdownList');
        if (!container) return;
        var list = getAllSavedQuotations(projectId);
        var badge = document.getElementById('quotSavedCount');
        if (badge) {
            badge.textContent = list.length;
            badge.style.display = list.length > 0 ? 'inline-flex' : 'none';
        }
        if (list.length === 0) {
            container.innerHTML = '<div class="px-4 py-3 text-sm text-gray-400 text-center">No saved quotations</div>';
            return;
        }
        var html = '';
        list.forEach(function(q) {
            var d = new Date(q.savedAt);
            var dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0') + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
            var itemCount = (q.lineItems ? q.lineItems.length : 0) + ' items';
            var total = 0;
            if (q.lineItems) q.lineItems.forEach(function(li) { total += (li.width * li.height / 1000000) * li.unitPrice * li.qty; });
            if (q.accessories) q.accessories.forEach(function(a) { total += a.unitPrice * a.qty; });
            total = total * (1 - (q.discount || 0) / 100);
            html += '<div class="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 transition group">' +
                '<button onclick="Nestopia.utils.quotEditor.loadQuotation(\'' + q.id + '\'); Nestopia.utils.quotEditor.toggleQuotLoadDropdown();" class="flex-1 text-left">' +
                    '<div class="text-sm font-medium text-gray-800">' + dateStr + '</div>' +
                    '<div class="text-xs text-gray-500">' + itemCount + (q.clientName ? ' &middot; ' + q.clientName : '') + ' &middot; &yen;' + total.toFixed(0) + (q.discount > 0 ? ' (' + q.discount + '% off)' : '') + '</div>' +
                '</button>' +
                '<button onclick="event.stopPropagation(); Nestopia.utils.quotEditor.deleteQuotation(\'' + q.id + '\');" class="opacity-0 group-hover:opacity-100 ml-2 w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete"><i class="fas fa-trash-alt text-xs"></i></button>' +
            '</div>';
        });
        container.innerHTML = html;
    }

    function toggleQuotLoadDropdown() {
        var dd = document.getElementById('quotLoadDropdown');
        if (dd) dd.classList.toggle('hidden');
    }

    function addQuotLineItem() {
        quotLineItemsData.push({ product: getQuotProductNames()[0], width: 3000, height: 2500, unitPrice: getQuotPriceLookup()[getQuotProductNames()[0]].defaultPrice, qty: 1 });
        renderQuotLineItems();
        updateQuotTotals();
    }

    function removeQuotLineItem(idx) {
        quotLineItemsData.splice(idx, 1);
        renderQuotLineItems();
        updateQuotTotals();
    }

    function addQuotAccessory() {
        var preset = getQuotAccessoryPresets()[0];
        quotAccessoriesData.push({ name: preset.name, spec: preset.spec, unitPrice: preset.defaultPrice, qty: 1 });
        renderQuotAccessories();
        updateQuotTotals();
    }

    function removeQuotAccessory(idx) {
        quotAccessoriesData.splice(idx, 1);
        renderQuotAccessories();
        updateQuotTotals();
    }

    function calcArea(w, h) { return (w * h) / 1000000; }

    function renderQuotLineItems() {
        var tbody = document.getElementById('quotLineItems');
        if (!tbody) return;
        var lang = getTenantLanguage();
        var optionsHtml = getQuotProductNames().map(function(n) { return '<option value="' + n + '">' + getLocalizedName(n, lang) + '</option>'; }).join('');
        tbody.innerHTML = quotLineItemsData.map(function(item, i) {
            var area = calcArea(item.width, item.height);
            var amount = area * item.unitPrice * item.qty;
            return '<tr class="border-t border-gray-100 hover:bg-blue-50/30">' +
                '<td class="py-2 px-3 text-gray-400 text-xs">' + (i + 1) + '</td>' +
                '<td class="py-2 px-3"><select onchange="quotLineItemsData[' + i + '].product=this.value;var lk=getQuotPriceLookup()[this.value];if(lk){quotLineItemsData[' + i + '].unitPrice=lk.defaultPrice;renderQuotLineItems();updateQuotTotals();}" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400">' + optionsHtml.replace('value="' + item.product + '"', 'value="' + item.product + '" selected') + '</select></td>' +
                '<td class="py-2 px-3"><input type="number" value="' + item.width + '" onchange="quotLineItemsData[' + i + '].width=Number(this.value);renderQuotLineItems();updateQuotTotals();" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-blue-400"></td>' +
                '<td class="py-2 px-3"><input type="number" value="' + item.height + '" onchange="quotLineItemsData[' + i + '].height=Number(this.value);renderQuotLineItems();updateQuotTotals();" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-blue-400"></td>' +
                '<td class="py-2 px-3 text-center text-xs font-medium text-gray-700">' + area.toFixed(2) + '</td>' +
                '<td class="py-2 px-3"><input type="number" value="' + item.unitPrice + '" step="1" onchange="quotLineItemsData[' + i + '].unitPrice=Number(this.value);renderQuotLineItems();updateQuotTotals();" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-blue-400"></td>' +
                '<td class="py-2 px-3"><input type="number" value="' + item.qty + '" min="1" onchange="quotLineItemsData[' + i + '].qty=Number(this.value);renderQuotLineItems();updateQuotTotals();" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-blue-400"></td>' +
                '<td class="py-2 px-3 text-right text-xs font-semibold text-gray-900">' + amount.toFixed(2) + '</td>' +
                '<td class="py-2 px-3"><button onclick="Nestopia.utils.quotEditor.removeQuotLineItem(' + i + ')" class="text-red-400 hover:text-red-600 transition"><i class="fas fa-trash-alt text-xs"></i></button></td></tr>';
        }).join('');
    }

    function renderQuotAccessories() {
        var tbody = document.getElementById('quotAccessories');
        if (!tbody) return;
        var lang = getTenantLanguage();
        var presetOpts = getQuotAccessoryPresets().map(function(p) { return '<option value="' + p.name + '">' + getLocalizedName(p.name, lang) + '</option>'; }).join('') + '<option value="__custom">' + getQuotText('customOption') + '</option>';
        tbody.innerHTML = quotAccessoriesData.map(function(item, i) {
            var amount = item.unitPrice * item.qty;
            return '<tr class="border-t border-gray-100 hover:bg-purple-50/30">' +
                '<td class="py-2 px-3 text-gray-400 text-xs">' + (i + 1) + '</td>' +
                '<td class="py-2 px-3"><select onchange="var v=this.value;if(v===\'__custom\'){quotAccessoriesData[' + i + '].name=\'\';quotAccessoriesData[' + i + '].unitPrice=0;}else{quotAccessoriesData[' + i + '].name=v;var pr=getQuotAccessoryPresets().find(function(p){return p.name===v;});if(pr)quotAccessoriesData[' + i + '].unitPrice=pr.defaultPrice;}renderQuotAccessories();updateQuotTotals();" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-400">' + presetOpts.replace('value="' + item.name + '"', 'value="' + item.name + '" selected') + '</select></td>' +
                '<td class="py-2 px-3"><input type="text" value="' + (item.spec || '') + '" onchange="quotAccessoriesData[' + i + '].spec=this.value;" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-blue-400" placeholder="' + getQuotText('specPlaceholder') + '"></td>' +
                '<td class="py-2 px-3"><input type="number" value="' + item.unitPrice + '" step="1" onchange="quotAccessoriesData[' + i + '].unitPrice=Number(this.value);renderQuotAccessories();updateQuotTotals();" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-blue-400"></td>' +
                '<td class="py-2 px-3"><input type="number" value="' + item.qty + '" min="1" onchange="quotAccessoriesData[' + i + '].qty=Number(this.value);renderQuotAccessories();updateQuotTotals();" class="w-full px-2 py-1.5 border border-gray-200 rounded text-xs text-center focus:ring-1 focus:ring-blue-400"></td>' +
                '<td class="py-2 px-3 text-right text-xs font-semibold text-gray-900">' + amount.toFixed(2) + '</td>' +
                '<td class="py-2 px-3"><button onclick="Nestopia.utils.quotEditor.removeQuotAccessory(' + i + ')" class="text-red-400 hover:text-red-600 transition"><i class="fas fa-trash-alt text-xs"></i></button></td></tr>';
        }).join('');
    }

    function updateQuotTotals() {
        var prodTotal = 0;
        quotLineItemsData.forEach(function(item) {
            prodTotal += calcArea(item.width, item.height) * item.unitPrice * item.qty;
        });
        var accTotal = 0;
        quotAccessoriesData.forEach(function(item) { accTotal += item.unitPrice * item.qty; });

        var discount = Number(document.getElementById('quotDiscount').value) || 0;
        var grandRMB = (prodTotal + accTotal) * (1 - discount / 100);

        document.getElementById('quotSubProducts').textContent = '\u00a5' + prodTotal.toFixed(2);
        document.getElementById('quotSubAccessories').textContent = '\u00a5' + accTotal.toFixed(2);
        document.getElementById('quotTotalRMB').textContent = '\u00a5' + grandRMB.toFixed(2);

        var currency = document.getElementById('quotCurrency').value;
        var rate = Number(document.getElementById('quotExchangeRate').value) || 1;
        var foreignRow = document.getElementById('quotForeignRow');
        if (currency === 'RMB') {
            foreignRow.style.display = 'none';
        } else {
            foreignRow.style.display = '';
            var foreignAmount = grandRMB / rate;
            var symbol = currency === 'SGD' ? 'S$' : '$';
            document.getElementById('quotForeignLabel').textContent = currency;
            document.getElementById('quotTotalForeign').textContent = symbol + foreignAmount.toFixed(2);
        }
    }

    function previewQuotation() {
        var client = document.getElementById('quotClientName').value || '';
        var phone = document.getElementById('quotClientPhone').value || '';
        var csRep = document.getElementById('quotCSRep').value || '';
        var profileColor = document.getElementById('quotProfileColor').value || '';
        var fabric = document.getElementById('quotFabric').value || '';
        var fabricColor = document.getElementById('quotFabricColor').value || '';
        var currency = document.getElementById('quotCurrency').value;
        var rate = Number(document.getElementById('quotExchangeRate').value) || 1;
        var discount = Number(document.getElementById('quotDiscount').value) || 0;
        var remarks = document.getElementById('quotRemarks').value || '';
        var today = new Date();
        var dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        var tenantCfg = tenantConfigs[getCurrentTenantSlug()] || tenantConfigs['default'];
        var logoPath = window.location.origin + '/' + tenantCfg.logo;
        var lang = getTenantLanguage();
        var t = function(key) { return getQuotText(key); };

        // Build product rows (localized names)
        var prodTotal = 0;
        var prodRowsHtml = quotLineItemsData.map(function(item, i) {
            var area = calcArea(item.width, item.height);
            var amount = area * item.unitPrice * item.qty;
            prodTotal += amount;
            return '<tr>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;color:#6b7280;">' + (i + 1) + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;font-weight:500;">' + getLocalizedName(item.product, lang) + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;">' + item.width + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;">' + item.height + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-weight:500;">' + area.toFixed(2) + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;">' + item.unitPrice.toFixed(2) + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;">' + item.qty + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-weight:600;">' + amount.toFixed(2) + '</td></tr>';
        }).join('');

        // Build accessory rows
        var accTotal = 0;
        var accRowsHtml = quotAccessoriesData.map(function(item, i) {
            var amount = item.unitPrice * item.qty;
            accTotal += amount;
            return '<tr>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;color:#6b7280;">' + (quotLineItemsData.length + i + 1) + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;font-weight:500;" colspan="4">' + getLocalizedName(item.name, lang) + (item.spec ? ' (' + item.spec + ')' : '') + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;">' + item.unitPrice.toFixed(2) + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;">' + item.qty + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-weight:600;">' + amount.toFixed(2) + '</td></tr>';
        }).join('');

        var grandRMB = (prodTotal + accTotal) * (1 - discount / 100);
        var foreignSymbol = currency === 'SGD' ? 'S$' : '$';
        var foreignAmount = currency !== 'RMB' ? grandRMB / rate : 0;

        // Subtotal row
        var subtotalHtml = '';
        if (accRowsHtml) {
            subtotalHtml = '<tr style="background:#f9fafb;">' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;" colspan="7"><strong>' + t('printSubtotal') + '</strong></td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-weight:600;">\u00a5' + prodTotal.toFixed(2) + '</td></tr>';
        }

        // Total rows
        var discountNote = discount > 0 ? ' (' + t('printDiscount') + ': ' + discount + '%)' : '';
        var totalRowsHtml = '<tr style="background:#eff6ff;">' +
            '<td style="border:1px solid #d1d5db;padding:10px;font-weight:700;" colspan="7">' + t('printTotalRMB') + discountNote + '</td>' +
            '<td style="border:1px solid #d1d5db;padding:10px;text-align:right;font-weight:700;font-size:16px;color:#1e40af;">\u00a5' + grandRMB.toFixed(2) + '</td></tr>';
        if (currency !== 'RMB') {
            totalRowsHtml += '<tr style="background:#eff6ff;">' +
                '<td style="border:1px solid #d1d5db;padding:10px;font-weight:700;" colspan="7">' + t(currency === 'SGD' ? 'printTotalSGD' : 'printTotalUSD') + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:10px;text-align:right;font-weight:700;font-size:16px;color:#1e40af;">' + foreignSymbol + foreignAmount.toFixed(2) + '</td></tr>';
        }

        // Remarks HTML - bilingual
        var remarkLines = remarks.split('\n').filter(function(l) { return l.trim(); });
        var remarksHtml = remarkLines.map(function(line) {
            return '<div style="margin-bottom:4px;font-size:12px;color:#374151;line-height:1.6;">' + line + '</div>';
        }).join('');

        // Exchange rate note
        var noteIdx = remarkLines.length + 1;
        var rateNote = '';
        if (currency !== 'RMB') {
            rateNote = '<div style="margin-bottom:4px;font-size:12px;color:#374151;line-height:1.6;">' + noteIdx + (lang === 'en' ? '. ' : '\u3001') + currency + ' ' + t('printExchangeRate') + ': ' + rate + ' (' + dateStr + ')</div>';
            noteIdx++;
        }

        // Material spec note
        var matLabel1 = document.getElementById('quotLabelProfileColor').textContent;
        var matLabel2 = document.getElementById('quotLabelFabric').textContent;
        var specNote = '<div style="margin-bottom:4px;font-size:12px;color:#374151;line-height:1.6;">' + noteIdx + (lang === 'en' ? '. ' : '\u3001') + matLabel1 + ': ' + profileColor + '; ' + matLabel2 + ': ' + (fabricColor ? fabricColor + ' ' : '') + fabric + '</div>';

        // Build final HTML - proper printable page
        var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + getQuotTypeTitle(lang) + ' - ' + client + '</title>' +
            '<style>' +
            '@page { size: A4; margin: 15mm 12mm; }' +
            'body { font-family: ' + (lang === 'en' ? '"Helvetica Neue", Arial, sans-serif' : '"Microsoft YaHei", "Helvetica Neue", Arial, sans-serif') + '; margin: 0; padding: 24px 32px; color: #111827; font-size: 13px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
            'table { border-collapse: collapse; width: 100%; }' +
            '.header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #1e40af; }' +
            '.header-logo { width: 60px; height: 60px; object-fit: contain; border-radius: 8px; }' +
            '.header-text { flex: 1; }' +
            '.header-title { font-size: 20px; font-weight: 700; color: #111827; }' +
            '.header-subtitle { font-size: 16px; font-weight: 600; color: #1e40af; margin-top: 2px; }' +
            '.header-date { text-align: right; font-size: 12px; color: #6b7280; }' +
            '.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; margin-bottom: 18px; font-size: 13px; }' +
            '.info-grid .label { font-weight: 600; color: #374151; }' +
            '.info-grid .value { color: #111827; }' +
            '.section-title { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }' +
            '.remarks-box { margin-top: 18px; padding: 12px 16px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; }' +
            '.remarks-title { font-size: 12px; font-weight: 600; color: #92400e; margin-bottom: 8px; }' +
            '.footer { margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 12px; color: #374151; }' +
            '.sig-line { margin-top: 40px; border-top: 1px solid #d1d5db; padding-top: 4px; font-size: 11px; color: #9ca3af; }' +
            '@media print { .no-print { display: none !important; } body { padding: 0; } }' +
            '@media screen { body { max-width: 800px; margin: 0 auto; background: #f9fafb; } }' +
            '</style></head><body>' +

            // Header with logo
            '<div class="header">' +
            '<img src="' + logoPath + '" class="header-logo" onerror="this.style.display=\'none\'">' +
            '<div class="header-text">' +
            '<div class="header-title">' + tenantCfg.name + '</div>' +
            '<div class="header-subtitle">' + getQuotTypeTitle(lang) + '</div>' +
            '</div>' +
            '<div class="header-date">' + t('printDate') + ': ' + dateStr + '</div>' +
            '</div>' +

            // Client info grid
            '<div class="info-grid">' +
            '<div><span class="label">' + t('printClient') + ': </span><span class="value">' + client + '</span></div>' +
            '<div><span class="label">' + t('printCSRep') + ': </span><span class="value">' + csRep + '</span></div>' +
            '<div><span class="label">' + t('printContact') + ': </span><span class="value">' + phone + '</span></div>' +
            '<div><span class="label">' + t('printCSContact') + ': </span><span class="value"></span></div>' +
            '</div>' +

            // Product table
            '<div class="section-title">' + t('printSectionDims') + '</div>' +
            '<table><thead><tr style="background:#f3f4f6;">' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;width:36px;">' + t('printThNo') + '</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:11px;color:#6b7280;">' + t('printThProduct') + '</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;width:60px;">' + t('printThWidth') + '</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;width:60px;">' + t('printThHeight') + '</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;width:70px;">' + t('printThArea') + '</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;width:80px;">' + t('printThUnitPrice') + '</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:11px;color:#6b7280;width:50px;">' + t('printThQty') + '</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:right;font-size:11px;color:#6b7280;width:90px;">' + t('printThAmount') + '</th></tr></thead><tbody>' +
            prodRowsHtml + subtotalHtml + accRowsHtml + totalRowsHtml +
            '</tbody></table>' +

            // Remarks
            '<div class="remarks-box">' +
            '<div class="remarks-title">' + t('printRemarks') + '</div>' +
            specNote + rateNote + remarksHtml + '</div>' +

            // Signature area
            '<div class="footer">' +
            '<div><strong>' + t('printSeller') + ':</strong> ' + tenantCfg.name + '<div class="sig-line">' + t('printSignDate') + '</div></div>' +
            '<div><strong>' + t('printBuyer') + ':</strong> ' + client + '<div class="sig-line">' + t('printSignDate') + '</div></div>' +
            '</div>' +

            // Print button
            '<div class="no-print" style="text-align:center;margin-top:30px;">' +
            '<button onclick="window.print()" style="padding:10px 32px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-right:10px;">' + t('printBtn') + '</button>' +
            '</div>' +

            '</body></html>';

        var w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        if (!w) {
            // Popup blocked - fall back to an iframe overlay
            var overlay = document.createElement('div');
            overlay.id = 'quotPrintOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;';
            var frame = document.createElement('iframe');
            frame.style.cssText = 'width:90vw;height:92vh;border:none;border-radius:12px;background:#fff;box-shadow:0 25px 50px rgba(0,0,0,.25);';
            overlay.appendChild(frame);
            var closeBtn = document.createElement('button');
            closeBtn.textContent = '\u2715 Close';
            closeBtn.style.cssText = 'position:fixed;top:12px;right:24px;z-index:10000;padding:8px 20px;background:#1e293b;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;';
            closeBtn.onclick = function() { document.body.removeChild(overlay); document.body.removeChild(closeBtn); };
            document.body.appendChild(overlay);
            document.body.appendChild(closeBtn);
            frame.contentDocument.open();
            frame.contentDocument.write(html);
            frame.contentDocument.close();
        } else {
            w.document.write(html);
            w.document.close();
        }
    }

    // ══════════════════════════════════════════════════════════
    //  Consumer Quotation Generator (v3.0)
    //  简化版报价单 — 仅显示消费者所需信息（优惠价、SGD 总额）
    //  格式参考：方小姐防风卷帘报价单20260414.xlsx
    // ══════════════════════════════════════════════════════════

    function generateConsumerQuotation(projectId) {
        var pid = projectId || quotCurrentProjectId;
        if (!pid) { showToast('No project selected', 'error'); return; }

        var project = (typeof allProjectsData !== 'undefined') ? allProjectsData.find(function(p) { return p.id === pid; }) : null;
        if (!project) project = workflowProjects.find(function(p) { return p.id === pid; });
        if (!project) { showToast('Project not found', 'error'); return; }

        var step4St = typeof getStep4State === 'function' ? getStep4State(pid) : null;
        if (!step4St || !step4St.costSummary) { showToast('Please calculate quotation first', 'error'); return; }

        var cs = step4St.costSummary;
        var rate = step4St.exchangeRate || 5.3612;
        var curr = step4St.currency || 'SGD';
        var today = new Date();
        var dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        var tenantCfg = tenantConfigs[getCurrentTenantSlug()] || tenantConfigs['default'];
        var logoPath = window.location.origin + '/' + tenantCfg.logo;
        var client = project.customer || 'Customer';
        var csName = tenantCfg.csName || '';
        var csPhone = tenantCfg.csPhone || '';

        // ── 构建产品行（无单项价格，只显示尺寸和面积）──
        var blindsRows = '';
        var totalOpenings = 0;
        if (cs.perOpeningCosts) {
            cs.perOpeningCosts.forEach(function(poc) {
                totalOpenings++;
                var skuLabel = poc.skuModel || poc.sku;
                var skuData = _skuCatalog[poc.sku];
                var productDesc = skuData ? (skuData.nameZh || skuData.name) : skuLabel;
                blindsRows += '<tr>' +
                    '<td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;color:#6b7280;font-size:12px;">' + poc.idx + '</td>' +
                    '<td style="border:1px solid #d1d5db;padding:8px 12px;font-size:12px;">' + productDesc + '</td>' +
                    '<td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;font-size:12px;">' + poc.widthMM + '</td>' +
                    '<td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;font-size:12px;">' + poc.heightMM + '</td>' +
                    '<td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;font-size:12px;">' + poc.area.toFixed(2) + '</td>' +
                    '<td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;font-size:12px;">' + poc.billedArea.toFixed(2) + '</td>' +
                    '<td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;font-size:12px;">1</td>' +
                '</tr>';
            });
        }

        // ── 电机合并为一行 ──
        var driveCount = totalOpenings;
        var driveName = '';
        if (cs.perOpeningCosts && cs.perOpeningCosts.length > 0) {
            var firstDrive = cs.perOpeningCosts[0].driveSystem;
            var dd = _driveCatalog[firstDrive];
            driveName = dd ? ((dd.nameZh || '') + ' / ' + (dd.name || '')) : (firstDrive || 'Motor');
        }
        var motorRow = '';
        if (driveCount > 0 && driveName) {
            motorRow = '<tr>' +
                '<td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;color:#6b7280;font-size:12px;">' + (totalOpenings + 1) + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 12px;font-size:12px;" colspan="5">' + driveName + '</td>' +
                '<td style="border:1px solid #d1d5db;padding:8px 12px;text-align:center;font-size:12px;">' + driveCount + '</td>' +
            '</tr>';
        }

        // ── 总价（仅显示外币总价）──
        var grandRMB = cs.grandTotalPref || ((cs.totalPref || 0) + (cs.totalDriveSell || 0));
        var grandForeign = grandRMB / rate;
        var foreignSymbol = curr === 'SGD' ? 'S$' : '$';

        // ── 备注 ──
        var profileColor = (document.getElementById('quotProfileColor') || {}).value || 'Coffee';
        var fabric = (document.getElementById('quotFabric') || {}).value || 'NP4000';
        var fabricDesc = 'Polyester+PVC, 5% openness';
        var remarks = [
            '\u578b\u6750\u989c\u8272 ' + profileColor + '\uff1b\u9762\u6599 ' + fabric + ' ' + fabricDesc + ' / Profile: ' + profileColor + '; Fabric: ' + fabric + ' ' + fabricDesc,
            curr + ' \u5bf9\u4eba\u6c11\u5e01\u6c47\u7387 / ' + curr + ' to RMB exchange rate: ' + rate + ' (' + dateStr + ')',
            '\u5305\u542b\u6d77\u5173\u8d39\u53ca\u7269\u6d41\u8fd0\u8f93\u7b49\u8d39\u7528 / Include customs duties, logistics, and shipping fees',
            '\u8d28\u4fdd\uff1a\u94dd\u5408\u91d1\u578b\u6750\u5341\u5e74\uff0c\u7535\u673a\u4e09\u5e74\uff0c\u9632\u98ce\u5377\u5e18\u4e24\u5e74 / Warranty: Aluminum alloy 10 years, motor 3 years, zip blinds 2 years',
            '\u4ed8\u6b3e\u6761\u4ef6\uff1a\u4e0b\u5355\u751f\u4ea7\u524d\u9700\u4ed850%\u5b9a\u91d1\uff0c\u53d1\u8d27\u524d\u4ed8\u6e05\u4f59\u6b3e / Payment: 50% deposit before production, balance before shipment'
        ];
        var remarksHtml = remarks.map(function(line, i) {
            return '<div style="margin-bottom:5px;font-size:11px;color:#374151;line-height:1.6;">' + (i + 1) + '. ' + line + '</div>';
        }).join('');

        // ── 构建 HTML ──
        var html = _buildConsumerHTML(tenantCfg, logoPath, dateStr, client, csName, csPhone, project,
            blindsRows, motorRow, totalOpenings, grandForeign, foreignSymbol, curr, remarksHtml);

        _openConsumerQuotWindow(html);
    }

    function _buildConsumerHTML(tenantCfg, logoPath, dateStr, client, csName, csPhone, project,
        blindsRows, motorRow, totalOpenings, grandForeign, foreignSymbol, curr, remarksHtml) {
        return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
            '<title>\u9632\u98ce\u5377\u5e18\u62a5\u4ef7\u5355 / Zip Blinds Quotation - ' + client + '</title>' +
            '<style>' +
            '@page{size:A4;margin:15mm 12mm;}' +
            'body{font-family:"Microsoft YaHei","Helvetica Neue",Arial,sans-serif;margin:0;padding:24px 32px;color:#111827;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}' +
            'table{border-collapse:collapse;width:100%;}' +
            '.hdr{display:flex;align-items:center;gap:16px;margin-bottom:16px;padding-bottom:14px;border-bottom:3px solid #ea580c;}' +
            '.hdr img{width:56px;height:56px;object-fit:contain;border-radius:8px;}' +
            '.hdr-t{flex:1;}.hdr-name{font-size:18px;font-weight:700;color:#111827;}' +
            '.hdr-sub{font-size:14px;font-weight:600;color:#ea580c;margin-top:2px;}' +
            '.hdr-date{text-align:right;font-size:11px;color:#6b7280;}' +
            '.info{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:14px;font-size:12px;}' +
            '.info .l{font-weight:600;color:#374151;}.info .v{color:#111827;}' +
            '.sec-title{font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;margin:14px 0 6px;}' +
            '.total-row td{background:#eff6ff;font-weight:700;font-size:14px;}' +
            '.total-row .amt{color:#ea580c;font-size:18px;text-align:right;}' +
            '.rmk{margin-top:16px;padding:12px 16px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;}' +
            '.rmk-t{font-size:11px;font-weight:600;color:#92400e;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;}' +
            '.ftr{margin-top:24px;display:grid;grid-template-columns:1fr 1fr;gap:20px;font-size:12px;color:#374151;}' +
            '@media print{.no-print{display:none!important;}body{padding:0;}}' +
            '@media screen{body{max-width:800px;margin:0 auto;background:#f9fafb;}}' +
            '</style></head><body>' +

            // Header
            '<div class="hdr">' +
            '<img src="' + logoPath + '" onerror="this.style.display=\'none\'">' +
            '<div class="hdr-t">' +
            '<div class="hdr-name">' + tenantCfg.name + '</div>' +
            '<div class="hdr-sub">\u9632\u98ce\u5377\u5e18\u62a5\u4ef7\u5355 / Zip Blinds Quotation</div>' +
            '</div>' +
            '<div class="hdr-date">\u65e5\u671f / Date: ' + dateStr + '</div>' +
            '</div>' +

            // Client info (2×2 grid matching reference)
            '<div class="info">' +
            '<div><span class="l">\u5ba2\u6237\u59d3\u540d / Client: </span><span class="v">' + client + '</span></div>' +
            '<div><span class="l">\u5ba2\u670d / CS Rep: </span><span class="v">' + csName + '</span></div>' +
            '<div><span class="l">\u8054\u7cfb\u7535\u8bdd / Contact: </span><span class="v">' + (project.phone || project.customerPhone || '') + '</span></div>' +
            '<div><span class="l">CS Contact: </span><span class="v">' + csPhone + '</span></div>' +
            '</div>' +

            // Section: Product Dimensions
            '<div class="sec-title">\u4ea7\u54c1\u5c3a\u5bf8 / PRODUCT DIMENSIONS</div>' +
            '<table><thead>' +
            '<tr style="background:#f3f4f6;">' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:10px;color:#6b7280;width:32px;">\u5e8f\u53f7<br>No.</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:left;font-size:10px;color:#6b7280;">\u54c1\u7c7b / Product</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:10px;color:#6b7280;width:70px;">\u5bbd<br>Width(mm)</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:10px;color:#6b7280;width:70px;">\u9ad8<br>Height(mm)</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:10px;color:#6b7280;width:65px;">\u8ba1\u7b97\u9762\u79ef<br>Area(M\u00b2)</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:10px;color:#6b7280;width:65px;">\u8ba1\u4ef7\u9762\u79ef<br>Priced(M\u00b2)</th>' +
            '<th style="border:1px solid #d1d5db;padding:8px 10px;text-align:center;font-size:10px;color:#6b7280;width:40px;">\u6570\u91cf<br>Qty</th>' +
            '</tr></thead><tbody>' +

            blindsRows +
            motorRow +

            // Preferential Total Price row
            '<tr class="total-row">' +
            '<td style="border:1px solid #d1d5db;padding:10px 12px;" colspan="6"><strong>\u4f18\u60e0\u603b\u4ef7 / Preferential Total Price (' + curr + ')</strong></td>' +
            '<td class="amt" style="border:1px solid #d1d5db;padding:10px 12px;">' + foreignSymbol + Math.round(grandForeign).toLocaleString() + '</td>' +
            '</tr>' +

            '</tbody></table>' +

            // Remarks
            '<div class="rmk">' +
            '<div class="rmk-t">\u7279\u6b8a\u8bf4\u660e / Special Remarks</div>' +
            remarksHtml + '</div>' +

            // Footer: Seller / Buyer
            '<div class="ftr">' +
            '<div><strong>\u5356\u65b9 / Seller:</strong> ' + tenantCfg.name + '</div>' +
            '<div><strong>\u4e70\u65b9 / Buyer:</strong> ' + client + '</div>' +
            '</div>' +

            // Print button
            '<div class="no-print" style="text-align:center;margin-top:30px;">' +
            '<button onclick="window.print()" style="padding:10px 32px;background:#ea580c;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">' +
            '<i class="fas fa-print" style="margin-right:6px;"></i>\u6253\u5370 / Print / Save PDF</button></div>' +

            '</body></html>';
    }

    function _openConsumerQuotWindow(html) {
        var w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        if (!w) {
            var overlay = document.createElement('div');
            overlay.id = 'consumerQuotOverlay';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;';
            var frame = document.createElement('iframe');
            frame.style.cssText = 'width:90vw;height:92vh;border:none;border-radius:12px;background:#fff;box-shadow:0 25px 50px rgba(0,0,0,.25);';
            overlay.appendChild(frame);
            var closeBtn = document.createElement('button');
            closeBtn.textContent = '\u2715 Close';
            closeBtn.style.cssText = 'position:fixed;top:12px;right:24px;z-index:10000;padding:8px 20px;background:#1e293b;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;';
            closeBtn.onclick = function() { document.body.removeChild(overlay); document.body.removeChild(closeBtn); };
            document.body.appendChild(overlay);
            document.body.appendChild(closeBtn);
            frame.contentDocument.open();
            frame.contentDocument.write(html);
            frame.contentDocument.close();
        } else {
            w.document.write(html);
            w.document.close();
        }
    }

    // ===== Namespace Export =====
    N.utils.quotEditor = {
        quotLineItemsData: quotLineItemsData,
        quotAccessoriesData: quotAccessoriesData,
        quotCurrentProjectId: quotCurrentProjectId,
        zbPriceLookup: zbPriceLookup,
        zbProductNames: zbProductNames,
        zbAccessoryPresets: zbAccessoryPresets,
        sunroomPriceLookup: sunroomPriceLookup,
        sunroomProductNames: sunroomProductNames,
        sunroomAccessoryPresets: sunroomAccessoryPresets,
        pergolaPriceLookup: pergolaPriceLookup,
        pergolaProductNames: pergolaProductNames,
        pergolaAccessoryPresets: pergolaAccessoryPresets,
        quotProductType: quotProductType,
        getQuotProductNames: getQuotProductNames,
        getQuotPriceLookup: getQuotPriceLookup,
        getQuotAccessoryPresets: getQuotAccessoryPresets,
        getQuotTypeTitle: getQuotTypeTitle,
        openQuotationEditor: openQuotationEditor,
        closeQuotationEditor: closeQuotationEditor,
        applyQuotI18nLabels: applyQuotI18nLabels,
        getQuotStorageKey: getQuotStorageKey,
        getAllSavedQuotations: getAllSavedQuotations,
        saveQuotation: saveQuotation,
        loadQuotation: loadQuotation,
        deleteQuotation: deleteQuotation,
        refreshQuotLoadDropdown: refreshQuotLoadDropdown,
        toggleQuotLoadDropdown: toggleQuotLoadDropdown,
        addQuotLineItem: addQuotLineItem,
        removeQuotLineItem: removeQuotLineItem,
        addQuotAccessory: addQuotAccessory,
        removeQuotAccessory: removeQuotAccessory,
        calcArea: calcArea,
        renderQuotLineItems: renderQuotLineItems,
        renderQuotAccessories: renderQuotAccessories,
        updateQuotTotals: updateQuotTotals,
        previewQuotation: previewQuotation,
        generateConsumerQuotation: generateConsumerQuotation
    };

    // ===== Global Aliases (backward compatibility) =====
    window.quotLineItemsData = quotLineItemsData;
    window.quotAccessoriesData = quotAccessoriesData;
    window.quotCurrentProjectId = quotCurrentProjectId;
    window.zbPriceLookup = zbPriceLookup;
    window.zbProductNames = zbProductNames;
    window.zbAccessoryPresets = zbAccessoryPresets;
    window.sunroomPriceLookup = sunroomPriceLookup;
    window.sunroomProductNames = sunroomProductNames;
    window.sunroomAccessoryPresets = sunroomAccessoryPresets;
    window.pergolaPriceLookup = pergolaPriceLookup;
    window.pergolaProductNames = pergolaProductNames;
    window.pergolaAccessoryPresets = pergolaAccessoryPresets;
    window.quotProductType = quotProductType;
    window.getQuotProductNames = getQuotProductNames;
    window.getQuotPriceLookup = getQuotPriceLookup;
    window.getQuotAccessoryPresets = getQuotAccessoryPresets;
    window.getQuotTypeTitle = getQuotTypeTitle;
    window.openQuotationEditor = openQuotationEditor;
    window.closeQuotationEditor = closeQuotationEditor;
    window.applyQuotI18nLabels = applyQuotI18nLabels;
    window.getQuotStorageKey = getQuotStorageKey;
    window.getAllSavedQuotations = getAllSavedQuotations;
    window.saveQuotation = saveQuotation;
    window.loadQuotation = loadQuotation;
    window.deleteQuotation = deleteQuotation;
    window.refreshQuotLoadDropdown = refreshQuotLoadDropdown;
    window.toggleQuotLoadDropdown = toggleQuotLoadDropdown;
    window.addQuotLineItem = addQuotLineItem;
    window.removeQuotLineItem = removeQuotLineItem;
    window.addQuotAccessory = addQuotAccessory;
    window.removeQuotAccessory = removeQuotAccessory;
    window.calcArea = calcArea;
    window.renderQuotLineItems = renderQuotLineItems;
    window.renderQuotAccessories = renderQuotAccessories;
    window.updateQuotTotals = updateQuotTotals;
    window.previewQuotation = previewQuotation;
    window.generateConsumerQuotation = generateConsumerQuotation;
})();
