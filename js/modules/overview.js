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

    function renderOverviewProducts() {
        const grid = document.getElementById('overviewProductsGrid');
        if (!grid) return;

        var slug = getCurrentTenantSlug();
        var isOmeya = (slug === 'omeya-sin');

        if (isOmeya) {
            // ── omeya-sin: 按 3 分区列表视图 ──
            grid.innerHTML = _renderOmeyaProductList(overviewProductsData);
        } else {
            // ── 其他租户: 列表视图 ──
            grid.innerHTML = _renderDefaultProductList(overviewProductsData);
        }

        // --- Item click: navigate to Products page with that product selected ---
        grid.querySelectorAll('.ov-product-item').forEach(function(item) {
            item.addEventListener('click', function() {
                var catalogId = this.dataset.catalogId;
                if (catalogId && typeof productCatalog !== 'undefined' && productCatalog[catalogId]) {
                    if (typeof productsState !== 'undefined') productsState.selectedProduct = catalogId;
                    navigateToPage('products');
                    setTimeout(function() {
                        if (typeof renderProductList === 'function') renderProductList();
                        if (typeof updateProductDetail === 'function') updateProductDetail(catalogId);
                        var selectedItem = document.querySelector('.product-item[data-product="' + catalogId + '"]');
                        if (selectedItem) selectedItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                }
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

})();
