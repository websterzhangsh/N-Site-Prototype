#!/usr/bin/env python3
"""Phase 3: 提取功能模块到 js/modules/ 和 js/utils/
将 8 个功能区块从 company-operations.html 替换为指向外部文件的注释，
并在 <script> 加载区添加对应的 script 标签。
"""

import sys

HTML_PATH = 'company-operations.html'

# ── 需要替换的区块 ──────────────────────────────────────
# 格式: (start_prefix, end_prefix, replacement_comment)
# start_prefix: 区块第一行的唯一前缀
# end_prefix:   区块结束后下一个 section 的唯一前缀（此行保留）
# 处理顺序：从文件底部到顶部

BLOCKS = [
    # 9. Projects Risk & Issues (14365 → 14531)
    (
        '        // ===== Projects Management (Risk & Issues) =====',
        '        // ===== Team Management =====',
        '        // ===== Projects Management: Risk & Issues (→ js/modules/projects.js + js/utils/helpers.js) ====='
    ),
    # 8. Workflow (13240 → 13749)
    (
        '        // ===== Projects Management (6-Step Workflow) =====',
        '        // ===== Quotation Editor =====',
        '        // ===== Projects Management: 6-Step Workflow (→ js/modules/workflow.js) ====='
    ),
    # 7. Projects Create + Master-Detail (12469 → 13213)
    (
        '        // ===== Create New Project Modal & Logic =====',
        '        // ===== Initialize =====',
        '        // ===== Projects: Create + Master-Detail (→ js/modules/projects.js) ====='
    ),
    # 6. Company Overview (8556 → 8825)
    (
        '        // ===== Company Overview: Toggle Detail Sections =====',
        '        // ===== Step/Workflow Config',
        '        // ===== Company Overview (→ js/modules/overview.js) ====='
    ),
    # 5. Knowledge Base (8099 → 8556)
    (
        '        // ===== Knowledge Base Functions =====',
        '        // ===== Company Overview: Toggle Detail Sections =====',
        '        // ===== Knowledge Base (→ js/modules/knowledge-base.js) ====='
    ),
    # 4. Customers (7531 → 8099)
    (
        '        // ===== Customers Page Functions (Supabase CRUD) =====',
        '        // ===== Knowledge Base Functions =====',
        '        // ===== Customers (→ js/modules/customers.js) ====='
    ),
    # 3. Orders (7477 → 7531)
    (
        '        // ===== Orders Page Functions =====',
        '        // ===== Customers Page Functions (Supabase CRUD) =====',
        '        // ===== Orders (→ js/modules/orders.js) ====='
    ),
    # 2. Products (6582 → 7477)
    (
        '        // ===== Products Page Functions =====',
        '        // ===== Orders Page Functions =====',
        '        // ===== Products (→ js/modules/products.js) ====='
    ),
]

# showToast 单独处理（不在 // ===== 标记区块中）
TOAST_START = 'function showToast(message, type'
TOAST_END   = '// ===== Pricing Agent Page Functions'

# ── 新增 script 标签 ──────────────────────────────────────
NEW_SCRIPTS = """\
    <!-- 4. 工具层 (Phase 3) -->
    <script src="js/utils/helpers.js"></script>
    <!-- 5. 功能模块 (Phase 3) -->
    <script src="js/modules/orders.js"></script>
    <script src="js/modules/customers.js"></script>
    <script src="js/modules/knowledge-base.js"></script>
    <script src="js/modules/products.js"></script>
    <script src="js/modules/overview.js"></script>
    <script src="js/modules/projects.js"></script>
    <script src="js/modules/workflow.js"></script>"""

SCRIPT_ANCHOR = '<script src="js/data/seed-projects.js"></script>'


def find_line(lines, prefix, start_from=0):
    """找到第一行以 prefix 开头的行号"""
    for i in range(start_from, len(lines)):
        if lines[i].rstrip().startswith(prefix.rstrip()):
            return i
    return None


def main():
    with open(HTML_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    orig = len(lines)
    print(f'[Phase 3] 原始行数: {orig}')

    # ── 1. 找出所有区块的 start / end 行号 ──
    replacements = []   # [(start_idx, end_idx, comment), ...]

    for start_pfx, end_pfx, comment in BLOCKS:
        si = find_line(lines, start_pfx)
        if si is None:
            print(f'  ⚠️  找不到起始: {start_pfx.strip()}')
            continue
        ei = find_line(lines, end_pfx, start_from=si + 1)
        if ei is None:
            print(f'  ⚠️  找不到结束: {end_pfx.strip()} (起始行 {si+1})')
            continue
        replacements.append((si, ei, comment))
        print(f'  ✓ 行 {si+1}–{ei}: {comment.strip()}')

    # showToast
    ti = find_line(lines, TOAST_START)
    if ti is not None:
        te = find_line(lines, TOAST_END, start_from=ti + 1)
        if te is not None:
            replacements.append((ti, te, '        // showToast (→ js/utils/helpers.js)'))
            print(f'  ✓ 行 {ti+1}–{te}: showToast')

    # ── 2. 从底部到顶部替换（保持上方行号不变） ──
    replacements.sort(key=lambda x: x[0], reverse=True)

    total_removed = 0
    for si, ei, comment in replacements:
        removed = ei - si
        lines[si:ei] = [comment + '\n', '\n']
        total_removed += removed - 2   # 替换为 2 行
        print(f'  替换行 {si+1}–{ei} → 注释 (删除 {removed} 行)')

    # ── 3. 插入 script 标签 ──
    anchor_idx = find_line(lines, SCRIPT_ANCHOR)
    if anchor_idx is not None:
        lines.insert(anchor_idx + 1, NEW_SCRIPTS + '\n')
        print(f'  ✓ script 标签插入在行 {anchor_idx + 2}')
    else:
        print('  ⚠️  找不到 seed-projects.js 锚点')

    # ── 4. 写回 ──
    with open(HTML_PATH, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    final = len(lines)
    print(f'[Phase 3] 最终行数: {final} (净减少 {orig - final} 行)')


if __name__ == '__main__':
    main()
