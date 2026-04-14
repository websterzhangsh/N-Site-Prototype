#!/usr/bin/env python3
"""
Step 1: Product Cost vs Price — 数据模型重构
- 将 12 个产品的 `pricing:` 重命名为 `cost:`
- 为每个产品添加 `price:` 字段（零售/批发价）
- 更新所有 `p.pricing` → `p.cost` 引用
"""

import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ============================================================
# Part A: 重命名 12 个产品定义中的 pricing: → cost:
# ============================================================
# 每个产品的 pricing 块开头都是：
#   pricing: {
#       unit: 'sqft', currency: 'USD',
# 我们只替换产品定义中的（行 7191-7435 范围内的），不碰其他 pricing 引用

product_pricing_blocks = [
    # sr-l-classic (line ~7191)
    ("extras: [], optionSet: 'sunroom', noteSet: 'sunroom',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [26, 30] },\n                        { span: '≤5m', priceRange: [28, 32] },\n                        { span: '≤6m', priceRange: [30, 35] },\n                        { span: '≤7m', priceRange: [33, 38] },\n                        { span: '>7m',  priceRange: [36, 42] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                }\n            },",
     "extras: [], optionSet: 'sunroom', noteSet: 'sunroom',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [26, 30] },\n                        { span: '≤5m', priceRange: [28, 32] },\n                        { span: '≤6m', priceRange: [30, 35] },\n                        { span: '≤7m', priceRange: [33, 38] },\n                        { span: '>7m',  priceRange: [36, 42] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', retail: [36, 42], wholesale: [30, 35] },\n                        { span: '≤5m', retail: [39, 45], wholesale: [32, 37] },\n                        { span: '≤6m', retail: [42, 49], wholesale: [35, 40] },\n                        { span: '≤7m', retail: [46, 53], wholesale: [38, 44] },\n                        { span: '>7m',  retail: [50, 59], wholesale: [41, 48] }\n                    ],\n                    note: 'Suggested selling price — installation, foundation, and permits not included.'\n                }\n            },"),

    # sr-l-smart (line ~7213)
    ("extras: ['Motor & drive control system'], optionSet: 'sunroom', noteSet: 'sunroom',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [32, 36] },\n                        { span: '≤5m', priceRange: [34, 39] },\n                        { span: '≤6m', priceRange: [36, 42] },\n                        { span: '≤7m', priceRange: [40, 46] },\n                        { span: '>7m',  priceRange: [44, 52] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                }\n            },\n            'sr-l-pro':",
     "extras: ['Motor & drive control system'], optionSet: 'sunroom', noteSet: 'sunroom',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [32, 36] },\n                        { span: '≤5m', priceRange: [34, 39] },\n                        { span: '≤6m', priceRange: [36, 42] },\n                        { span: '≤7m', priceRange: [40, 46] },\n                        { span: '>7m',  priceRange: [44, 52] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', retail: [45, 50], wholesale: [37, 41] },\n                        { span: '≤5m', retail: [48, 55], wholesale: [39, 45] },\n                        { span: '≤6m', retail: [50, 59], wholesale: [41, 48] },\n                        { span: '≤7m', retail: [56, 64], wholesale: [46, 53] },\n                        { span: '>7m',  retail: [62, 73], wholesale: [51, 60] }\n                    ],\n                    note: 'Suggested selling price — installation, foundation, and permits not included.'\n                }\n            },\n            'sr-l-pro':"),

    # sr-l-pro (line ~7235)
    ("extras: ['Solar power & energy storage system', '(Motor & drive control system)'], optionSet: 'sunroom', noteSet: 'sunroom',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [40, 46] },\n                        { span: '≤5m', priceRange: [43, 49] },\n                        { span: '≤6m', priceRange: [46, 53] },\n                        { span: '≤7m', priceRange: [50, 58] },\n                        { span: '>7m',  priceRange: [55, 65] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                }\n            },\n            'sr-m-classic':",
     "extras: ['Solar power & energy storage system', '(Motor & drive control system)'], optionSet: 'sunroom', noteSet: 'sunroom',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [40, 46] },\n                        { span: '≤5m', priceRange: [43, 49] },\n                        { span: '≤6m', priceRange: [46, 53] },\n                        { span: '≤7m', priceRange: [50, 58] },\n                        { span: '>7m',  priceRange: [55, 65] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', retail: [56, 64], wholesale: [46, 53] },\n                        { span: '≤5m', retail: [60, 69], wholesale: [49, 56] },\n                        { span: '≤6m', retail: [64, 74], wholesale: [53, 61] },\n                        { span: '≤7m', retail: [70, 81], wholesale: [58, 67] },\n                        { span: '>7m',  retail: [77, 91], wholesale: [63, 75] }\n                    ],\n                    note: 'Suggested selling price — installation, foundation, and permits not included.'\n                }\n            },\n            'sr-m-classic':"),

    # sr-m-classic (line ~7257)
    ("extras: [], optionSet: 'sunroom', noteSet: 'sunroom',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [27, 31] },\n                        { span: '≤5m', priceRange: [29, 34] },\n                        { span: '≤6m', priceRange: [31, 37] },\n                        { span: '≤7m', priceRange: [35, 40] },\n                        { span: '>7m',  priceRange: [38, 44] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                }\n            },\n            'sr-m-smart':",
     "extras: [], optionSet: 'sunroom', noteSet: 'sunroom',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [27, 31] },\n                        { span: '≤5m', priceRange: [29, 34] },\n                        { span: '≤6m', priceRange: [31, 37] },\n                        { span: '≤7m', priceRange: [35, 40] },\n                        { span: '>7m',  priceRange: [38, 44] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', retail: [38, 43], wholesale: [31, 36] },\n                        { span: '≤5m', retail: [41, 48], wholesale: [33, 39] },\n                        { span: '≤6m', retail: [43, 52], wholesale: [36, 43] },\n                        { span: '≤7m', retail: [49, 56], wholesale: [40, 46] },\n                        { span: '>7m',  retail: [53, 62], wholesale: [44, 51] }\n                    ],\n                    note: 'Suggested selling price — installation, foundation, and permits not included.'\n                }\n            },\n            'sr-m-smart':"),

    # sr-m-smart (line ~7279)
    ("extras: ['Motor & drive control system'], optionSet: 'sunroom', noteSet: 'sunroom',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [33, 38] },\n                        { span: '≤5m', priceRange: [36, 41] },\n                        { span: '≤6m', priceRange: [38, 44] },\n                        { span: '≤7m', priceRange: [42, 48] },\n                        { span: '>7m',  priceRange: [46, 54] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                }\n            },\n            'sr-m-pro':",
     "extras: ['Motor & drive control system'], optionSet: 'sunroom', noteSet: 'sunroom',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [33, 38] },\n                        { span: '≤5m', priceRange: [36, 41] },\n                        { span: '≤6m', priceRange: [38, 44] },\n                        { span: '≤7m', priceRange: [42, 48] },\n                        { span: '>7m',  priceRange: [46, 54] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', retail: [46, 53], wholesale: [38, 44] },\n                        { span: '≤5m', retail: [50, 57], wholesale: [41, 47] },\n                        { span: '≤6m', retail: [53, 62], wholesale: [44, 51] },\n                        { span: '≤7m', retail: [59, 67], wholesale: [48, 55] },\n                        { span: '>7m',  retail: [64, 76], wholesale: [53, 62] }\n                    ],\n                    note: 'Suggested selling price — installation, foundation, and permits not included.'\n                }\n            },\n            'sr-m-pro':"),

    # sr-m-pro (line ~7301)
    ("extras: ['Solar power & energy storage system', '(Motor & drive control system)'], optionSet: 'sunroom', noteSet: 'sunroom',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [42, 48] },\n                        { span: '≤5m', priceRange: [45, 51] },\n                        { span: '≤6m', priceRange: [48, 56] },\n                        { span: '≤7m', priceRange: [52, 60] },\n                        { span: '>7m',  priceRange: [58, 68] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                }\n            },\n            // ===== PERGOLA",
     "extras: ['Solar power & energy storage system', '(Motor & drive control system)'], optionSet: 'sunroom', noteSet: 'sunroom',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', priceRange: [42, 48] },\n                        { span: '≤5m', priceRange: [45, 51] },\n                        { span: '≤6m', priceRange: [48, 56] },\n                        { span: '≤7m', priceRange: [52, 60] },\n                        { span: '>7m',  priceRange: [58, 68] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤4m', retail: [59, 67], wholesale: [48, 55] },\n                        { span: '≤5m', retail: [63, 71], wholesale: [52, 59] },\n                        { span: '≤6m', retail: [67, 78], wholesale: [55, 64] },\n                        { span: '≤7m', retail: [73, 84], wholesale: [60, 69] },\n                        { span: '>7m',  retail: [81, 95], wholesale: [67, 78] }\n                    ],\n                    note: 'Suggested selling price — installation, foundation, and permits not included.'\n                }\n            },\n            // ===== PERGOLA"),

    # pg-basic (line ~7324)
    ("extras: [], optionSet: 'pergola', noteSet: 'pergola',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3m', priceRange: [18, 22] },\n                        { span: '≤4m', priceRange: [20, 24] },\n                        { span: '≤5m', priceRange: [22, 27] },\n                        { span: '≤6m', priceRange: [24, 30] },\n                        { span: '>6m',  priceRange: [27, 34] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                }\n            },\n            'pg-classic':",
     "extras: [], optionSet: 'pergola', noteSet: 'pergola',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3m', priceRange: [18, 22] },\n                        { span: '≤4m', priceRange: [20, 24] },\n                        { span: '≤5m', priceRange: [22, 27] },\n                        { span: '≤6m', priceRange: [24, 30] },\n                        { span: '>6m',  priceRange: [27, 34] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3m', retail: [25, 31], wholesale: [21, 25] },\n                        { span: '≤4m', retail: [28, 34], wholesale: [23, 28] },\n                        { span: '≤5m', retail: [31, 38], wholesale: [25, 31] },\n                        { span: '≤6m', retail: [34, 42], wholesale: [28, 35] },\n                        { span: '>6m',  retail: [38, 48], wholesale: [31, 39] }\n                    ],\n                    note: 'Suggested selling price — installation, foundation, and permits not included.'\n                }\n            },\n            'pg-classic':"),

    # pg-classic (line ~7346)
    ("extras: [], optionSet: 'pergola', noteSet: 'pergola',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3m', priceRange: [28, 32] },\n                        { span: '≤4m', priceRange: [30, 35] },\n                        { span: '≤5m', priceRange: [32, 38] },\n                        { span: '≤6m', priceRange: [35, 42] },\n                        { span: '>6m',  priceRange: [38, 48] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                }\n            },\n            // ===== ZIP BLINDS",
     "extras: [], optionSet: 'pergola', noteSet: 'pergola',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3m', priceRange: [28, 32] },\n                        { span: '≤4m', priceRange: [30, 35] },\n                        { span: '≤5m', priceRange: [32, 38] },\n                        { span: '≤6m', priceRange: [35, 42] },\n                        { span: '>6m',  priceRange: [38, 48] }\n                    ],\n                    note: 'Material cost only — installation, foundation, and permits not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3m', retail: [39, 45], wholesale: [32, 37] },\n                        { span: '≤4m', retail: [42, 49], wholesale: [35, 40] },\n                        { span: '≤5m', retail: [45, 53], wholesale: [37, 44] },\n                        { span: '≤6m', retail: [49, 59], wholesale: [40, 48] },\n                        { span: '>6m',  retail: [53, 67], wholesale: [44, 55] }\n                    ],\n                    note: 'Suggested selling price — installation, foundation, and permits not included.'\n                }\n            },\n            // ===== ZIP BLINDS"),

    # zb-manual (line ~7369)
    ("extras: [], optionSet: 'blinds', noteSet: 'blinds',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3.8m', priceRange: [12, 15] },\n                        { span: '≤5.5m', priceRange: [14, 18] },\n                        { span: '>5.5m',  priceRange: [17, 22] }\n                    ],\n                    note: 'Material cost only — installation not included.'\n                }\n            },\n            'zb-motorized':",
     "extras: [], optionSet: 'blinds', noteSet: 'blinds',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3.8m', priceRange: [12, 15] },\n                        { span: '≤5.5m', priceRange: [14, 18] },\n                        { span: '>5.5m',  priceRange: [17, 22] }\n                    ],\n                    note: 'Material cost only — installation not included.'\n                },\n                price: {\n                    unit: 'sqm', currency: 'USD',\n                    mode: 'strategy',\n                    tiers: [\n                        { label: 'ZB-100 Standard', retail: [38, 45], wholesale: [31, 37] },\n                        { label: 'ZB-200 Professional', retail: [52, 62], wholesale: [43, 51] },\n                        { label: 'ZB-300 Elite', retail: [58, 85], wholesale: [48, 70] }\n                    ],\n                    note: 'Base fabric price per sqm. Drive system and surcharges applied via quotation engine.'\n                }\n            },\n            'zb-motorized':"),

    # zb-motorized (line ~7389)
    ("extras: ['Electric motor & control system'], optionSet: 'blinds', noteSet: 'blinds',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3.8m', priceRange: [18, 22] },\n                        { span: '≤5.5m', priceRange: [21, 26] },\n                        { span: '>5.5m',  priceRange: [25, 32] }\n                    ],\n                    note: 'Material cost only — installation not included.'\n                }\n            },\n            // ===== ADU",
     "extras: ['Electric motor & control system'], optionSet: 'blinds', noteSet: 'blinds',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '≤3.8m', priceRange: [18, 22] },\n                        { span: '≤5.5m', priceRange: [21, 26] },\n                        { span: '>5.5m',  priceRange: [25, 32] }\n                    ],\n                    note: 'Material cost only — installation not included.'\n                },\n                price: {\n                    unit: 'sqm', currency: 'USD',\n                    mode: 'strategy',\n                    tiers: [\n                        { label: 'ZB-100 Standard', retail: [38, 45], wholesale: [31, 37] },\n                        { label: 'ZB-200 Professional', retail: [52, 62], wholesale: [43, 51] },\n                        { label: 'ZB-300 Elite', retail: [58, 85], wholesale: [48, 70] }\n                    ],\n                    note: 'Base fabric price per sqm. Motorized drive ($68-$215/unit) added in quotation engine.'\n                }\n            },\n            // ===== ADU"),

    # adu-studio (line ~7410)
    ("extras: [], optionSet: 'adu', noteSet: 'adu',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '300-500 sqft', priceRange: [180, 220] }\n                    ],\n                    note: 'Turnkey material cost per sqft — permits, site prep, and utility connections not included.'\n                }\n            },\n            'adu-2bed':",
     "extras: [], optionSet: 'adu', noteSet: 'adu',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '300-500 sqft', priceRange: [180, 220] }\n                    ],\n                    note: 'Turnkey material cost per sqft — permits, site prep, and utility connections not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '300-500 sqft', retail: [252, 308], wholesale: [207, 253] }\n                    ],\n                    note: 'Suggested selling price — permits, site prep, and utility connections not included.'\n                }\n            },\n            'adu-2bed':"),

    # adu-2bed (line ~7428)
    ("extras: [], optionSet: 'adu', noteSet: 'adu',\n                pricing: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '500-800 sqft', priceRange: [200, 250] }\n                    ],\n                    note: 'Turnkey material cost per sqft — permits, site prep, and utility connections not included.'\n                }\n            }\n        };",
     "extras: [], optionSet: 'adu', noteSet: 'adu',\n                cost: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '500-800 sqft', priceRange: [200, 250] }\n                    ],\n                    note: 'Turnkey material cost per sqft — permits, site prep, and utility connections not included.'\n                },\n                price: {\n                    unit: 'sqft', currency: 'USD',\n                    tiers: [\n                        { span: '500-800 sqft', retail: [280, 350], wholesale: [230, 288] }\n                    ],\n                    note: 'Suggested selling price — permits, site prep, and utility connections not included.'\n                }\n            }\n        };"),
]

