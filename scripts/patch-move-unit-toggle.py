#!/usr/bin/env python3
"""
将 Verification 单位切换器从面板内部移动到 Measurement Verification 头部
使其始终可见，同时影响 Initial Summary 和 Verification Details 两个区域

变更:
1. 在 Measurement Verification header 的 Close/Open 按钮旁添加 [in|mm] 切换器
2. 从 Verification Details 内部移除旧的切换器，保留 Tolerance Legend
"""
import os, sys

html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'company-operations.html')

with open(html_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f'Read {len(lines)} lines from company-operations.html', flush=True)

# ── Change 1: 在 header 的 Close/Open 按钮外包一层 flex，插入 unit toggle ──
header_start = None
header_end = None

for i, line in enumerate(lines):
    if 'zbVerifToggleBtn_${project.id}' in line and 'toggleVerificationPanel' in line:
        header_start = i
        # 找到 </button> 结束行
        for j in range(i + 1, min(i + 5, len(lines))):
            if '</button>' in lines[j]:
                header_end = j
                break
        break

if header_start is None or header_end is None:
    print('ERROR: Could not find verification header button', flush=True)
    sys.exit(1)

print(f'Change 1: Found header button at lines {header_start + 1}-{header_end + 1}', flush=True)

# ── Change 2: 找到面板内的 Unit Toggle 块 ──
toggle_start = None
toggle_end = None

for i, line in enumerate(lines):
    if '<!-- Unit Toggle (Verification) -->' in line:
        toggle_start = i
        # 找到 unitBtnMM_verif_ 行，然后找之后的两个 </div>
        for j in range(i + 1, min(i + 20, len(lines))):
            if 'unitBtnMM_verif_' in lines[j]:
                div_closes = 0
                for k in range(j + 1, min(j + 5, len(lines))):
                    stripped = lines[k].strip()
                    if stripped == '</div>' or stripped.startswith('</div>'):
                        div_closes += 1
                        if div_closes >= 2:
                            toggle_end = k
                            break
                break
        break

if toggle_start is None or toggle_end is None:
    print('ERROR: Could not find old unit toggle block', flush=True)
    sys.exit(1)

print(f'Change 2: Found old toggle block at lines {toggle_start + 1}-{toggle_end + 1}', flush=True)

# ── 应用变更（从后往前，避免行号偏移）──

# Change 2: 替换旧的 toggle 块为纯 Tolerance Legend
base2 = '                        '
legend_lines = [
    base2 + '<!-- Tolerance Legend -->\n',
    base2 + '<div class="mb-3 flex items-center gap-4 text-[9px] text-gray-400">\n',
    base2 + '    <span><i class="fas fa-check-circle text-green-500 mr-0.5"></i> Within 3mm (0.12\u201d)</span>\n',
    base2 + '    <span><i class="fas fa-exclamation-triangle text-amber-500 mr-0.5"></i> 3\u20135mm (0.12\u201d\u20130.20\u201d)</span>\n',
    base2 + '    <span><i class="fas fa-times-circle text-red-500 mr-0.5"></i> &gt; 5mm (0.20\u201d)</span>\n',
    base2 + '</div>\n',
]
lines[toggle_start:toggle_end + 1] = legend_lines
print(f'Change 2: Replaced lines {toggle_start + 1}-{toggle_end + 1} with tolerance legend only \u2713', flush=True)

# Change 1: 包裹 header 按钮，添加 unit toggle（Change 2 已完成，行号不受影响因为 Change 2 在后面）
# 注意: toggle_start > header_end, 所以 Change 2 的行号偏移不影响 header 位置
# 但如果 toggle_start > header_start, Change 2 的替换会影响行号。让我重新检查...
# header_start ~ line 6974, toggle_start ~ line 7011, 所以 toggle 在 header 之后
# 从后往前应用意味着先改 toggle（后面的），再改 header（前面的）
# 但我已经改了 toggle，现在 lines 数组已经变了，header 的行号可能变了吗？
# 不会，因为 toggle_start > header_start，修改 toggle 不影响 header 之前的行号

base1 = '                        '
# 保存原始按钮行
btn_lines = lines[header_start:header_end + 1]
# 构建新的包装结构
new_header_lines = [
    base1 + '<div class="flex items-center gap-2">\n',
    base1 + '    <div class="inline-flex items-center bg-gray-100 rounded-lg p-0.5 text-[10px] font-semibold">\n',
    base1 + "        <button id=\"unitBtnInch_verif_${project.id}\" onclick=\"toggleZBUnit('${project.id}')\" class=\"px-2.5 py-1 rounded-md transition-all bg-purple-600 text-white shadow-sm\">in</button>\n",
    base1 + "        <button id=\"unitBtnMM_verif_${project.id}\" onclick=\"toggleZBUnit('${project.id}')\" class=\"px-2.5 py-1 rounded-md transition-all text-gray-500 hover:text-gray-700\">mm</button>\n",
    base1 + '    </div>\n',
]
# 添加原始按钮行（增加 4 空格缩进）
for bl in btn_lines:
    new_header_lines.append('    ' + bl)
new_header_lines.append(base1 + '</div>\n')

lines[header_start:header_end + 1] = new_header_lines
print(f'Change 1: Added unit toggle to header at lines {header_start + 1}-{header_end + 1} \u2713', flush=True)

# ── 写回文件 ──
with open(html_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('SUCCESS: Unit toggle moved to Measurement Verification header.', flush=True)
