#!/usr/bin/env python3
"""wire_customer_crud.py
Mod 1: Add customer stats HTML IDs
Mod 2: Replace Customer JS with Supabase CRUD
Mod 3: Add A.1 sync call in saveIntakeModule
"""
import sys, os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
HTML_FILE = os.path.join(SCRIPT_DIR, '..', 'company-operations.html')
JS_BLOCK_FILE = os.path.join(SCRIPT_DIR, '_customer_js_block.txt')


def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    original_len = len(content)

    # Read replacement JS block
    with open(JS_BLOCK_FILE, 'r', encoding='utf-8') as f:
        new_js = f.read()

    # ===== Mod 1: Add customer stats HTML IDs =====
    print('Mod 1 -- Add customer stats HTML IDs ...')

    mods_1 = [
        ('1a', 'Total Customers</div>\n                                    <div class="text-2xl font-bold text-gray-900">482</div>',
               'Total Customers</div>\n                                    <div id="custStatTotal" class="text-2xl font-bold text-gray-900">--</div>'),
        ('1b', '<div class="text-sm text-gray-500">Active</div>\n                                    <div class="text-2xl font-bold text-green-600">324</div>',
               '<div class="text-sm text-gray-500">Active</div>\n                                    <div id="custStatActive" class="text-2xl font-bold text-green-600">--</div>'),
        ('1c', 'New This Month</div>\n                                    <div class="text-2xl font-bold text-purple-600">28</div>',
               'New This Month</div>\n                                    <div id="custStatNew" class="text-2xl font-bold text-purple-600">--</div>'),
        ('1d', 'Repeat Customers</div>\n                                    <div class="text-2xl font-bold text-amber-600">156</div>',
               'Repeat Customers</div>\n                                    <div id="custStatRepeat" class="text-2xl font-bold text-amber-600">--</div>'),
        ('1e', '<span class="text-xs text-gray-500">482 total</span>',
               '<span id="custListTotal" class="text-xs text-gray-500">-- total</span>'),
    ]
    for label, old, new in mods_1:
        if old not in content:
            print(f'  X {label}: target not found')
            return 1
        content = content.replace(old, new, 1)
        print(f'  OK {label}')

    # ===== Mod 2: Replace Customer JS block =====
    print('Mod 2 -- Replace Customer JS with Supabase CRUD ...')

    start_marker = '        // ===== Customers Page Functions ====='
    end_marker = '        // ===== Knowledge Base Functions ====='
    start_idx = content.find(start_marker)
    end_idx = content.find(end_marker)
    if start_idx == -1:
        print('  X Start marker not found')
        return 1
    if end_idx == -1:
        print('  X End marker not found')
        return 1
    content = content[:start_idx] + new_js + content[end_idx:]
    print('  OK Mod 2: Customer JS replaced')

    # ===== Mod 3: Add A.1 sync in saveIntakeModule =====
    print('Mod 3 -- Add A.1 sync in saveIntakeModule ...')

    old3 = """            // \u540c\u6b65\u5230 Supabase
            saveIntakeToDB(projectId, data);

            // Re-render step detail if open"""
    new3 = """            // \u540c\u6b65\u5230 Supabase
            saveIntakeToDB(projectId, data);

            // A.1 Customer Basics: sync to project card & Supabase customers
            if (moduleKey === 'A.1') {
                syncA1ToProject(projectId, data);
            }

            // Re-render step detail if open"""
    if old3 not in content:
        print('  X Mod 3: target not found')
        return 1
    content = content.replace(old3, new3, 1)
    print('  OK Mod 3: A.1 sync added')

    # Write back
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'\nDone! {original_len} -> {len(content)} chars (delta: {len(content) - original_len:+d})')
    return 0


if __name__ == '__main__':
    sys.exit(main())
