#!/usr/bin/env python3
"""Fix: Quotation system shows 'Zip Blinds Quotation' for all project types.
Add multi-product-type support (Sunroom, Pergola, Zip Blinds).
"""
import re, sys, os

FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'company-operations.html')

with open(FILE, 'r', encoding='utf-8') as fh:
    content = fh.read()

original_lines = content.count('\n') + 1
print(f"Original: {original_lines} lines")

changes_count = 0

def replace_one(content, old, new, desc):
    global changes_count
    cnt = content.count(old)
    if cnt == 0:
        print(f"  ERROR: '{desc}' - pattern not found!")
        sys.exit(1)
    if cnt > 1:
        print(f"  WARNING: '{desc}' - found {cnt} times, replacing first only")
    content = content.replace(old, new, 1)
    changes_count += 1
    print(f"  ✓ {changes_count}. {desc}")
    return content

def replace_all_occurrences(content, old, new, desc):
    global changes_count
    cnt = content.count(old)
    if cnt == 0:
        print(f"  ERROR: '{desc}' - pattern not found!")
        sys.exit(1)
    content = content.replace(old, new)
    changes_count += 1
    print(f"  ✓ {changes_count}. {desc} ({cnt} occurrences)")
    return content

print("\n--- Adding multi-product-type quotation support ---\n")

# =====================================================================
# 1. Add Sunroom/Pergola product catalogs + helper functions
# =====================================================================
OLD_1 = "Installation Fee', spec: '', defaultPrice: 0 }\n        ];\n\n        function openQuotationEditor(projectId) {"

NEW_1 = """Installation Fee', spec: '', defaultPrice: 0 }
        ];

        // ===== Multi-Product-Type Quotation Support =====
        var sunroomPriceLookup = {
            'Screen Room / 纱窗阳光房': { defaultPrice: 1500, model: 'SR-SCREEN' },
            '3-Season Sunroom / 三季阳光房': { defaultPrice: 2500, model: 'SR-3S' },
            '4-Season Sunroom / 四季阳光房 (Low-E)': { defaultPrice: 3800, model: 'SR-4S' },
            '4-Season Sunroom / 四季阳光房 (Insulated)': { defaultPrice: 4500, model: 'SR-4S-INS' }
        };
        var sunroomProductNames = Object.keys(sunroomPriceLookup);
        var sunroomAccessoryPresets = [
            { name: 'Roof System / 屋顶系统', spec: '', defaultPrice: 0 },
            { name: 'Foundation / 地基基础', spec: '', defaultPrice: 0 },
            { name: 'Electrical / 电气布线', spec: '', defaultPrice: 0 },
            { name: 'HVAC System / 暖通空调', spec: '', defaultPrice: 0 },
            { name: 'Installation Fee / 安装费', spec: '', defaultPrice: 0 }
        ];

        var pergolaPriceLookup = {
            'Motorized Louvered Pergola / 电动百叶凉亭': { defaultPrice: 2200, model: 'PG-LOUVER' },
            'Fixed Pergola / 固定凉亭': { defaultPrice: 1200, model: 'PG-FIXED' },
            'Retractable Pergola / 可伸缩凉亭': { defaultPrice: 1800, model: 'PG-RETRACT' }
        };
        var pergolaProductNames = Object.keys(pergolaPriceLookup);
        var pergolaAccessoryPresets = [
            { name: 'LED Lighting / LED灯光系统', spec: '', defaultPrice: 0 },
            { name: 'Rain Sensor / 雨量传感器', spec: '', defaultPrice: 0 },
            { name: 'Side Screens / 侧面纱网', spec: '', defaultPrice: 0 },
            { name: 'Installation Fee / 安装费', spec: '', defaultPrice: 0 }
        ];

        var quotProductType = 'zipblinds';

        function getQuotProductNames() {
            if (quotProductType === 'sunroom') return sunroomProductNames;
            if (quotProductType === 'pergola') return pergolaProductNames;
            return zbProductNames;
        }
        function getQuotPriceLookup() {
            if (quotProductType === 'sunroom') return sunroomPriceLookup;
            if (quotProductType === 'pergola') return pergolaPriceLookup;
            return zbPriceLookup;
        }
        function getQuotAccessoryPresets() {
            if (quotProductType === 'sunroom') return sunroomAccessoryPresets;
            if (quotProductType === 'pergola') return pergolaAccessoryPresets;
            return zbAccessoryPresets;
        }
        function getQuotTypeTitle(lang) {
            if (quotProductType === 'sunroom') return lang === 'en' ? 'Sunroom Quotation' : '阳光房报价单 / Sunroom Quotation';
            if (quotProductType === 'pergola') return lang === 'en' ? 'Pergola Quotation' : '凉亭报价单 / Pergola Quotation';
            return lang === 'en' ? 'Zip Blinds Quotation' : '防风卷帘报价单 / Zip Blinds Quotation';
        }

        function openQuotationEditor(projectId) {"""

