#!/usr/bin/env python3
"""Phase 2.7: 修改 company-operations.html — 提取核心基础层到外部 JS"""

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

original_count = len(lines)
print(f'原始行数: {original_count}')


def find_idx(pattern, start=0):
    for i in range(start, len(lines)):
        if pattern in lines[i]:
            return i
    raise ValueError(f'NOT FOUND: "{pattern}" from line {start}')


def find_idx_rev(pattern, before):
    for i in range(before - 1, -1, -1):
        if pattern in lines[i]:
            return i
    raise ValueError(f'NOT FOUND (reverse): "{pattern}" before line {before}')


changes = []

# ── Block A: NestopiaDB 内联 <script> (lines ~597-671) ──
# 替换为 <script src="...">
a_start = find_idx('Nestopia Supabase Config (inlined)')
# 往上找 <script>
a_script_open = find_idx_rev('<script>', a_start)
a_end = find_idx('</script>', a_start)
print(f'Block A (NestopiaDB): lines {a_script_open+1}-{a_end+1}')
changes.append((a_script_open, a_end, [
    '    <script src="js/core/supabase-config.js"></script>\n',
]))

# ── Block B: NestopiaStorage 内联 <script> (lines ~672-914) ──
b_start = find_idx('Nestopia Supabase Storage (inlined)')
b_script_open = find_idx_rev('<script>', b_start)
b_end = find_idx('</script>', b_start)
print(f'Block B (NestopiaStorage): lines {b_script_open+1}-{b_end+1}')
changes.append((b_script_open, b_end, [
    '    <script src="js/core/supabase-storage.js"></script>\n',
]))

# ── Block C: Auth functions (lines ~4653-4692 in main <script>) ──
c_start = find_idx('// ===== Authentication =====')
# End: just before "// ===== Load tenant and user data ====="
c_end_marker = find_idx('// ===== Load tenant and user data =====', c_start)
c_end = c_end_marker - 1  # blank line before
# Trim trailing blank lines
while c_end > c_start and lines[c_end].strip() == '':
    c_end -= 1
print(f'Block C (Auth): lines {c_start+1}-{c_end+1}')
changes.append((c_start, c_end, [
    '        // ===== Authentication (→ js/core/auth.js) =====\n',
]))

# ── Block D: Tenant config (getCurrentTenantSlug → getLocalizedName) ──
d_start = find_idx('// ===== Load tenant and user data =====')
# End: just before "// ===== Quotation i18n Dictionary"
d_end_marker = find_idx('// ===== Quotation i18n Dictionary', d_start)
d_end = d_end_marker - 1
while d_end > d_start and lines[d_end].strip() == '':
    d_end -= 1
print(f'Block D (Tenant): lines {d_start+1}-{d_end+1}')
changes.append((d_start, d_end, [
    '        // ===== Tenant Config (→ js/core/tenant.js) =====\n',
]))

# ── Block E: i18n (quotI18n alias + getQuotText) ──
e_start = find_idx('// ===== Quotation i18n Dictionary')
e_end_marker = find_idx('function loadDashboardData()', e_start)
e_end = e_end_marker - 1
while e_end > e_start and lines[e_end].strip() == '':
    e_end -= 1
print(f'Block E (i18n): lines {e_start+1}-{e_end+1}')
changes.append((e_start, e_end, [
    '        // ===== i18n (→ js/core/i18n.js) =====\n',
]))

# ── Block F: Router (navigateToPage → renderSidebarProjects) ──
f_start = find_idx('// ===== Page Navigation (v1.2.0')
# End: just before "// ===== Per-Project Agent Panel Data"
f_end_marker = find_idx('// ===== Per-Project Agent Panel Data', f_start)
f_end = f_end_marker - 1
while f_end > f_start and lines[f_end].strip() == '':
    f_end -= 1
print(f'Block F (Router): lines {f_start+1}-{f_end+1}')
changes.append((f_start, f_end, [
    '        // ===== Page Navigation (→ js/core/router.js) =====\n',
]))

# ── 从后往前应用替换 ──
changes.sort(key=lambda x: x[0], reverse=True)
total_removed = 0
for start, end, replacement in changes:
    old_count = end - start + 1
    lines[start:end + 1] = replacement
    removed = old_count - len(replacement)
    total_removed += removed
    print(f'  替换 {old_count} 行 → {len(replacement)} 行 (净减 {removed})')

# ── 更新 script 标签区域 ──
# 找到 Phase 1 添加的 script 标签区域，在其前面添加 core 文件
phase1_marker = find_idx('<!-- JS 模块化文件 (Phase 1')
print(f'\n在行 {phase1_marker+1} 前插入 core script 标签')

core_scripts = [
    '    <!-- JS 核心层 (Phase 2) -->\n',
    '    <script src="js/core/auth.js"></script>\n',
    '    <script src="js/core/tenant.js"></script>\n',
    '    <script src="js/core/i18n.js"></script>\n',
    '    <script src="js/core/router.js"></script>\n',
    '\n',
]
lines[phase1_marker:phase1_marker] = core_scripts

with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(lines)

new_count = len(lines)
print(f'\n完成! {original_count} → {new_count} 行 (净减 {original_count - new_count} 行)')
