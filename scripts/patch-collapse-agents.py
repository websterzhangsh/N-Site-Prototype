#!/usr/bin/env python3
"""
将 Compliance Pre-check 和 KB Quick Reference 从 Step 3 右侧栏移除，
数据/逻辑整合到 Compliance Agent 和 Knowledge Agent 中。

Changes:
1. 移除 Compliance pre-check items 计算变量 (lines ~6508-6521)
2. 移除 Compliance Pre-Check HTML 面板 (lines ~6658-6667)
3. 移除 Step 3 中 KB Quick Reference 调用 (line ~6733)
"""
import sys

filepath = 'company-operations.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content
changes = 0

# === Change 1: 移除 Compliance 计算变量 (lines ~6508-6521) ===
# 从 "// Compliance pre-check items" 到 "// Design enablement matrix" 之前
MARKER1_START = '                // Compliance pre-check items\n'
MARKER1_END = '\n                // Design enablement matrix (product-type-aware)'

idx1s = content.find(MARKER1_START)
idx1e = content.find(MARKER1_END)

if idx1s >= 0 and idx1e >= 0:
    # 移除从 MARKER1_START 开始到 MARKER1_END 之前的所有内容
    content = content[:idx1s] + content[idx1e + 1:]  # +1 跳过开头的 \n
    changes += 1
    print('[1] OK — 移除 Compliance 计算变量')
else:
    print('[1] SKIP — 标记未找到 (start=%d, end=%d)' % (idx1s, idx1e))

# === Change 2: 移除 Compliance Pre-Check HTML 面板 ===
# 从 "<!-- Compliance Pre-Check -->" 到 "</div>\n\n" 然后是 "<!-- Design Enablement Matrix -->"
MARKER2_START = '                                <!-- Compliance Pre-Check -->\n'
MARKER2_END = '                                <!-- Design Enablement Matrix -->'

idx2s = content.find(MARKER2_START)
idx2e = content.find(MARKER2_END)

if idx2s >= 0 and idx2e >= 0:
    # 移除从 MARKER2_START 到 MARKER2_END 之前 (保留 Design Enablement Matrix 注释)
    content = content[:idx2s] + content[idx2e:]
    changes += 1
    print('[2] OK — 移除 Compliance Pre-Check HTML 面板')
else:
    print('[2] SKIP — 标记未找到 (start=%d, end=%d)' % (idx2s, idx2e))

# === Change 3: 移除 Step 3 中 KB Quick Reference 调用 ===
MARKER3 = "${isZipBlinds ? renderKBQuickRefHTML('measurement', project.id) : ''}"

idx3 = content.find(MARKER3)
if idx3 >= 0:
    # 找到该行的起始和结束位置
    line_start = content.rfind('\n', 0, idx3) + 1
    line_end = content.find('\n', idx3)
    if line_end < 0:
        line_end = len(content)
    # 移除整行（包括换行符）
    content = content[:line_start] + content[line_end + 1:]
    changes += 1
    print('[3] OK — 移除 Step 3 KB Quick Reference 调用')
else:
    print('[3] SKIP — 标记未找到')

# === 写入 ===
if changes > 0:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('\n✅ 共 %d 处修改已写入 %s' % (changes, filepath))
else:
    print('\n⚠️ 无修改')