content = replace_one(content, OLD_1, NEW_1, "Add product catalogs + helper functions")

# =====================================================================
# 2. Add product type detection in openQuotationEditor
# =====================================================================
OLD_2 = "if (!project) return;\n\n            // Apply i18n labels based on tenant language\n            applyQuotI18nLabels();"

NEW_2 = """if (!project) return;

            // Detect product type from project
            var ptype = (project.type || '').toLowerCase();
            if (ptype.indexOf('sunroom') >= 0 || ptype.indexOf('sun room') >= 0) {
                quotProductType = 'sunroom';
            } else if (ptype.indexOf('pergola') >= 0) {
                quotProductType = 'pergola';
            } else {
                quotProductType = 'zipblinds';
            }

            // Apply i18n labels based on tenant language
            applyQuotI18nLabels();
            // Override title with product-type-specific text
            document.getElementById('quotModalTitleText').textContent = getQuotTypeTitle(getTenantLanguage());"""

content = replace_one(content, OLD_2, NEW_2, "Add type detection + dynamic title")

# =====================================================================
# 3. Insert material defaults override before quotRemarks
# =====================================================================
OLD_3 = "            document.getElementById('quotRemarks').value = getQuotText('defaultRemarks');"

NEW_3 = """            // Override material labels/defaults for non-Zip-Blinds products
            if (quotProductType === 'sunroom') {
                document.getElementById('quotLabelProfileColor').textContent = lang === 'en' ? 'Frame Color' : '框架颜色 / Frame Color';
                document.getElementById('quotLabelFabric').textContent = lang === 'en' ? 'Glass Type' : '玻璃类型 / Glass Type';
                document.getElementById('quotProfileColor').value = lang === 'en' ? 'White' : '白色 / White';
                document.getElementById('quotFabric').value = lang === 'en' ? 'Tempered Low-E Glass' : '钢化Low-E玻璃 / Tempered Low-E';
                document.getElementById('quotFabricColor').placeholder = 'e.g. Clear, Tinted, Reflective';
            } else if (quotProductType === 'pergola') {
                document.getElementById('quotLabelProfileColor').textContent = lang === 'en' ? 'Frame Color' : '框架颜色 / Frame Color';
                document.getElementById('quotLabelFabric').textContent = lang === 'en' ? 'Louver Material' : '百叶材质 / Louver Material';
                document.getElementById('quotProfileColor').value = lang === 'en' ? 'Dark Gray' : '深灰色 / Dark Gray';
                document.getElementById('quotFabric').value = lang === 'en' ? 'Aluminum Alloy' : '铝合金 / Aluminum Alloy';
                document.getElementById('quotFabricColor').placeholder = 'e.g. RAL7016';
            }
            document.getElementById('quotRemarks').value = getQuotText('defaultRemarks');"""

content = replace_one(content, OLD_3, NEW_3, "Add material labels/defaults override for Sunroom/Pergola")

# =====================================================================
# 4 & 5. Replace line items initialization (2 occurrences)
# =====================================================================
content = replace_all_occurrences(content,
    "{ product: zbProductNames[0], width: 3000, height: 2500, unitPrice: zbPriceLookup[zbProductNames[0]].defaultPrice, qty: 1 }",
    "{ product: getQuotProductNames()[0], width: 3000, height: 2500, unitPrice: getQuotPriceLookup()[getQuotProductNames()[0]].defaultPrice, qty: 1 }",
    "Dynamic product in line item init"
)

