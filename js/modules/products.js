/**
 * products.js — 产品管理页面
 * Phase 3.5: Products Page Functions
 * 依赖: helpers.js, supabase-config.js, data/product-catalog.js
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.modules = N.modules || {};

    // ===== Products Page Functions =====
    const productsState = {
        selectedProduct: getCurrentTenantSlug() === 'omeya-sin' ? 'WR100A-63' : 'sr-l-classic',
        filter: 'all',
        uploadVisible: false
    };

    // Product Catalog Data (-> js/data/product-catalog.js)
    let productCatalog = Nestopia.data.productCatalog;

    // ── v3.0: 从 zbSKUCatalog 动态注入 Zip Blinds 产品条目 ──
    function _injectZBProducts() {
        var skuCat = window.zbSKUCatalog;
        var driveCat = window.zbDriveSystemCatalog;
        if (!skuCat) return;
        var sketchIcon = '/images/products/icons/zip-blinds.png'; // sketch 风格产品图标
        Object.keys(skuCat).forEach(function(key) {
            var s = skuCat[key];
            // 判断驱动类型
            var hasMotor = false;
            if (s.drives && driveCat) {
                for (var i = 0; i < s.drives.length; i++) {
                    var d = driveCat[s.drives[i]];
                    if (d && d.type === 'motorized') { hasMotor = true; break; }
                }
            }
            var priceRange = s.priceTiers || [];
            var lowPrice = priceRange.length > 0 ? priceRange[priceRange.length - 1].price : 0;
            var highPrice = priceRange.length > 0 ? priceRange[0].price : 0;
            productCatalog[key] = {
                name: s.name,
                nameZh: s.nameZh,
                category: 'blinds',
                catLabel: 'Zip Blinds',
                series: s.series,
                shape: s.housing,
                control: hasMotor ? 'Motorized' : 'Manual',
                status: 'Active',
                leadTime: '2-3 weeks',
                fileCount: 0,
                image: sketchIcon,  // 使用 sketch 图标替代场景图
                desc: s.features || '',
                components: ['Aluminum alloy housing', 'Premium outdoor fabric', 'Side track system', 'Zipper guide track'],
                colors: 'Coffee Brown / Iron Black / Matte White / Iron Grey / Matte Black',
                spans: [],
                extras: [],
                optionSet: 'blinds',
                noteSet: 'blinds',
                // 新增 ZB SKU 专有字段
                _zbSKU: key,
                _zbData: s,
                cost: {
                    unit: 'm\u00b2', currency: 'RMB',
                    tiers: priceRange.map(function(t) {
                        return { span: (t.maxArea === Infinity ? '>' + (priceRange.length > 1 ? priceRange[priceRange.length - 2].maxArea : s.minArea || 3) : '\u2264' + t.maxArea) + ' m\u00b2', priceRange: [t.price, t.price] };
                    }),
                    note: 'Supplier unit price (RMB/m\u00b2). Min billable area: ' + (s.minArea || 3) + ' m\u00b2.'
                },
                price: null
            };
            // 注册 sketch 图标到 productIcons（侧边栏和详情主图共用）
            productIcons[key] = sketchIcon;
        });
        console.log('[ProductCatalog] 从 zbSKUCatalog 注入 ' + Object.keys(skuCat).length + ' 个 ZB SKU 产品');

        // ── 向后兼容别名：overview.js 仍使用 'zb-manual' / 'zb-motorized' ──
        var firstKey = Object.keys(skuCat)[0]; // 默认代表 SKU（WR100A-63）
        if (firstKey && productCatalog[firstKey]) {
            productCatalog['zb-manual']    = productCatalog[firstKey];
            productCatalog['zb-motorized'] = productCatalog[firstKey];
            console.log('[ProductCatalog] 已添加 zb-manual / zb-motorized 向后兼容别名 →', firstKey);
        }
    }
    _injectZBProducts();


    // -- Product Catalog: Supabase CRUD Helpers ---------------
    const PRODUCT_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
    let _productCatalogSeeded = false;

    async function loadProductCatalogFromDB() {
        if (typeof NestopiaDB === 'undefined') return false;
        try {
            const res = await fetch(
                NestopiaDB.url + '/rest/v1/tenant_products?tenant_id=eq.' + PRODUCT_TENANT_ID + '&order=sort_order.asc,product_key.asc',
                { headers: { 'apikey': NestopiaDB.anonKey, 'Authorization': 'Bearer ' + NestopiaDB.anonKey } }
            );
            if (!res.ok) return false;
            const rows = await res.json();
            if (rows.length === 0) return false;
            // 构建 productCatalog 和 productIcons
            const newCatalog = {};
            rows.forEach(r => {
                newCatalog[r.product_key] = r.product_data;
                if (r.product_data.icon) productIcons[r.product_key] = r.product_data.icon;
                else if (r.product_data.image) productIcons[r.product_key] = r.product_data.image;
            });
            productCatalog = newCatalog;
            console.log('[ProductCatalog] 从 DB 加载 ' + rows.length + ' 个产品');
            return true;
        } catch (e) { console.warn('[ProductCatalog] DB 加载失败', e); return false; }
    }

    async function seedProductCatalogToDB() {
        if (typeof NestopiaDB === 'undefined' || _productCatalogSeeded) return;
        _productCatalogSeeded = true;
        try {
            const entries = Object.entries(productCatalog);
            for (let i = 0; i < entries.length; i++) {
                const [key, data] = entries[i];
                await fetch(NestopiaDB.url + '/rest/v1/tenant_products', {
                    method: 'POST',
                    headers: {
                        'apikey': NestopiaDB.anonKey,
                        'Authorization': 'Bearer ' + NestopiaDB.anonKey,
                        'Content-Type': 'application/json',
                        'Prefer': 'resolution=ignore-duplicates'
                    },
                    body: JSON.stringify({
                        tenant_id: PRODUCT_TENANT_ID,
                        product_key: key,
                        product_data: data,
                        sort_order: i
                    })
                });
            }
            console.log('[ProductCatalog] Seed ' + entries.length + ' 默认产品到 DB');
        } catch (e) { console.warn('[ProductCatalog] Seed 失败', e); }
    }

    async function saveProductToDB(productKey, productData, sortOrder) {
        if (typeof NestopiaDB === 'undefined') return;
        try {
            await fetch(NestopiaDB.url + '/rest/v1/tenant_products', {
                method: 'POST',
                headers: {
                    'apikey': NestopiaDB.anonKey,
                    'Authorization': 'Bearer ' + NestopiaDB.anonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                    tenant_id: PRODUCT_TENANT_ID,
                    product_key: productKey,
                    product_data: productData,
                    sort_order: sortOrder || 0,
                    is_active: true
                })
            });
        } catch (e) { console.warn('[ProductCatalog] 保存失败', e); }
    }

    async function deleteProductFromDB(productKey) {
        if (typeof NestopiaDB === 'undefined') return;
        try {
            await fetch(
                NestopiaDB.url + '/rest/v1/tenant_products?tenant_id=eq.' + PRODUCT_TENANT_ID + '&product_key=eq.' + encodeURIComponent(productKey),
                {
                    method: 'DELETE',
                    headers: { 'apikey': NestopiaDB.anonKey, 'Authorization': 'Bearer ' + NestopiaDB.anonKey }
                }
            );
        } catch (e) { console.warn('[ProductCatalog] 删除失败', e); }
    }

    // -- Product CRUD Modal -----------------------------------
    function openProductModal(mode, productKey) {
        // mode = 'create' | 'edit'
        const existing = mode === 'edit' && productKey ? productCatalog[productKey] : null;
        const title = mode === 'edit' ? 'Edit Product' : 'Add New Product';
        const catOptions = ['sunroom', 'pergola', 'blinds', 'adu'];
        const catLabels = { sunroom: 'Sunroom', pergola: 'Pergola', blinds: 'Zip Blinds', adu: 'ADU' };
        const statusOptions = ['Active', 'Draft', 'Discontinued'];
        const controlOptions = ['Manual', 'Motorized', 'Solar + Motor', 'Electric Motor', 'N/A'];

        const p = existing || {
            name: '', category: 'sunroom', catLabel: 'Sunroom',
            series: '', shape: '', control: 'Manual',
            status: 'Active', leadTime: '', fileCount: 0,
            icon: '', image: '', desc: '',
            components: [], colors: 'Standard & Non-standard',
            spans: [], extras: [],
            optionSet: 'sunroom', noteSet: 'sunroom',
            cost: { unit: 'sqft', currency: 'USD', tiers: [], note: '' },
            price: { unit: 'sqft', currency: 'USD', tiers: [], note: '' }
        };

        // 把数组转成逗号分隔文本用于编辑
        const componentsStr = (p.components || []).join('\n');
        const spansStr = (p.spans || []).join(', ');
        const extrasStr = (p.extras || []).join('\n');
        const tiersStr = (p.cost && p.cost.tiers || []).map(t =>
            t.span + '|' + (t.priceRange ? t.priceRange[0] + '-' + t.priceRange[1] : 'TBD')
        ).join('\n');
        const priceTiersStr = (p.price && p.price.tiers || []).map(t => {
            var key = t.label || t.span || '';
            var r = t.retail ? t.retail[0] + '-' + t.retail[1] : 'TBD';
            var w = t.wholesale ? t.wholesale[0] + '-' + t.wholesale[1] : 'TBD';
            return key + '|' + r + '|' + w;
        }).join('\n');

        const modal = document.createElement('div');
        modal.id = 'productCrudModal';
        modal.className = 'fixed inset-0 z-[300] flex items-start justify-center pt-6 overflow-y-auto bg-black/40 backdrop-blur-sm';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.innerHTML = '\
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4 mb-8" style="animation: modalIn 0.2s ease-out" onclick="event.stopPropagation()">\
                <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">\
                    <div>\
                        <div class="text-base font-bold text-gray-900">' + title + '</div>\
                        <div class="text-xs text-gray-400 mt-0.5">' + (mode === 'edit' ? 'Key: ' + productKey : 'Create a new product entry') + '</div>\
                    </div>\
                    <button onclick="document.getElementById(\'productCrudModal\').remove()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">\
                        <i class="fas fa-times text-gray-500 text-sm"></i>\
                    </button>\
                </div>\
                <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">\
                    <!-- Row 1: Name + Key -->\
                    <div class="grid grid-cols-2 gap-4">\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Product Name *</label>\
                            <input id="pcm_name" type="text" value="' + p.name.replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. L-Classic Sunroom">\
                        </div>\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Product Key *</label>\
                            <input id="pcm_key" type="text" value="' + (productKey || '') + '" ' + (mode === 'edit' ? 'readonly class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"' : 'class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"') + ' placeholder="e.g. sr-l-classic (unique)">\
                        </div>\
                    </div>\
\
                    <!-- Row 2: Category + Series + Shape -->\
                    <div class="grid grid-cols-3 gap-4">\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>\
                            <select id="pcm_category" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">\
                                ' + catOptions.map(c => '<option value="' + c + '"' + (p.category === c ? ' selected' : '') + '>' + catLabels[c] + '</option>').join('') + '\
                            </select>\
                        </div>\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Series</label>\
                            <input id="pcm_series" type="text" value="' + (p.series || '').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Classic Series">\
                        </div>\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Shape</label>\
                            <input id="pcm_shape" type="text" value="' + (p.shape || '').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="L-Type (optional)">\
                        </div>\
                    </div>\
\
                    <!-- Row 3: Control + Status + Lead Time -->\
                    <div class="grid grid-cols-3 gap-4">\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Control</label>\
                            <select id="pcm_control" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">\
                                ' + controlOptions.map(c => '<option value="' + c + '"' + (p.control === c ? ' selected' : '') + '>' + c + '</option>').join('') + '\
                            </select>\
                        </div>\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>\
                            <select id="pcm_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">\
                                ' + statusOptions.map(s => '<option value="' + s + '"' + (p.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '\
                            </select>\
                        </div>\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lead Time</label>\
                            <input id="pcm_leadTime" type="text" value="' + (p.leadTime || '').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="3-4 weeks">\
                        </div>\
                    </div>\
\
                    <!-- Row 4: Colors -->\
                    <div>\
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Colors</label>\
                        <input id="pcm_colors" type="text" value="' + (p.colors || '').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Standard & Non-standard">\
                    </div>\
\
                    <!-- Row 5: Image URLs -->\
                    <div class="grid grid-cols-2 gap-4">\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Icon URL</label>\
                            <input id="pcm_icon" type="text" value="' + (p.icon || '').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="/images/products/icons/xxx.png">\
                        </div>\
                        <div>\
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>\
                            <input id="pcm_image" type="text" value="' + (p.image || '').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="/images/gallery/xxx.jpg">\
                        </div>\
                    </div>\
\
                    <!-- Description -->\
                    <div>\
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>\
                        <textarea id="pcm_desc" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Product description...">' + (p.desc || '').replace(/</g, '&lt;') + '</textarea>\
                    </div>\
\
                    <!-- Components (one per line) -->\
                    <div>\
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Components <span class="font-normal text-gray-400">(one per line)</span></label>\
                        <textarea id="pcm_components" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Aluminum alloy profiles&#10;Polycarbonate panels&#10;...">' + componentsStr.replace(/</g, '&lt;') + '</textarea>\
                    </div>\
\
                    <!-- Extras (subset of components, one per line) -->\
                    <div>\
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Series Extras <span class="font-normal text-gray-400">(one per line, subset of components)</span></label>\
                        <textarea id="pcm_extras" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Motor & drive control system&#10;...">' + extrasStr.replace(/</g, '&lt;') + '</textarea>\
                    </div>\
\
                    <!-- Spans -->\
                    <div>\
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Span Options <span class="font-normal text-gray-400">(comma separated)</span></label>\
                        <input id="pcm_spans" type="text" value="' + spansStr.replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="\u22644m, \u22645m, \u22646m, \u22647m, >7m">\
                    </div>\
\
                    <!-- Pricing Section -->\
                    <div class="border border-gray-200 rounded-xl p-4 bg-gray-50/50">\
                        <h5 class="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3"><i class="fas fa-coins mr-1"></i>Material Cost (COGS)</h5>\
                        <div class="grid grid-cols-2 gap-4 mb-3">\
                            <div>\
                                <label class="block text-xs text-gray-500 mb-1">Unit</label>\
                                <input id="pcm_costUnit" type="text" value="' + (p.cost && p.cost.unit || 'sqft').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">\
                            </div>\
                            <div>\
                                <label class="block text-xs text-gray-500 mb-1">Currency</label>\
                                <input id="pcm_costCurrency" type="text" value="' + (p.cost && p.cost.currency || 'USD').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">\
                            </div>\
                        </div>\
                        <div>\
                            <label class="block text-xs text-gray-500 mb-1">Cost Tiers <span class="text-gray-400">(one per line: span|low-high, e.g. \u22644m|26-30)</span></label>\
                            <textarea id="pcm_tiers" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="\u22644m|26-30&#10;\u22645m|28-32&#10;...">' + tiersStr.replace(/</g, '&lt;') + '</textarea>\
                        </div>\
                        <div class="mt-3">\
                            <label class="block text-xs text-gray-500 mb-1">Cost Note</label>\
                            <input id="pcm_costNote" type="text" value="' + (p.cost && p.cost.note || '').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Material cost only...">\
                        </div>\
                    </div>\
\
                    <!-- Selling Price Section -->\
                    <div class="border border-orange-200 rounded-xl p-4 bg-orange-50/30">\
                        <h5 class="text-xs font-bold text-orange-700 uppercase tracking-wider mb-3"><i class="fas fa-tags mr-1"></i>Selling Price</h5>\
                        <div class="grid grid-cols-2 gap-4 mb-3">\
                            <div>\
                                <label class="block text-xs text-gray-500 mb-1">Unit</label>\
                                <input id="pcm_priceUnit" type="text" value="' + (p.price && p.price.unit || 'sqft').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">\
                            </div>\
                            <div>\
                                <label class="block text-xs text-gray-500 mb-1">Currency</label>\
                                <input id="pcm_priceCurrency" type="text" value="' + (p.price && p.price.currency || 'USD').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500">\
                            </div>\
                        </div>\
                        <div>\
                            <label class="block text-xs text-gray-500 mb-1">Price Tiers <span class="text-gray-400">(one per line: span|retail_low-high|wholesale_low-high)</span></label>\
                            <textarea id="pcm_priceTiers" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="\u22644m|36-42|30-35&#10;\u22645m|39-45|32-37&#10;...">' + priceTiersStr.replace(/</g, '&lt;') + '</textarea>\
                        </div>\
                        <div class="mt-3">\
                            <label class="block text-xs text-gray-500 mb-1">Price Note</label>\
                            <input id="pcm_priceNote" type="text" value="' + (p.price && p.price.note || '').replace(/"/g, '&quot;') + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Suggested selling price...">\
                        </div>\
                    </div>\
                </div>\
                <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">\
                    <button onclick="document.getElementById(\'productCrudModal\').remove()" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">Cancel</button>\
                    <button onclick="Nestopia.modules.products.saveProductFromModal(\'' + mode + '\', \'' + (productKey || '') + '\')" class="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition shadow-sm flex items-center gap-2">\
                        <i class="fas fa-save"></i> ' + (mode === 'edit' ? 'Update Product' : 'Create Product') + '\
                    </button>\
                </div>\
            </div>';
        document.body.appendChild(modal);
    }

    async function saveProductFromModal(mode, origKey) {
        const catLabels = { sunroom: 'Sunroom', pergola: 'Pergola', blinds: 'Zip Blinds', adu: 'ADU' };
        const name = document.getElementById('pcm_name').value.trim();
        const key = document.getElementById('pcm_key').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const category = document.getElementById('pcm_category').value;
        if (!name || !key) { showToast('Product name and key are required.', 'error'); return; }
        if (mode === 'create' && productCatalog[key]) { showToast('Product key "' + key + '" already exists.', 'error'); return; }

        // 解析 tiers
        const tiersRaw = document.getElementById('pcm_tiers').value.trim().split('\n').filter(l => l.trim());
        const tiers = tiersRaw.map(line => {
            const parts = line.split('|');
            const span = (parts[0] || '').trim();
            const rangePart = (parts[1] || '').trim();
            if (rangePart === 'TBD' || !rangePart) return { span: span, priceRange: null };
            const nums = rangePart.split('-').map(Number);
            return { span: span, priceRange: nums.length >= 2 ? [nums[0], nums[1]] : [nums[0], nums[0]] };
        });

        // 构建产品对象
        const productData = {
            name: name,
            category: category,
            catLabel: catLabels[category] || category,
            series: document.getElementById('pcm_series').value.trim(),
            shape: document.getElementById('pcm_shape').value.trim(),
            control: document.getElementById('pcm_control').value,
            status: document.getElementById('pcm_status').value,
            leadTime: document.getElementById('pcm_leadTime').value.trim(),
            fileCount: (productCatalog[key] || {}).fileCount || 0,
            icon: document.getElementById('pcm_icon').value.trim(),
            image: document.getElementById('pcm_image').value.trim(),
            desc: document.getElementById('pcm_desc').value.trim(),
            components: document.getElementById('pcm_components').value.trim().split('\n').map(s => s.trim()).filter(Boolean),
            colors: document.getElementById('pcm_colors').value.trim(),
            spans: document.getElementById('pcm_spans').value.split(',').map(s => s.trim()).filter(Boolean),
            extras: document.getElementById('pcm_extras').value.trim().split('\n').map(s => s.trim()).filter(Boolean),
            optionSet: category,
            noteSet: category,
            cost: {
                unit: document.getElementById('pcm_costUnit').value.trim() || 'sqft',
                currency: document.getElementById('pcm_costCurrency').value.trim() || 'USD',
                tiers: tiers,
                note: document.getElementById('pcm_costNote').value.trim()
            },
            price: (function() {
                var pUnit = document.getElementById('pcm_priceUnit').value.trim() || 'sqft';
                var pCurr = document.getElementById('pcm_priceCurrency').value.trim() || 'USD';
                var pNote = document.getElementById('pcm_priceNote').value.trim();
                var pRaw = document.getElementById('pcm_priceTiers').value.trim().split('\n').filter(function(l) { return l.trim(); });
                var isStrategy = pRaw.length > 0 && pRaw[0].indexOf('ZB-') === 0;
                var pTiers = pRaw.map(function(line) {
                    var parts = line.split('|');
                    var key = (parts[0] || '').trim();
                    var rPart = (parts[1] || '').trim();
                    var wPart = (parts[2] || '').trim();
                    var rNums = rPart && rPart !== 'TBD' ? rPart.split('-').map(Number) : null;
                    var wNums = wPart && wPart !== 'TBD' ? wPart.split('-').map(Number) : null;
                    var tier = {};
                    if (isStrategy) tier.label = key; else tier.span = key;
                    if (rNums && rNums.length >= 2) tier.retail = [rNums[0], rNums[1]];
                    if (wNums && wNums.length >= 2) tier.wholesale = [wNums[0], wNums[1]];
                    return tier;
                });
                var result = { unit: pUnit, currency: pCurr, tiers: pTiers, note: pNote };
                if (isStrategy) result.mode = 'strategy';
                return result;
            })()
        };

        // 更新本地 catalog
        productCatalog[key] = productData;
        if (productData.icon) productIcons[key] = productData.icon;
        else if (productData.image) productIcons[key] = productData.image;

        // 保存到 DB
        const sortOrder = Object.keys(productCatalog).indexOf(key);
        await saveProductToDB(key, productData, sortOrder);

        // 刷新 UI
        renderProductList();
        updateProductDetail(key);
        productsState.selectedProduct = key;
        updateProductStats();

        // 关闭 modal
        const modal = document.getElementById('productCrudModal');
        if (modal) modal.remove();
        showToast(mode === 'edit' ? 'Product updated successfully!' : 'Product created successfully!', 'success');
    }

    async function deleteProduct(productKey) {
        if (!productKey || !productCatalog[productKey]) return;
        const pName = productCatalog[productKey].name || productKey;
        if (!confirm('Delete "' + pName + '"? This action cannot be undone.')) return;

        // 从本地删除
        delete productCatalog[productKey];
        delete productIcons[productKey];

        // 从 DB 删除
        await deleteProductFromDB(productKey);

        // 刷新 UI
        const remaining = Object.keys(productCatalog);
        productsState.selectedProduct = remaining.length > 0 ? remaining[0] : null;
        renderProductList();
        if (productsState.selectedProduct) {
            updateProductDetail(productsState.selectedProduct);
        } else {
            const dc = document.getElementById('productDetailContent');
            if (dc) dc.innerHTML = '<div class="text-center text-gray-400 py-12"><i class="fas fa-box-open text-4xl mb-3"></i><p>No products in catalog</p></div>';
        }
        updateProductStats();
        showToast('Product "' + pName + '" deleted.', 'success');
    }

    function updateProductStats() {
        const entries = getFilteredCatalogEntries();
        const total = entries.length;
        const active = entries.filter(([k, p]) => p.status === 'Active').length;
        const cats = new Set(entries.map(([k, p]) => p.category)).size;
        // 更新 Stats 栏
        const statsCards = document.querySelectorAll('#page-products .grid.grid-cols-4 .text-2xl');
        if (statsCards.length >= 3) {
            statsCards[0].textContent = total;
            statsCards[1].textContent = active;
            statsCards[2].textContent = cats;
        }
    }

    // Shared option sets for each product category
    const productOptionSets = {
        sunroom: [
            { name: 'Honeycomb Shade \u2014 Top (Manual)', icon: 'fa-sun', desc: 'Aluminum foil honeycomb shade for roof' },
            { name: 'Honeycomb Shade \u2014 Top (Electric)', icon: 'fa-bolt', desc: 'Motorized honeycomb shade with control' },
            { name: 'Facade Shade \u2014 Manual', icon: 'fa-grip-lines', desc: 'Manual facade shading system' },
            { name: 'Facade Shade \u2014 Electric', icon: 'fa-sliders-h', desc: 'Electric facade shading system' },
            { name: 'LED Strip Lighting', icon: 'fa-lightbulb', desc: 'Ambient LED strip system' },
            { name: 'Flooring', icon: 'fa-border-all', desc: 'Composite decking floor' }
        ],
        pergola: [
            { name: 'Zip Blinds \u2014 Basic (Manual)', icon: 'fa-window-maximize', desc: 'Manual zip blind side enclosure' },
            { name: 'Zip Blinds \u2014 Classic (Electric)', icon: 'fa-window-restore', desc: 'Motorized zip blind side enclosure' },
            { name: 'Weather Sensor (Rain & Wind)', icon: 'fa-cloud-rain', desc: 'Auto-close on weather detection' },
            { name: 'WiFi / Phone Control', icon: 'fa-wifi', desc: 'Smart home integration' },
            { name: 'Flooring', icon: 'fa-border-all', desc: 'Composite decking floor' }
        ],
        blinds: [
            { name: 'Material & Aperture Rate', icon: 'fa-th', desc: 'Custom fabric material and openness selection' }
        ],
        'zb-standard': [
            { name: 'Material & Aperture Rate', icon: 'fa-th', desc: 'Custom fabric material and openness selection' }
        ],
        'zb-outdoor': [
            { name: 'Material & Aperture Rate', icon: 'fa-th', desc: 'Custom fabric material and openness selection' }
        ],
        'zb-special': [
            { name: 'Material & Aperture Rate', icon: 'fa-th', desc: 'Custom fabric material and openness selection' }
        ],
        adu: [
            { name: 'Custom Layout Design', icon: 'fa-pencil-ruler', desc: 'Tailored floor plan within modular constraints' },
            { name: 'Solar Panel System', icon: 'fa-solar-panel', desc: 'Rooftop solar power system' },
            { name: 'Smart Home Package', icon: 'fa-wifi', desc: 'IoT-ready smart home integration' }
        ]
    };

    // Shared notes for each product category
    const productNotes = {
        sunroom: [
            'L/W/H refer to interior net dimensions of the sunroom',
            'Prices are for product only \u2014 installation fee not included',
            'Foundation/base installation required \u2014 additional cost applies'
        ],
        pergola: [
            'L/W/H refer to exterior outline dimensions',
            'Prices are for product only \u2014 installation fee not included',
            'Foundation/base installation required \u2014 additional cost applies'
        ],
        blinds: [
            'Width refers to the span of the blind opening',
            'Custom material and aperture rate options available'
        ],
        adu: [
            'Modular design \u2014 delivery timeline starts from permit approval',
            'Fully customizable layout within modular constraints',
            'Building permits and site preparation not included'
        ]
    };

    // Category display config
    const allProductCategories = [
        { key: 'sunroom', label: 'Sunroom', icon: 'fa-sun', color: 'amber' },
        { key: 'pergola', label: 'Pergola', icon: 'fa-warehouse', color: 'green' },
        { key: 'blinds', label: 'Zip Blinds', icon: 'fa-align-justify', color: 'purple' }
    ];
    // ZB 系列分类（匹配报价表 3 分区结构）
    const zbSeriesCategories = [
        { key: 'zb-standard', label: 'WR100/110', icon: 'fa-home', color: 'blue' },
        { key: 'zb-outdoor', label: 'WR120', icon: 'fa-mountain-sun', color: 'green' },
        { key: 'zb-special', label: 'Special', icon: 'fa-star', color: 'amber' }
    ];
    // series 字段 → category key 映射
    var zbSeriesCatMap = { 'WR100': 'zb-standard', 'WR110': 'zb-standard', 'WR120': 'zb-outdoor', 'Special': 'zb-special' };
    var zbSeriesLabelMap = { 'zb-standard': 'WR100/110 Standard & Gazebo', 'zb-outdoor': 'WR120 Outdoor', 'zb-special': 'Special' };
    function getProductCategories() {
        const slug = getCurrentTenantSlug();
        if (slug === 'omeya-sin') return zbSeriesCategories;
        return allProductCategories;
    }
    const productCategories = getProductCategories();

    // Product 3D icon mapping (per product ID -> icon path)
    const productIcons = {
        'sr-l-classic': '/images/products/icons/sunroom-l-type.png',
        'sr-l-smart':   '/images/products/icons/sunroom-l-type.png',
        'sr-l-pro':     '/images/products/icons/sunroom-l-type.png',
        'sr-m-classic': '/images/products/icons/sunroom-m-type.png',
        'sr-m-smart':   '/images/products/icons/sunroom-m-type.png',
        'sr-m-pro':     '/images/products/icons/sunroom-m-type.png',
        'pg-basic':     '/images/products/icons/pergola.png',
        'pg-classic':   '/images/products/icons/pergola.png',
        'zb-manual':    '/images/products/icons/zip-blinds.png',
        'zb-motorized': '/images/products/icons/zip-blinds.png',
        'adu-studio':   '/images/products/icons/adu-studio.png',
        'adu-2bed':     '/images/products/icons/adu-2bed.png'
    };

    async function initProductsPage() {
        // 从 Supabase 加载租户产品目录
        const dbLoaded = await loadProductCatalogFromDB();
        if (!dbLoaded) await seedProductCatalogToDB();
        // Hide filter buttons not relevant to current tenant
        var tenantCatKeys = productCategories.map(function(c) { return c.key; });
        document.querySelectorAll('.product-filter-btn').forEach(function(btn) {
            var f = btn.dataset.filter;
            if (f !== 'all' && tenantCatKeys.indexOf(f) === -1) btn.style.display = 'none';
        });
        // Render product list from catalog data
        renderProductList();
        // Render initial product detail
        updateProductDetail(productsState.selectedProduct);
        // 动态更新 stats
        updateProductStats();

        // Filter buttons
        document.querySelectorAll('.product-filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.product-filter-btn').forEach(b => {
                    b.classList.remove('bg-gray-900', 'text-white');
                    b.classList.add('bg-white', 'border', 'text-gray-600');
                });
                this.classList.remove('bg-white', 'border', 'text-gray-600');
                this.classList.add('bg-gray-900', 'text-white');
                productsState.filter = this.dataset.filter;
                filterProducts(this.dataset.filter);
            });
        });

        // Search
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchProducts(this.value.toLowerCase());
            });
        }

        // Upload files button
        const uploadBtn = document.getElementById('uploadFilesBtn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function() {
                const uploadArea = document.getElementById('fileUploadArea');
                productsState.uploadVisible = !productsState.uploadVisible;
                uploadArea.classList.toggle('hidden', !productsState.uploadVisible);
            });
        }

        // File drop zone
        const dropZone = document.getElementById('fileDropZone');
        const fileInput = document.getElementById('productFileInput');
        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-blue-400', 'bg-blue-50'); });
            dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('border-blue-400', 'bg-blue-50'); });
            dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('border-blue-400', 'bg-blue-50'); if (e.dataTransfer.files.length) handleFileUpload(e.dataTransfer.files); });
            fileInput.addEventListener('change', function() { if (this.files.length) handleFileUpload(this.files); });
        }

        // Add product button
        const addBtn = document.getElementById('addProductBtn');
        if (addBtn) addBtn.addEventListener('click', () => openProductModal('create', null));

        // Edit product button
        const editBtn = document.getElementById('editProductBtn');
        if (editBtn) editBtn.addEventListener('click', () => openProductModal('edit', productsState.selectedProduct));
    }

    // Get tenant-filtered product catalog entries
    function getFilteredCatalogEntries() {
        const catKeys = productCategories.map(c => c.key);
        return Object.entries(productCatalog).filter(([k, p]) => catKeys.includes(p.category));
    }

    // Render grouped product list from productCatalog
    function renderProductList() {
        const list = document.getElementById('productList');
        if (!list) return;
        const filteredEntries = getFilteredCatalogEntries();
        const totalProducts = filteredEntries.length;
        const countEl = document.getElementById('productCount');
        if (countEl) countEl.textContent = totalProducts + ' items';

        let html = '';
        productCategories.forEach(cat => {
            const products = filteredEntries.filter(([k, p]) => p.category === cat.key);
            if (products.length === 0) return;
            html += '<div class="product-category" data-cat="' + cat.key + '">' +
                '<div class="px-4 py-2 bg-gray-50/80 flex items-center justify-between border-b border-gray-100">' +
                    '<div class="flex items-center gap-2">' +
                        '<i class="fas ' + cat.icon + ' text-' + cat.color + '-500 text-xs"></i>' +
                        '<span class="text-[11px] font-bold text-gray-400 uppercase tracking-wider">' + cat.label + '</span>' +
                    '</div>' +
                    '<span class="text-[10px] text-gray-400 bg-gray-200/80 px-1.5 py-0.5 rounded font-medium">' + products.length + '</span>' +
                '</div>';
            products.forEach(([id, p]) => {
                const sel = productsState.selectedProduct === id;
                // 类别图标映射：sunroom→fa-sun, pergola→fa-umbrella-beach, blinds→fa-border-all, adu→fa-home
                var catIcons = { sunroom: 'fa-sun', pergola: 'fa-umbrella-beach', blinds: 'fa-border-all', adu: 'fa-home' };
                var catIcon = catIcons[p.category] || 'fa-box';
                var catColors = { sunroom: 'amber', pergola: 'green', blinds: 'purple', adu: 'blue' };
                var catColor = catColors[p.category] || 'gray';
                html += '<div class="product-item p-3 hover:bg-blue-50/30 cursor-pointer transition-all ' + (sel ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent') + '" data-product="' + id + '" data-category="' + p.category + '">' +
                    '<div class="flex items-center gap-3">' +
                        '<div class="w-9 h-9 bg-' + catColor + '-100 rounded-lg flex items-center justify-center flex-shrink-0">' +
                            '<i class="fas ' + catIcon + ' text-' + catColor + '-500 text-sm"></i>' +
                        '</div>' +
                        '<div class="flex-1 min-w-0">' +
                            '<div class="text-sm font-medium text-gray-900 truncate">' + p.name + '</div>' +
                            '<div class="text-xs text-gray-400 truncate">' + p.series + (p.shape ? ' \u00b7 ' + p.shape : '') + ' \u00b7 ' + p.control + '</div>' +
                        '</div>' +
                        '<span class="text-[10px] ' + (p.status === 'Active' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50') + ' font-semibold flex-shrink-0 px-1.5 py-0.5 rounded-full">' + p.status + '</span>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';
        });
        list.innerHTML = html;

        // Bind click events
        list.querySelectorAll('.product-item').forEach(item => {
            item.addEventListener('click', function() {
                const productId = this.dataset.product;
                productsState.selectedProduct = productId;
                list.querySelectorAll('.product-item').forEach(i => {
                    i.classList.remove('bg-blue-50/50', 'border-blue-500');
                    i.classList.add('border-transparent');
                });
                this.classList.remove('border-transparent');
                this.classList.add('bg-blue-50/50', 'border-blue-500');
                updateProductDetail(productId);
            });
        });
    }

    // ── ZB SKU 产品专用详情渲染 ──
    function _renderZBProductDetail(productId, p, sku) {
        var container = document.getElementById('productDetailContent');
        if (!container) return;
        var driveCat = window.zbDriveSystemCatalog || {};
        var biz = window.zbBusinessParams || {};
        var iconSrc = productIcons[productId] || p.image;
        var tiers = sku.priceTiers || [];
        var lowPrice = tiers.length > 0 ? tiers[tiers.length - 1].price : 0;
        var highPrice = tiers.length > 0 ? tiers[0].price : 0;

        var drivesHTML = '';
        if (sku.drives && sku.drives.length > 0) {
            drivesHTML = sku.drives.map(function(dk) {
                var d = driveCat[dk]; if (!d) return '';
                var tl = d.type === 'motorized' ? '<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">Motor</span>' :
                         d.type === 'combo' ? '<span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded">Combo</span>' :
                         '<span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded">Manual</span>';
                return '<div class="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition">' +
                    '<div class="flex items-center gap-2 min-w-0"><i class="fas fa-cog text-gray-400 text-xs flex-shrink-0"></i><span class="text-sm text-gray-800 truncate">' + d.name + '</span>' + tl + '</div>' +
                    '<span class="text-sm font-bold text-gray-900 flex-shrink-0">\u00a5' + d.price + '<span class="text-[10px] text-gray-400 font-normal ml-0.5">/set</span></span></div>';
            }).join('');
        }

        var priceTiersHTML = tiers.map(function(t, i) {
            var al = t.maxArea === Infinity ? '>' + (i > 0 ? tiers[i-1].maxArea : (sku.minArea||3)) + ' m\u00b2' : '\u2264' + t.maxArea + ' m\u00b2';
            return '<div class="flex items-center justify-between px-3 py-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-lg">' +
                '<div class="flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">' + (i+1) + '</span><span class="text-sm font-semibold text-gray-900">' + al + '</span></div>' +
                '<span class="text-sm font-bold text-emerald-700">\u00a5' + t.price + '<span class="text-[10px] text-gray-400 font-normal ml-1">/m\u00b2</span></span></div>';
        }).join('');

        container.innerHTML =
            '<div class="flex gap-6 mb-6"><div class="w-44 h-44 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 p-2"><img src="' + iconSrc + '" alt="' + p.name + '" class="w-full h-full object-contain"></div>' +
            '<div class="flex-1 min-w-0"><div class="flex items-center gap-3 mb-1.5 flex-wrap"><h2 class="text-xl font-bold text-gray-900">' + sku.model + '</h2><span class="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span><span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">' + sku.series + '</span></div>' +
            '<p class="text-sm text-gray-500 mb-3">' + (sku.nameZh || p.name) + '</p>' +
            '<div class="grid grid-cols-3 gap-3 mb-3">' +
                '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Housing</label><div class="text-xs font-bold text-gray-900 mt-0.5">' + sku.housing + '</div></div>' +
                '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Max Size</label><div class="text-xs font-bold text-gray-900 mt-0.5">' + (sku.maxWidthMM/1000) + 'm W \u00d7 ' + (sku.maxHeightMM/1000) + 'm H</div></div>' +
                '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Fabric</label><div class="text-xs font-bold text-gray-900 mt-0.5">' + sku.fabric + ' (' + sku.fabricOpenness + ')</div></div>' +
                '<div class="bg-orange-50 rounded-lg p-2.5"><label class="text-[10px] text-orange-400 uppercase tracking-wider font-medium">Supplier Price</label><div class="text-sm font-bold text-orange-700 mt-0.5">\u00a5' + lowPrice + ' \u2013 \u00a5' + highPrice + '<span class="text-[10px] text-gray-400 font-normal">/m\u00b2</span></div></div>' +
                (sku.samplePrice ? '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Sample</label><div class="text-xs font-bold text-gray-900 mt-0.5">\u00a5' + sku.samplePrice + '/pc</div></div>' : '') +
                '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Min Area</label><div class="text-xs font-bold text-gray-900 mt-0.5">' + (sku.minArea||3) + ' m\u00b2</div></div>' +
            '</div>' +
            '<p class="text-sm text-gray-600 leading-relaxed">' + (sku.features||'') + '</p>' +
            (sku.notes ? '<p class="text-xs text-amber-600 mt-1"><i class="fas fa-info-circle mr-1"></i>' + sku.notes + '</p>' : '') +
            '</div></div>' +
            '<div class="border border-gray-100 rounded-xl p-5 mb-5"><h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-tags text-emerald-500"></i> Pricing Tiers <span class="text-[10px] text-gray-400 font-normal">(Supplier unit price by area)</span></h4><div class="space-y-1.5 mb-3">' + priceTiersHTML + '</div>' +
            '<p class="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 flex items-start gap-1.5"><i class="fas fa-info-circle mt-0.5 flex-shrink-0"></i><span>Prices ex-factory (incl. tax), excl. shipping/installation. Min billable area: ' + (sku.minArea||3) + ' m\u00b2. Standard NP4000 fabric included.</span></p></div>' +
            (drivesHTML ? '<div class="border border-gray-100 rounded-xl p-5 mb-5"><h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-cogs text-blue-500"></i> Compatible Drive Systems <span class="text-[10px] text-gray-400 font-normal">(' + sku.drives.length + ' options)</span></h4><div class="space-y-1.5">' + drivesHTML + '</div><p class="text-[11px] text-gray-400 mt-3"><i class="fas fa-info-circle mr-1"></i>Drive system priced per unit (RMB/set), selected during quotation.</p></div>' : '') +
            '<div class="border border-blue-100 bg-blue-50/30 rounded-xl p-4"><h4 class="text-sm font-semibold text-blue-800 mb-2.5 flex items-center gap-2"><i class="fas fa-calculator text-blue-500"></i> Quotation Formula Parameters <span class="text-[10px] text-blue-400 font-normal">(editable)</span></h4>' +
            '<div class="grid grid-cols-2 lg:grid-cols-3 gap-2.5">' +
                '<div class="bg-white rounded-lg p-2.5 border border-gray-200"><label class="text-[10px] text-gray-400 uppercase block mb-1">Supplier Discount</label><div class="flex items-center gap-1"><input type="number" value="' + (biz.supplierDiscountRate||0.9) + '" min="0.5" max="1" step="0.01" onchange="window.zbBusinessParams.supplierDiscountRate=parseFloat(this.value)" class="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><span class="text-xs text-gray-400">rate</span></div></div>' +
                '<div class="bg-white rounded-lg p-2.5 border border-gray-200"><label class="text-[10px] text-gray-400 uppercase block mb-1">Shipping & Customs</label><div class="flex items-center gap-1"><input type="number" value="' + (biz.shippingCostRate||0.3) + '" min="0" max="1" step="0.01" onchange="window.zbBusinessParams.shippingCostRate=parseFloat(this.value)" class="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><span class="text-xs text-gray-400">rate</span></div></div>' +
                '<div class="bg-white rounded-lg p-2.5 border border-gray-200"><label class="text-[10px] text-gray-400 uppercase block mb-1">Installation Fee</label><div class="flex items-center gap-1"><input type="number" value="' + (biz.installationFeePerSqm||191) + '" min="0" max="1000" step="1" onchange="window.zbBusinessParams.installationFeePerSqm=parseFloat(this.value)" class="w-16 px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><span class="text-xs text-gray-400">\u00a5/m\u00b2</span></div></div>' +
                '<div class="bg-white rounded-lg p-2.5 border border-gray-200"><label class="text-[10px] text-gray-400 uppercase block mb-1">Market Markup</label><div class="flex items-center gap-1"><input type="number" value="' + (biz.marketMarkup||2.92) + '" min="1" max="10" step="0.01" onchange="window.zbBusinessParams.marketMarkup=parseFloat(this.value)" class="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><span class="text-xs text-gray-400">\u00d7</span></div></div>' +
                '<div class="bg-white rounded-lg p-2.5 border border-gray-200"><label class="text-[10px] text-gray-400 uppercase block mb-1">Default Discount</label><div class="flex items-center gap-1"><input type="number" value="' + (biz.preferentialDiscount||0.5) + '" min="0" max="1" step="0.01" onchange="window.zbBusinessParams.preferentialDiscount=parseFloat(this.value)" class="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><span class="text-xs text-gray-400">rate</span></div></div>' +
                '<div class="bg-white rounded-lg p-2.5 border border-gray-200"><label class="text-[10px] text-gray-400 uppercase block mb-1">Accessory Markup</label><div class="flex items-center gap-1"><input type="number" value="' + (biz.accessoryMarkupRate||0.13) + '" min="0" max="1" step="0.001" onchange="window.zbBusinessParams.accessoryMarkupRate=parseFloat(this.value)" class="w-16 px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"><span class="text-xs text-gray-400">rate</span></div></div>' +
            '</div></div>';
    }

    // Update the product detail panel
    function updateProductDetail(productId) {
        const p = productCatalog[productId];
        if (!p) return;

        // ── ZB SKU 产品专用详情渲染 ──
        if (p._zbSKU && p._zbData) {
            _renderZBProductDetail(productId, p, p._zbData);
            return;
        }

        const opts = productOptionSets[p.optionSet] || [];
        const notes = productNotes[p.noteSet] || [];
        const container = document.getElementById('productDetailContent');
        if (!container) return;
        const iconSrc = productIcons[productId] || p.image;
        const priceSummary = p.price && p.price.tiers && p.price.tiers.length > 0
            ? (p.price.mode === 'strategy'
                ? ('$' + p.price.tiers[0].retail[0] + ' \u2013 $' + p.price.tiers[p.price.tiers.length - 1].retail[1] + '/' + p.price.unit)
                : ('$' + p.price.tiers[0].retail[0] + ' \u2013 $' + p.price.tiers[p.price.tiers.length - 1].retail[1] + '/' + p.price.unit))
            : '\u2014';
        const costSummary = p.cost && p.cost.tiers && p.cost.tiers.length > 0
            ? ('$' + p.cost.tiers[0].priceRange[0] + ' \u2013 $' + p.cost.tiers[p.cost.tiers.length - 1].priceRange[1] + '/' + p.cost.unit)
            : '\u2014';

        container.innerHTML = '' +
            '<!-- Product Header -->' +
            '<div class="flex gap-6 mb-6">' +
                '<div class="w-44 h-44 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 p-2">' +
                    '<img src="' + iconSrc + '" alt="' + p.name + '" class="w-full h-full object-contain">' +
                '</div>' +
                '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-center gap-3 mb-1.5">' +
                        '<h2 class="text-xl font-bold text-gray-900">' + p.name + '</h2>' +
                        '<span class="px-2.5 py-0.5 ' + (p.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700') + ' text-xs font-medium rounded-full">' + p.status + '</span>' +
                    '</div>' +
                    '<p class="text-sm text-gray-500 mb-4">' + p.catLabel + ' \u00b7 ' + p.series + (p.shape ? ' \u00b7 ' + p.shape : '') + '</p>' +
                    '<div class="grid grid-cols-4 gap-4 mb-4">' +
                        '<div class="bg-gray-50 rounded-lg p-2.5">' +
                            '<label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Control</label>' +
                            '<div class="text-sm font-bold text-gray-900 mt-0.5">' + p.control + '</div>' +
                        '</div>' +
                        '<div class="bg-gray-50 rounded-lg p-2.5">' +
                            '<label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Colors</label>' +
                            '<div class="text-sm font-bold text-gray-900 mt-0.5">' + p.colors + '</div>' +
                        '</div>' +
                        '<div class="bg-gray-50 rounded-lg p-2.5">' +
                            '<label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Cost</label>' +
                            '<div class="text-sm font-bold text-gray-600 mt-0.5">' + costSummary + '</div>' +
                        '</div>' +
                        '<div class="bg-orange-50 rounded-lg p-2.5">' +
                            '<label class="text-[10px] text-orange-400 uppercase tracking-wider font-medium">Retail Price</label>' +
                            '<div class="text-sm font-bold text-orange-700 mt-0.5">' + priceSummary + '</div>' +
                        '</div>' +
                        '<div class="bg-gray-50 rounded-lg p-2.5">' +
                            '<label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Lead Time</label>' +
                            '<div class="text-sm font-bold text-gray-900 mt-0.5">' + p.leadTime + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<p class="text-sm text-gray-600 leading-relaxed">' + p.desc + '</p>' +
                '</div>' +
            '</div>' +

            '<!-- Specifications -->' +
            '<div class="border border-gray-100 rounded-xl p-5 mb-5">' +
                '<h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">' +
                    '<i class="fas fa-cog text-gray-400"></i> Product Specifications' +
                '</h4>' +
                '<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">' +
                    '<div>' +
                        '<h5 class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Components Included</h5>' +
                        '<div class="space-y-2">' +
                            p.components.map(function(c) { return '' +
                                '<div class="flex items-center gap-2.5">' +
                                    '<div class="w-5 h-5 rounded-full ' + (p.extras.includes(c) ? 'bg-blue-100' : 'bg-green-100') + ' flex items-center justify-center flex-shrink-0">' +
                                        '<i class="fas ' + (p.extras.includes(c) ? 'fa-star text-blue-500' : 'fa-check text-green-500') + '" style="font-size:9px"></i>' +
                                    '</div>' +
                                    '<span class="text-sm ' + (p.extras.includes(c) ? 'text-blue-700 font-medium' : 'text-gray-700') + '">' + c + '</span>' +
                                '</div>';
                            }).join('') +
                        '</div>' +
                        (p.extras.length > 0 ? '<p class="text-[11px] text-blue-500 mt-3 flex items-center gap-1"><i class="fas fa-star" style="font-size:8px"></i> Highlighted = series-specific upgrade</p>' : '') +
                    '</div>' +
                    '<div>' +
                        '<h5 class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">' +
                            (p.cost ? '<i class="fas fa-dollar-sign mr-1"></i>Material Cost by Span' : 'Span / Size Options') +
                        '</h5>' +
                        (p.cost ? '' +
                        '<div class="space-y-1.5 mb-3">' +
                            '<div class="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">' +
                                '<span>Span / Size</span>' +
                                '<span>Material Cost (' + p.cost.currency + '/' + p.cost.unit + ')</span>' +
                            '</div>' +
                            p.cost.tiers.map(function(t, i) { return '' +
                            '<div class="flex items-center justify-between px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50/30 transition group">' +
                                '<div class="flex items-center gap-2">' +
                                    '<span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">' + (i + 1) + '</span>' +
                                    '<span class="text-sm font-semibold text-gray-900">' + t.span + '</span>' +
                                '</div>' +
                                '<div class="text-sm font-bold text-emerald-700 group-hover:text-emerald-800">' +
                                    (t.priceRange ? '$' + t.priceRange[0] + ' \u2013 $' + t.priceRange[1] : '<span class="text-gray-400 font-normal">TBD</span>') +
                                '</div>' +
                            '</div>';
                            }).join('') +
                        '</div>' +
                        '<p class="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 flex items-start gap-1.5">' +
                            '<i class="fas fa-info-circle mt-0.5 flex-shrink-0"></i>' +
                            '<span>' + p.cost.note + '</span>' +
                        '</p>' +

                        (p.price && p.price.tiers && p.price.tiers.length > 0 ? '' +
                        '<h5 class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-5">' +
                            '<i class="fas fa-tags mr-1"></i>Selling Price' + (p.price.mode === 'strategy' ? ' (by Product Tier)' : ' by Span') +
                        '</h5>' +
                        '<div class="space-y-1.5 mb-3">' +
                            '<div class="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">' +
                                '<span>' + (p.price.mode === 'strategy' ? 'Product Tier' : 'Span / Size') + '</span>' +
                                '<div class="flex gap-6">' +
                                    '<span class="text-orange-400">Retail (' + p.price.currency + '/' + p.price.unit + ')</span>' +
                                    '<span class="text-blue-400">Wholesale</span>' +
                                '</div>' +
                            '</div>' +
                            p.price.tiers.map(function(t, i) { return '' +
                            '<div class="flex items-center justify-between px-4 py-2.5 bg-orange-50/40 border border-orange-200/60 rounded-lg hover:border-orange-300 hover:bg-orange-50/60 transition group">' +
                                '<div class="flex items-center gap-2">' +
                                    '<span class="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">' + (i + 1) + '</span>' +
                                    '<span class="text-sm font-semibold text-gray-900">' + (t.label || t.span) + '</span>' +
                                '</div>' +
                                '<div class="flex gap-6">' +
                                    '<div class="text-sm font-bold text-orange-700 group-hover:text-orange-800">' +
                                        (t.retail ? '$' + t.retail[0] + ' \u2013 $' + t.retail[1] : '<span class="text-gray-400 font-normal">TBD</span>') +
                                    '</div>' +
                                    '<div class="text-sm font-medium text-blue-600 group-hover:text-blue-700 min-w-[80px] text-right">' +
                                        (t.wholesale ? '$' + t.wholesale[0] + ' \u2013 $' + t.wholesale[1] : '<span class="text-gray-400 font-normal">TBD</span>') +
                                    '</div>' +
                                '</div>' +
                            '</div>';
                            }).join('') +
                        '</div>' +
                        '<p class="text-[11px] text-orange-600 bg-orange-50 rounded-lg px-3 py-2 flex items-start gap-1.5">' +
                            '<i class="fas fa-tags mt-0.5 flex-shrink-0"></i>' +
                            '<span>' + p.price.note + '</span>' +
                        '</p>'
                        : '')
                        : '' +
                        '<div class="flex flex-wrap gap-2 mb-3">' +
                            p.spans.map(function(s) { return '' +
                                '<div class="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-center hover:border-blue-300 hover:bg-blue-50/50 transition cursor-default">' +
                                    '<div class="text-sm font-bold text-gray-900">' + s + '</div>' +
                                '</div>';
                            }).join('') +
                        '</div>' +
                        '<p class="text-[11px] text-gray-400">' +
                            (p.category === 'sunroom' ? 'Span = interior net width of the sunroom' : p.category === 'pergola' ? 'Span = exterior outline width of the pergola' : p.category === 'blinds' ? 'Width = span of the blind opening' : 'Size = total livable area') +
                        '</p>'
                        ) +
                    '</div>' +
                '</div>' +
            '</div>' +

            (opts.length > 0 ? '' +
            '<!-- Configuration Options -->' +
            '<div class="border border-gray-100 rounded-xl p-5 mb-5">' +
                '<h4 class="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">' +
                    '<i class="fas fa-puzzle-piece text-gray-400"></i> Configuration Options' +
                '</h4>' +
                '<div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5">' +
                    opts.map(function(o) { return '' +
                        '<label class="flex items-center gap-3 p-3 bg-gray-50/80 rounded-lg hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer transition border border-transparent">' +
                            '<input type="checkbox" class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">' +
                            '<div class="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">' +
                                '<i class="fas ' + o.icon + ' text-gray-500 text-sm"></i>' +
                            '</div>' +
                            '<div class="min-w-0">' +
                                '<div class="text-sm font-medium text-gray-800">' + o.name + '</div>' +
                                '<div class="text-[11px] text-gray-400">' + o.desc + '</div>' +
                            '</div>' +
                        '</label>';
                    }).join('') +
                '</div>' +
            '</div>' : '') +

            (notes.length > 0 ? '' +
            '<!-- Important Notes -->' +
            '<div class="border border-amber-200/60 bg-amber-50/40 rounded-xl p-4">' +
                '<h4 class="text-sm font-semibold text-amber-800 mb-2.5 flex items-center gap-2">' +
                    '<i class="fas fa-info-circle text-amber-500"></i> Important Notes' +
                '</h4>' +
                '<ul class="space-y-1.5">' +
                    notes.map(function(n) { return '' +
                        '<li class="text-sm text-amber-700 flex items-start gap-2">' +
                            '<span class="text-amber-400 mt-0.5 flex-shrink-0">\u2022</span>' +
                            '<span>' + n + '</span>' +
                        '</li>';
                    }).join('') +
                '</ul>' +
            '</div>' : '');
    }

    // Filter products by category
    function filterProducts(filter) {
        document.querySelectorAll('.product-category').forEach(cat => {
            if (filter === 'all' || cat.dataset.cat === filter) {
                cat.style.display = '';
            } else {
                cat.style.display = 'none';
            }
        });
        document.querySelectorAll('.product-item').forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Search products by name, category, series
    function searchProducts(query) {
        if (!query) {
            document.querySelectorAll('.product-category, .product-item').forEach(el => el.style.display = '');
            return;
        }
        document.querySelectorAll('.product-item').forEach(item => {
            const p = productCatalog[item.dataset.product];
            if (!p) return;
            const searchStr = (p.name + ' ' + p.catLabel + ' ' + p.series + ' ' + p.control + ' ' + (p.shape || '')).toLowerCase();
            item.style.display = searchStr.includes(query) ? '' : 'none';
        });
        // Hide empty category headers
        document.querySelectorAll('.product-category').forEach(cat => {
            const visible = cat.querySelectorAll('.product-item[style=""], .product-item:not([style])');
            cat.style.display = visible.length > 0 ? '' : 'none';
        });
    }

    function handleFileUpload(files) {
        const progressArea = document.getElementById('uploadProgress');
        const progressBar = document.getElementById('uploadProgressBar');

        progressArea.classList.remove('hidden');
        progressBar.style.width = '0%';

        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = progress + '%';

            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    progressArea.classList.add('hidden');
                    showToast(files.length + ' file(s) uploaded successfully!', 'success');
                }, 500);
            }
        }, 200);
    }

    // -- 注册到 Nestopia.modules 命名空间 ---------------------
    N.modules.products = {
        productsState: productsState,
        productCatalog: productCatalog,
        PRODUCT_TENANT_ID: PRODUCT_TENANT_ID,
        productIcons: productIcons,
        productOptionSets: productOptionSets,
        productNotes: productNotes,
        allProductCategories: allProductCategories,
        productCategories: productCategories,
        loadProductCatalogFromDB: loadProductCatalogFromDB,
        seedProductCatalogToDB: seedProductCatalogToDB,
        saveProductToDB: saveProductToDB,
        deleteProductFromDB: deleteProductFromDB,
        openProductModal: openProductModal,
        saveProductFromModal: saveProductFromModal,
        deleteProduct: deleteProduct,
        updateProductStats: updateProductStats,
        getProductCategories: getProductCategories,
        initProductsPage: initProductsPage,
        getFilteredCatalogEntries: getFilteredCatalogEntries,
        renderProductList: renderProductList,
        updateProductDetail: updateProductDetail,
        filterProducts: filterProducts,
        searchProducts: searchProducts,
        handleFileUpload: handleFileUpload
    };

    // -- 全局别名（向后兼容 HTML onclick 及其他模块调用） -----
    window.productsState = productsState;
    Object.defineProperty(window, 'productCatalog', {
        get: function() { return productCatalog; },
        set: function(v) { productCatalog = v; },
        configurable: true
    });
    window.productIcons = productIcons;
    window.productOptionSets = productOptionSets;
    window.productNotes = productNotes;
    window.allProductCategories = allProductCategories;
    window.productCategories = productCategories;
    window.zbSeriesCatMap = zbSeriesCatMap;
    window.zbSeriesLabelMap = zbSeriesLabelMap;
    window.PRODUCT_TENANT_ID = PRODUCT_TENANT_ID;

    // 函数别名
    window.loadProductCatalogFromDB = loadProductCatalogFromDB;
    window.seedProductCatalogToDB = seedProductCatalogToDB;
    window.seedProductCatalog = seedProductCatalogToDB;        // 兼容别名
    window.saveProductToDB = saveProductToDB;
    window.deleteProductFromDB = deleteProductFromDB;
    window.openProductModal = openProductModal;
    window.saveProductFromModal = saveProductFromModal;
    window.deleteProduct = deleteProduct;
    window.updateProductStats = updateProductStats;
    window.getProductCategories = getProductCategories;
    window.initProductsPage = initProductsPage;
    window.getFilteredCatalogEntries = getFilteredCatalogEntries;
    window.renderProductList = renderProductList;
    window.renderProductGrid = renderProductList;              // 兼容别名
    window.updateProductDetail = updateProductDetail;
    window.filterProducts = filterProducts;
    window.searchProducts = searchProducts;
    window.handleFileUpload = handleFileUpload;
    window.handleProductImageUpload = handleFileUpload;        // 兼容别名
    window.uploadProductFiles = handleFileUpload;              // 兼容别名

})();
