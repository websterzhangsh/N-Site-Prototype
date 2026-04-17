#!/usr/bin/env python3
"""
Two fixes:
1. Width/Height fields: enforce positive real number (正实数) — add min/step + validation
2. Greenscape multi-slug tenant filter — treat default/partner1/partner2 as equivalent
"""

import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ─────────────────────────────────────────────────────────────
# Fix 1a: Add min: 0.01, step: 'any' to width_in field def
# ─────────────────────────────────────────────────────────────
old_width = "{ key: 'width_in', label: 'Width (inches)', type: 'number', icon: 'fa-arrows-alt-h', placeholder: 'e.g. 72', perOpening: true }"
new_width = "{ key: 'width_in', label: 'Width (inches)', type: 'number', icon: 'fa-arrows-alt-h', placeholder: 'e.g. 72', perOpening: true, min: 0.01, step: 'any' }"

count = content.count(old_width)
if count != 1:
    print(f"ERROR: width_in field def found {count} times, expected 1")
    sys.exit(1)
content = content.replace(old_width, new_width)
print("✓ Fix 1a: Added min/step to width_in field definition")

# ─────────────────────────────────────────────────────────────
# Fix 1b: Add min: 0.01, step: 'any' to height_in field def
# ─────────────────────────────────────────────────────────────
old_height = "{ key: 'height_in', label: 'Height (inches)', type: 'number', icon: 'fa-arrows-alt-v', placeholder: 'e.g. 96', perOpening: true }"
new_height = "{ key: 'height_in', label: 'Height (inches)', type: 'number', icon: 'fa-arrows-alt-v', placeholder: 'e.g. 96', perOpening: true, min: 0.01, step: 'any' }"

count = content.count(old_height)
if count != 1:
    print(f"ERROR: height_in field def found {count} times, expected 1")
    sys.exit(1)
content = content.replace(old_height, new_height)
print("✓ Fix 1b: Added min/step to height_in field definition")

# ─────────────────────────────────────────────────────────────
# Fix 1c: Add positive-number validation in updateStep3Field
# ─────────────────────────────────────────────────────────────
old_update = """        function updateStep3Field(projectId, key, value) {
            var state = getStep3State(projectId);
            if (key.startsWith('_appt')) {"""

new_update = """        function updateStep3Field(projectId, key, value) {
            // Validate positive real number for width/height fields
            if ((key.indexOf('width_in') >= 0 || key.indexOf('height_in') >= 0) && value !== '') {
                var num = parseFloat(value);
                if (isNaN(num) || num <= 0) {
                    var inp = document.getElementById('step3_' + key + '_' + projectId);
                    if (inp) { inp.value = ''; }
                    return;
                }
            }
            var state = getStep3State(projectId);
            if (key.startsWith('_appt')) {"""

count = content.count(old_update)
if count != 1:
    print(f"ERROR: updateStep3Field found {count} times, expected 1")
    sys.exit(1)
content = content.replace(old_update, new_update)
print("✓ Fix 1c: Added positive-number validation in updateStep3Field")

# ─────────────────────────────────────────────────────────────
# Fix 2: Greenscape multi-slug tenant filter
# ─────────────────────────────────────────────────────────────
old_filter = """                    rows = rows.filter(function(row) {
                        var cfg = row.product_config || {};
                        // Strict tenant isolation: only show projects tagged for this tenant
                        if (!cfg.tenant_slug) return false;
                        return cfg.tenant_slug === currentSlug;
                    });"""

new_filter = """                    rows = rows.filter(function(row) {
                        var cfg = row.product_config || {};
                        // Strict tenant isolation: only show projects tagged for this tenant
                        if (!cfg.tenant_slug) return false;
                        // Greenscape family: default/partner1/partner2 are equivalent sub-tenants
                        var greenscapeSlugs = ['default', 'partner1', 'partner2'];
                        if (greenscapeSlugs.indexOf(currentSlug) >= 0) {
                            return greenscapeSlugs.indexOf(cfg.tenant_slug) >= 0;
                        }
                        return cfg.tenant_slug === currentSlug;
                    });"""

count = content.count(old_filter)
if count != 1:
    print(f"ERROR: tenant filter found {count} times, expected 1")
    sys.exit(1)
content = content.replace(old_filter, new_filter)
print("✓ Fix 2: Greenscape multi-slug family filter applied")

# ─────────────────────────────────────────────────────────────
# Write back
# ─────────────────────────────────────────────────────────────
if content == original:
    print("WARNING: No changes made!")
    sys.exit(1)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nAll fixes applied. File saved ({len(content)} chars)")
