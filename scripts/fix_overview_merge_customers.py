#!/usr/bin/env python3
"""Fix: Merge project customers into Overview customers table.

Problem: Overview only shows Supabase customers table records (3), 
missing project customers like Larry Zhang who aren't in the DB yet.

Fix: After building displayData from Supabase, also add unique customers 
from allProjectsData that aren't already in the list.
"""
import sys, os

HTML_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'company-operations.html')

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = len(content)

    # Replace the displayData building block to include project customer merge
    old = """            if (customersState.loaded && customersState.data.length > 0) {
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
            }"""

    new = """            if (customersState.loaded && customersState.data.length > 0) {
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
            }"""

    if old not in content:
        print("[FATAL] Could not find displayData block in renderOverviewCustomers")
        sys.exit(1)
    content = content.replace(old, new)
    print("[Mod 1] Added project customer merge to renderOverviewCustomers()")

    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    delta = len(content) - orig
    print(f"\nDone. Delta: {delta:+d} chars ({len(content):,} total)")

if __name__ == '__main__':
    main()
