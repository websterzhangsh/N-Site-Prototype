#!/usr/bin/env python3
"""Fix Company Overview Customers table to use Supabase/synced data instead of hardcoded data.

Problem: renderOverviewCustomers() uses a static hardcoded overviewCustomersData array.
Fix:
  Mod 1: Replace renderOverviewCustomers() to prefer customersState.data (Supabase).
  Mod 2: After loadCustomersFromDB() completes, trigger overview customers refresh.
  Mod 3: Update overview customer stats card to be dynamic (ID it for JS updates).
"""
import sys, os

HTML_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'company-operations.html')

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = len(content)

    # === Mod 1: Replace renderOverviewCustomers() ===
    old_func = """        function renderOverviewCustomers() {
            const tbody = document.getElementById('overviewCustomersBody');
            if (!tbody || tbody.children.length > 0) return;
            tbody.innerHTML = overviewCustomersData.map(c => `
                <tr class="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td class="py-3 px-5"><div class="flex items-center gap-2.5"><div class="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold">${c.avatar}</div><span class="text-sm font-medium text-gray-900">${c.name}</span></div></td>
                    <td class="py-3 px-5 text-sm text-gray-600">${c.email}</td>
                    <td class="py-3 px-5 text-sm text-gray-600">${c.location}</td>
                    <td class="py-3 px-5 text-sm font-medium text-gray-900">${c.projects}</td>
                    <td class="py-3 px-5 text-sm font-semibold text-gray-900">${c.spent}</td>
                    <td class="py-3 px-5"><span class="px-2.5 py-0.5 ${c.status === 'VIP' ? 'bg-amber-50 text-amber-700' : c.status === 'New' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'} text-xs font-medium rounded-full">${c.status}</span></td>
                </tr>
            `).join('');
        }"""

    new_func = """        function renderOverviewCustomers() {
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
        }"""

    if old_func not in content:
        print("[FATAL] Mod 1: renderOverviewCustomers() not found")
        sys.exit(1)
    content = content.replace(old_func, new_func)
    print("[Mod 1] Replaced renderOverviewCustomers() with Supabase-aware version + stats updater")

    # === Mod 2: Trigger overview refresh after loadCustomersFromDB ===
    # After Supabase success path (line ~8315): renderCustomerListHTML(); updateCustomerStats();
    old2 = """                    customersState.loaded = true;
                    renderCustomerListHTML();
                    updateCustomerStats();"""
    new2 = """                    customersState.loaded = true;
                    renderCustomerListHTML();
                    updateCustomerStats();
                    renderOverviewCustomers();"""
    if old2 not in content:
        print("[FATAL] Mod 2: loadCustomersFromDB success path not found")
        sys.exit(1)
    content = content.replace(old2, new2, 1)
    print("[Mod 2] Added renderOverviewCustomers() call after Supabase load")

    # Also after fallback path
    old2b = """                console.warn('[Customers] Supabase not connected, using fallback');
                customersState.data = _getCustomerFallbackData();
                customersState.loaded = true;
                renderCustomerListHTML();
                updateCustomerStats();"""
    new2b = """                console.warn('[Customers] Supabase not connected, using fallback');
                customersState.data = _getCustomerFallbackData();
                customersState.loaded = true;
                renderCustomerListHTML();
                updateCustomerStats();
                renderOverviewCustomers();"""
    if old2b not in content:
        print("[WARN] Mod 2b: Fallback path not found")
    else:
        content = content.replace(old2b, new2b, 1)
        print("[Mod 2b] Added renderOverviewCustomers() call after fallback load")

    # Also after catch path
    old2c = """                    customersState.data = _getCustomerFallbackData();
                    customersState.loaded = true;
                    renderCustomerListHTML();
                    updateCustomerStats();
                });"""
    new2c = """                    customersState.data = _getCustomerFallbackData();
                    customersState.loaded = true;
                    renderCustomerListHTML();
                    updateCustomerStats();
                    renderOverviewCustomers();
                });"""
    if old2c not in content:
        print("[WARN] Mod 2c: Catch path not found")
    else:
        content = content.replace(old2c, new2c, 1)
        print("[Mod 2c] Added renderOverviewCustomers() call after error fallback")

    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    delta = len(content) - orig
    print(f"\nAll mods applied. Delta: {delta:+d} chars ({len(content):,} total)")

if __name__ == '__main__':
    main()
