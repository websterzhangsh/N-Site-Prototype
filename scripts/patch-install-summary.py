#!/usr/bin/env python3
"""
patch-install-summary.py
为 company-operations.html 打两个补丁:
1. Installation Summary 容器添加动态 ID，以便 updateInstallationSummary() 实时刷新
2. Per-opening 初始渲染时将默认值写入 state，确保 agg() 能读取
"""
import sys, os

FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'company-operations.html')

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ── Change 1: 给 Installation Summary 内容容器添加 ID ──────────
OLD_1 = '<div class="space-y-1.5">\n                                        ${(() => {\n                                            const md = step3State.measurementData;'
NEW_1 = '<div id="installSummaryContent_${project.id}" class="space-y-1.5">\n                                        ${(() => {\n                                            const md = step3State.measurementData;'

count1 = content.count(OLD_1)
print(f'Change 1 matches: {count1}', flush=True)
if count1 != 1:
    print(f'[ERROR] Change 1: expected 1 match, found {count1}', flush=True)
    sys.exit(1)
content = content.replace(OLD_1, NEW_1, 1)
print('[OK] Change 1: Installation Summary container ID added', flush=True)

# ── Change 2: Per-opening 初始渲染写入默认值到 state ────────────
OLD_2 = "const savedVal = step3State.measurementData[perKey] || (mData[perKey] !== undefined ? String(mData[perKey]) : '') || '';\n                        return _renderMFWrap(mf, perKey, savedVal, project.id, '');"
NEW_2 = "const savedVal = step3State.measurementData[perKey] || (mData[perKey] !== undefined ? String(mData[perKey]) : '') || '';\n                        // \u2605 \u5c06 per-opening \u9ed8\u8ba4\u503c\u5199\u5165 state\uff08\u786e\u4fdd Installation Summary \u53ef\u8bfb\u53d6\uff09\n                        if (!savedVal && mf.type === 'select' && mf.defaultValue) {\n                            step3State.measurementData[perKey] = mf.defaultValue;\n                        }\n                        return _renderMFWrap(mf, perKey, savedVal, project.id, '');"

count2 = content.count(OLD_2)
print(f'Change 2 matches: {count2}', flush=True)
if count2 != 1:
    print(f'[ERROR] Change 2: expected 1 match, found {count2}', flush=True)
    sys.exit(1)
content = content.replace(OLD_2, NEW_2, 1)
print('[OK] Change 2: Per-opening default value writing added', flush=True)

if content == original:
    print('[WARN] No changes detected!', flush=True)
    sys.exit(1)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print('[DONE] Both patches applied successfully', flush=True)
