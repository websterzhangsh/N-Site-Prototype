#!/usr/bin/env python3
"""
patch-hide-generate-btn.py
隐藏 Generate Installation Package 按钮及其下方提示文字（功能为占位模拟，暂不需要展示）
使用行号定位法避免引号转义匹配问题
"""
import sys, os

FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'company-operations.html')

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 定位按钮块的起止行
start_idx = None
end_idx = None

for i, line in enumerate(lines):
    if '<!-- Generate Design / Order Button' in line and '-->' in line:
        start_idx = i
    if start_idx is not None and 'Complete measurement data to enable design generation' in line:
        end_idx = i
        break

if start_idx is None or end_idx is None:
    print(f'[ERROR] Could not find button block (start={start_idx}, end={end_idx})', flush=True)
    sys.exit(1)

# 检查是否已经被注释掉
if '<!--' in lines[start_idx + 1]:
    print('[SKIP] Button block already commented out', flush=True)
    sys.exit(0)

print(f'Found button block: lines {start_idx+1}-{end_idx+1}', flush=True)

# 获取缩进
indent = '                                '

# 构建新行
new_block = []
new_block.append(f'{indent}<!-- Generate Design / Order Button \u2014 \u6682\u65f6\u9690\u85cf\uff08\u529f\u80fd\u4e3a\u5360\u4f4d\u6a21\u62df\uff0c\u5f85\u63a5\u5165\u771f\u5b9e API \u540e\u6062\u590d\uff09\n')
for j in range(start_idx + 1, end_idx + 1):
    new_block.append(lines[j])
new_block.append(f'{indent}-->\n')

# 替换
new_lines = lines[:start_idx] + new_block + lines[end_idx + 1:]

with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print('[DONE] Generate button hidden via HTML comment', flush=True)