count = 0
for old, new in product_pricing_blocks:
    if old in content:
        content = content.replace(old, new, 1)
        count += 1
    else:
        print(f"WARNING: Product block {count} not found!")
        # Try to find a partial match for debugging
        first_20 = old[:80]
        if first_20 in content:
            print(f"  -> Partial match found for: {first_20[:60]}...")
        else:
            print(f"  -> No partial match for: {first_20[:60]}...")

print(f"Part A: Replaced {count}/12 product pricing→cost blocks")

# ============================================================
# Part B: 更新所有 p.pricing → p.cost 引用（非产品定义区域）
# ============================================================

ref_replacements = [
    # Line 5492-5493: sunroom product cards (designer) — show cost
    ("var priceMin = p.pricing.tiers[0].priceRange[0];\n                var priceMax = p.pricing.tiers[p.pricing.tiers.length - 1].priceRange[1];",
     "var priceMin = p.cost.tiers[0].priceRange[0];\n                var priceMax = p.cost.tiers[p.cost.tiers.length - 1].priceRange[1];"),

    # Line 5539-5540: selected product summary (designer)
    ("var priceMin = product.pricing.tiers[0].priceRange[0];\n            var priceMax = product.pricing.tiers[product.pricing.tiers.length - 1].priceRange[1];",
     "var priceMin = product.cost.tiers[0].priceRange[0];\n            var priceMax = product.cost.tiers[product.cost.tiers.length - 1].priceRange[1];"),

    # Line 5558: span button tier prices (designer)
    ("var tier = product.pricing.tiers[idx];",
     "var tier = product.cost.tiers[idx];"),

    # Line 5608: span selection tier (designer) — same pattern, second occurrence
    # Both occurrences at 5558 and 5608 have same pattern. Use replace with count.

    # Line 5620-5621: selected span stats
    ("if (spanIdx >= 0 && product.pricing.tiers[spanIdx]) {\n                    var tier = product.pricing.tiers[spanIdx];",
     "if (spanIdx >= 0 && product.cost.tiers[spanIdx]) {\n                    var tier = product.cost.tiers[spanIdx];"),

    # Line 5642-5643: quick stats
    ("var priceMin = product.pricing.tiers[0].priceRange[0];\n            var priceMax = product.pricing.tiers[0].priceRange[1];",
     "var priceMin = product.cost.tiers[0].priceRange[0];\n            var priceMax = product.cost.tiers[0].priceRange[1];"),

    # Line 5667: spec card pricing note
    ("document.getElementById('specPricingNote').querySelector('span').textContent = product.pricing.note;",
     "document.getElementById('specPricingNote').querySelector('span').textContent = product.cost.note;"),

    # Line 7546: default product template in CRUD modal
    ("pricing: { unit: 'sqft', currency: 'USD', tiers: [], note: '' }",
     "cost: { unit: 'sqft', currency: 'USD', tiers: [], note: '' },\n                price: { unit: 'sqft', currency: 'USD', tiers: [], note: '' }"),

    # Line 7553: CRUD modal tier string generation
    ("const tiersStr = (p.pricing && p.pricing.tiers || []).map(t =>",
     "const tiersStr = (p.cost && p.cost.tiers || []).map(t =>"),

    # Line 7671: CRUD modal unit field
    ("value=\"${(p.pricing && p.pricing.unit || 'sqft').replace(/\"/g, '&quot;')}\"",
     "value=\"${(p.cost && p.cost.unit || 'sqft').replace(/\"/g, '&quot;')}\""),

    # Line 7675: CRUD modal currency field
    ("value=\"${(p.pricing && p.pricing.currency || 'USD').replace(/\"/g, '&quot;')}\"",
     "value=\"${(p.cost && p.cost.currency || 'USD').replace(/\"/g, '&quot;')}\""),

    # Line 7684: CRUD modal note field
    ("value=\"${(p.pricing && p.pricing.note || '').replace(/\"/g, '&quot;')}\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500\" placeholder=\"Material cost only...\">",
     "value=\"${(p.cost && p.cost.note || '').replace(/\"/g, '&quot;')}\" class=\"w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500\" placeholder=\"Material cost only...\">"),

    # Line 7737: save function — pricing: → cost:
    ("pricing: {\n                    unit: document.getElementById('pcm_priceUnit').value.trim() || 'sqft',\n                    currency: document.getElementById('pcm_priceCurrency').value.trim() || 'USD',\n                    tiers: tiers,\n                    note: document.getElementById('pcm_priceNote').value.trim()\n                }",
     "cost: {\n                    unit: document.getElementById('pcm_costUnit').value.trim() || 'sqft',\n                    currency: document.getElementById('pcm_costCurrency').value.trim() || 'USD',\n                    tiers: tiers,\n                    note: document.getElementById('pcm_costNote').value.trim()\n                },\n                price: (productCatalog[origKey] || {}).price || { unit: 'sqft', currency: 'USD', tiers: [], note: '' }"),

    # Line 8026-8027: product detail header price summary — show SELLING price
    ("const priceSummary = p.pricing && p.pricing.tiers.length > 0\n                ? ('$' + p.pricing.tiers[0].priceRange[0] + ' – $' + p.pricing.tiers[p.pricing.tiers.length - 1].priceRange[1] + '/' + p.pricing.unit)",
     "const priceSummary = p.price && p.price.tiers && p.price.tiers.length > 0\n                ? (p.price.mode === 'strategy'\n                    ? ('$' + p.price.tiers[0].retail[0] + ' – $' + p.price.tiers[p.price.tiers.length - 1].retail[1] + '/' + p.price.unit)\n                    : ('$' + p.price.tiers[0].retail[0] + ' – $' + p.price.tiers[p.price.tiers.length - 1].retail[1] + '/' + p.price.unit))"),

    # Line 8086-8092: spec section header — keep as Material Cost
    ("${p.pricing ? '<i class=\"fas fa-dollar-sign mr-1\"></i>Material Cost by Span' : 'Span / Size Options'}",
     "${p.cost ? '<i class=\"fas fa-dollar-sign mr-1\"></i>Material Cost by Span' : 'Span / Size Options'}"),

    # Line 8088: spec section conditional
    ("${p.pricing ? `",
     "${p.cost ? `"),

    # Line 8092: cost table header
    ("Material Cost (${p.pricing.currency}/${p.pricing.unit})",
     "Material Cost (${p.cost.currency}/${p.cost.unit})"),

    # Line 8094: cost tiers iteration
    ("${p.pricing.tiers.map((t, i) => `",
     "${p.cost.tiers.map((t, i) => `"),

    # Line 8108: cost note
    ("<span>${p.pricing.note}</span>",
     "<span>${p.cost.note}</span>"),

    # Line 11227: step 2 product cards — show selling price
    ("const priceRange = prod ? ('$' + prod.pricing.tiers[0].priceRange[0] + '-' + prod.pricing.tiers[0].priceRange[1] + '/sqft') : '';",
     "const priceRange = prod && prod.price && prod.price.tiers && prod.price.tiers.length > 0 ? (prod.price.mode === 'strategy' ? ('$' + prod.price.tiers[0].retail[0] + '-' + prod.price.tiers[0].retail[1] + '/' + prod.price.unit) : ('$' + prod.price.tiers[0].retail[0] + '-' + prod.price.tiers[0].retail[1] + '/' + prod.price.unit)) : '';"),

    # Line 12391: step 2 stats — show cost
    ("var tier0 = product.pricing.tiers[0].priceRange;",
     "var tier0 = product.cost.tiers[0].priceRange;"),
]

