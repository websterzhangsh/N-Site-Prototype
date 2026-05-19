/**
 * wholesale-pricing.js — Wholesale Pricing Management (Nestopia-CHN Platform Admin)
 * Phase 2: 多层定价链管理界面
 * 命名空间: Nestopia.modules.wholesalePricing
 * 依赖: pricing-data.js, supabase-config.js, tenant.js, helpers.js
 *
 * 功能:
 *  - 平台批发定价总表 (SKU + Drive 的 x 值管理)
 *  - 批量设置 margin factor
 *  - 产品上架/隐藏 (Publish/Hide) 到分销商
 *  - Per-distributor 可见性视图
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.modules = N.modules || {};

    // ══════════════════════════════════════════════════════════
    //  模块状态
    // ══════════════════════════════════════════════════════════

    var _state = {
        wholesaleData: [],          // platform_wholesale_pricing 记录
        distributors: [],           // 分销商租户列表
        selectedDistributor: null,  // 当前选中的分销商 tenant_id
        distributorPriceList: [],   // 当前分销商的 distributor_price_list 记录
        editedRows: {},             // 已编辑但未保存的 x 值 { sku_key: newX }
        selectedSKUs: new Set(),    // UI 上勾选的 SKU
        filterSeries: 'all',       // 系列筛选
        searchQuery: '',           // 搜索文本
        loading: false,
        initialized: false,
        historyData: [],           // 发布历史日志
        historyLoaded: false,      // 历史是否已加载
        paramsEditing: false       // 报价公式参数是否处于编辑模式
    };

    // ══════════════════════════════════════════════════════════
    //  1. 初始化 & 数据加载
    // ══════════════════════════════════════════════════════════

    /**
     * 初始化 Wholesale Pricing 模块
     * 仅 nestopia-chn 租户可见，其他租户跳过
     */
    function init() {
        var slug = (N.tenant && N.tenant.getCurrentSlug) ? N.tenant.getCurrentSlug() : 'default';
        if (slug !== 'nestopia-chn') {
            _hideNavItem();
            return;
        }
        _showNavItem();
        if (_state.initialized) return;
        _state.initialized = true;
        _loadParamsFromStorage();
        loadData();
    }

    /**
     * 从 Supabase 加载所有数据
     */
    function loadData() {
        _state.loading = true;
        _renderLoading();

        var client = _getClient();
        if (!client) {
            _state.loading = false;
            _renderError('Supabase client not available');
            return;
        }

        // 并行加载: 批发定价 + 分销商列表
        Promise.all([
            client.from('platform_wholesale_pricing')
                .select('*')
                .eq('is_active', true)
                .order('product_type')
                .order('sku_key'),
            client.from('tenants')
                .select('id, slug, name, status')
                .neq('slug', 'nestopia-chn')
                .eq('status', 'active')
        ]).then(function(results) {
            var wholesaleRes = results[0];
            var tenantsRes = results[1];

            if (wholesaleRes.error) {
                console.error('[WholesalePricing] Load wholesale data failed:', wholesaleRes.error);
                _renderError('Failed to load pricing data: ' + wholesaleRes.error.message);
                return;
            }
            if (tenantsRes.error) {
                console.warn('[WholesalePricing] Load tenants failed:', tenantsRes.error);
            }

            _state.wholesaleData = wholesaleRes.data || [];
            _state.distributors = (tenantsRes.data || []).filter(function(t) {
                return t.slug !== 'default'; // 排除 demo 租户
            });
            _state.loading = false;
            _state.editedRows = {};
            _state.selectedSKUs = new Set();

            // 默认选中第一个分销商
            if (_state.distributors.length > 0 && !_state.selectedDistributor) {
                _state.selectedDistributor = _state.distributors[0].id;
            }

            // 加载分销商价目表
            if (_state.selectedDistributor) {
                _loadDistributorPriceList(_state.selectedDistributor).then(function() {
                    _renderPage();
                });
            } else {
                _renderPage();
            }

            // 同步缓存到 pricing-data.js
            if (N.data && N.data.pricing && N.data.pricing.clearWholesalePricingCache) {
                N.data.pricing.clearWholesalePricingCache();
            }

            console.log('[WholesalePricing] Loaded', _state.wholesaleData.length, 'pricing records,', _state.distributors.length, 'distributors');
        }).catch(function(err) {
            _state.loading = false;
            console.error('[WholesalePricing] Load error:', err);
            _renderError('Network error: ' + err.message);
        });
    }

    /**
     * 加载指定分销商的价目表
     */
    function _loadDistributorPriceList(tenantId) {
        var client = _getClient();
        if (!client) return Promise.resolve();

        return client.from('distributor_price_list')
            .select('*')
            .eq('tenant_id', tenantId)
            .then(function(res) {
                if (res.error) {
                    console.warn('[WholesalePricing] Load DPL failed:', res.error);
                    _state.distributorPriceList = [];
                } else {
                    _state.distributorPriceList = res.data || [];
                }
            });
    }

    // ══════════════════════════════════════════════════════════
    //  2. 页面渲染 — 主入口
    // ══════════════════════════════════════════════════════════

    function _renderPage() {
        var container = document.getElementById('page-wholesale-pricing');
        if (!container) return;

        var skuCat = window.zbSKUCatalog || {};
        var driveCat = window.zbDriveSystemCatalog || {};

        // 构建 SKU 数据行
        var blindsRows = _buildTableRows('blinds', skuCat);
        var driveRows = _buildTableRows('drive', driveCat);

        // 统计信息
        var dplMap = _buildDPLMap();
        var totalSKUs = blindsRows.length + driveRows.length;
        var publishedCount = _state.distributorPriceList.filter(function(r) { return r.is_visible; }).length;
        var hiddenCount = _state.distributorPriceList.filter(function(r) { return !r.is_visible; }).length;
        var unpublishedCount = totalSKUs - publishedCount - hiddenCount;

        var distributorName = _getDistributorName(_state.selectedDistributor);

        container.innerHTML = '' +
            // ── Header ──
            '<div class="flex items-center justify-between mb-6">' +
                '<div>' +
                    '<h2 class="text-2xl font-bold text-gray-900">Wholesale Pricing</h2>' +
                    '<p class="text-gray-500 mt-1">Platform Price Management &mdash; B = A &times; (1+x)</p>' +
                '</div>' +
                '<div class="flex gap-3">' +
                    '<button onclick="Nestopia.modules.wholesalePricing.loadData()" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2">' +
                        '<i class="fas fa-sync-alt"></i> <span>Refresh</span>' +
                    '</button>' +
                '</div>' +
            '</div>' +

            // ── Stats ──
            '<div class="grid grid-cols-4 gap-4 mb-6">' +
                _renderStatCard('Total SKUs', totalSKUs, 'fas fa-box', 'blue', 'Total number of SKUs managed on the platform') +
                _renderStatCard('Published', publishedCount, 'fas fa-check-circle', 'green', 'SKUs visible to the selected distributor — they can see and quote these products') +
                _renderStatCard('Hidden', hiddenCount, 'fas fa-eye-slash', 'amber', 'SKUs previously published but now hidden — distributor cannot see them until re-published') +
                _renderStatCard('Unpublished', unpublishedCount, 'fas fa-minus-circle', 'gray', 'SKUs not yet published to the selected distributor — use "Publish Selected" to make them available') +
            '</div>' +

            // ── Quotation Formula Parameters ──
            _renderQuotationParamsSection() +

            // ── Filter Bar ──
            '<div class="bg-white rounded-xl border border-gray-200 p-4 mb-4">' +
                '<div class="flex items-center justify-between flex-wrap gap-3">' +
                    '<div class="flex items-center gap-3">' +
                        // Series filter
                        '<select id="wpFilterSeries" onchange="Nestopia.modules.wholesalePricing._onFilterChange()" ' +
                            'class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                            '<option value="all">All Series</option>' +
                            '<option value="WR100">WR100</option>' +
                            '<option value="WR110">WR110</option>' +
                            '<option value="WR120">WR120</option>' +
                            '<option value="Special">Special</option>' +
                            '<option value="drive">Drive Systems</option>' +
                        '</select>' +
                        // Search
                        '<div class="relative">' +
                            '<i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>' +
                            '<input type="text" id="wpSearchInput" placeholder="Search SKU..." ' +
                                'oninput="Nestopia.modules.wholesalePricing._onFilterChange()" ' +
                                'class="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                        '</div>' +
                    '</div>' +
                    // Distributor selector
                    '<div class="flex items-center gap-3">' +
                        '<span class="text-sm text-gray-500">Distributor:</span>' +
                        '<select id="wpDistributorSelect" onchange="Nestopia.modules.wholesalePricing._onDistributorChange()" ' +
                            'class="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                            _renderDistributorOptions() +
                        '</select>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // ── SKU Pricing Table ──
            '<div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">' +
                '<div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">' +
                    '<h3 class="font-semibold text-gray-800"><i class="fas fa-th-list mr-2 text-blue-600"></i>Zip Blinds SKU Pricing</h3>' +
                    '<span class="text-xs text-gray-400">' + blindsRows.length + ' SKUs</span>' +
                '</div>' +
                '<div class="overflow-x-auto">' +
                    '<table class="w-full text-sm">' +
                        '<thead class="bg-gray-50 text-xs text-gray-500 uppercase">' +
                            '<tr>' +
                                '<th class="px-3 py-2 text-left w-8"><input type="checkbox" id="wpSelectAllBlinds" onchange="Nestopia.modules.wholesalePricing._onSelectAll(\'blinds\', this.checked)"></th>' +
                                '<th class="px-3 py-2 text-left">SKU</th>' +
                                '<th class="px-3 py-2 text-left">Series</th>' +
                                '<th class="px-3 py-2 text-right">Supplier (A)</th>' +
                                '<th class="px-3 py-2 text-center w-24">x Factor</th>' +
                                '<th class="px-3 py-2 text-right">Wholesale (B)</th>' +
                                '<th class="px-3 py-2 text-center w-16">&Delta;%</th>' +
                                '<th class="px-3 py-2 text-center w-16" title="Visibility — whether this SKU is published to selected distributor">Vis</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody class="divide-y divide-gray-100">' +
                            _renderTableRows(blindsRows, dplMap) +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>' +

            // ── Drive Systems Table ──
            '<div class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">' +
                '<div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">' +
                    '<h3 class="font-semibold text-gray-800"><i class="fas fa-cog mr-2 text-purple-600"></i>Drive Systems</h3>' +
                    '<span class="text-xs text-gray-400">' + driveRows.length + ' drives</span>' +
                '</div>' +
                '<div class="overflow-x-auto">' +
                    '<table class="w-full text-sm">' +
                        '<thead class="bg-gray-50 text-xs text-gray-500 uppercase">' +
                            '<tr>' +
                                '<th class="px-3 py-2 text-left w-8"><input type="checkbox" id="wpSelectAllDrives" onchange="Nestopia.modules.wholesalePricing._onSelectAll(\'drive\', this.checked)"></th>' +
                                '<th class="px-3 py-2 text-left">Drive</th>' +
                                '<th class="px-3 py-2 text-left">Type</th>' +
                                '<th class="px-3 py-2 text-right">Supplier (A)</th>' +
                                '<th class="px-3 py-2 text-center w-24">x Factor</th>' +
                                '<th class="px-3 py-2 text-right">Wholesale (B)</th>' +
                                '<th class="px-3 py-2 text-center w-16">&Delta;%</th>' +
                                '<th class="px-3 py-2 text-center w-16" title="Visibility — whether this SKU is published to selected distributor">Vis</th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody class="divide-y divide-gray-100">' +
                            _renderDriveRows(driveRows, dplMap) +
                        '</tbody>' +
                    '</table>' +
                '</div>' +
            '</div>' +

            // ── Action Bar ──
            '<div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between flex-wrap gap-3">' +
                '<div class="text-sm text-gray-500" id="wpSelectionInfo">' +
                    '<span id="wpSelectedCount">0</span> of ' + totalSKUs + ' selected for ' + _escHtml(distributorName) +
                '</div>' +
                '<div class="flex gap-3">' +
                    '<button onclick="Nestopia.modules.wholesalePricing.saveAllMargins()" ' +
                        'class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 text-sm">' +
                        '<i class="fas fa-save"></i> Save All x' +
                    '</button>' +
                    '<button onclick="Nestopia.modules.wholesalePricing.showBatchMarginModal()" ' +
                        'class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-2 text-sm">' +
                        '<i class="fas fa-percentage"></i> Batch Margin...' +
                    '</button>' +
                    '<button onclick="Nestopia.modules.wholesalePricing.publishSelected()" ' +
                        'class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 text-sm">' +
                        '<i class="fas fa-upload"></i> Publish Selected' +
                    '</button>' +
                    '<button onclick="Nestopia.modules.wholesalePricing.hideSelected()" ' +
                        'class="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition flex items-center gap-2 text-sm">' +
                        '<i class="fas fa-eye-slash"></i> Hide Selected' +
                    '</button>' +
                '</div>' +
            '</div>' +

            // ── Publish History Section ──
            '<div class="mt-4">' +
                '<button onclick="Nestopia.modules.wholesalePricing.toggleHistoryPanel()" ' +
                    'class="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition mb-3">' +
                    '<i class="fas fa-history text-gray-400"></i>' +
                    '<span class="font-medium">Publish History</span>' +
                    '<i class="fas fa-chevron-down text-xs text-gray-400"></i>' +
                '</button>' +
                '<div id="wp-history-section" class="hidden">' +
                    '<div class="bg-white rounded-xl border border-gray-200 p-4">' +
                        '<div id="wp-history-panel">' +
                            '<div class="text-center text-gray-400 py-6"><i class="fas fa-spinner fa-spin mr-2"></i>Loading history...</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // ── Batch Margin Modal (hidden) ──
            '<div id="wpBatchMarginModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" style="display:none;">' +
                '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">' +
                    '<div class="px-6 py-4 border-b border-gray-200">' +
                        '<h3 class="text-lg font-semibold text-gray-900">Batch Set Margin Factor</h3>' +
                    '</div>' +
                    '<div class="px-6 py-5">' +
                        '<div class="mb-4">' +
                            '<label class="block text-sm font-medium text-gray-700 mb-1">Apply to:</label>' +
                            '<div class="space-y-2">' +
                                '<label class="flex items-center gap-2 text-sm">' +
                                    '<input type="radio" name="batchScope" value="selected" checked> Selected SKUs (<span id="batchSelectedCount">0</span>)' +
                                '</label>' +
                                '<label class="flex items-center gap-2 text-sm">' +
                                    '<input type="radio" name="batchScope" value="series"> Specific series:' +
                                    '<select id="batchSeriesSelect" class="ml-1 px-2 py-1 border border-gray-300 rounded text-sm">' +
                                        '<option value="WR100">WR100</option>' +
                                        '<option value="WR110">WR110</option>' +
                                        '<option value="WR120">WR120</option>' +
                                        '<option value="Special">Special</option>' +
                                        '<option value="drive">Drive Systems</option>' +
                                    '</select>' +
                                '</label>' +
                                '<label class="flex items-center gap-2 text-sm">' +
                                    '<input type="radio" name="batchScope" value="all"> All SKUs' +
                                '</label>' +
                            '</div>' +
                        '</div>' +
                        '<div class="mb-4">' +
                            '<label class="block text-sm font-medium text-gray-700 mb-1">Margin Factor x:</label>' +
                            '<div class="flex items-center gap-2">' +
                                '<input type="number" id="batchMarginInput" step="0.01" min="0" max="5" value="0.40" ' +
                                    'class="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">' +
                                '<span class="text-sm text-gray-500">(<span id="batchMarginPercent">40</span>%)</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600" id="batchPreview">' +
                            'Preview: Wholesale price = Supplier price &times; 1.40' +
                        '</div>' +
                    '</div>' +
                    '<div class="px-6 py-4 bg-gray-50 flex justify-end gap-3">' +
                        '<button onclick="Nestopia.modules.wholesalePricing.closeBatchMarginModal()" ' +
                            'class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>' +
                        '<button onclick="Nestopia.modules.wholesalePricing.applyBatchMargin()" ' +
                            'class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Apply</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        _updateSelectionCount();
    }

    // ══════════════════════════════════════════════════════════
    //  3. 渲染辅助函数
    // ══════════════════════════════════════════════════════════

    function _renderStatCard(label, value, icon, color, tooltip) {
        var tooltipHtml = '';
        if (tooltip) {
            tooltipHtml = '<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg ' +
                'opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">' +
                '<span>' + _escHtml(tooltip) + '</span>' +
                '<div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>' +
            '</div>';
        }
        return '<div class="relative group bg-white rounded-xl border border-gray-200 p-4 cursor-default">' +
            tooltipHtml +
            '<div class="flex items-center justify-between">' +
                '<div>' +
                    '<div class="text-sm text-gray-500">' + label + '</div>' +
                    '<div class="text-2xl font-bold text-' + color + '-600">' + value + '</div>' +
                '</div>' +
                '<div class="w-10 h-10 bg-' + color + '-100 rounded-lg flex items-center justify-center">' +
                    '<i class="' + icon + ' text-' + color + '-600"></i>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    // ══════════════════════════════════════════════════════════
    //  2b. 报价公式参数卡片
    // ══════════════════════════════════════════════════════════

    /**
     * 渲染报价公式参数区域（只读 / 编辑双模式）
     * 6 个参数来自 window.zbBusinessParams
     */
    function _renderQuotationParamsSection() {
        var biz = window.zbBusinessParams || {};
        if (_state.paramsEditing) {
            return _renderQuotationParamsEdit(biz);
        }
        return _renderQuotationParamsReadonly(biz);
    }

    function _renderQuotationParamsReadonly(biz) {
        return '<div class="bg-white rounded-xl border border-gray-200 mb-4">' +
            '<div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">' +
                '<h3 class="font-semibold text-gray-800 flex items-center gap-2">' +
                    '<i class="fas fa-calculator text-blue-600"></i> Quotation Formula Parameters' +
                '</h3>' +
                '<button onclick="Nestopia.modules.wholesalePricing._wpStartEditParams()" ' +
                    'class="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition flex items-center gap-1.5">' +
                    '<i class="fas fa-pen text-[10px]"></i> Edit' +
                '</button>' +
            '</div>' +
            '<div class="p-4">' +
                '<div class="grid grid-cols-2 lg:grid-cols-3 gap-3">' +
                    _renderParamReadField('Supplier Discount', (biz.supplierDiscountRate || 0.9) + ' off', 'Discount rate applied to supplier list price') +
                    _renderParamReadField('Shipping & Customs', ((biz.shippingCostRate || 0.3) * 100).toFixed(0) + '%', 'Shipping & customs as % of discounted total') +
                    _renderParamReadField('Installation Fee', '\u00a5' + (biz.installationFeePerSqm || 191) + '/m\u00b2', 'Installation fee per square meter') +
                    _renderParamReadField('Market Markup', '\u00d7' + (biz.marketMarkup || 2.92), 'Market price multiplier on total cost') +
                    _renderParamReadField('Default Discount', ((biz.preferentialDiscount || 0.5) * 100).toFixed(0) + '%', 'Default discount off market price') +
                    _renderParamReadField('Accessory Markup', '+' + ((biz.accessoryMarkupRate || 0.13) * 100).toFixed(0) + '%', 'Markup rate on motor/accessory prices') +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function _renderParamReadField(label, value, tooltip) {
        return '<div class="bg-gray-50 rounded-lg p-3 border border-gray-100 group relative">' +
            '<label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium block mb-1">' + label + '</label>' +
            '<div class="text-sm font-bold text-gray-900">' + value + '</div>' +
            (tooltip ? '<div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg ' +
                'opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none z-50 shadow-lg">' +
                '<span>' + _escHtml(tooltip) + '</span>' +
                '<div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>' +
            '</div>' : '') +
        '</div>';
    }

    function _renderQuotationParamsEdit(biz) {
        return '<div class="bg-white rounded-xl border border-blue-300 mb-4">' +
            '<div class="px-4 py-3 bg-blue-50/50 border-b border-blue-200 flex items-center justify-between">' +
                '<h3 class="font-semibold text-blue-800 flex items-center gap-2">' +
                    '<i class="fas fa-calculator text-blue-500"></i> Editing Quotation Formula Parameters' +
                '</h3>' +
                '<div class="flex gap-2">' +
                    '<button onclick="Nestopia.modules.wholesalePricing._wpSaveParams()" ' +
                        'class="px-4 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-1.5">' +
                        '<i class="fas fa-check"></i> Save' +
                    '</button>' +
                    '<button onclick="Nestopia.modules.wholesalePricing._wpCancelEditParams()" ' +
                        'class="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition">' +
                        'Cancel' +
                    '</button>' +
                '</div>' +
            '</div>' +
            '<div class="p-4">' +
                '<div class="grid grid-cols-2 lg:grid-cols-3 gap-3">' +
                    _renderParamEditField('Supplier Discount', 'wpParam_supplierDiscount', biz.supplierDiscountRate || 0.9, 'number', 'e.g. 0.9') +
                    _renderParamEditField('Shipping & Customs (%)', 'wpParam_shipping', ((biz.shippingCostRate || 0.3) * 100).toFixed(1), 'number', 'e.g. 30') +
                    _renderParamEditField('Installation (\u00a5/m\u00b2)', 'wpParam_installation', biz.installationFeePerSqm || 191, 'number', 'e.g. 191') +
                    _renderParamEditField('Market Markup (\u00d7)', 'wpParam_markup', biz.marketMarkup || 2.92, 'number', 'e.g. 2.92') +
                    _renderParamEditField('Default Discount (%)', 'wpParam_discount', ((biz.preferentialDiscount || 0.5) * 100).toFixed(1), 'number', 'e.g. 50') +
                    _renderParamEditField('Accessory Markup (%)', 'wpParam_accessory', ((biz.accessoryMarkupRate || 0.13) * 100).toFixed(1), 'number', 'e.g. 13') +
                '</div>' +
                '<p class="text-[11px] text-gray-400 mt-3"><i class="fas fa-info-circle mr-1"></i>Changes are saved to session and persist in localStorage. Percentages are stored as decimals internally.</p>' +
            '</div>' +
        '</div>';
    }

    function _renderParamEditField(label, id, value, type, placeholder) {
        return '<div>' +
            '<label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium block mb-1">' + label + '</label>' +
            '<input id="' + id + '" type="' + (type || 'text') + '" value="' + value + '" placeholder="' + (placeholder || '') + '" ' +
                'class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" step="any">' +
        '</div>';
    }

    /**
     * 进入参数编辑模式
     */
    function _wpStartEditParams() {
        _state.paramsEditing = true;
        _renderPage();
    }

    /**
     * 取消参数编辑
     */
    function _wpCancelEditParams() {
        _state.paramsEditing = false;
        _renderPage();
    }

    /**
     * 保存参数编辑 — 更新 window.zbBusinessParams + localStorage
     */
    function _wpSaveParams() {
        var biz = window.zbBusinessParams;
        if (!biz) return;

        var _v = function(id) { var el = document.getElementById(id); return el ? parseFloat(el.value) : null; };
        var v;

        v = _v('wpParam_supplierDiscount');  if (v !== null && v > 0) biz.supplierDiscountRate = v;
        v = _v('wpParam_shipping');           if (v !== null && v >= 0) biz.shippingCostRate = v / 100;
        v = _v('wpParam_installation');       if (v !== null && v >= 0) biz.installationFeePerSqm = v;
        v = _v('wpParam_markup');             if (v !== null && v > 0) biz.marketMarkup = v;
        v = _v('wpParam_discount');           if (v !== null && v >= 0) biz.preferentialDiscount = v / 100;
        v = _v('wpParam_accessory');          if (v !== null && v >= 0) biz.accessoryMarkupRate = v / 100;

        // 持久化到 localStorage
        try {
            var toSave = {
                supplierDiscountRate: biz.supplierDiscountRate,
                shippingCostRate: biz.shippingCostRate,
                installationFeePerSqm: biz.installationFeePerSqm,
                marketMarkup: biz.marketMarkup,
                preferentialDiscount: biz.preferentialDiscount,
                accessoryMarkupRate: biz.accessoryMarkupRate
            };
            localStorage.setItem('nestopia_zbBusinessParams', JSON.stringify(toSave));
        } catch (e) {
            console.warn('[WholesalePricing] localStorage save failed:', e);
        }

        _state.paramsEditing = false;
        _showToast('Quotation parameters updated', 'success');
        _renderPage();
    }

    /**
     * 从 localStorage 恢复参数（如有）
     */
    function _loadParamsFromStorage() {
        try {
            var stored = localStorage.getItem('nestopia_zbBusinessParams');
            if (!stored) return;
            var saved = JSON.parse(stored);
            var biz = window.zbBusinessParams;
            if (!biz) return;
            var keys = ['supplierDiscountRate', 'shippingCostRate', 'installationFeePerSqm', 'marketMarkup', 'preferentialDiscount', 'accessoryMarkupRate'];
            keys.forEach(function(k) {
                if (saved[k] !== undefined && typeof saved[k] === 'number' && !isNaN(saved[k])) {
                    biz[k] = saved[k];
                }
            });
            console.log('[WholesalePricing] Restored params from localStorage');
        } catch (e) {
            console.warn('[WholesalePricing] localStorage restore failed:', e);
        }
    }

    function _renderLoading() {
        var container = document.getElementById('page-wholesale-pricing');
        if (!container) return;
        container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center">' +
            '<i class="fas fa-spinner fa-spin text-3xl text-blue-500 mb-3"></i>' +
            '<p class="text-gray-500">Loading wholesale pricing data...</p></div></div>';
    }

    function _renderError(msg) {
        var container = document.getElementById('page-wholesale-pricing');
        if (!container) return;
        container.innerHTML = '<div class="flex items-center justify-center py-20"><div class="text-center">' +
            '<i class="fas fa-exclamation-triangle text-3xl text-red-500 mb-3"></i>' +
            '<p class="text-gray-700 font-medium">Error Loading Data</p>' +
            '<p class="text-gray-500 text-sm mt-1">' + _escHtml(msg) + '</p>' +
            '<button onclick="Nestopia.modules.wholesalePricing.loadData()" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">' +
                '<i class="fas fa-redo mr-1"></i> Retry' +
            '</button></div></div>';
    }

    function _renderDistributorOptions() {
        if (_state.distributors.length === 0) {
            return '<option value="">No distributors available</option>';
        }
        return _state.distributors.map(function(t) {
            var selected = t.id === _state.selectedDistributor ? ' selected' : '';
            return '<option value="' + t.id + '"' + selected + '>' + _escHtml(t.name) + ' (' + _escHtml(t.slug) + ')</option>';
        }).join('');
    }

    /**
     * 构建表格行数据
     * @param {string} productType - 'blinds' | 'drive'
     * @param {Object} catalog - zbSKUCatalog or zbDriveSystemCatalog
     * @returns {Array<Object>}
     */
    function _buildTableRows(productType, catalog) {
        var rows = [];
        Object.keys(catalog).forEach(function(key) {
            var item = catalog[key];
            // 查找 DB 中的 x 值
            var dbRecord = _state.wholesaleData.find(function(r) {
                return r.sku_key === key;
            });
            var x = _state.editedRows[key] !== undefined ? _state.editedRows[key] :
                    (dbRecord ? parseFloat(dbRecord.margin_factor_x) : 0.40);

            rows.push({
                key: key,
                item: item,
                productType: productType,
                x: x,
                dbRecord: dbRecord
            });
        });
        return rows;
    }

    /**
     * 构建 DPL (Distributor Price List) Map
     * @returns {Object.<string, Object>} 以 sku_key 为键
     */
    function _buildDPLMap() {
        var map = {};
        _state.distributorPriceList.forEach(function(row) {
            map[row.sku_key] = row;
        });
        return map;
    }

    /**
     * 渲染卷帘 SKU 行
     */
    function _renderTableRows(rows, dplMap) {
        var html = '';
        var series = _state.filterSeries;
        var search = _state.searchQuery.toLowerCase();

        rows.forEach(function(row) {
            var sku = row.item;
            var skuSeries = sku.series || 'Special';

            // 系列筛选
            if (series !== 'all' && series !== 'drive' && skuSeries !== series) return;
            if (series === 'drive') return; // 卷帘表不显示驱动

            // 搜索过滤
            if (search && row.key.toLowerCase().indexOf(search) < 0 &&
                (sku.nameZh || '').toLowerCase().indexOf(search) < 0) return;

            var dplEntry = dplMap[row.key];
            var visIcon = _getVisIcon(dplEntry);
            var isChecked = _state.selectedSKUs.has(row.key);

            // 供货商价格显示 (取第一个和最后一个区间)
            var tiers = sku.priceTiers || [];
            var supplierStr = tiers.map(function(t) { return t.price; }).join('/');

            // 批发价计算
            var wholesaleStr = tiers.map(function(t) {
                return Math.round(t.price * (1 + row.x));
            }).join('/');

            var pctStr = '+' + Math.round(row.x * 100) + '%';
            var isEdited = _state.editedRows[row.key] !== undefined;

            html += '<tr class="hover:bg-gray-50 transition-colors' + (isEdited ? ' bg-yellow-50' : '') + '">' +
                '<td class="px-3 py-2"><input type="checkbox" ' + (isChecked ? 'checked' : '') +
                    ' onchange="Nestopia.modules.wholesalePricing._onSelectSKU(\'' + row.key + '\', this.checked)"></td>' +
                '<td class="px-3 py-2 font-medium text-gray-900">' + _escHtml(row.key) + '</td>' +
                '<td class="px-3 py-2 text-gray-500">' + _escHtml(skuSeries) + '</td>' +
                '<td class="px-3 py-2 text-right text-gray-600 font-mono text-xs">' + supplierStr + '</td>' +
                '<td class="px-3 py-2 text-center">' +
                    '<input type="number" step="0.01" min="0" max="5" value="' + row.x.toFixed(2) + '" ' +
                        'onchange="Nestopia.modules.wholesalePricing._onMarginChange(\'' + row.key + '\', this.value)" ' +
                        'class="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                '</td>' +
                '<td class="px-3 py-2 text-right font-medium text-gray-900 font-mono text-xs">' + wholesaleStr + '</td>' +
                '<td class="px-3 py-2 text-center text-xs text-green-600 font-medium">' + pctStr + '</td>' +
                '<td class="px-3 py-2 text-center">' + visIcon + '</td>' +
            '</tr>';
        });

        return html || '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">No matching SKUs</td></tr>';
    }

    /**
     * 渲染驱动系统行
     */
    function _renderDriveRows(rows, dplMap) {
        var html = '';
        var series = _state.filterSeries;
        var search = _state.searchQuery.toLowerCase();

        // 如果系列筛选不是 all 且不是 drive，隐藏驱动行
        if (series !== 'all' && series !== 'drive') {
            return '<tr><td colspan="8" class="px-4 py-4 text-center text-gray-400 text-xs">Filter active &mdash; showing blinds only</td></tr>';
        }

        rows.forEach(function(row) {
            var drive = row.item;

            // 搜索过滤
            if (search && row.key.toLowerCase().indexOf(search) < 0 &&
                (drive.nameZh || '').toLowerCase().indexOf(search) < 0) return;

            var dplEntry = dplMap[row.key];
            var visIcon = _getVisIcon(dplEntry);
            var isChecked = _state.selectedSKUs.has(row.key);
            var isEdited = _state.editedRows[row.key] !== undefined;

            var supplierPrice = drive.price;
            var wholesalePrice = Math.round(supplierPrice * (1 + row.x));
            var pctStr = '+' + Math.round(row.x * 100) + '%';

            var typeLabel = drive.type === 'motorized' ? 'Motor' :
                           drive.type === 'manual' ? 'Manual' :
                           drive.type === 'combo' ? 'Combo' : drive.type;

            html += '<tr class="hover:bg-gray-50 transition-colors' + (isEdited ? ' bg-yellow-50' : '') + '">' +
                '<td class="px-3 py-2"><input type="checkbox" ' + (isChecked ? 'checked' : '') +
                    ' onchange="Nestopia.modules.wholesalePricing._onSelectSKU(\'' + row.key + '\', this.checked)"></td>' +
                '<td class="px-3 py-2 font-medium text-gray-900">' + _escHtml(row.key) + '</td>' +
                '<td class="px-3 py-2 text-gray-500">' + _escHtml(typeLabel) + '</td>' +
                '<td class="px-3 py-2 text-right text-gray-600 font-mono text-xs">' + supplierPrice + '</td>' +
                '<td class="px-3 py-2 text-center">' +
                    '<input type="number" step="0.01" min="0" max="5" value="' + row.x.toFixed(2) + '" ' +
                        'onchange="Nestopia.modules.wholesalePricing._onMarginChange(\'' + row.key + '\', this.value)" ' +
                        'class="w-20 px-2 py-1 border border-gray-300 rounded text-center text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
                '</td>' +
                '<td class="px-3 py-2 text-right font-medium text-gray-900 font-mono text-xs">' + wholesalePrice + '</td>' +
                '<td class="px-3 py-2 text-center text-xs text-green-600 font-medium">' + pctStr + '</td>' +
                '<td class="px-3 py-2 text-center">' + visIcon + '</td>' +
            '</tr>';
        });

        return html || '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-400">No matching drives</td></tr>';
    }

    function _getVisIcon(dplEntry) {
        if (!dplEntry) return '<span class="text-gray-300" title="Unpublished">&mdash;</span>';
        if (dplEntry.is_visible) return '<span class="text-green-500" title="Published (visible)">&#x2705;</span>';
        return '<span title="Hidden">' +
            '<i class="fas fa-lock text-amber-500 text-xs"></i></span>';
    }

    // ══════════════════════════════════════════════════════════
    //  4. 事件处理
    // ══════════════════════════════════════════════════════════

    function _onFilterChange() {
        var seriesEl = document.getElementById('wpFilterSeries');
        var searchEl = document.getElementById('wpSearchInput');
        _state.filterSeries = seriesEl ? seriesEl.value : 'all';
        _state.searchQuery = searchEl ? searchEl.value : '';
        _renderPage();
        // 恢复筛选值
        var newSeriesEl = document.getElementById('wpFilterSeries');
        var newSearchEl = document.getElementById('wpSearchInput');
        if (newSeriesEl) newSeriesEl.value = _state.filterSeries;
        if (newSearchEl) { newSearchEl.value = _state.searchQuery; newSearchEl.focus(); }
    }

    function _onDistributorChange() {
        var el = document.getElementById('wpDistributorSelect');
        if (!el) return;
        _state.selectedDistributor = el.value;
        _state.selectedSKUs = new Set();
        _loadDistributorPriceList(_state.selectedDistributor).then(function() {
            _renderPage();
        });
    }

    function _onMarginChange(skuKey, newValue) {
        var x = parseFloat(newValue);
        if (isNaN(x) || x < 0 || x > 5) return;
        _state.editedRows[skuKey] = x;
        // 刷新这一行的批发价显示
        _renderPage();
        // 恢复筛选状态
        _restoreFilterState();
    }

    function _onSelectSKU(skuKey, checked) {
        if (checked) {
            _state.selectedSKUs.add(skuKey);
        } else {
            _state.selectedSKUs.delete(skuKey);
        }
        _updateSelectionCount();
    }

    function _onSelectAll(type, checked) {
        var catalog = type === 'blinds' ? (window.zbSKUCatalog || {}) : (window.zbDriveSystemCatalog || {});
        Object.keys(catalog).forEach(function(key) {
            if (checked) {
                _state.selectedSKUs.add(key);
            } else {
                _state.selectedSKUs.delete(key);
            }
        });
        _renderPage();
        _restoreFilterState();
    }

    function _updateSelectionCount() {
        var el = document.getElementById('wpSelectedCount');
        if (el) el.textContent = _state.selectedSKUs.size;
    }

    function _restoreFilterState() {
        var seriesEl = document.getElementById('wpFilterSeries');
        var searchEl = document.getElementById('wpSearchInput');
        if (seriesEl) seriesEl.value = _state.filterSeries;
        if (searchEl) searchEl.value = _state.searchQuery;
    }

    // ══════════════════════════════════════════════════════════
    //  5. 数据操作 — Save / Batch / Publish / Hide
    // ══════════════════════════════════════════════════════════

    /**
     * 保存所有已编辑的 x 值到 platform_wholesale_pricing
     */
    function saveAllMargins() {
        var editedKeys = Object.keys(_state.editedRows);
        if (editedKeys.length === 0) {
            _showToast('No changes to save', 'info');
            return;
        }

        var client = _getClient();
        if (!client) return;

        var promises = editedKeys.map(function(skuKey) {
            var newX = _state.editedRows[skuKey];
            var dbRecord = _state.wholesaleData.find(function(r) { return r.sku_key === skuKey; });
            if (dbRecord) {
                // Update existing
                return client.from('platform_wholesale_pricing')
                    .update({ margin_factor_x: newX, updated_at: new Date().toISOString() })
                    .eq('id', dbRecord.id);
            } else {
                // Insert new (shouldn't normally happen — all records seeded)
                var productType = (window.zbDriveSystemCatalog && window.zbDriveSystemCatalog[skuKey]) ? 'drive' : 'blinds';
                return client.from('platform_wholesale_pricing')
                    .insert({
                        sku_key: skuKey,
                        product_type: productType,
                        margin_factor_x: newX,
                        effective_from: new Date().toISOString().split('T')[0]
                    });
            }
        });

        Promise.all(promises).then(function(results) {
            var hasError = results.some(function(r) { return r.error; });
            if (hasError) {
                var errMsg = results.find(function(r) { return r.error; }).error.message;
                _showToast('Save error: ' + errMsg, 'error');
            } else {
                _showToast('Saved successfully — ' + editedKeys.length + ' item(s) updated', 'success');
                _state.editedRows = {};
                // 清除缓存并重新加载
                if (N.data && N.data.pricing && N.data.pricing.clearWholesalePricingCache) {
                    N.data.pricing.clearWholesalePricingCache();
                }
                loadData();
            }
        });
    }

    /**
     * 批量设置 margin — 弹窗
     */
    function showBatchMarginModal() {
        var modal = document.getElementById('wpBatchMarginModal');
        if (modal) modal.style.display = 'flex';
        var countEl = document.getElementById('batchSelectedCount');
        if (countEl) countEl.textContent = _state.selectedSKUs.size;

        // 绑定输入联动
        var input = document.getElementById('batchMarginInput');
        if (input) {
            input.oninput = function() {
                var val = parseFloat(this.value) || 0;
                var pct = document.getElementById('batchMarginPercent');
                if (pct) pct.textContent = Math.round(val * 100);
                var preview = document.getElementById('batchPreview');
                if (preview) preview.textContent = 'Preview: Wholesale price = Supplier price \u00d7 ' + (1 + val).toFixed(2);
            };
        }
    }

    function closeBatchMarginModal() {
        var modal = document.getElementById('wpBatchMarginModal');
        if (modal) modal.style.display = 'none';
    }

    /**
     * 应用批量 margin
     */
    function applyBatchMargin() {
        var input = document.getElementById('batchMarginInput');
        var newX = parseFloat(input ? input.value : '0.40');
        if (isNaN(newX) || newX < 0 || newX > 5) {
            _showToast('Invalid margin value', 'error');
            return;
        }

        var scope = document.querySelector('input[name="batchScope"]:checked');
        var scopeVal = scope ? scope.value : 'selected';

        var skuCat = window.zbSKUCatalog || {};
        var driveCat = window.zbDriveSystemCatalog || {};
        var keysToUpdate = [];

        if (scopeVal === 'selected') {
            keysToUpdate = Array.from(_state.selectedSKUs);
        } else if (scopeVal === 'series') {
            var seriesSelect = document.getElementById('batchSeriesSelect');
            var targetSeries = seriesSelect ? seriesSelect.value : 'WR100';
            if (targetSeries === 'drive') {
                keysToUpdate = Object.keys(driveCat);
            } else {
                Object.keys(skuCat).forEach(function(key) {
                    if ((skuCat[key].series || 'Special') === targetSeries) keysToUpdate.push(key);
                });
            }
        } else {
            keysToUpdate = Object.keys(skuCat).concat(Object.keys(driveCat));
        }

        if (keysToUpdate.length === 0) {
            _showToast('No SKUs to update', 'info');
            return;
        }

        keysToUpdate.forEach(function(key) {
            _state.editedRows[key] = newX;
        });

        closeBatchMarginModal();
        _renderPage();
        _restoreFilterState();
        _showToast(keysToUpdate.length + ' SKU(s) margin set to ' + (newX * 100).toFixed(0) + '%', 'success');
    }

    /**
     * 发布选中 SKU 到当前分销商
     * 计算 B = A*(1+x) 并 upsert 到 distributor_price_list
     */
    function publishSelected() {
        if (_state.selectedSKUs.size === 0) {
            _showToast('Please select SKUs to publish', 'info');
            return;
        }
        if (!_state.selectedDistributor) {
            _showToast('Please select a distributor', 'info');
            return;
        }

        // 先保存所有编辑的 x 值（如果有的话）
        var editedKeys = Object.keys(_state.editedRows);
        var savePromise = editedKeys.length > 0 ? _saveMarginsSilent(editedKeys) : Promise.resolve();

        savePromise.then(function() {
            return _doPublish();
        });
    }

    function _doPublish() {
        var client = _getClient();
        if (!client) return;

        var skuCat = window.zbSKUCatalog || {};
        var driveCat = window.zbDriveSystemCatalog || {};
        var tenantId = _state.selectedDistributor;
        var records = [];

        _state.selectedSKUs.forEach(function(skuKey) {
            var isBlinds = !!skuCat[skuKey];
            var isDrive = !!driveCat[skuKey];

            // 查找 x 值
            var dbRecord = _state.wholesaleData.find(function(r) { return r.sku_key === skuKey; });
            var x = _state.editedRows[skuKey] !== undefined ? _state.editedRows[skuKey] :
                    (dbRecord ? parseFloat(dbRecord.margin_factor_x) : 0.40);

            if (isBlinds) {
                var sku = skuCat[skuKey];
                var wholesaleTiers = sku.priceTiers.map(function(tier) {
                    return {
                        maxArea: tier.maxArea === Infinity ? 9999 : tier.maxArea,
                        wholesalePrice: Math.round(tier.price * (1 + x))
                    };
                });
                records.push({
                    tenant_id: tenantId,
                    sku_key: skuKey,
                    product_type: 'blinds',
                    price_tiers: wholesaleTiers,
                    currency: 'RMB',
                    source_margin_x: x,
                    is_visible: true,
                    hidden_reason: null,
                    hidden_at: null,
                    import_status: 'pending',
                    imported_at: null,
                    published_at: new Date().toISOString(),
                    synced_at: new Date().toISOString()
                });
            } else if (isDrive) {
                var drive = driveCat[skuKey];
                records.push({
                    tenant_id: tenantId,
                    sku_key: skuKey,
                    product_type: 'drive',
                    price_tiers: [{ wholesalePrice: Math.round(drive.price * (1 + x)) }],
                    currency: 'RMB',
                    source_margin_x: x,
                    is_visible: true,
                    hidden_reason: null,
                    hidden_at: null,
                    import_status: 'pending',
                    imported_at: null,
                    published_at: new Date().toISOString(),
                    synced_at: new Date().toISOString()
                });
            }
        });

        if (records.length === 0) return;

        client.from('distributor_price_list')
            .upsert(records, { onConflict: 'tenant_id,sku_key' })
            .then(function(res) {
                if (res.error) {
                    _showToast('Publish error: ' + res.error.message, 'error');
                } else {
                    var distName = _getDistributorName(tenantId);
                    _showToast(records.length + ' SKU(s) published to ' + distName, 'success');
                    // 写入发布历史日志
                    _logPublishHistory('publish', tenantId, records);
                    _state.selectedSKUs = new Set();
                    _state.editedRows = {};
                    loadData();
                }
            });
    }

    /**
     * 隐藏选中 SKU（设 is_visible = false，不删除记录）
     */
    function hideSelected() {
        if (_state.selectedSKUs.size === 0) {
            _showToast('Please select SKUs to hide', 'info');
            return;
        }
        if (!_state.selectedDistributor) {
            _showToast('Please select a distributor', 'info');
            return;
        }

        var client = _getClient();
        if (!client) return;

        var tenantId = _state.selectedDistributor;
        var skuKeys = Array.from(_state.selectedSKUs);

        // 只能隐藏已发布的 SKU
        var publishedKeys = skuKeys.filter(function(key) {
            return _state.distributorPriceList.some(function(r) {
                return r.sku_key === key;
            });
        });

        if (publishedKeys.length === 0) {
            _showToast('No published SKUs selected to hide', 'info');
            return;
        }

        client.from('distributor_price_list')
            .update({
                is_visible: false,
                hidden_reason: 'manual_hide',
                hidden_at: new Date().toISOString()
            })
            .eq('tenant_id', tenantId)
            .in('sku_key', publishedKeys)
            .then(function(res) {
                if (res.error) {
                    _showToast('Hide error: ' + res.error.message, 'error');
                } else {
                    _showToast(publishedKeys.length + ' SKU(s) hidden', 'success');
                    // 写入隐藏历史日志
                    var hideRecords = publishedKeys.map(function(k) {
                        return { sku_key: k, product_type: _getProductType(k) };
                    });
                    _logPublishHistory('hide', tenantId, hideRecords);
                    _state.selectedSKUs = new Set();
                    loadData();
                }
            });
    }

    /**
     * 静默保存 margins（不触发 UI 刷新）
     */
    function _saveMarginsSilent(keys) {
        var client = _getClient();
        if (!client) return Promise.resolve();

        var promises = keys.map(function(skuKey) {
            var newX = _state.editedRows[skuKey];
            var dbRecord = _state.wholesaleData.find(function(r) { return r.sku_key === skuKey; });
            if (dbRecord) {
                return client.from('platform_wholesale_pricing')
                    .update({ margin_factor_x: newX, updated_at: new Date().toISOString() })
                    .eq('id', dbRecord.id);
            }
            return Promise.resolve({ error: null });
        });

        return Promise.all(promises);
    }

    // ══════════════════════════════════════════════════════════
    //  5b. 发布历史日志
    // ══════════════════════════════════════════════════════════

    /**
     * 写入发布/隐藏历史日志
     * @param {string} action - 'publish' | 'hide' | 'unhide'
     * @param {string} tenantId - 目标分销商 UUID
     * @param {Array} records - 受影响的记录列表（至少含 sku_key）
     */
    function _logPublishHistory(action, tenantId, records) {
        var client = _getClient();
        if (!client) return;

        var skuKeys = records.map(function(r) { return r.sku_key; });
        var details = {
            items: records.map(function(r) {
                var d = { sku_key: r.sku_key, product_type: r.product_type || _getProductType(r.sku_key) };
                if (r.price_tiers) d.price_tiers = r.price_tiers;
                if (r.source_margin_x !== undefined) d.margin_x = r.source_margin_x;
                return d;
            })
        };

        client.from('publish_history')
            .insert({
                tenant_id: tenantId,
                action: action,
                sku_count: skuKeys.length,
                sku_keys: skuKeys,
                details: details,
                created_by: 'platform'
            })
            .then(function(res) {
                if (res.error) {
                    console.warn('[WholesalePricing] History log failed:', res.error.message);
                } else {
                    console.log('[WholesalePricing] History logged:', action, skuKeys.length, 'SKUs');
                    // 刷新历史面板（如果已打开）
                    if (_state.historyLoaded) _loadPublishHistory();
                }
            });
    }

    /**
     * 判断 SKU 的产品类型
     */
    function _getProductType(skuKey) {
        var skuCat = window.zbSKUCatalog || {};
        var driveCat = window.zbDriveSystemCatalog || {};
        if (skuCat[skuKey]) return 'blinds';
        if (driveCat[skuKey]) return 'drive';
        return 'unknown';
    }

    /**
     * 加载发布历史（最近 50 条）
     */
    function _loadPublishHistory() {
        var client = _getClient();
        if (!client) return;

        client.from('publish_history')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
            .then(function(res) {
                if (res.error) {
                    console.warn('[WholesalePricing] Load history failed:', res.error.message);
                    return;
                }
                _state.historyData = res.data || [];
                _state.historyLoaded = true;
                _renderHistoryPanel();
            });
    }

    /**
     * 渲染发布历史面板
     */
    function _renderHistoryPanel() {
        var container = document.getElementById('wp-history-panel');
        if (!container) return;

        var items = _state.historyData || [];
        if (items.length === 0) {
            container.innerHTML = '<div class="text-center text-gray-400 py-8"><i class="fas fa-history text-2xl mb-2"></i><p class="text-sm">No publish history yet</p></div>';
            return;
        }

        var html = '<div class="space-y-2 max-h-[400px] overflow-y-auto">';
        items.forEach(function(item) {
            var time = new Date(item.created_at);
            var timeStr = time.toLocaleDateString() + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            var distName = _getDistributorName(item.tenant_id);
            var actionIcon, actionColor, actionLabel;

            if (item.action === 'publish') {
                actionIcon = 'fa-upload';
                actionColor = 'text-green-600 bg-green-50';
                actionLabel = 'Published';
            } else if (item.action === 'hide') {
                actionIcon = 'fa-eye-slash';
                actionColor = 'text-orange-600 bg-orange-50';
                actionLabel = 'Hidden';
            } else {
                actionIcon = 'fa-eye';
                actionColor = 'text-blue-600 bg-blue-50';
                actionLabel = 'Unhidden';
            }

            // 构建变更详情摘要
            var details = item.details || {};
            var detailItems = details.items || [];
            var blindsCount = detailItems.filter(function(d) { return d.product_type === 'blinds'; }).length;
            var driveCount = detailItems.filter(function(d) { return d.product_type === 'drive'; }).length;
            var summary = [];
            if (blindsCount > 0) summary.push(blindsCount + ' blinds');
            if (driveCount > 0) summary.push(driveCount + ' drives');
            var summaryStr = summary.join(', ') || (item.sku_count + ' SKU(s)');

            // SKU 列表（最多显示 5 个）
            var skuKeys = item.sku_keys || [];
            var skuPreview = skuKeys.slice(0, 5).join(', ');
            if (skuKeys.length > 5) skuPreview += ' +' + (skuKeys.length - 5) + ' more';

            html += '<div class="border border-gray-100 rounded-lg p-3 hover:bg-gray-50/50 transition">' +
                '<div class="flex items-start justify-between gap-3">' +
                    '<div class="flex items-start gap-2.5 min-w-0">' +
                        '<div class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ' + actionColor + '">' +
                            '<i class="fas ' + actionIcon + ' text-xs"></i>' +
                        '</div>' +
                        '<div class="min-w-0">' +
                            '<div class="flex items-center gap-2 flex-wrap">' +
                                '<span class="text-sm font-medium text-gray-900">' + actionLabel + '</span>' +
                                '<span class="text-xs text-gray-400">\u2192</span>' +
                                '<span class="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">' + distName + '</span>' +
                            '</div>' +
                            '<p class="text-xs text-gray-500 mt-0.5">' + summaryStr + '</p>' +
                            '<p class="text-[11px] text-gray-400 mt-0.5 truncate" title="' + skuPreview + '">' + skuPreview + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<span class="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">' + timeStr + '</span>' +
                '</div>' +
            '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    /**
     * 切换历史面板显示/隐藏
     */
    function toggleHistoryPanel() {
        var panel = document.getElementById('wp-history-section');
        if (!panel) return;
        var isHidden = panel.classList.contains('hidden');
        if (isHidden) {
            panel.classList.remove('hidden');
            if (!_state.historyLoaded) _loadPublishHistory();
        } else {
            panel.classList.add('hidden');
        }
    }

    function _showNavItem() {
        var navItem = document.getElementById('nav-wholesale-pricing');
        if (navItem) navItem.style.display = '';
    }

    function _hideNavItem() {
        var navItem = document.getElementById('nav-wholesale-pricing');
        if (navItem) navItem.style.display = 'none';
    }

    // ══════════════════════════════════════════════════════════
    //  7. 工具函数
    // ══════════════════════════════════════════════════════════

    function _getClient() {
        return (typeof NestopiaDB !== 'undefined' && NestopiaDB.getClient) ? NestopiaDB.getClient() : null;
    }

    function _getDistributorName(tenantId) {
        var dist = _state.distributors.find(function(t) { return t.id === tenantId; });
        return dist ? dist.name : 'Unknown';
    }

    function _escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function _showToast(message, type) {
        // 简易 toast — 复用现有 toast 或创建临时 toast
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        // 内联 toast
        var existing = document.getElementById('wp-toast');
        if (existing) existing.remove();

        var colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' };
        var bgColor = colors[type] || colors.info;

        var toast = document.createElement('div');
        toast.id = 'wp-toast';
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;' +
            'border-radius:10px;color:white;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);' +
            'background:' + bgColor + ';transition:opacity 0.3s;';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    // ══════════════════════════════════════════════════════════
    //  8. 命名空间导出
    // ══════════════════════════════════════════════════════════

    N.modules.wholesalePricing = {
        init: init,
        loadData: loadData,
        saveAllMargins: saveAllMargins,
        showBatchMarginModal: showBatchMarginModal,
        closeBatchMarginModal: closeBatchMarginModal,
        applyBatchMargin: applyBatchMargin,
        publishSelected: publishSelected,
        hideSelected: hideSelected,
        toggleHistoryPanel: toggleHistoryPanel,

        // 内部事件处理（onclick 引用）
        _onFilterChange: _onFilterChange,
        _onDistributorChange: _onDistributorChange,
        _onMarginChange: _onMarginChange,
        _onSelectSKU: _onSelectSKU,
        _onSelectAll: _onSelectAll,
        _wpStartEditParams: _wpStartEditParams,
        _wpSaveParams: _wpSaveParams,
        _wpCancelEditParams: _wpCancelEditParams
    };

    console.log('[Nestopia] wholesale-pricing.js loaded');
})();
