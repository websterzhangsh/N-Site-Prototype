#!/usr/bin/env python3
"""
Replace ZB quotation panel HTML in company-operations.html
with new SKU-based template (v2.0).

旧版: Product Tier (ZB-100/200/300) + Fabric + Drive System + 6-Strategy badges
新版: SKU Catalog (WR110A-78 等) + Currency/Exchange Rate + RMB pricing
"""
import sys
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_FILE = os.path.join(BASE, 'company-operations.html')
NEW_BLOCK_FILE = '/tmp/zb_panel_v2.txt'

START_MARKER = '// ---- Zip Blinds pricing panel ----'
END_MARKER = '// ---- Sunroom / Pergola pricing panel ----'

# Read files
with open(HTML_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

with open(NEW_BLOCK_FILE, 'r', encoding='utf-8') as f:
    new_block = f.read()

# Find the ZB block boundaries
start_pos = content.find(START_MARKER)
if start_pos < 0:
    print(f'ERROR: Could not find start marker: {START_MARKER}')
    sys.exit(1)

end_pos = content.find(END_MARKER)
if end_pos < 0:
    print(f'ERROR: Could not find end marker: {END_MARKER}')
    sys.exit(1)

# Find start of the line containing START_MARKER
line_start = content.rfind('\n', 0, start_pos) + 1

# Find start of the line containing END_MARKER
end_line_start = content.rfind('\n', 0, end_pos) + 1

# The old block is from line_start to end_line_start (exclusive)
old_block = content[line_start:end_line_start]
old_lines = old_block.count('\n')
new_lines = new_block.count('\n')

print(f'Found ZB block at char {line_start}..{end_line_start}')
print(f'Old block: {old_lines} lines')
print(f'New block: {new_lines} lines')

# Perform replacement
new_content = content[:line_start] + new_block + '\n\n' + content[end_line_start:]

with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'SUCCESS: Replaced ZB quotation panel HTML')
print(f'File size: {len(content)} -> {len(new_content)} bytes')
