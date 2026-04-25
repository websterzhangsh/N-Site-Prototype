#!/usr/bin/env python3
"""
patch-verif-skip-image.py
修复 Verification 表格中 image_upload 字段（如 Fabric Sample Photo）的 base64 数据
溢出导致 Delta 列不可见的 bug。

方案：在 perFieldDefs 定义时过滤掉 image_upload 类型字段。
"""
import sys, os

FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'company-operations.html')

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 目标行：const perFieldDefs = mpConfig.zipBlindsFields.filter(mf => mf.perOpening);
# 位于 Verification Panel 区块内
target = None
for i, line in enumerate(lines):
    if 'perFieldDefs' in line and 'mf.perOpening' in line and 'zipBlindsFields' in line:
        target = i
        break

if target is None:
    print('[ERROR] Could not find perFieldDefs line', flush=True)
    sys.exit(1)

old_line = lines[target]
print(f'Found at line {target+1}: {old_line.rstrip()}', flush=True)

# 验证是否只有简单的 perOpening filter
if "mf => mf.perOpening)" not in old_line:
    print(f'[ERROR] Line does not match expected pattern', flush=True)
    sys.exit(1)

# 替换：增加 image_upload 过滤
new_line = old_line.replace(
    "mf => mf.perOpening)",
    "mf => mf.perOpening && mf.type !== 'image_upload')"
)
lines[target] = new_line
print(f'New line: {new_line.rstrip()}', flush=True)

with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('[DONE] image_upload fields excluded from verification table', flush=True)
