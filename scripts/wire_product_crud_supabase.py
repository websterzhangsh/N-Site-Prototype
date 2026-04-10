#!/usr/bin/env python3
"""
wire_product_crud_supabase.py
让 productCatalog 从硬编码升级为租户自定义 CRUD，数据持久化到 Supabase tenant_products 表。

修改清单（7 处）:
1. const productCatalog → let productCatalog（允许运行时修改）
2. 在 productCatalog 闭合 }; 后注入 DB helpers（load / save / seed / delete）
3. 重写 initProductsPage() 使其先从 DB 加载
4. 替换 addProductBtn toast → 打开 CRUD Modal（create 模式）
5. 替换 editProductBtn toast → 打开 CRUD Modal（edit 模式）
6. 在 Edit 按钮旁注入 Delete 按钮 HTML
7. 动态更新 Stats 栏数字
"""

import re, sys, os

FILE = os.path.join(os.path.dirname(__file__), '..', 'company-operations.html')

def read_file():
    with open(FILE, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(content):
    with open(FILE, 'w', encoding='utf-8') as f:
        f.write(content)

def safe_replace(src, old, new, label, count=1):
    if old not in src:
        print(f"  ✗ 找不到锚点: {label}")
        sys.exit(1)
    result = src.replace(old, new, count)
    print(f"  ✓ {label}")
    return result

# ──────────────────────────────────────────────
content = read_file()
print(f"读入 {len(content)} 字符")

# ===== 1. const productCatalog → let productCatalog =====
content = safe_replace(content,
    "const productCatalog = {",
    "let productCatalog = {",
    "Mod1: const→let productCatalog"
)

# ===== 2. 注入 DB helpers（在 productCatalog 闭合后、productOptionSets 前） =====
ANCHOR2 = """        // Shared option sets for each product category
        const productOptionSets = {"""

DB_HELPERS = r"""
        // ── Product Catalog: Supabase CRUD Helpers ──────────────
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

        // ── Product CRUD Modal ──────────────────────────────────
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
                pricing: { unit: 'sqft', currency: 'USD', tiers: [], note: '' }
            };

            // 把数组转成逗号分隔文本用于编辑
            const componentsStr = (p.components || []).join('\n');
            const spansStr = (p.spans || []).join(', ');
            const extrasStr = (p.extras || []).join('\n');
            const tiersStr = (p.pricing && p.pricing.tiers || []).map(t =>
                t.span + '|' + (t.priceRange ? t.priceRange[0] + '-' + t.priceRange[1] : 'TBD')
            ).join('\n');

            const modal = document.createElement('div');
            modal.id = 'productCrudModal';
            modal.className = 'fixed inset-0 z-[300] flex items-start justify-center pt-6 overflow-y-auto bg-black/40 backdrop-blur-sm';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
            modal.innerHTML = `
                <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4 mb-8" style="animation: modalIn 0.2s ease-out" onclick="event.stopPropagation()">
                    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                        <div>
                            <div class="text-base font-bold text-gray-900">${title}</div>
                            <div class="text-xs text-gray-400 mt-0.5">${mode === 'edit' ? 'Key: ' + productKey : 'Create a new product entry'}</div>
                        </div>
                        <button onclick="document.getElementById('productCrudModal').remove()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                            <i class="fas fa-times text-gray-500 text-sm"></i>
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                        <!-- Row 1: Name + Key -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Product Name *</label>
                                <input id="pcm_name" type="text" value="${p.name.replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. L-Classic Sunroom">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Product Key *</label>
                                <input id="pcm_key" type="text" value="${productKey || ''}" ${mode === 'edit' ? 'readonly class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"' : 'class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"'} placeholder="e.g. sr-l-classic (unique)">
                            </div>
                        </div>

                        <!-- Row 2: Category + Series + Shape -->
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
                                <select id="pcm_category" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    ${catOptions.map(c => '<option value="' + c + '"' + (p.category === c ? ' selected' : '') + '>' + catLabels[c] + '</option>').join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Series</label>
                                <input id="pcm_series" type="text" value="${(p.series || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Classic Series">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Shape</label>
                                <input id="pcm_shape" type="text" value="${(p.shape || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="L-Type (optional)">
                            </div>
                        </div>

                        <!-- Row 3: Control + Status + Lead Time -->
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Control</label>
                                <select id="pcm_control" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    ${controlOptions.map(c => '<option value="' + c + '"' + (p.control === c ? ' selected' : '') + '>' + c + '</option>').join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                                <select id="pcm_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                    ${statusOptions.map(s => '<option value="' + s + '"' + (p.status === s ? ' selected' : '') + '>' + s + '</option>').join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Lead Time</label>
                                <input id="pcm_leadTime" type="text" value="${(p.leadTime || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="3-4 weeks">
                            </div>
                        </div>

                        <!-- Row 4: Colors -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Colors</label>
                            <input id="pcm_colors" type="text" value="${(p.colors || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Standard & Non-standard">
                        </div>

                        <!-- Row 5: Image URLs -->
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Icon URL</label>
                                <input id="pcm_icon" type="text" value="${(p.icon || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="/images/products/icons/xxx.png">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Image URL</label>
                                <input id="pcm_image" type="text" value="${(p.image || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="/images/gallery/xxx.jpg">
                            </div>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                            <textarea id="pcm_desc" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Product description...">${(p.desc || '').replace(/</g, '&lt;')}</textarea>
                        </div>

                        <!-- Components (one per line) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Components <span class="font-normal text-gray-400">(one per line)</span></label>
                            <textarea id="pcm_components" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Aluminum alloy profiles&#10;Polycarbonate panels&#10;...">${componentsStr.replace(/</g, '&lt;')}</textarea>
                        </div>

                        <!-- Extras (subset of components, one per line) -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Series Extras <span class="font-normal text-gray-400">(one per line, subset of components)</span></label>
                            <textarea id="pcm_extras" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Motor & drive control system&#10;...">${extrasStr.replace(/</g, '&lt;')}</textarea>
                        </div>

                        <!-- Spans -->
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Span Options <span class="font-normal text-gray-400">(comma separated)</span></label>
                            <input id="pcm_spans" type="text" value="${spansStr.replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="≤4m, ≤5m, ≤6m, ≤7m, >7m">
                        </div>

                        <!-- Pricing Section -->
                        <div class="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                            <h5 class="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3"><i class="fas fa-dollar-sign mr-1"></i>Pricing</h5>
                            <div class="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">Unit</label>
                                    <input id="pcm_priceUnit" type="text" value="${(p.pricing && p.pricing.unit || 'sqft').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                                <div>
                                    <label class="block text-xs text-gray-500 mb-1">Currency</label>
                                    <input id="pcm_priceCurrency" type="text" value="${(p.pricing && p.pricing.currency || 'USD').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                                </div>
                            </div>
                            <div>
                                <label class="block text-xs text-gray-500 mb-1">Price Tiers <span class="text-gray-400">(one per line: span|low-high, e.g. ≤4m|26-30)</span></label>
                                <textarea id="pcm_tiers" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="≤4m|26-30&#10;≤5m|28-32&#10;...">${tiersStr.replace(/</g, '&lt;')}</textarea>
                            </div>
                            <div class="mt-3">
                                <label class="block text-xs text-gray-500 mb-1">Pricing Note</label>
                                <input id="pcm_priceNote" type="text" value="${(p.pricing && p.pricing.note || '').replace(/"/g, '&quot;')}" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Material cost only...">
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
                        <button onclick="document.getElementById('productCrudModal').remove()" class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition">Cancel</button>
                        <button onclick="saveProductFromModal('${mode}', '${productKey || ''}')" class="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition shadow-sm flex items-center gap-2">
                            <i class="fas fa-save"></i> ${mode === 'edit' ? 'Update Product' : 'Create Product'}
                        </button>
                    </div>
                </div>`;
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
                pricing: {
                    unit: document.getElementById('pcm_priceUnit').value.trim() || 'sqft',
                    currency: document.getElementById('pcm_priceCurrency').value.trim() || 'USD',
                    tiers: tiers,
                    note: document.getElementById('pcm_priceNote').value.trim()
                }
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

""" + "        // Shared option sets for each product category\n        const productOptionSets = {"

content = safe_replace(content, ANCHOR2, DB_HELPERS, "Mod2: 注入 DB helpers + CRUD Modal")

# ===== 3. 重写 initProductsPage() 开头 — 增加 DB 加载 =====
OLD_INIT = """        function initProductsPage() {
            // Hide filter buttons not relevant to current tenant
            var tenantCatKeys = productCategories.map(function(c) { return c.key; });"""

NEW_INIT = """        async function initProductsPage() {
            // 从 Supabase 加载租户产品目录
            const dbLoaded = await loadProductCatalogFromDB();
            if (!dbLoaded) await seedProductCatalogToDB();
            // Hide filter buttons not relevant to current tenant
            var tenantCatKeys = productCategories.map(function(c) { return c.key; });"""

content = safe_replace(content, OLD_INIT, NEW_INIT, "Mod3: initProductsPage → async + DB 加载")

# ===== 4. 替换 addProductBtn toast → 打开 CRUD Modal =====
OLD_ADD = """            const addBtn = document.getElementById('addProductBtn');
            if (addBtn) addBtn.addEventListener('click', () => showToast('Add Product form will open here — create new product entries.', 'info'));"""

NEW_ADD = """            const addBtn = document.getElementById('addProductBtn');
            if (addBtn) addBtn.addEventListener('click', () => openProductModal('create', null));"""

content = safe_replace(content, OLD_ADD, NEW_ADD, "Mod4: addProductBtn → openProductModal(create)")

# ===== 5. 替换 editProductBtn toast → 打开 CRUD Modal =====
OLD_EDIT = """            const editBtn = document.getElementById('editProductBtn');
            if (editBtn) editBtn.addEventListener('click', () => showToast('Edit Product form will open here — modify product details.', 'info'));"""

NEW_EDIT = """            const editBtn = document.getElementById('editProductBtn');
            if (editBtn) editBtn.addEventListener('click', () => openProductModal('edit', productsState.selectedProduct));"""

content = safe_replace(content, OLD_EDIT, NEW_EDIT, "Mod5: editProductBtn → openProductModal(edit)")

# ===== 6. 在 Edit 按钮旁注入 Delete 按钮 HTML =====
OLD_EDIT_HTML = """                                        <button id="editProductBtn" class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                            <i class="fas fa-edit mr-1"></i>Edit
                                        </button>
                                        <button class="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition">
                                            <i class="fas fa-ellipsis-h"></i>
                                        </button>"""

NEW_EDIT_HTML = """                                        <button id="editProductBtn" class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition">
                                            <i class="fas fa-edit mr-1"></i>Edit
                                        </button>
                                        <button id="deleteProductBtn" onclick="deleteProduct(productsState.selectedProduct)" class="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition">
                                            <i class="fas fa-trash-alt mr-1"></i>Delete
                                        </button>"""

content = safe_replace(content, OLD_EDIT_HTML, NEW_EDIT_HTML, "Mod6: 注入 Delete 按钮")

# ===== 7. 在 renderProductList 后调用 updateProductStats =====
OLD_RENDER_CALL = """            // Render product list from catalog data
            renderProductList();
            // Render initial product detail
            updateProductDetail(productsState.selectedProduct);"""

NEW_RENDER_CALL = """            // Render product list from catalog data
            renderProductList();
            // Render initial product detail
            updateProductDetail(productsState.selectedProduct);
            // 动态更新 stats
            updateProductStats();"""

content = safe_replace(content, OLD_RENDER_CALL, NEW_RENDER_CALL, "Mod7: 初始化后调用 updateProductStats")

# ===== 写回 =====
write_file(content)
print(f"\n全部 7 处修改完成 ✅  ({len(content)} 字符)")