# =====================================================================
# 6. addQuotAccessory - use dynamic preset
# =====================================================================
content = replace_one(content,
    "var preset = zbAccessoryPresets[0];",
    "var preset = getQuotAccessoryPresets()[0];",
    "Dynamic preset in addQuotAccessory"
)

# =====================================================================
# 7. renderQuotLineItems - product options dropdown
# =====================================================================
content = replace_one(content,
    "var optionsHtml = zbProductNames.map(function(n)",
    "var optionsHtml = getQuotProductNames().map(function(n)",
    "Dynamic product names in renderQuotLineItems"
)

# =====================================================================
# 8. renderQuotLineItems - inline onchange price lookup
# =====================================================================
content = replace_one(content,
    "var lk=zbPriceLookup[this.value]",
    "var lk=getQuotPriceLookup()[this.value]",
    "Dynamic price lookup in line item onchange"
)

# =====================================================================
# 9. renderQuotAccessories - preset options dropdown
# =====================================================================
content = replace_one(content,
    "var presetOpts = zbAccessoryPresets.map(function(p)",
    "var presetOpts = getQuotAccessoryPresets().map(function(p)",
    "Dynamic preset names in renderQuotAccessories"
)

# =====================================================================
# 10. renderQuotAccessories - inline onchange preset lookup
# =====================================================================
content = replace_one(content,
    "pr=zbAccessoryPresets.find(function(p)",
    "pr=getQuotAccessoryPresets().find(function(p)",
    "Dynamic preset lookup in accessory onchange"
)

# =====================================================================
# 11. Print preview - dynamic document <title>
# =====================================================================
m = re.search(r"<title>Zip Blinds Quotation / .+? - ' \+ client", content)
if not m:
    print("  ERROR: Print title pattern not found!")
    sys.exit(1)
content = content[:m.start()] + "<title>' + getQuotTypeTitle('bilingual') + ' - ' + client" + content[m.end():]
changes_count += 1
print(f"  ✓ {changes_count}. Dynamic print document title")

# =====================================================================
# 12. Print preview - dynamic header subtitle
# =====================================================================
m = re.search(r'header-subtitle">Zip Blinds Quotation / .+?</div>', content)
if not m:
    print("  ERROR: Print subtitle pattern not found!")
    sys.exit(1)
new_sub = 'header-subtitle">\' + getQuotTypeTitle(\'bilingual\') + \'</div>'
content = content[:m.start()] + new_sub + content[m.end():]
changes_count += 1
print(f"  ✓ {changes_count}. Dynamic print header subtitle")

# =====================================================================
# Validation
# =====================================================================
final_lines = content.count('\n') + 1
print(f"\nFinal: {final_lines} lines (added {final_lines - original_lines})")

# Safety checks
assert '</html>' in content, "FATAL: </html> closing tag missing!"
assert 'function openQuotationEditor' in content, "FATAL: openQuotationEditor function missing!"
assert 'getQuotProductNames' in content, "FATAL: getQuotProductNames function missing!"
assert 'quotProductType' in content, "FATAL: quotProductType variable missing!"
assert 'sunroomPriceLookup' in content, "FATAL: sunroomPriceLookup missing!"
assert 'pergolaPriceLookup' in content, "FATAL: pergolaPriceLookup missing!"

# Verify no remaining hardcoded zbProductNames/zbPriceLookup in function code
# (should only appear in definitions now)
remaining = content.count('zbProductNames')
if remaining != 2:  # var declaration + Object.keys() assignment
    print(f"  WARNING: zbProductNames still appears {remaining} times (expected 2 definitions)")
remaining = content.count('zbPriceLookup')
if remaining != 2:  # var declaration + Object.keys() reference
    print(f"  WARNING: zbPriceLookup still appears {remaining} times (expected 2 definitions)")
remaining = content.count('zbAccessoryPresets')
if remaining != 1:  # var declaration only
    print(f"  WARNING: zbAccessoryPresets still appears {remaining} times (expected 1 definition)")

# Write
with open(FILE, 'w', encoding='utf-8') as fh:
    fh.write(content)

print(f"\n✅ All {changes_count} changes applied successfully!")
