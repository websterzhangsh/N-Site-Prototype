#!/usr/bin/env python3
"""
Phase 4: 从 company-operations.html 移除已提取到独立 JS 文件的代码块。
策略: 先收集所有行号范围（基于原始文件），再从底部到顶部统一替换。
"""
import os, sys

HTML_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'company-operations.html')

def find_line(lines, prefix, start=0):
    """找到 strip() 后以 prefix 开头的行，返回 0-based 行号。"""
    for i in range(start, len(lines)):
        if lines[i].strip().startswith(prefix):
            return i
    return -1

def find_line_exact(lines, content, start=0):
    """找到 strip() 后完全等于 content 的行。"""
    for i in range(start, len(lines)):
        if lines[i].strip() == content:
            return i
    return -1

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    original_count = len(lines)
    print(f"[Phase 4] 原始行数: {original_count}", flush=True)

    # ── 第一步: 在原始文件上定位所有标记 ──
    m = {}
    markers = [
        ('agent_panel', '// ===== Per-Project Agent Panel Data'),
        ('designer_block', '// ==================================================================='),  # after agent_panel
        ('designer_page_legacy', '// ===== AI Designer Page'),
        ('showtoast', 'function showToast(message'),
        ('pricing', '// ===== Pricing Agent Page Functions'),
        ('compliance', '// ===== Compliance Manager Page Functions'),
        ('customer_service', '// ===== Customer Service Executive Page Functions'),
        ('products_ph3', '// ===== Products (→ js/modules/products.js)'),
        ('step2', '// ===== Step 2: AI Designer Helper Functions'),
        ('step3', '// ===== Step 3: Measurement & Design Panel Functions'),
        ('step4', '// ===== Step 4: Quotation & Pricing Panel Functions'),
        ('projects_ph3', '// ===== Projects: Create + Master-Detail'),
        ('quot_editor', '// ===== Quotation Editor ====='),
        ('risk_issues_ph3', '// ===== Projects Management: Risk & Issues'),
        ('chatbot', '// ===== B2B Chatbot Module'),
        ('script_close', '</script>'),
    ]

    # Find all markers sequentially
    for key, prefix in markers:
        search_from = 0
        if key == 'designer_block':
            # Must be AFTER agent_panel marker
            search_from = m.get('agent_panel', 0) + 1
        elif key == 'showtoast':
            # The duplicate showToast is after designer_page_legacy
            search_from = m.get('designer_page_legacy', 0) + 1
        elif key == 'script_close':
            # Must be after chatbot
            search_from = m.get('chatbot', 0) + 1

        if prefix == '</script>':
            idx = find_line_exact(lines, prefix, search_from)
        else:
            idx = find_line(lines, prefix, search_from)

        if idx == -1:
            print(f"  [ERROR] Marker '{key}' ('{prefix}') not found from line {search_from}!", flush=True)
            sys.exit(1)
        m[key] = idx
        print(f"  Found [{key}] at line {idx + 1}", flush=True)

    # ── 第二步: 定义替换区间 [start, end)，即替换 start..end-1 行 ──
    # 从底部到顶部排列（替换时从下往上不影响行号）
    replacements = [
        # 9. Chatbot: from chatbot marker to </script> (exclusive)
        (m['chatbot'], m['script_close'],
         '        // ===== B2B Chatbot (→ js/utils/chatbot.js) =====\n'),

        # 8. Quotation Editor: from quot_editor to risk_issues_ph3
        (m['quot_editor'], m['risk_issues_ph3'],
         '        // ===== Quotation Editor (→ js/utils/quotation-editor.js) =====\n'),

        # 7. Step 4: from step4 to projects_ph3
        (m['step4'], m['projects_ph3'],
         '        // ===== Step 4: Quotation (→ js/steps/step4-quotation.js) =====\n'),

        # 6. Step 3: from step3 to step4
        (m['step3'], m['step4'],
         '        // ===== Step 3: Measurement (→ js/steps/step3-measurement.js) =====\n'),

        # 5. Step 2: from step2 to step3
        (m['step2'], m['step3'],
         '        // ===== Step 2: AI Design (→ js/steps/step2-design.js) =====\n'),

        # 4. Customer Service: from customer_service to products_ph3
        (m['customer_service'], m['products_ph3'],
         '        // ===== Customer Service (→ js/agents/customer-service.js) =====\n'),

        # 3. Compliance: from compliance to customer_service
        (m['compliance'], m['customer_service'],
         '        // ===== Compliance (→ js/agents/compliance.js) =====\n'),

        # 2. Pricing + duplicate showToast: from showtoast to compliance
        (m['showtoast'], m['compliance'],
         '        // ===== Pricing Agent (→ js/agents/pricing.js) =====\n'),

        # 1. AI Designer: from designer_block to showtoast
        (m['designer_block'], m['showtoast'],
         '        // ===== AI Designer (→ js/agents/designer.js) =====\n'),
    ]

    # Validate no overlaps and sort bottom-to-top
    replacements.sort(key=lambda x: x[0], reverse=True)

    print(f"\n[Phase 4] 替换计划:", flush=True)
    removed_total = 0
    for start, end, comment in replacements:
        count = end - start
        removed_total += count - 1  # -1 for the replacement comment line
        label = comment.strip().strip('/')
        print(f"  Lines {start+1}-{end}: {count} lines → {label.strip()}", flush=True)

    # ── 第三步: 从底部到顶部执行替换 ──
    for start, end, comment in replacements:
        lines[start:end] = [comment]

    print(f"\n[Phase 4] 总共移除: {removed_total} 行", flush=True)
    print(f"[Phase 4] 替换后行数: {len(lines)}", flush=True)

    # ── 第四步: 插入 <script> 标签 ──
    anchor = find_line(lines, '<script src="js/modules/workflow.js">')
    if anchor == -1:
        print("[ERROR] workflow.js anchor not found!", flush=True)
        sys.exit(1)

    new_scripts = [
        '    <!-- 6. Agent 模块 (Phase 4) -->\n',
        '    <script src="js/agents/designer.js"></script>\n',
        '    <script src="js/agents/pricing.js"></script>\n',
        '    <script src="js/agents/compliance.js"></script>\n',
        '    <script src="js/agents/customer-service.js"></script>\n',
        '    <!-- 7. Step 实现 (Phase 4) -->\n',
        '    <script src="js/steps/step2-design.js"></script>\n',
        '    <script src="js/steps/step3-measurement.js"></script>\n',
        '    <script src="js/steps/step4-quotation.js"></script>\n',
        '    <!-- 8. 独立工具 (Phase 4) -->\n',
        '    <script src="js/utils/quotation-editor.js"></script>\n',
        '    <script src="js/utils/chatbot.js"></script>\n',
    ]

    insert_pos = anchor + 1
    for i, line in enumerate(new_scripts):
        lines.insert(insert_pos + i, line)

    print(f"[Phase 4] 插入 {len(new_scripts)} 行 script 标签 (after line {insert_pos})", flush=True)
    print(f"[Phase 4] 最终行数: {len(lines)}", flush=True)

    # ── 写回文件 ──
    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print(f"\n[Phase 4] ✅ 完成! {original_count} → {len(lines)} 行 (减少 {original_count - len(lines)} 行)", flush=True)

if __name__ == '__main__':
    main()
