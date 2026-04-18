#!/usr/bin/env python3
"""修复 script 标签加载顺序: namespace.js 必须最先加载"""

FILE = 'company-operations.html'
with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 将分散的 script 标签合并为正确顺序
old = """    <!-- JS 核心层 (Phase 2) -->
    <script src="js/core/auth.js"></script>
    <script src="js/core/tenant.js"></script>
    <script src="js/core/i18n.js"></script>
    <script src="js/core/router.js"></script>

    <!-- JS 模块化文件 (Phase 1 — 数据层) -->
    <script src="js/core/namespace.js"></script>
    <script src="js/data/i18n-dict.js"></script>
    <script src="js/data/pricing-data.js"></script>
    <script src="js/data/product-catalog.js"></script>
    <script src="js/data/step-config.js"></script>
    <script src="js/data/intake-fields.js"></script>
    <script src="js/data/seed-projects.js"></script>"""

new = """    <!-- JS 模块化文件 — 按依赖顺序加载 -->
    <!-- 1. 命名空间 -->
    <script src="js/core/namespace.js"></script>
    <!-- 2. 核心基础层 (Phase 2) -->
    <script src="js/core/supabase-config.js"></script>
    <script src="js/core/supabase-storage.js"></script>
    <script src="js/core/auth.js"></script>
    <script src="js/core/tenant.js"></script>
    <script src="js/core/i18n.js"></script>
    <script src="js/core/router.js"></script>
    <!-- 3. 数据层 (Phase 1) -->
    <script src="js/data/i18n-dict.js"></script>
    <script src="js/data/pricing-data.js"></script>
    <script src="js/data/product-catalog.js"></script>
    <script src="js/data/step-config.js"></script>
    <script src="js/data/intake-fields.js"></script>
    <script src="js/data/seed-projects.js"></script>"""

if old not in content:
    print('ERROR: old pattern not found!')
    import sys; sys.exit(1)

content = content.replace(old, new)

# 同时移除 head 中已变成外部引用的 supabase-config/storage script 标签
# 因为它们现在在 body 末尾的统一加载区域了
old_sc = '    <script src="js/core/supabase-config.js"></script>\n    <script src="js/core/supabase-storage.js"></script>'
# 只移除 head 区域的（第一次出现，在 Supabase CDN 之后）
first_pos = content.find(old_sc)
# 检查是否在 body 标签之前（即 head 区域）
body_pos = content.find('<body')
if first_pos < body_pos:
    content = content[:first_pos] + content[first_pos + len(old_sc) + 1:]  # +1 for trailing \n
    print('已移除 head 区域的重复 supabase script 标签')

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print('加载顺序已修复: namespace → supabase → auth → tenant → i18n → router → data')
