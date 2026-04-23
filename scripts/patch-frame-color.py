#!/usr/bin/env python3
"""
patch-frame-color.py — Frame Color 改为项目级公共字段 + 默认值写入 state

改动:
1. Installation Summary: Frame Color 从 agg('frame_color') 改为读取公共字段 md.frame_color
2. Common field rendering: 渲染时将默认值写入 state（确保 Summary 等可读取）
"""

import sys

HTML_FILE = 'company-operations.html'

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 改动 1: Installation Summary —— Frame Color 从 per-opening 聚合改为公共字段 ──
old_frame_color_summary = "+ row('fa-palette', 'Frame Color', agg('frame_color'))"
new_frame_color_summary = "+ row('fa-palette', 'Frame Color', fmt(md.frame_color || '') || '\\u2014')"

count1 = content.count(old_frame_color_summary)
if count1 == 0:
    print(f"[WARN] 改动 1: 未找到 Installation Summary Frame Color 旧代码")
    print(f"  查找: {old_frame_color_summary!r}")
    sys.exit(1)
elif count1 > 1:
    print(f"[WARN] 改动 1: 匹配数 = {count1}（期望 1）")
    sys.exit(1)

content = content.replace(old_frame_color_summary, new_frame_color_summary, 1)
print(f"[OK] 改动 1: Installation Summary Frame Color → 公共字段读取")

# ── 改动 2: Common field rendering — 将默认值写入 state ──
old_common_field_render = """const fieldRows = commonFields.map(mf => {
                    const savedVal = step3State.measurementData[mf.key] || (mData[mf.key] !== undefined ? String(mData[mf.key]) : '') || mf.defaultValue || '';
                    const extraOC = (mf.key === 'openings') ? "; rebuildZBOpeningSections('" + project.id + "')" : '';
                    return _renderMFWrap(mf, mf.key, savedVal, project.id, extraOC);
                }).join('');"""

new_common_field_render = """const fieldRows = commonFields.map(mf => {
                    const savedVal = step3State.measurementData[mf.key] || (mData[mf.key] !== undefined ? String(mData[mf.key]) : '') || mf.defaultValue || '';
                    // ★ 将默认值写入 state（确保 Installation Summary 等功能可读取）
                    if (!step3State.measurementData[mf.key] && mf.defaultValue) {
                        step3State.measurementData[mf.key] = mf.defaultValue;
                    }
                    const extraOC = (mf.key === 'openings') ? "; rebuildZBOpeningSections('" + project.id + "')" : '';
                    return _renderMFWrap(mf, mf.key, savedVal, project.id, extraOC);
                }).join('');"""

count2 = content.count(old_common_field_render)
if count2 == 0:
    print(f"[WARN] 改动 2: 未找到 common field rendering 旧代码")
    sys.exit(1)
elif count2 > 1:
    print(f"[WARN] 改动 2: 匹配数 = {count2}（期望 1）")
    sys.exit(1)

content = content.replace(old_common_field_render, new_common_field_render, 1)
print(f"[OK] 改动 2: Common field rendering — 默认值写入 state")

# ── 写回文件 ──
with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ 全部 2 处改动已应用到 {HTML_FILE}")
#!/usr/bin/env python3
"""
patch-frame-color.py — Frame Color 改为项目级公共字段 + 默认值写入 state

改动:
1. Installation Summary: Frame Color 从 agg('frame_color') 改为读取公共字段 md.frame_color
2. Common field rendering: 渲染时将默认值写入 state（确保 Summary 等可读取）
"""

import sys

HTML_FILE = 'company-operations.html'

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 改动 1: Installation Summary —— Frame Color 从 per-opening 聚合改为公共字段 ──
old_frame_color_summary = "+ row('fa-palette', 'Frame Color', agg('frame_color'))"
new_frame_color_summary = "+ row('fa-palette', 'Frame Color', fmt(md.frame_color || '') || '\\u2014')"

count1 = content.count(old_frame_color_summary)
if count1 == 0:
    print(f"[WARN] 改动 1: 未找到 Installation Summary Frame Color 旧代码")
    print(f"  查找: {old_frame_color_summary!r}")
    sys.exit(1)
elif count1 > 1:
    print(f"[WARN] 改动 1: 匹配数 = {count1}（期望 1）")
    sys.exit(1)

content = content.replace(old_frame_color_summary, new_frame_color_summary, 1)
print(f"[OK] 改动 1: Installation Summary Frame Color → 公共字段读取")

# ── 改动 2: Common field rendering — 将默认值写入 state ──
old_common_field_render = """const fieldRows = commonFields.map(mf => {
                    const savedVal = step3State.measurementData[mf.key] || (mData[mf.key] !== undefined ? String(mData[mf.key]) : '') || mf.defaultValue || '';
                    const extraOC = (mf.key === 'openings') ? "; rebuildZBOpeningSections('" + project.id + "')" : '';
                    return _renderMFWrap(mf, mf.key, savedVal, project.id, extraOC);
                }).join('');"""

new_common_field_render = """const fieldRows = commonFields.map(mf => {
                    const savedVal = step3State.measurementData[mf.key] || (mData[mf.key] !== undefined ? String(mData[mf.key]) : '') || mf.defaultValue || '';
                    // ★ 将默认值写入 state（确保 Installation Summary 等功能可读取）
                    if (!step3State.measurementData[mf.key] && mf.defaultValue) {
                        step3State.measurementData[mf.key] = mf.defaultValue;
                    }
                    const extraOC = (mf.key === 'openings') ? "; rebuildZBOpeningSections('" + project.id + "')" : '';
                    return _renderMFWrap(mf, mf.key, savedVal, project.id, extraOC);
                }).join('');"""

count2 = content.count(old_common_field_render)
if count2 == 0:
    print(f"[WARN] 改动 2: 未找到 common field rendering 旧代码")
    sys.exit(1)
elif count2 > 1:
    print(f"[WARN] 改动 2: 匹配数 = {count2}（期望 1）")
    sys.exit(1)

content = content.replace(old_common_field_render, new_common_field_render, 1)
print(f"[OK] 改动 2: Common field rendering — 默认值写入 state")

# ── 写回文件 ──
with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n✅ 全部 2 处改动已应用到 {HTML_FILE}")
