/**
 * customers.js — 客户管理页面
 * Phase 3.3: Customers Page Functions (Supabase CRUD)
 * 依赖: helpers.js, supabase-config.js, router.js
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.modules = N.modules || {};

    // ===== Customers Page Functions (Supabase CRUD) =====
    const customersState = {
        selectedCustomer: null,
        filter: 'all',
        data: [],
        loaded: false
    };

    function loadCustomersFromDB() {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) {
            console.warn('[Customers] Supabase not connected, using fallback');
            customersState.data = _getCustomerFallbackData();
            customersState.loaded = true;
            renderCustomerListHTML();
            updateCustomerStats();
            renderOverviewCustomers();
            if (customersState.data.length > 0 && !customersState.selectedCustomer) {
                customersState.selectedCustomer = customersState.data[0].id;
                updateCustomerDetail(customersState.selectedCustomer);
            }
            return Promise.resolve();
        }
        return NestopiaDB.getClient()
            .from('customers')
            .select('*')
            .eq('tenant_id', NestopiaDB.getTenantId())
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .then(function(res) {
                if (res.error) {
                    console.warn('[Customers] DB load error:', res.error.message);
                    customersState.data = _getCustomerFallbackData();
                } else {
                    customersState.data = res.data || [];
                }
                customersState.loaded = true;
                renderCustomerListHTML();
                updateCustomerStats();
                renderOverviewCustomers();
                if (customersState.data.length > 0) {
                    if (!customersState.selectedCustomer || !customersState.data.find(function(c){ return c.id === customersState.selectedCustomer; })) {
                        customersState.selectedCustomer = customersState.data[0].id;
                    }
                    updateCustomerDetail(customersState.selectedCustomer);
                }
            })
            .catch(function(err) {
                console.warn('[Customers] DB load failed:', err.message);
                customersState.data = _getCustomerFallbackData();
                customersState.loaded = true;
                renderCustomerListHTML();
                updateCustomerStats();
                renderOverviewCustomers();
            });
    }

    function _getCustomerFallbackData() {
        var seen = {};
        var result = [];
        if (typeof allProjectsData !== 'undefined') {
            allProjectsData.forEach(function(p) {
                if (!p.customer || seen[p.customer]) return;
                seen[p.customer] = true;
                result.push({
                    id: 'local-' + p.id,
                    name: p.customer,
                    email: p.customerEmail || '',
                    phone: p.customerPhone || '',
                    address: p.customerAddress || '',
                    source: 'website',
                    customer_type: 'standard',
                    status: 'active',
                    created_at: new Date().toISOString()
                });
            });
        }
        return result;
    }

    function saveCustomerToDB(customerData) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) {
            showToast('Supabase not connected. Cannot save customer.', 'warning');
            return Promise.resolve(null);
        }
        var payload = {
            tenant_id: NestopiaDB.getTenantId(),
            name: customerData.name,
            email: customerData.email || null,
            phone: customerData.phone || null,
            company: customerData.company || null,
            address: customerData.address || null,
            city: customerData.city || null,
            province: customerData.province || null,
            postal_code: customerData.postal_code || null,
            source: customerData.source || 'website',
            customer_type: customerData.customer_type || 'standard',
            notes: customerData.notes || null,
            status: customerData.status || 'active',
            updated_at: new Date().toISOString()
        };
        if (customerData.id && !String(customerData.id).startsWith('local-')) {
            return NestopiaDB.getClient()
                .from('customers')
                .update(payload)
                .eq('id', customerData.id)
                .eq('tenant_id', NestopiaDB.getTenantId())
                .select()
                .then(function(res) {
                    if (res.error) { showToast('Update failed: ' + res.error.message, 'error'); return null; }
                    showToast('Customer updated successfully', 'success');
                    return res.data && res.data[0] ? res.data[0] : null;
                });
        } else {
            payload.customer_number = 'CUS-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(16).slice(2,8);
            return NestopiaDB.getClient()
                .from('customers')
                .insert(payload)
                .select()
                .then(function(res) {
                    if (res.error) { showToast('Create failed: ' + res.error.message, 'error'); return null; }
                    showToast('Customer created successfully', 'success');
                    return res.data && res.data[0] ? res.data[0] : null;
                });
        }
    }

    function deleteCustomerFromDB(customerId) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) {
            showToast('Supabase not connected', 'error');
            return Promise.resolve(false);
        }
        return NestopiaDB.getClient()
            .from('customers')
            .update({ is_deleted: true, updated_at: new Date().toISOString() })
            .eq('id', customerId)
            .eq('tenant_id', NestopiaDB.getTenantId())
            .then(function(res) {
                if (res.error) { showToast('Delete failed: ' + res.error.message, 'error'); return false; }
                showToast('Customer deleted', 'success');
                return true;
            });
    }

    function _getBadgeForCustomer(c) {
        var t = (c.customer_type || 'standard').toLowerCase();
        if (t === 'vip') return { text: 'VIP', cls: 'bg-green-100 text-green-700' };
        if (t === 'enterprise') return { text: 'Enterprise', cls: 'bg-purple-100 text-purple-700' };
        var s = (c.status || 'active').toLowerCase();
        if (s === 'prospect') return { text: 'New', cls: 'bg-amber-100 text-amber-700' };
        return { text: 'Active', cls: 'bg-blue-100 text-blue-700' };
    }

    function _getCustomerInitialColor(name) {
        var colors = ['bg-blue-500','bg-green-500','bg-purple-500','bg-amber-500','bg-red-500','bg-teal-500','bg-indigo-500','bg-pink-500'];
        var hash = 0;
        for (var i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    }

    function _getCustomerInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
        return parts[0].charAt(0).toUpperCase();
    }

    function renderCustomerListHTML() {
        var container = document.getElementById('customerList');
        if (!container) return;
        var list = _getFilteredCustomers();
        if (list.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-gray-400"><i class="fas fa-users text-3xl mb-2 block"></i><p class="text-sm">No customers found</p></div>';
            return;
        }
        container.innerHTML = list.map(function(c) {
            var badge = _getBadgeForCustomer(c);
            var color = _getCustomerInitialColor(c.name);
            var initials = _getCustomerInitials(c.name);
            var isSelected = customersState.selectedCustomer === c.id;
            var selectedCls = isSelected ? ' bg-blue-50/50 border-l-4 border-blue-500' : '';
            return '<div class="customer-item p-4 hover:bg-gray-50 cursor-pointer' + selectedCls + '" data-customer="' + c.id + '" onclick="Nestopia.modules.customers.selectCustomerItem(this)">' +
                '<div class="flex items-start gap-3">' +
                '<div class="w-10 h-10 ' + color + ' rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">' + initials + '</div>' +
                '<div class="flex-1 min-w-0">' +
                '<div class="flex items-center justify-between">' +
                '<span class="font-medium text-gray-900 text-sm">' + (c.name || 'Unnamed') + '</span>' +
                '<span class="px-1.5 py-0.5 ' + badge.cls + ' text-xs rounded">' + badge.text + '</span>' +
                '</div>' +
                '<p class="text-xs text-gray-500 truncate">' + (c.email || c.phone || '\u2014') + '</p>' +
                '<p class="text-xs text-gray-400 truncate mt-0.5">' + (_formatCustAddr(c) || '\u2014') + '</p>' +
                '</div></div></div>';
        }).join('');
    }

    function selectCustomerItem(el) {
        var cId = el.dataset.customer;
        customersState.selectedCustomer = cId;
        document.querySelectorAll('#customerList .customer-item').forEach(function(item) {
            item.classList.remove('bg-blue-50/50', 'border-l-4', 'border-blue-500');
        });
        el.classList.add('bg-blue-50/50', 'border-l-4', 'border-blue-500');
        updateCustomerDetail(cId);
    }

    function _getFilteredCustomers() {
        var searchVal = '';
        var searchEl = document.getElementById('customerSearch');
        if (searchEl) searchVal = searchEl.value.toLowerCase();
        return customersState.data.filter(function(c) {
            var f = customersState.filter;
            if (f !== 'all') {
                var badge = _getBadgeForCustomer(c);
                if (f === 'active' && badge.text !== 'Active' && badge.text !== 'VIP') return false;
                if (f === 'new' && badge.text !== 'New') return false;
                if (f === 'vip' && badge.text !== 'VIP') return false;
            }
            if (searchVal) {
                var text = ((c.name || '') + ' ' + (c.email || '') + ' ' + (c.phone || '') + ' ' + (c.address || '')).toLowerCase();
                if (!text.includes(searchVal)) return false;
            }
            return true;
        });
    }

    function updateCustomerStats() {
        var all = customersState.data;
        var total = all.length;
        var active = all.filter(function(c) { return c.status === 'active'; }).length;
        var prospect = all.filter(function(c) { return c.status === 'prospect'; }).length;
        var vip = all.filter(function(c) { return c.customer_type === 'vip'; }).length;
        var el;
        el = document.getElementById('custStatTotal'); if (el) el.textContent = total;
        el = document.getElementById('custStatActive'); if (el) el.textContent = active;
        el = document.getElementById('custStatNew'); if (el) el.textContent = prospect;
        el = document.getElementById('custStatRepeat'); if (el) el.textContent = vip;
        el = document.getElementById('custListTotal'); if (el) el.textContent = total + ' total';
    }

    function updateCustomerDetail(customerId) {
        var customer = customersState.data.find(function(c) { return c.id === customerId; });
        if (!customer) return;
        var initials = _getCustomerInitials(customer.name);
        var color = _getCustomerInitialColor(customer.name);
        var badge = _getBadgeForCustomer(customer);
        var avatar = document.getElementById('customerDetailAvatar');
        if (avatar) { avatar.textContent = initials; avatar.className = 'w-20 h-20 ' + color + ' rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0'; }
        var el;
        el = document.getElementById('customerDetailName'); if (el) el.textContent = customer.name || '\u2014';
        el = document.getElementById('customerDetailProject'); if (el) el.textContent = customer.company || _getCustomerProjectNames(customer) || '\u2014';
        el = document.getElementById('customerDetailEmail'); if (el) el.textContent = customer.email || '\u2014';
        el = document.getElementById('customerDetailPhone'); if (el) el.textContent = customer.phone || '\u2014';
        el = document.getElementById('customerDetailAddress'); if (el) el.textContent = _formatCustAddr(customer) || '\u2014';
        el = document.getElementById('customerDetailSource');
        if (el) { var src = (customer.source || '\u2014'); el.textContent = src.replace(/_/g, ' ').replace(/\b\w/g, function(l){ return l.toUpperCase(); }); }
        var badgeEl = document.getElementById('customerDetailBadge');
        if (badgeEl) { badgeEl.textContent = badge.text; badgeEl.className = 'px-2 py-0.5 ' + badge.cls + ' text-xs font-medium rounded-full'; }
        el = document.getElementById('customerStatOrders'); if (el) el.textContent = customer._orderCount || '0';
        el = document.getElementById('customerStatSpent'); if (el) el.textContent = customer._totalSpent || '$0';
        el = document.getElementById('customerStatProjects'); if (el) el.textContent = customer._projectCount || _countCustomerProjects(customer);
        el = document.getElementById('customerStatSatisfaction'); if (el) el.textContent = customer.satisfaction_score ? customer.satisfaction_score + '%' : 'N/A';
    }

    function _formatCustAddr(c) {
        if (!c) return '';
        var parts = [];
        if (c.address) parts.push(c.address);
        if (c.city) parts.push(c.city);
        if (c.province) parts.push(c.province);
        if (c.postal_code) parts.push(c.postal_code);
        return parts.join(', ');
    }

    function _getCustomerProjectNames(customer) {
        if (typeof allProjectsData === 'undefined') return '';
        var names = [];
        allProjectsData.forEach(function(p) {
            if ((customer.email && p.customerEmail === customer.email) || p.customer === customer.name) names.push(p.name);
        });
        return names.join(', ');
    }

    function _countCustomerProjects(customer) {
        if (typeof allProjectsData === 'undefined') return 0;
        var count = 0;
        allProjectsData.forEach(function(p) {
            if ((customer.email && p.customerEmail === customer.email) || p.customer === customer.name) count++;
        });
        return count;
    }

    function filterCustomers(filter) {
        customersState.filter = filter;
        renderCustomerListHTML();
    }

    function searchCustomers(query) {
        renderCustomerListHTML();
    }

    function openCustomerModal(customerId) {
        var customer = null;
        var isEdit = false;
        if (customerId) {
            customer = customersState.data.find(function(c) { return c.id === customerId; });
            if (customer) isEdit = true;
        }
        var title = isEdit ? 'Edit Customer' : 'Add Customer';
        var overlay = document.createElement('div');
        overlay.id = 'customerModalOverlay';
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4';
        overlay.onclick = function(e) { if (e.target === overlay) closeCustomerModal(); };
        var cid = isEdit ? customerId : '';
        overlay.innerHTML = '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onclick="event.stopPropagation()">' +
            '<div class="flex items-center justify-between p-5 border-b border-gray-200">' +
            '<h2 class="text-lg font-bold text-gray-900">' + title + '</h2>' +
            '<button onclick="Nestopia.modules.customers.closeCustomerModal()" class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-xl">&times;</button>' +
            '</div>' +
            '<div class="p-5 space-y-4">' +
            _custField('custForm_name', 'Client Name', 'text', true, customer ? customer.name : '', 'Full name') +
            _custField('custForm_email', 'Email', 'email', false, customer ? customer.email : '', 'client@email.com') +
            _custField('custForm_phone', 'Phone', 'text', true, customer ? customer.phone : '', '(310) 555-0100') +
            _custField('custForm_company', 'Company', 'text', false, customer ? customer.company : '', 'Company name') +
            '<div class="grid grid-cols-2 gap-4">' +
            _custField('custForm_address', 'Street Address', 'text', false, customer ? (customer.address || '') : '', '123 Main St') +
            _custField('custForm_city', 'City', 'text', false, customer ? (customer.city || '') : '', 'Los Angeles') +
            '</div>' +
            '<div class="grid grid-cols-2 gap-4">' +
            _custField('custForm_province', 'State / Province', 'text', false, customer ? (customer.province || '') : '', 'CA') +
            _custField('custForm_postal_code', 'ZIP / Postal Code', 'text', false, customer ? (customer.postal_code || '') : '', '90001') +
            '</div>' +
            '<div class="grid grid-cols-2 gap-4">' +
            '<div><label class="block text-sm font-medium text-gray-700 mb-1">Source</label>' +
            '<select id="custForm_source" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
            _custOpt('website', 'Website', customer) + _custOpt('referral', 'Referral', customer) + _custOpt('partner', 'Partner', customer) +
            _custOpt('exhibition', 'Exhibition', customer) + _custOpt('social_media', 'Social Media', customer) +
            _custOpt('phone', 'Phone', customer) + _custOpt('walk_in', 'Walk-in', customer) + _custOpt('other', 'Other', customer) +
            '</select></div>' +
            '<div><label class="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>' +
            '<select id="custForm_customer_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">' +
            _custTypeOpt('standard', 'Standard', customer) + _custTypeOpt('vip', 'VIP', customer) + _custTypeOpt('enterprise', 'Enterprise', customer) +
            '</select></div>' +
            '</div>' +
            '<div><label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>' +
            '<textarea id="custForm_notes" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" rows="3" placeholder="Add notes...">' + (customer && customer.notes ? customer.notes : '') + '</textarea></div>' +
            '</div>' +
            '<div class="flex items-center justify-between p-5 border-t border-gray-200">' +
            (isEdit ? '<button onclick="Nestopia.modules.customers.confirmDeleteCustomer()" class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"><i class="fas fa-trash-alt mr-1"></i>Delete</button>' : '<div></div>') +
            '<div class="flex gap-3">' +
            '<button onclick="Nestopia.modules.customers.closeCustomerModal()" class="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition">Cancel</button>' +
            '<button onclick="Nestopia.modules.customers.submitCustomerForm()" class="px-6 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"><i class="fas fa-save mr-1"></i>Save</button>' +
            '</div></div></div>';
        overlay.dataset.editId = cid;
        document.body.appendChild(overlay);
        setTimeout(function() { var f = document.getElementById('custForm_name'); if (f) f.focus(); }, 100);
    }

    function _custField(id, label, type, required, value, placeholder) {
        return '<div><label class="block text-sm font-medium text-gray-700 mb-1">' + label + (required ? ' <span class="text-red-500">*</span>' : '') + '</label>' +
            '<input type="' + type + '" id="' + id + '" value="' + String(value || '').replace(/"/g, '&quot;') + '" placeholder="' + placeholder + '" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"' + (required ? ' required' : '') + '></div>';
    }

    function _custOpt(val, label, customer) {
        return '<option value="' + val + '"' + (customer && customer.source === val ? ' selected' : '') + '>' + label + '</option>';
    }

    function _custTypeOpt(val, label, customer) {
        return '<option value="' + val + '"' + (customer && customer.customer_type === val ? ' selected' : '') + '>' + label + '</option>';
    }

    function closeCustomerModal() {
        var overlay = document.getElementById('customerModalOverlay');
        if (overlay) overlay.remove();
    }

    function submitCustomerForm() {
        var overlay = document.getElementById('customerModalOverlay');
        var existingId = overlay ? overlay.dataset.editId : '';
        var name = (document.getElementById('custForm_name').value || '').trim();
        var phone = (document.getElementById('custForm_phone').value || '').trim();
        if (!name) { showToast('Client Name is required', 'error'); return; }
        if (!phone) { showToast('Phone is required', 'error'); return; }
        var data = {
            name: name,
            email: (document.getElementById('custForm_email').value || '').trim(),
            phone: phone,
            company: (document.getElementById('custForm_company').value || '').trim(),
            address: (document.getElementById('custForm_address').value || '').trim(),
            city: (document.getElementById('custForm_city').value || '').trim(),
            province: (document.getElementById('custForm_province').value || '').trim(),
            postal_code: (document.getElementById('custForm_postal_code').value || '').trim(),
            source: document.getElementById('custForm_source').value,
            customer_type: document.getElementById('custForm_customer_type').value,
            notes: (document.getElementById('custForm_notes').value || '').trim()
        };
        if (existingId) data.id = existingId;
        saveCustomerToDB(data).then(function(saved) {
            if (saved) {
                closeCustomerModal();
                customersState.selectedCustomer = saved.id || existingId;
                loadCustomersFromDB();
            }
        });
    }

    function confirmDeleteCustomer() {
        var overlay = document.getElementById('customerModalOverlay');
        var cid = overlay ? overlay.dataset.editId : '';
        if (!cid) return;
        if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) return;
        deleteCustomerFromDB(cid).then(function(ok) {
            if (ok) {
                closeCustomerModal();
                customersState.selectedCustomer = null;
                loadCustomersFromDB();
            }
        });
    }

    function initCustomersPage() {
        var listEl = document.getElementById('customerList');
        if (listEl) listEl.innerHTML = '<div class="p-6 text-center text-gray-400"><i class="fas fa-spinner fa-spin mr-2"></i>Loading customers...</div>';
        if (!customersState.loaded) {
            loadCustomersFromDB();
        } else {
            renderCustomerListHTML();
            updateCustomerStats();
            if (customersState.selectedCustomer) updateCustomerDetail(customersState.selectedCustomer);
        }
        document.querySelectorAll('.customer-filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.customer-filter-btn').forEach(function(b) {
                    b.classList.remove('bg-gray-900', 'text-white');
                    b.classList.add('bg-white', 'border', 'text-gray-600');
                });
                this.classList.remove('bg-white', 'border', 'text-gray-600');
                this.classList.add('bg-gray-900', 'text-white');
                filterCustomers(this.dataset.filter);
            });
        });
        var searchInput = document.getElementById('customerSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function() { searchCustomers(this.value); });
        }
        var addBtn = document.getElementById('addCustomerBtn');
        if (addBtn) {
            addBtn.addEventListener('click', function() { openCustomerModal(); });
        }
        var editBtn = document.getElementById('editCustomerBtn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                if (customersState.selectedCustomer) openCustomerModal(customersState.selectedCustomer);
            });
        }
    }

    function syncA1ToProject(projectId, intakeData) {
        var name = intakeData.a1_client_name || '';
        var email = intakeData.a1_email || '';
        var phone = intakeData.a1_phone || '';
        var addrParts = [];
        if (intakeData.a1_address_street) addrParts.push(intakeData.a1_address_street);
        if (intakeData.a1_address_city) addrParts.push(intakeData.a1_address_city);
        if (intakeData.a1_address_state) addrParts.push(intakeData.a1_address_state);
        if (intakeData.a1_address_zip) addrParts.push(intakeData.a1_address_zip);
        var address = addrParts.join(', ');
        if (!name) return;
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        if (project) {
            project.customer = name;
            project.customerEmail = email;
            project.customerPhone = phone;
            project.customerAddress = address;
            if (currentDetailProject && currentDetailProject.id === projectId) {
                renderProjectCustomer(project);
                var metaEl = document.getElementById('projDetailMeta');
                if (metaEl) metaEl.textContent = name + ' \u00b7 ' + project.type + ' \u00b7 Started ' + project.startDate + ' \u00b7 Budget $' + project.budget.toLocaleString();
            }
            renderSidebarProjects();
        }
        if (typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            var custPayload = {
                tenant_id: NestopiaDB.getTenantId(),
                name: name,
                email: email || null,
                phone: phone || null,
                address: intakeData.a1_address_street || null,
                city: intakeData.a1_address_city || null,
                province: intakeData.a1_address_state || null,
                postal_code: intakeData.a1_address_zip || null,
                updated_at: new Date().toISOString()
            };
            var query = NestopiaDB.getClient().from('customers').select('id')
                .eq('tenant_id', NestopiaDB.getTenantId()).eq('is_deleted', false);
            if (email) {
                query = query.eq('email', email);
            } else {
                query = query.eq('name', name);
            }
            query.maybeSingle().then(function(res) {
                if (res.data && res.data.id) {
                    NestopiaDB.getClient().from('customers')
                        .update(custPayload).eq('id', res.data.id)
                        .then(function(r) { if (!r.error) console.log('[A.1 Sync] Customer updated:', name); });
                } else {
                    custPayload.customer_number = 'CUS-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.random().toString(16).slice(2,8);
                    custPayload.source = 'website';
                    custPayload.customer_type = 'standard';
                    custPayload.status = 'active';
                    NestopiaDB.getClient().from('customers')
                        .insert(custPayload)
                        .then(function(r) { if (!r.error) console.log('[A.1 Sync] Customer created:', name); });
                }
            });
            if (customersState.loaded) {
                setTimeout(function() { loadCustomersFromDB(); }, 500);
            }
        }
    }

    // -- Page-load: sync A.1 intake data from Supabase to project objects --
    function syncAllA1OnLoad() {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return;
        var pending = allProjectsData.length;
        var anyUpdated = false;
        allProjectsData.forEach(function(project) {
            NestopiaDB.getClient()
                .from('project_intake_data')
                .select('form_data')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .eq('project_key', project.id)
                .maybeSingle()
                .then(function(res) {
                    if (res.data && res.data.form_data) {
                        var fd = res.data.form_data;
                        if (fd.a1_client_name) {
                            project.customer = fd.a1_client_name;
                            if (fd.a1_email) project.customerEmail = fd.a1_email;
                            if (fd.a1_phone) project.customerPhone = fd.a1_phone;
                            var addrParts = [];
                            if (fd.a1_address_street) addrParts.push(fd.a1_address_street);
                            if (fd.a1_address_city) addrParts.push(fd.a1_address_city);
                            if (fd.a1_address_state) addrParts.push(fd.a1_address_state);
                            if (fd.a1_address_zip) addrParts.push(fd.a1_address_zip);
                            if (addrParts.length > 0) project.customerAddress = addrParts.join(', ');
                            anyUpdated = true;
                            if (currentDetailProject && currentDetailProject.id === project.id) {
                                renderProjectCustomer(project);
                                var metaEl = document.getElementById('projDetailMeta');
                                if (metaEl) metaEl.textContent = project.customer + ' \u00b7 ' + project.type + ' \u00b7 Started ' + project.startDate + ' \u00b7 Budget $' + project.budget.toLocaleString();
                            }
                            console.log('[A.1 Sync] Page-load sync for', project.id, '->', project.customer);
                        }
                        // Merge into intakeFormData so form shows latest data
                        var localData = getIntakeData(project.id);
                        Object.keys(fd).forEach(function(k) {
                            localData[k] = fd[k];
                        });
                    }
                    pending--;
                    if (pending === 0 && anyUpdated) {
                        renderSidebarProjects();
                    }
                })
                .catch(function() { pending--; });
        });
    }

    // ===== Register on namespace =====
    N.modules.customers = {
        customersState: customersState,
        loadCustomersFromDB: loadCustomersFromDB,
        saveCustomerToDB: saveCustomerToDB,
        deleteCustomerFromDB: deleteCustomerFromDB,
        renderCustomerListHTML: renderCustomerListHTML,
        selectCustomerItem: selectCustomerItem,
        updateCustomerStats: updateCustomerStats,
        updateCustomerDetail: updateCustomerDetail,
        filterCustomers: filterCustomers,
        searchCustomers: searchCustomers,
        openCustomerModal: openCustomerModal,
        closeCustomerModal: closeCustomerModal,
        submitCustomerForm: submitCustomerForm,
        confirmDeleteCustomer: confirmDeleteCustomer,
        initCustomersPage: initCustomersPage,
        syncA1ToProject: syncA1ToProject,
        syncAllA1OnLoad: syncAllA1OnLoad
    };

    // ===== Global aliases (backward compat) =====
    window.customersState = customersState;
    window.loadCustomersFromDB = loadCustomersFromDB;
    window.saveCustomerToDB = saveCustomerToDB;
    window.deleteCustomerFromDB = deleteCustomerFromDB;
    window.renderCustomerListHTML = renderCustomerListHTML;
    window.selectCustomerItem = selectCustomerItem;
    window.updateCustomerStats = updateCustomerStats;
    window.updateCustomerDetail = updateCustomerDetail;
    window.filterCustomers = filterCustomers;
    window.searchCustomers = searchCustomers;
    window.openCustomerModal = openCustomerModal;
    window.closeCustomerModal = closeCustomerModal;
    window.submitCustomerForm = submitCustomerForm;
    window.confirmDeleteCustomer = confirmDeleteCustomer;
    window.initCustomersPage = initCustomersPage;
    window.syncA1ToProject = syncA1ToProject;
    window.syncAllA1OnLoad = syncAllA1OnLoad;

    // ===== Requested alternate aliases =====
    window.showCustomerDetail = updateCustomerDetail;
    window.renderCustomersGrid = renderCustomerListHTML;
    window.renderCustomerDetail = updateCustomerDetail;
    window.refreshCustomersList = loadCustomersFromDB;
    window.createCustomerFromIntake = syncA1ToProject;
    window.seedCustomersFromDB = loadCustomersFromDB;
})();
