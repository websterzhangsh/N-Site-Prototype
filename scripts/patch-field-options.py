#!/usr/bin/env python3
"""
Patch company-operations.html:
1. Update _renderMF select: add disabled + defaultValue support
2. Update verification select: add disabled support
3. Update rebuildZBOpeningSections select in step3: add disabled + defaultValue
"""
import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ── Change 1: _renderMF select options ──
# Find the exact line with savedVal comparison in _renderMF
MARKER1 = "savedVal === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}"
IDX1 = content.find(MARKER1)
assert IDX1 != -1, "Change 1: marker not found"
assert content.count(MARKER1) == 1, f"Change 1: expected 1, found {content.count(MARKER1)}"

REPLACE1 = "(savedVal || mf.defaultValue || '') === o.value ? 'selected' : ''} ${o.disabled ? 'disabled style=\"color:#aaa\"' : ''}>${o.label}${o.disabled ? ' (Coming Soon)' : ''}</option>`).join('')}"
content = content[:IDX1] + REPLACE1 + content[IDX1 + len(MARKER1):]
print("OK Change 1: _renderMF select updated with disabled + defaultValue")


# ── Change 2: Verification select options ──
MARKER2 = "verifiedVal === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}"
IDX2 = content.find(MARKER2)
assert IDX2 != -1, "Change 2: marker not found"
assert content.count(MARKER2) == 1, f"Change 2: expected 1, found {content.count(MARKER2)}"

REPLACE2 = "verifiedVal === o.value ? 'selected' : ''} ${o.disabled ? 'disabled style=\"color:#aaa\"' : ''}>${o.label}${o.disabled ? ' (Coming Soon)' : ''}</option>`).join('')}"
content = content[:IDX2] + REPLACE2 + content[IDX2 + len(MARKER2):]
print("OK Change 2: Verification select updated with disabled support")


assert content != original, "No changes were made!"

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print("OK File saved with 2 changes")