ref_count = 0
for old, new in ref_replacements:
    if old in content:
        content = content.replace(old, new, 1)
        ref_count += 1
    else:
        print(f"WARNING: Reference {ref_count} not found: {old[:80]}...")

print(f"Part B: Updated {ref_count}/{len(ref_replacements)} pricing references")

# ============================================================
# Part C: 更新 CRUD modal 中的 Pricing section → Cost section
# ============================================================

# 更新 section 标题和 field IDs
crud_replacements = [
    # Section header
    ("<h5 class=\"text-xs font-bold text-gray-600 uppercase tracking-wider mb-3\"><i class=\"fas fa-dollar-sign mr-1\"></i>Pricing</h5>",
     "<h5 class=\"text-xs font-bold text-gray-600 uppercase tracking-wider mb-3\"><i class=\"fas fa-coins mr-1\"></i>Material Cost (COGS)</h5>"),

    # Unit field ID
    ("<input id=\"pcm_priceUnit\" type=\"text\"",
     "<input id=\"pcm_costUnit\" type=\"text\""),

    # Currency field ID
    ("<input id=\"pcm_priceCurrency\" type=\"text\"",
     "<input id=\"pcm_costCurrency\" type=\"text\""),

    # Tiers label
    ("Price Tiers <span class=\"text-gray-400\">(one per line: span|low-high, e.g. ≤4m|26-30)</span>",
     "Cost Tiers <span class=\"text-gray-400\">(one per line: span|low-high, e.g. ≤4m|26-30)</span>"),

    # Note field ID
    ("<label class=\"block text-xs text-gray-500 mb-1\">Pricing Note</label>\n                                <input id=\"pcm_priceNote\"",
     "<label class=\"block text-xs text-gray-500 mb-1\">Cost Note</label>\n                                <input id=\"pcm_costNote\""),
]

crud_count = 0
for old, new in crud_replacements:
    if old in content:
        content = content.replace(old, new, 1)
        crud_count += 1
    else:
        print(f"WARNING: CRUD replacement {crud_count} not found: {old[:80]}...")

print(f"Part C: Updated {crud_count}/{len(crud_replacements)} CRUD modal elements")

# ============================================================
# Final: 写回文件
# ============================================================
if content != original:
    with open(FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"\n✅ Step 1 complete — file updated successfully")
    print(f"   Total changes: {count} product blocks + {ref_count} references + {crud_count} CRUD elements")
else:
    print("\n❌ No changes made — check warnings above")
    sys.exit(1)
