/**
 * overview.js -- 公司概览页面
 * Phase 3.6: Company Overview Functions
 * 依赖: helpers.js, tenant.js
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.modules = N.modules || {};

    // ===== Company Overview: Toggle Detail Sections =====
    let activeOverviewSection = null;
    var _ovSelectedProduct = null; // 当前 Overview 详情面板选中的产品

    function toggleOverviewSection(section) {
        const allSections = document.querySelectorAll('.overview-detail-section');
        const allCards = document.querySelectorAll('.overview-card');

        if (activeOverviewSection === section) {
            // Collapse if clicking same card
            allSections.forEach(s => s.classList.add('hidden'));
            allCards.forEach(c => {
                c.classList.remove('border-blue-400', 'border-green-400', 'border-purple-400', 'shadow-lg');
                c.classList.add('border-gray-200');
                c.querySelector('.overview-arrow').style.transform = '';
            });
            activeOverviewSection = null;
            return;
        }

        // Hide all, show selected
        allSections.forEach(s => s.classList.add('hidden'));
        allCards.forEach(c => {
            c.classList.remove('border-blue-400', 'border-green-400', 'border-purple-400', 'shadow-lg');
            c.classList.add('border-gray-200');
            c.querySelector('.overview-arrow').style.transform = '';
        });

        const target = document.getElementById('overview-section-' + section);
        if (target) {
            target.classList.remove('hidden');
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        const card = document.querySelector('.overview-card[data-section="' + section + '"]');
        if (card) {
            const colorMap = { orders: 'border-blue-400', customers: 'border-green-400', products: 'border-purple-400' };
            card.classList.remove('border-gray-200');
            card.classList.add(colorMap[section], 'shadow-lg');
            card.querySelector('.overview-arrow').style.transform = 'rotate(180deg)';
        }

        activeOverviewSection = section;

        // Populate data on first open
        if (section === 'orders') renderOverviewOrders();
        if (section === 'customers') renderOverviewCustomers();
        if (section === 'products') renderOverviewProducts();
    }

    // ===== Company Overview: Tenant-Aware Data =====
    function getOverviewOrdersData() {
        const slug = getCurrentTenantSlug();
        if (slug === 'omeya-sin') return [
            { id: 'OMY-ORD-001', customer: 'Miss Xu', email: 'miss.xu@email.com', product: 'Zip Blinds Motorized', total: '$6,500', status: 'Pending', statusColor: 'amber', date: 'Apr 1, 2026' }
        ];
        if (slug === 'nestopia-chn') return [
            { id: 'CHN-ORD-001', customer: 'Larry Zhang', email: 'larry.zhang@email.com', product: 'L-Classic Sunroom', total: '$50,000', status: 'Pending', statusColor: 'amber', date: 'Apr 1, 2026' },
            { id: 'CHN-ORD-002', customer: 'Larry Zhang', email: 'larry.zhang@email.com', product: 'Pergola Basic', total: '$15,000', status: 'Pending', statusColor: 'amber', date: 'Apr 1, 2026' },
            { id: 'CHN-ORD-003', customer: 'Larry Zhang', email: 'larry.zhang@email.com', product: 'Zip Blinds Standard', total: '$8,000', status: 'Pending', statusColor: 'amber', date: 'Apr 1, 2026' }
        ];
        return [
            { id: 'ORD-2024-0156', customer: 'Mr. Johnson', email: 'johnson@email.com', product: 'Classic Sunroom', total: '$18,500', status: 'In Production', statusColor: 'blue', date: 'Mar 10, 2026' },
            { id: 'ORD-2024-0155', customer: 'Ms. Chen', email: 'chen@email.com', product: 'Studio Pergola', total: '$6,900', status: 'Pending', statusColor: 'amber', date: 'Mar 8, 2026' },
            { id: 'ORD-2024-0154', customer: 'Mrs. Davis', email: 'davis@email.com', product: 'Zip Blinds Set', total: '$4,200', status: 'Shipped', statusColor: 'purple', date: 'Mar 5, 2026' },
            { id: 'ORD-2024-0153', customer: 'Mr. Smith', email: 'smith@email.com', product: 'Premium Sunroom', total: '$32,000', status: 'Completed', statusColor: 'green', date: 'Feb 28, 2026' },
            { id: 'ORD-2024-0152', customer: 'Ms. Garcia', email: 'garcia@email.com', product: 'ADU Studio', total: '$85,000', status: 'In Production', statusColor: 'blue', date: 'Feb 25, 2026' },
            { id: 'ORD-2024-0151', customer: 'Mr. Wilson', email: 'wilson@email.com', product: 'Classic Pergola', total: '$9,500', status: 'Completed', statusColor: 'green', date: 'Feb 20, 2026' },
            { id: 'ORD-2024-0150', customer: 'Mrs. Taylor', email: 'taylor@email.com', product: 'Zip Blinds Motorized', total: '$5,800', status: 'Pending', statusColor: 'amber', date: 'Feb 15, 2026' },
            { id: 'ORD-2024-0149', customer: 'Mr. Anderson', email: 'anderson@email.com', product: 'M-Smart Sunroom', total: '$24,500', status: 'In Production', statusColor: 'blue', date: 'Feb 10, 2026' }
        ];
    }
    const overviewOrdersData = getOverviewOrdersData();

    function getOverviewCustomersData() {
        const slug = getCurrentTenantSlug();
        if (slug === 'omeya-sin') return [
            { name: 'Miss Xu', email: 'miss.xu@email.com', location: '88 Orchard Road, Singapore', projects: 1, spent: '$0', status: 'New', avatar: 'X' }
        ];
        if (slug === 'nestopia-chn') return [
            { name: 'Larry Zhang', email: 'larry.zhang@email.com', location: '1288 Nanjing West Rd, Shanghai', projects: 3, spent: '$0', status: 'New', avatar: 'Z' }
        ];
        return [
        { name: 'Mr. Johnson', email: 'johnson@email.com', location: '123 Sunshine Ave, Los Angeles, CA', projects: 3, spent: '$42,500', status: 'VIP', avatar: 'J' },
        { name: 'Ms. Chen', email: 'chen@email.com', location: '456 Oak Dr, Frederick, MD', projects: 1, spent: '$6,900', status: 'Active', avatar: 'C' },
        { name: 'Mrs. Davis', email: 'davis@email.com', location: '789 Pool Ln, Scottsdale, AZ', projects: 2, spent: '$12,800', status: 'Active', avatar: 'D' },
        { name: 'Mr. Smith', email: 'smith@email.com', location: '8520 Fenton St, Silver Spring, MD', projects: 1, spent: '$32,000', status: 'VIP', avatar: 'S' },
        { name: 'Ms. Garcia', email: 'garcia@email.com', location: '654 Pine Rd, San Diego, CA', projects: 1, spent: '$85,000', status: 'New', avatar: 'G' },
        { name: 'Mr. Wilson', email: 'wilson@email.com', location: '987 Cedar Ct, Portland, OR', projects: 2, spent: '$18,200', status: 'Active', avatar: 'W' },
        { name: 'Mrs. Taylor', email: 'taylor@email.com', location: '111 Rose Blvd, Denver, CO', projects: 1, spent: '$5,800', status: 'Active', avatar: 'T' },
        { name: 'Mr. Anderson', email: 'anderson@email.com', location: '222 Maple Ave, Seattle, WA', projects: 2, spent: '$38,500', status: 'VIP', avatar: 'A' },
        { name: 'Ms. Martinez', email: 'martinez@email.com', location: '333 Birch Ln, Phoenix, AZ', projects: 1, spent: '$9,200', status: 'Active', avatar: 'M' },
        { name: 'Mr. Thompson', email: 'thompson@email.com', location: '444 Walnut Dr, Dallas, TX', projects: 3, spent: '$52,000', status: 'VIP', avatar: 'T' },
        { name: 'Mrs. Brown', email: 'brown@email.com', location: '555 Spruce Ct, Miami, FL', projects: 1, spent: '$15,300', status: 'Active', avatar: 'B' },
        { name: 'Mr. Lee', email: 'lee@email.com', location: '666 Aspen Way, Sacramento, CA', projects: 2, spent: '$22,700', status: 'Active', avatar: 'L' },
        { name: 'Ms. White', email: 'white@email.com', location: '777 Cherry St, Nashville, TN', projects: 1, spent: '$8,400', status: 'New', avatar: 'W' },
        { name: 'Mr. Harris', email: 'harris@email.com', location: '888 Poplar Rd, Charlotte, NC', projects: 1, spent: '$11,600', status: 'Active', avatar: 'H' },
        { name: 'Mrs. Clark', email: 'clark@email.com', location: '999 Cypress Ln, Tampa, FL', projects: 2, spent: '$29,800', status: 'Active', avatar: 'C' },
        { name: 'Mr. Lewis', email: 'lewis@email.com', location: '100 Willow Dr, Raleigh, NC', projects: 1, spent: '$7,500', status: 'New', avatar: 'L' },
        { name: 'Ms. Robinson', email: 'robinson@email.com', location: '200 Ivy Ct, Atlanta, GA', projects: 1, spent: '$19,200', status: 'Active', avatar: 'R' },
        { name: 'Mr. Walker', email: 'walker@email.com', location: '300 Magnolia Blvd, Orlando, FL', projects: 2, spent: '$35,600', status: 'Active', avatar: 'W' }
        ];
    }
    const overviewCustomersData = getOverviewCustomersData();

    function getOverviewProductsData() {
        const slug = getCurrentTenantSlug();
        if (slug === 'omeya-sin') {
            // 从 zbSKUCatalog 动态生成，按 Excel 3 分区结构分组
            var skuCat = window.zbSKUCatalog;
            var driveCat = window.zbDriveSystemCatalog;
            var catMap = window.zbSeriesCatMap || { 'WR100': 'zb-standard', 'WR110': 'zb-standard', 'WR120': 'zb-outdoor', 'Special': 'zb-special' };
            var labelMap = window.zbSeriesLabelMap || { 'zb-standard': 'WR100/110 Standard & Gazebo', 'zb-outdoor': 'WR120 Outdoor', 'zb-special': 'Special' };
            if (!skuCat) return [];
            var items = [];
            Object.keys(skuCat).forEach(function(key) {
                var s = skuCat[key];
                var hasMotor = false;
                if (s.drives && driveCat) {
                    for (var i = 0; i < s.drives.length; i++) {
                        var d = driveCat[s.drives[i]];
                        if (d && d.type === 'motorized') { hasMotor = true; break; }
                    }
                }
                var tiers = s.priceTiers || [];
                var lowP = tiers.length > 0 ? tiers[tiers.length - 1].price : 0;
                var highP = tiers.length > 0 ? tiers[0].price : 0;
                var priceStr = lowP === highP ? ('\u00a5' + lowP + '/m\u00b2') : ('\u00a5' + lowP + '\u2013' + highP + '/m\u00b2');
                var filterKey = catMap[s.series] || 'zb-standard';
                items.push({
                    name: s.model || s.name,
                    category: labelMap[filterKey] || s.series,
                    price: priceStr,
                    control: hasMotor ? 'Motorized' : 'Manual',
                    status: 'Active',
                    color: 'purple',
                    filterKey: filterKey,
                    catalogId: key,
                    series: s.series,
                    housing: s.housing || '',
                    notes: s.notes || ''
                });
            });
            return items;
        }
        // nestopia-chn and default/partner1/partner2 share all products
        return [
        { name: 'L-Classic Sunroom', category: 'Sunroom \u00b7 Classic', price: 'Manual', status: 'Active', color: 'amber', filterKey: 'sunroom', catalogId: 'sr-l-classic' },
        { name: 'L-Smart Sunroom', category: 'Sunroom \u00b7 Smart', price: 'Motorized', status: 'Active', color: 'amber', filterKey: 'sunroom', catalogId: 'sr-l-smart' },
        { name: 'L-Pro Sunroom', category: 'Sunroom \u00b7 Pro', price: 'Solar+Motor', status: 'Active', color: 'amber', filterKey: 'sunroom', catalogId: 'sr-l-pro' },
        { name: 'M-Classic Sunroom', category: 'Sunroom \u00b7 Classic', price: 'Manual', status: 'Active', color: 'blue', filterKey: 'sunroom', catalogId: 'sr-m-classic' },
        { name: 'M-Smart Sunroom', category: 'Sunroom \u00b7 Smart', price: 'Motorized', status: 'Active', color: 'blue', filterKey: 'sunroom', catalogId: 'sr-m-smart' },
        { name: 'M-Pro Sunroom', category: 'Sunroom \u00b7 Pro', price: 'Solar+Motor', status: 'Active', color: 'blue', filterKey: 'sunroom', catalogId: 'sr-m-pro' },
        { name: 'Pergola Basic', category: 'Pergola \u00b7 Basic', price: 'Manual', status: 'Active', color: 'green', filterKey: 'pergola', catalogId: 'pg-basic' },
        { name: 'Pergola Classic', category: 'Pergola \u00b7 Classic', price: 'Motorized', status: 'Active', color: 'green', filterKey: 'pergola', catalogId: 'pg-classic' },
        { name: 'Zip Blinds Standard', category: 'Zip Blinds', price: 'Manual', status: 'Active', color: 'purple', filterKey: 'blinds', catalogId: 'zb-manual' },
        { name: 'Zip Blinds Motorized', category: 'Zip Blinds', price: 'Electric', status: 'Active', color: 'purple', filterKey: 'blinds', catalogId: 'zb-motorized' }
        ];
    }
    const overviewProductsData = getOverviewProductsData();

    function renderOverviewOrders() {
        const tbody = document.getElementById('overviewOrdersBody');
        if (!tbody || tbody.children.length > 0) return;
        tbody.innerHTML = overviewOrdersData.map(o => '<tr class="border-b border-gray-50 hover:bg-gray-50/50 transition">' +
            '<td class="py-3 px-5"><span class="text-sm font-medium text-gray-900">' + o.id + '</span></td>' +
            '<td class="py-3 px-5"><div class="text-sm font-medium text-gray-900">' + o.customer + '</div><div class="text-xs text-gray-400">' + o.email + '</div></td>' +
            '<td class="py-3 px-5 text-sm text-gray-700">' + o.product + '</td>' +
            '<td class="py-3 px-5 text-sm font-semibold text-gray-900">' + o.total + '</td>' +
            '<td class="py-3 px-5"><span class="px-2.5 py-0.5 bg-' + o.statusColor + '-50 text-' + o.statusColor + '-700 text-xs font-medium rounded-full">' + o.status + '</span></td>' +
            '<td class="py-3 px-5 text-sm text-gray-500">' + o.date + '</td>' +
            '</tr>').join('');
    }

    function renderOverviewCustomers() {
        var tbody = document.getElementById('overviewCustomersBody');
        if (!tbody) return;
        var displayData;
        if (customersState.loaded && customersState.data.length > 0) {
            displayData = customersState.data.map(function(c) {
                var loc = '';
                if (c.address) loc += c.address;
                if (c.city) loc += (loc ? ', ' : '') + c.city;
                if (c.province && c.province !== c.city) loc += (loc ? ', ' : '') + c.province;
                var projCount = 0;
                if (typeof allProjectsData !== 'undefined') {
                    projCount = allProjectsData.filter(function(p) {
                        return p.customer === c.name;
                    }).length;
                }
                var st = c.customer_type === 'vip' ? 'VIP' : (c.status === 'active' ? 'Active' : c.status === 'new' ? 'New' : (c.status || 'Active'));
                st = st.charAt(0).toUpperCase() + st.slice(1);
                return { name: c.name || 'Unknown', email: c.email || '', location: loc, projects: projCount, spent: '$0', status: st, avatar: (c.name || 'U').charAt(0).toUpperCase() };
            });
            // Merge project customers not yet in Supabase
            if (typeof allProjectsData !== 'undefined') {
                var seen = {};
                displayData.forEach(function(d) { seen[d.name] = true; });
                allProjectsData.forEach(function(p) {
                    if (!p.customer || p.hidden || seen[p.customer]) return;
                    seen[p.customer] = true;
                    var projCount = allProjectsData.filter(function(pp) { return pp.customer === p.customer; }).length;
                    displayData.push({
                        name: p.customer,
                        email: p.customerEmail || '',
                        location: p.customerAddress || '',
                        projects: projCount,
                        spent: '$0',
                        status: 'New',
                        avatar: p.customer.charAt(0).toUpperCase()
                    });
                });
            }
        } else {
            displayData = overviewCustomersData;
        }
        tbody.innerHTML = displayData.map(function(c) {
            var badge = c.status === 'VIP' ? 'bg-amber-50 text-amber-700' : c.status === 'New' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700';
            return '<tr class="border-b border-gray-50 hover:bg-gray-50/50 transition">' +
                '<td class="py-3 px-5"><div class="flex items-center gap-2.5"><div class="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">' + c.avatar + '</div><span class="text-sm font-medium text-gray-900">' + c.name + '</span></div></td>' +
                '<td class="py-3 px-5 text-sm text-gray-600">' + c.email + '</td>' +
                '<td class="py-3 px-5 text-sm text-gray-600">' + c.location + '</td>' +
                '<td class="py-3 px-5 text-sm font-medium text-gray-900">' + c.projects + '</td>' +
                '<td class="py-3 px-5 text-sm font-semibold text-gray-900">' + c.spent + '</td>' +
                '<td class="py-3 px-5"><span class="px-2.5 py-0.5 ' + badge + ' text-xs font-medium rounded-full">' + c.status + '</span></td>' +
                '</tr>';
        }).join('');
        _updateOverviewCustomerStats(displayData);
    }

    function _updateOverviewCustomerStats(data) {
        var card = document.querySelector('.overview-card[data-section="customers"]');
        if (!card) return;
        var countEl = card.querySelector('.text-2xl');
        if (countEl) countEl.textContent = data.length;
        var statsDiv = card.querySelector('.flex.items-center.gap-3.mt-3');
        if (statsDiv) {
            var active = data.filter(function(c) { return c.status === 'Active' || c.status === 'VIP'; }).length;
            var newC = data.filter(function(c) { return c.status === 'New'; }).length;
            statsDiv.innerHTML = '<span class="text-green-600 font-medium">' + active + ' Active</span><span class="text-purple-600 font-medium">' + newC + ' New This Month</span>';
        }
    }

    // ── 列表视图辅助函数 ──
    function _renderOmeyaProductList(data) {
        var sectionOrder = ['zb-standard', 'zb-outdoor', 'zb-special'];
        var sectionMeta = {
            'zb-standard': { label: 'WR100 / WR110 Series', sublabel: 'Standard & Gazebo', icon: 'fa-home', color: 'blue' },
            'zb-outdoor':  { label: 'WR120 Series', sublabel: 'Outdoor Heavy-duty', icon: 'fa-mountain-sun', color: 'green' },
            'zb-special':  { label: 'Special Series', sublabel: 'Hidden Rail \u00b7 Indoor \u00b7 Large Format', icon: 'fa-star', color: 'amber' }
        };
        var grouped = {};
        data.forEach(function(p) { var k = p.filterKey || 'zb-standard'; if (!grouped[k]) grouped[k] = []; grouped[k].push(p); });
        var html = '<div class="border border-gray-100 rounded-xl overflow-hidden">';
        sectionOrder.forEach(function(sk) {
            var items = grouped[sk] || [];
            if (items.length === 0) return;
            var meta = sectionMeta[sk] || { label: sk, sublabel: '', icon: 'fa-box', color: 'gray' };
            html += '<div class="ov-product-section" data-section-filter="' + sk + '">' +
                '<div class="px-4 py-2 bg-gray-50/80 flex items-center justify-between border-b border-gray-100">' +
                    '<div class="flex items-center gap-2">' +
                        '<i class="fas ' + meta.icon + ' text-' + meta.color + '-500 text-xs"></i>' +
                        '<span class="text-[11px] font-bold text-gray-500 uppercase tracking-wider">' + meta.label + '</span>' +
                        '<span class="text-[10px] text-gray-400">' + meta.sublabel + '</span>' +
                    '</div>' +
                    '<span class="text-[10px] bg-gray-200/80 text-gray-500 px-1.5 py-0.5 rounded font-medium">' + items.length + '</span>' +
                '</div>';
            items.forEach(function(p) { html += _renderProductListItem(p); });
            html += '</div>';
        });
        html += '</div>';
        return html;
    }

    function _renderDefaultProductList(data) {
        var html = '<div class="border border-gray-100 rounded-xl overflow-hidden">';
        data.forEach(function(p) { html += _renderProductListItem(p); });
        html += '</div>';
        return html;
    }

    function _renderProductListItem(p) {
        var iconSrc = (typeof productIcons !== 'undefined' && productIcons[p.catalogId]) ? productIcons[p.catalogId] : '/images/products/icons/zip-blinds.png';
        return '<div class="ov-product-item flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-all" data-category="' + p.filterKey + '" data-catalog-id="' + p.catalogId + '">' +
            '<div class="w-8 h-8 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 p-0.5">' +
                '<img src="' + iconSrc + '" alt="' + (p.name || '') + '" class="w-full h-full object-contain">' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
                '<div class="text-sm font-medium text-gray-900 truncate">' + (p.name || '') + '</div>' +
                '<div class="text-xs text-gray-400 truncate">' + (p.housing || p.category || '') + '</div>' +
            '</div>' +
            '<span class="text-xs text-gray-500 font-medium flex-shrink-0">' + (p.price || '') + '</span>' +
            '<span class="text-[10px] ' + (p.control === 'Motorized' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 bg-gray-50') + ' font-medium px-1.5 py-0.5 rounded-full flex-shrink-0">' + (p.control || 'Manual') + '</span>' +
            '<span class="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-medium rounded-full flex-shrink-0">' + (p.status || 'Active') + '</span>' +
            (p.notes ? '<span class="text-[10px] text-amber-500 flex-shrink-0" title="' + p.notes + '"><i class="fas fa-info-circle"></i></span>' : '') +
        '</div>';
    }

    // ══════════════════════════════════════════════════════
    // Overview 产品详情面板 — master-detail 交互
    // ══════════════════════════════════════════════════════

    function _showOvProductDetail(catalogId) {
        var listCol = document.getElementById('ovProductListCol');
        var detailCol = document.getElementById('ovProductDetailCol');
        if (!listCol || !detailCol) return;
        listCol.style.width = '280px';
        listCol.style.flexShrink = '0';
        listCol.style.maxHeight = '720px';
        listCol.style.overflowY = 'auto';
        detailCol.classList.remove('hidden');
        _ovSelectedProduct = catalogId;
        // 高亮选中项
        var grid = document.getElementById('overviewProductsGrid');
        if (grid) {
            grid.querySelectorAll('.ov-product-item').forEach(function(item) {
                var sel = item.dataset.catalogId === catalogId;
                item.classList.toggle('bg-blue-50', sel);
                item.classList.toggle('border-l-4', sel);
                item.classList.toggle('border-l-blue-500', sel);
            });
        }
        try {
            detailCol.innerHTML = _renderOvDetailPanel(catalogId);
        } catch (err) {
            console.error('[Nestopia] _showOvProductDetail failed:', err);
            detailCol.innerHTML = '<div class="p-5 border border-red-200 bg-red-50 rounded-xl text-center"><p class="text-red-600 font-medium mb-2">Failed to load details</p><p class="text-red-400 text-xs">' + (err.message || '') + '</p></div>';
        }
    }

    function _hideOvProductDetail() {
        var listCol = document.getElementById('ovProductListCol');
        var detailCol = document.getElementById('ovProductDetailCol');
        if (listCol) { listCol.style.width = ''; listCol.style.flexShrink = ''; listCol.style.maxHeight = ''; listCol.style.overflowY = ''; }
        if (detailCol) { detailCol.classList.add('hidden'); detailCol.innerHTML = ''; }
        _ovSelectedProduct = null;
        var grid = document.getElementById('overviewProductsGrid');
        if (grid) grid.querySelectorAll('.ov-product-item').forEach(function(item) {
            item.classList.remove('bg-blue-50', 'border-l-4', 'border-l-blue-500');
        });
    }

    function _renderOvDetailPanel(catalogId) {
        var skuCat = window.zbSKUCatalog;
        var pc = (typeof productCatalog !== 'undefined') ? productCatalog : {};
        var p = pc[catalogId];
        if (!p) return '<div class="p-5 text-center text-gray-400">Product not found</div>';
        var skuKey = p._zbSKU || catalogId;
        var sku = (skuCat && skuCat[skuKey]) || p._zbData;
        if (!sku) return '<div class="p-5 text-center text-gray-400">SKU data not available</div>';
        return '<div class="bg-white rounded-xl border border-gray-200 overflow-hidden">' +
            '<div class="p-4 border-b border-gray-200 flex items-center justify-between">' +
                '<h3 class="font-semibold text-gray-900">Product Information</h3>' +
                '<div class="flex gap-2">' +
                    '<button class="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"><i class="fas fa-edit mr-1"></i>Edit</button>' +
                    '<button class="px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"><i class="fas fa-trash-alt mr-1"></i>Delete</button>' +
                '</div>' +
            '</div>' +
            '<div class="p-5">' +
                _renderOvDetailHeader(sku, p) +
                _renderOvPricingTiers(sku) +
                _renderOvDriveSystems(sku) +
                _renderOvQuotationParams() +
                _renderOvProductFiles() +
                _renderOvActionButtons() +
            '</div></div>';
    }

    function _renderOvDetailHeader(sku, p) {
        var iconSrc = (typeof productIcons !== 'undefined' && productIcons[p.id || '']) || p.image || '/images/products/icons/zip-blinds.png';
        var tiers = sku.priceTiers || [];
        var lowP = tiers.length > 0 ? tiers[tiers.length - 1].price : 0;
        var highP = tiers.length > 0 ? tiers[0].price : 0;
        return '<div class="flex gap-6 mb-6">' +
            '<div class="w-36 h-36 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100 p-2">' +
                '<img src="' + iconSrc + '" alt="' + (p.name || '') + '" class="w-full h-full object-contain">' +
            '</div>' +
            '<div class="flex-1 min-w-0">' +
                '<div class="flex items-center gap-3 mb-1.5 flex-wrap">' +
                    '<h2 class="text-xl font-bold text-gray-900">' + (sku.model || p.name || '') + '</h2>' +
                    '<span class="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Active</span>' +
                    '<span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">' + (sku.series || '') + '</span>' +
                '</div>' +
                '<p class="text-sm text-gray-500 mb-3">' + (sku.nameZh || p.name || '') + '</p>' +
                _renderOvDetailSpecs(sku, lowP, highP) +
                '<p class="text-sm text-gray-600 leading-relaxed">' + (sku.features || '') + '</p>' +
                (sku.notes ? '<p class="text-xs text-amber-600 mt-1"><i class="fas fa-info-circle mr-1"></i>' + sku.notes + '</p>' : '') +
            '</div></div>';
    }

    function _renderOvDetailSpecs(sku, lowP, highP) {
        return '<div class="grid grid-cols-3 gap-3 mb-3">' +
            '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Housing</label><div class="text-xs font-bold text-gray-900 mt-0.5">' + (sku.housing || '') + '</div></div>' +
            '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Max Size</label><div class="text-xs font-bold text-gray-900 mt-0.5">' + ((sku.maxWidthMM||0)/1000) + 'm W \u00d7 ' + ((sku.maxHeightMM||0)/1000) + 'm H</div></div>' +
            '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Fabric</label><div class="text-xs font-bold text-gray-900 mt-0.5">' + (sku.fabric || '') + ' (' + (sku.fabricOpenness || '') + ')</div></div>' +
            '<div class="bg-orange-50 rounded-lg p-2.5"><label class="text-[10px] text-orange-400 uppercase tracking-wider font-medium">Supplier Price</label><div class="text-sm font-bold text-orange-700 mt-0.5">\u00a5' + lowP + ' \u2013 \u00a5' + highP + '<span class="text-[10px] text-gray-400 font-normal">/m\u00b2</span></div></div>' +
            '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Min Area</label><div class="text-xs font-bold text-gray-900 mt-0.5">' + (sku.minArea || 3) + ' m\u00b2</div></div>' +
            (sku.samplePrice ? '<div class="bg-gray-50 rounded-lg p-2.5"><label class="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Sample</label><div class="text-xs font-bold text-gray-900 mt-0.5">\u00a5' + sku.samplePrice + '/pc</div></div>' : '') +
        '</div>';
    }

    function _renderOvPricingTiers(sku) {
        var tiers = sku.priceTiers || [];
        if (tiers.length === 0) return '';
        var html = tiers.map(function(t, i) {
            var al = t.maxArea === Infinity ? '>' + (i > 0 ? tiers[i-1].maxArea : (sku.minArea||3)) + ' m\u00b2' : '\u2264' + t.maxArea + ' m\u00b2';
            return '<div class="flex items-center justify-between px-3 py-2.5 bg-emerald-50/60 border border-emerald-200/60 rounded-lg">' +
                '<div class="flex items-center gap-2"><span class="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">' + (i+1) + '</span><span class="text-sm font-semibold text-gray-900">' + al + '</span></div>' +
                '<span class="text-sm font-bold text-emerald-700">\u00a5' + t.price + '<span class="text-[10px] text-gray-400 font-normal ml-1">/m\u00b2</span></span></div>';
        }).join('');
        return '<div class="border border-gray-100 rounded-xl p-5 mb-5">' +
            '<h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-tags text-emerald-500"></i> Pricing Tiers <span class="text-[10px] text-gray-400 font-normal">(Supplier unit price by area)</span></h4>' +
            '<div class="space-y-1.5 mb-3">' + html + '</div>' +
            '<p class="text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 flex items-start gap-1.5"><i class="fas fa-info-circle mt-0.5 flex-shrink-0"></i><span>Prices ex-factory (incl. tax), excl. shipping/installation. Min billable area: ' + (sku.minArea||3) + ' m\u00b2. Standard NP4000 fabric included.</span></p></div>';
    }

    function _renderOvDriveSystems(sku) {
        var driveCat = window.zbDriveSystemCatalog || {};
        if (!sku.drives || sku.drives.length === 0) return '';
        var html = sku.drives.map(function(dk) {
            var d = driveCat[dk]; if (!d) return '';
            var tl = d.type === 'motorized' ? '<span class="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded">Motor</span>' :
                     d.type === 'combo' ? '<span class="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-bold rounded">Combo</span>' :
                     '<span class="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded">Manual</span>';
            return '<div class="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition">' +
                '<div class="flex items-center gap-2 min-w-0"><i class="fas fa-cog text-gray-400 text-xs flex-shrink-0"></i><span class="text-sm text-gray-800 truncate">' + d.name + '</span>' + tl + '</div>' +
                '<span class="text-sm font-bold text-gray-900 flex-shrink-0">\u00a5' + d.price + '<span class="text-[10px] text-gray-400 font-normal ml-0.5">/set</span></span></div>';
        }).join('');
        return '<div class="border border-gray-100 rounded-xl p-5 mb-5">' +
            '<h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><i class="fas fa-cogs text-blue-500"></i> Compatible Drive Systems <span class="text-[10px] text-gray-400 font-normal">(' + sku.drives.length + ' options)</span></h4>' +
            '<div class="space-y-1.5">' + html + '</div>' +
            '<p class="text-[11px] text-gray-400 mt-3"><i class="fas fa-info-circle mr-1"></i>Drive system priced per unit (RMB/set), selected during quotation.</p></div>';
    }

    function _renderOvQuotationParams() {
        var biz = window.zbBusinessParams || {};
        return '<div class="border border-blue-100 bg-blue-50/30 rounded-xl p-4 mb-5">' +
            '<h4 class="text-sm font-semibold text-blue-800 mb-2.5 flex items-center gap-2"><i class="fas fa-calculator text-blue-500"></i> Quotation Formula Parameters</h4>' +
            '<div class="grid grid-cols-2 lg:grid-cols-3 gap-2.5">' +
                _renderOvParamField('Supplier Discount', (biz.supplierDiscountRate || 0.9) + ' off') +
                _renderOvParamField('Shipping & Customs', ((biz.shippingCostRate || 0.3) * 100) + '%') +
                _renderOvParamField('Installation Fee', '\u00a5' + (biz.installationFeePerSqm || 191) + '/m\u00b2') +
                _renderOvParamField('Market Markup', '\u00d7' + (biz.marketMarkup || 2.92)) +
                _renderOvParamField('Default Discount', ((biz.preferentialDiscount || 0.5) * 100) + '%') +
                _renderOvParamField('Accessory Markup', '+' + ((biz.accessoryMarkupRate || 0.13) * 100) + '%') +
            '</div></div>';
    }

    function _renderOvParamField(label, value) {
        return '<div class="bg-white rounded-lg p-2.5 border border-gray-200">' +
            '<label class="text-[10px] text-gray-400 uppercase block mb-1">' + label + '</label>' +
            '<div class="text-xs font-bold text-gray-900">' + value + '</div></div>';
    }

    function _renderOvProductFiles() {
        return '<div class="border border-gray-100 rounded-xl p-5 mb-5">' +
            '<div class="flex items-center justify-between mb-3">' +
                '<h4 class="text-sm font-semibold text-gray-900 flex items-center gap-2"><i class="fas fa-file-alt text-gray-400"></i> Product Files</h4>' +
                '<button class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg flex items-center gap-1.5 opacity-50 cursor-not-allowed" disabled><i class="fas fa-cloud-upload-alt"></i> Upload Files</button>' +
            '</div>' +
            '<p class="text-sm text-gray-400 text-center py-4"><i class="fas fa-inbox text-gray-300 text-lg mb-2 block"></i>Files will appear here after upload</p></div>';
    }

    function _renderOvActionButtons() {
        return '<div class="flex gap-3">' +
            '<button class="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"><i class="fas fa-copy text-gray-400"></i> Duplicate Product</button>' +
            '<button class="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition"><i class="fas fa-archive text-gray-400"></i> Archive Product</button>' +
            '<button class="flex-none px-5 py-3 bg-white border border-red-200 text-red-500 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-50 transition"><i class="fas fa-trash-alt"></i> Del</button>' +
        '</div>';
    }

    function renderOverviewProducts() {
        const grid = document.getElementById('overviewProductsGrid');
        if (!grid) return;

        var slug = getCurrentTenantSlug();
        var isOmeya = (slug === 'omeya-sin');

        // ── 两栏 flex 布局：左列列表 + 右列详情（初始隐藏）──
        var listHTML = isOmeya ? _renderOmeyaProductList(overviewProductsData) : _renderDefaultProductList(overviewProductsData);
        grid.innerHTML = '<div class="flex gap-6">' +
            '<div id="ovProductListCol" class="transition-all duration-300" style="width:100%">' + listHTML + '</div>' +
            '<div id="ovProductDetailCol" class="hidden flex-1 min-w-0"></div>' +
        '</div>';

        // --- Item click: 展开内联详情面板 ---
        grid.querySelectorAll('.ov-product-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var catalogId = this.dataset.catalogId;
                if (catalogId) _showOvProductDetail(catalogId);
            });
        });

        // --- Overview filter buttons (hide non-tenant categories) ---
        var ovTenantCatKeys = (typeof productCategories !== 'undefined') ? productCategories.map(function(c) { return c.key; }) : [];
        document.querySelectorAll('.ov-product-filter-btn').forEach(function(btn) {
            var f = btn.dataset.filter;
            if (f !== 'all' && ovTenantCatKeys.indexOf(f) === -1) { btn.style.display = 'none'; }
            btn.addEventListener('click', function() {
                document.querySelectorAll('.ov-product-filter-btn').forEach(function(b) {
                    b.classList.remove('bg-gray-900', 'text-white');
                    b.classList.add('bg-white', 'border', 'text-gray-600');
                });
                this.classList.remove('bg-white', 'border', 'text-gray-600');
                this.classList.add('bg-gray-900', 'text-white');
                var filter = this.dataset.filter;
                if (isOmeya) {
                    grid.querySelectorAll('.ov-product-section').forEach(function(sec) {
                        sec.style.display = (filter === 'all' || sec.dataset.sectionFilter === filter) ? '' : 'none';
                    });
                } else {
                    grid.querySelectorAll('.ov-product-item').forEach(function(item) {
                        item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
                    });
                }
            });
        });

        // --- 更新 Overview stats card 产品数量 ---
        _updateOverviewProductStats(overviewProductsData);
    }

    function _updateOverviewProductStats(data) {
        var card = document.querySelector('.overview-card[data-section="products"]');
        if (!card) return;
        var countEl = card.querySelector('.text-2xl');
        if (countEl) countEl.textContent = data.length;
        var statsDiv = card.querySelector('.flex.items-center.gap-3.mt-3');
        if (statsDiv) {
            var active = data.filter(function(p) { return p.status === 'Active'; }).length;
            var cats = new Set(data.map(function(p) { return p.filterKey; })).size;
            statsDiv.innerHTML = '<span class="text-green-600 font-medium">' + active + ' Active</span><span class="text-gray-600 font-medium">' + cats + ' Categories</span>';
        }
    }

    // ===== 注册模块 =====
    N.modules.overview = {
        toggleOverviewSection: toggleOverviewSection,
        getOverviewOrdersData: getOverviewOrdersData,
        overviewOrdersData: overviewOrdersData,
        getOverviewCustomersData: getOverviewCustomersData,
        overviewCustomersData: overviewCustomersData,
        getOverviewProductsData: getOverviewProductsData,
        overviewProductsData: overviewProductsData,
        renderOverviewOrders: renderOverviewOrders,
        renderOverviewCustomers: renderOverviewCustomers,
        renderOverviewProducts: renderOverviewProducts,
        _updateOverviewCustomerStats: _updateOverviewCustomerStats,
        _updateOverviewProductStats: _updateOverviewProductStats
    };

    // ===== 全局别名（向后兼容） =====
    window.toggleOverviewSection = toggleOverviewSection;
    window.getOverviewOrdersData = getOverviewOrdersData;
    window.overviewOrdersData = overviewOrdersData;
    window.getOverviewCustomersData = getOverviewCustomersData;
    window.overviewCustomersData = overviewCustomersData;
    window.getOverviewProductsData = getOverviewProductsData;
    window.overviewProductsData = overviewProductsData;
    window.renderOverviewOrders = renderOverviewOrders;
    window.renderOverviewCustomers = renderOverviewCustomers;
    window.renderOverviewProducts = renderOverviewProducts;
    window._updateOverviewCustomerStats = _updateOverviewCustomerStats;
    window._showOvProductDetail = _showOvProductDetail;
    window._hideOvProductDetail = _hideOvProductDetail;

})();
