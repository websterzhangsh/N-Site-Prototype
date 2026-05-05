/**
 * distributor-pricing.js — Phase 3: 分销商端价格表导入与通知
 * ============================================================
 * 当平台(Nestopia-CHN)向分销商发布价格表后，分销商在 Company Overview
 * 页面会看到通知横幅，引导其 Review & Import 价格表。
 *
 * 依赖: supabase-config.js, tenant.js, helpers.js
 * 命名空间: Nestopia.modules.distributorPricing
 * ============================================================
 */
(function() {
    'use strict';

    var N = window.Nestopia || (window.Nestopia = {});
    if (!N.modules) N.modules = {};

    // ══════════════════════════════════════════════════════════
    //  1. 状态
    // ══════════════════════════════════════════════════════════

    var _state = {
        pendingItems: [],       // distributor_price_list records with import_status='pending'
        importedItems: [],      // records with import_status='imported'
        initialized: false,
        loading: false
    };

    // ══════════════════════════════════════════════════════════
    //  2. 初始化 — 仅分销商租户执行
    // ══════════════════════════════════════════════════════════

    function init() {
        // 仅分销商端显示（非 nestopia-chn）
        if (N.tenant && N.tenant.isPlatform && N.tenant.isPlatform()) {
            console.log('[DistributorPricing] Skip init — platform tenant');
            return;
        }

        _state.initialized = true;
        var tenantId = _getDbTenantId();
        console.log('[DistributorPricing] init — slug:', (N.tenant && N.tenant.getCurrentSlug ? N.tenant.getCurrentSlug() : '?'), '| dbTenantId:', tenantId);
        checkPendingImports();
    }

    // ══════════════════════════════════════════════════════════
    //  3. 检查待导入价格表
    // ══════════════════════════════════════════════════════════

    function checkPendingImports() {
        var client = _getClient();
        if (!client) return;

        var tenantId = _getDbTenantId();
        if (!tenantId) return;

        _state.loading = true;

        client.from('distributor_price_list')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_visible', true)
            .order('published_at', { ascending: false })
            .then(function(res) {
                _state.loading = false;
                if (res.error) {
                    console.warn('[DistributorPricing] Load failed:', res.error.message);
                    return;
                }

                var data = res.data || [];
                _state.pendingItems = data.filter(function(r) { return r.import_status === 'pending'; });
                _state.importedItems = data.filter(function(r) { return r.import_status === 'imported'; });

                console.log('[DistributorPricing] Pending:', _state.pendingItems.length, '| Imported:', _state.importedItems.length);

                if (_state.pendingItems.length > 0) {
                    _renderNotificationBanner();
                } else {
                    _hideNotificationBanner();
                }
            });
    }

    // ══════════════════════════════════════════════════════════
    //  4. 通知横幅渲染
    // ══════════════════════════════════════════════════════════

    function _renderNotificationBanner() {
        // 移除已有横幅
        _hideNotificationBanner();

        var count = _state.pendingItems.length;
        var publishedAt = _state.pendingItems[0] ? _state.pendingItems[0].published_at : '';
        var dateStr = publishedAt ? new Date(publishedAt).toLocaleDateString() : '';

        var banner = document.createElement('div');
        banner.id = 'dp-notification-banner';
        banner.className = 'dp-notification-banner';
        banner.innerHTML =
            '<div class="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">' +
                        '<i class="fas fa-file-invoice-dollar text-blue-600 text-lg"></i>' +
                    '</div>' +
                    '<div>' +
                        '<div class="font-semibold text-gray-900">New Price List Available</div>' +
                        '<div class="text-sm text-gray-600">' +
                            count + ' SKU(s) published by Nestopia-CHN' +
                            (dateStr ? ' on ' + dateStr : '') +
                            ' &mdash; review and import to activate pricing.' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="flex items-center gap-2">' +
                    '<button onclick="Nestopia.modules.distributorPricing.showImportPanel()" ' +
                        'class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">' +
                        '<i class="fas fa-file-import mr-1"></i> Review & Import' +
                    '</button>' +
                    '<button onclick="Nestopia.modules.distributorPricing.dismissBanner()" ' +
                        'class="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors" title="Dismiss">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                '</div>' +
            '</div>';

        // 插入到 Company Overview (Dashboard) 页面顶部
        var overviewPage = document.getElementById('page-dashboard');
        if (overviewPage) {
            overviewPage.insertBefore(banner, overviewPage.firstChild);
        }
    }

    function _hideNotificationBanner() {
        var existing = document.getElementById('dp-notification-banner');
        if (existing) existing.remove();
    }

    function dismissBanner() {
        _hideNotificationBanner();
    }

    // ══════════════════════════════════════════════════════════
    //  5. Import 面板 — Review & Import
    // ══════════════════════════════════════════════════════════

    function showImportPanel() {
        // 移除已有面板
        _hideImportPanel();

        var panel = document.createElement('div');
        panel.id = 'dp-import-panel';
        panel.style.cssText = 'position:fixed;inset:0;z-index:9998;display:flex;align-items:center;justify-content:center;';
        panel.innerHTML =
            '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.4);" onclick="Nestopia.modules.distributorPricing.hideImportPanel()"></div>' +
            '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden relative z-10 flex flex-col">' +
                _renderImportPanelHeader() +
                _renderImportPanelBody() +
                _renderImportPanelFooter() +
            '</div>';

        document.body.appendChild(panel);
    }

    function _renderImportPanelHeader() {
        var count = _state.pendingItems.length;
        return '<div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">' +
            '<div>' +
                '<h2 class="text-lg font-bold text-gray-900">Import Price List from Nestopia-CHN</h2>' +
                '<p class="text-sm text-gray-500 mt-0.5">' + count + ' SKU(s) pending import</p>' +
            '</div>' +
            '<button onclick="Nestopia.modules.distributorPricing.hideImportPanel()" ' +
                'class="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">' +
                '<i class="fas fa-times"></i>' +
            '</button>' +
        '</div>';
    }

    function _renderImportPanelBody() {
        var skuCat = window.zbSKUCatalog || {};
        var driveCat = window.zbDriveSystemCatalog || {};

        var blindsItems = _state.pendingItems.filter(function(r) { return r.product_type === 'blinds'; });
        var driveItems = _state.pendingItems.filter(function(r) { return r.product_type === 'drive'; });

        var html = '<div class="flex-1 overflow-y-auto px-6 py-4" style="max-height:55vh;">';

        // Blinds section
        if (blindsItems.length > 0) {
            html += '<div class="mb-5">' +
                '<h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">' +
                    '<i class="fas fa-blinds text-blue-500"></i> Zip Blinds SKU Pricing (' + blindsItems.length + ')' +
                '</h3>' +
                '<div class="space-y-2">';

            blindsItems.forEach(function(item) {
                var sku = skuCat[item.sku_key] || {};
                var tiers = item.price_tiers || [];
                var seriesMatch = (item.sku_key || '').match(/^(WR\d+)/);
                var series = seriesMatch ? seriesMatch[1] : '';
                var minArea = sku.minArea || 3;

                html += '<div class="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50/20 transition">' +
                    '<div class="flex items-center justify-between mb-2">' +
                        '<div class="flex items-center gap-2">' +
                            '<span class="font-mono text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">' + _escHtml(item.sku_key) + '</span>' +
                            (series ? '<span class="text-[10px] text-gray-400 uppercase">' + series + '</span>' : '') +
                        '</div>' +
                        '<span class="text-[10px] text-blue-500 font-medium">' + tiers.length + ' tier' + (tiers.length > 1 ? 's' : '') + '</span>' +
                    '</div>' +
                    '<div class="flex flex-wrap gap-1.5">';

                tiers.forEach(function(t, i) {
                    var maxA = t.maxArea === 9999 ? Infinity : (t.maxArea || Infinity);
                    var areaLabel;
                    if (maxA === Infinity) {
                        areaLabel = '>' + (i > 0 ? tiers[i-1].maxArea : minArea) + ' m\u00b2';
                    } else {
                        areaLabel = '\u2264' + t.maxArea + ' m\u00b2';
                    }
                    html += '<div class="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-md px-2.5 py-1">' +
                        '<span class="text-[11px] text-gray-600">' + areaLabel + '</span>' +
                        '<span class="text-[11px] font-bold text-blue-700">\u00a5' + t.wholesalePrice + '</span>' +
                    '</div>';
                });

                html += '</div></div>';
            });

            html += '</div></div>';
        }

        // Drive section
        if (driveItems.length > 0) {
            html += '<div class="mb-4">' +
                '<h3 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">' +
                    '<i class="fas fa-cog text-amber-500"></i> Drive Systems (' + driveItems.length + ')' +
                '</h3>' +
                '<div class="grid grid-cols-2 gap-2">';

            driveItems.forEach(function(item) {
                var drive = driveCat[item.sku_key] || {};
                var driveName = drive.name || item.sku_key;
                var tiers = item.price_tiers || [];
                var price = tiers.length > 0 ? tiers[0].wholesalePrice : '\u2014';

                html += '<div class="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5 hover:border-amber-300 hover:bg-amber-50/20 transition">' +
                    '<div class="flex items-center gap-2 min-w-0">' +
                        '<i class="fas fa-cog text-gray-400 text-xs flex-shrink-0"></i>' +
                        '<span class="text-xs font-medium text-gray-800 truncate">' + _escHtml(driveName) + '</span>' +
                    '</div>' +
                    '<span class="text-xs font-bold text-amber-700 flex-shrink-0">\u00a5' + price + '/set</span>' +
                '</div>';
            });

            html += '</div></div>';
        }

        html += '</div>';
        return html;
    }

    function _renderImportPanelFooter() {
        var count = _state.pendingItems.length;
        return '<div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">' +
            '<div class="text-sm text-gray-500">' +
                '<i class="fas fa-info-circle mr-1"></i> ' +
                'Importing will activate these prices for your quotations.' +
            '</div>' +
            '<div class="flex items-center gap-3">' +
                '<button onclick="Nestopia.modules.distributorPricing.hideImportPanel()" ' +
                    'class="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">' +
                    'Cancel' +
                '</button>' +
                '<button onclick="Nestopia.modules.distributorPricing.importAll()" ' +
                    'class="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm">' +
                    '<i class="fas fa-check mr-1"></i> Import All (' + count + ')' +
                '</button>' +
            '</div>' +
        '</div>';
    }

    function hideImportPanel() {
        _hideImportPanel();
    }

    function _hideImportPanel() {
        var panel = document.getElementById('dp-import-panel');
        if (panel) panel.remove();
    }

    // ══════════════════════════════════════════════════════════
    //  6. Import 操作
    // ══════════════════════════════════════════════════════════

    function importAll() {
        var client = _getClient();
        if (!client) return;

        var tenantId = _getDbTenantId();
        if (!tenantId) return;

        var ids = _state.pendingItems.map(function(r) { return r.id; });
        if (ids.length === 0) return;

        // 批量更新 import_status = 'imported'
        client.from('distributor_price_list')
            .update({
                import_status: 'imported',
                imported_at: new Date().toISOString()
            })
            .eq('tenant_id', tenantId)
            .eq('import_status', 'pending')
            .then(function(res) {
                if (res.error) {
                    _showToast('Import failed: ' + res.error.message, 'error');
                    return;
                }

                var count = _state.pendingItems.length;
                _state.importedItems = _state.importedItems.concat(_state.pendingItems);
                _state.pendingItems = [];

                _hideImportPanel();
                _hideNotificationBanner();
                _showToast('Successfully imported ' + count + ' SKU(s) — pricing is now active', 'success');

                // 清除定价缓存，下次报价使用新价格
                if (N.data && N.data.pricing && N.data.pricing.clearWholesalePricingCache) {
                    N.data.pricing.clearWholesalePricingCache();
                }
            });
    }

    // ══════════════════════════════════════════════════════════
    //  7. 获取已导入的价格数据（供 Step 4 报价使用）
    // ══════════════════════════════════════════════════════════

    /**
     * 获取当前分销商已导入的价格表
     * @returns {Promise<Array>} — distributor_price_list records with import_status='imported'
     */
    function getImportedPriceList() {
        // 如果已加载，直接返回缓存
        if (_state.importedItems.length > 0) {
            return Promise.resolve(_state.importedItems);
        }

        var client = _getClient();
        if (!client) return Promise.resolve([]);

        var tenantId = _getDbTenantId();
        if (!tenantId) return Promise.resolve([]);

        return client.from('distributor_price_list')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('is_visible', true)
            .eq('import_status', 'imported')
            .then(function(res) {
                if (res.error) return [];
                _state.importedItems = res.data || [];
                return _state.importedItems;
            });
    }

    /**
     * 根据 SKU key 获取批发价 tiers（已导入的）
     * @param {string} skuKey
     * @returns {Array|null} — price_tiers 数组 或 null（未导入）
     */
    function getWholesalePriceTiers(skuKey) {
        var record = _state.importedItems.find(function(r) { return r.sku_key === skuKey; });
        return record ? (record.price_tiers || null) : null;
    }

    /**
     * 获取某 SKU 的批发单价（第一个 tier 的价格）
     * @param {string} skuKey
     * @returns {number|null}
     */
    function getWholesalePrice(skuKey) {
        var tiers = getWholesalePriceTiers(skuKey);
        if (!tiers || tiers.length === 0) return null;
        return tiers[0].wholesalePrice || null;
    }

    // ══════════════════════════════════════════════════════════
    //  8. 工具函数
    // ══════════════════════════════════════════════════════════

    function _getClient() {
        return (typeof NestopiaDB !== 'undefined' && NestopiaDB.getClient) ? NestopiaDB.getClient() : null;
    }

    function _getDbTenantId() {
        return (N.tenant && N.tenant.getDbTenantId) ? N.tenant.getDbTenantId() : null;
    }

    function _escHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function _showToast(message, type) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
            return;
        }
        // 内联 toast fallback
        var existing = document.getElementById('dp-toast');
        if (existing) existing.remove();

        var colors = { success: '#22c55e', error: '#ef4444', info: '#3b82f6' };
        var bgColor = colors[type] || colors.info;

        var toast = document.createElement('div');
        toast.id = 'dp-toast';
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;' +
            'border-radius:10px;color:white;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);' +
            'background:' + bgColor + ';transition:opacity 0.3s;';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() { toast.remove(); }, 300);
        }, 4000);
    }

    // ══════════════════════════════════════════════════════════
    //  9. 命名空间导出
    // ══════════════════════════════════════════════════════════

    N.modules.distributorPricing = {
        init: init,
        checkPendingImports: checkPendingImports,
        showImportPanel: showImportPanel,
        hideImportPanel: hideImportPanel,
        dismissBanner: dismissBanner,
        importAll: importAll,
        getImportedPriceList: getImportedPriceList,
        getWholesalePriceTiers: getWholesalePriceTiers,
        getWholesalePrice: getWholesalePrice
    };

    console.log('[Nestopia] distributor-pricing.js loaded (Phase 3)');
})();
