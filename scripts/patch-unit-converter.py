#!/usr/bin/env python3
"""
Patch company-operations.html to add Inch/mm unit converter support:
1. Add unit-converter.js script tag
2. Add unit toggle switch in Measurement panel (ZB only)
3. Add unit toggle switch in Verification panel
4. Add vinit_ IDs to Initial column for dimension fields
5. Add data-unit-label to verification field labels
"""

import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ── Change 1: Add unit-converter.js script tag after helpers.js ──────
old1 = '    <script src="js/utils/helpers.js?v=88fd51b"></script>'
new1 = '    <script src="js/utils/helpers.js?v=88fd51b"></script>\n    <script src="js/utils/unit-converter.js?v=88fd51b"></script>'

assert content.count(old1) == 1, f"Change 1: Expected 1 occurrence, found {content.count(old1)}"
content = content.replace(old1, new1)
print("✓ Change 1: Added unit-converter.js script tag")


# ── Change 2: Add unit toggle in Measurement panel (between heading and grid) ──
# Insert ZB-only unit toggle pill after the section heading, before the grid
old2 = '''                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-xs font-semibold text-gray-700"><i class="fas ${isZipBlinds ? 'fa-window-maximize' : 'fa-ruler-combined'} text-purple-400 mr-1.5"></i>${isZipBlinds ? 'Opening & Product Specs' : 'Measurement Data'}</span>
                                        <button onclick="Nestopia.steps.step3.saveStep3Measurement('${project.id}')" class="text-[10px] text-purple-600 font-medium hover:text-purple-800 transition"><i class="fas fa-save mr-1"></i>Save</button>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2.5">'''

new2 = '''                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-xs font-semibold text-gray-700"><i class="fas ${isZipBlinds ? 'fa-window-maximize' : 'fa-ruler-combined'} text-purple-400 mr-1.5"></i>${isZipBlinds ? 'Opening & Product Specs' : 'Measurement Data'}</span>
                                        <div class="flex items-center gap-2">
                                            ${isZipBlinds ? `<div class="inline-flex items-center bg-gray-100 rounded-lg p-0.5 text-[10px] font-semibold">
                                                <button id="unitBtnInch_meas_${project.id}" onclick="toggleZBUnit('${project.id}')" class="px-2.5 py-1 rounded-md transition-all bg-purple-600 text-white shadow-sm">in</button>
                                                <button id="unitBtnMM_meas_${project.id}" onclick="toggleZBUnit('${project.id}')" class="px-2.5 py-1 rounded-md transition-all text-gray-500 hover:text-gray-700">mm</button>
                                            </div>` : ''}
                                            <button onclick="Nestopia.steps.step3.saveStep3Measurement('${project.id}')" class="text-[10px] text-purple-600 font-medium hover:text-purple-800 transition"><i class="fas fa-save mr-1"></i>Save</button>
                                        </div>
                                    </div>
                                    <div class="grid grid-cols-2 gap-2.5">'''

assert content.count(old2) == 1, f"Change 2: Expected 1 occurrence, found {content.count(old2)}"
content = content.replace(old2, new2)
print("✓ Change 2: Added unit toggle in Measurement panel")


# ── Change 3: Add unit toggle in Verification panel ──
# Insert between Verification Details section and Tolerance Legend
old3 = '''                        <!-- Tolerance Legend -->
                        <div class="mb-3 flex items-center gap-4 text-[9px] text-gray-400">
                            <span><i class="fas fa-check-circle text-green-500 mr-0.5"></i> Within 3mm (0.12")</span>'''

new3 = '''                        <!-- Unit Toggle (Verification) -->
                        <div class="mb-3 flex items-center justify-between">
                            <div class="flex items-center gap-4 text-[9px] text-gray-400">
                                <span><i class="fas fa-check-circle text-green-500 mr-0.5"></i> Within 3mm (0.12")</span>'''

assert content.count(old3) == 1, f"Change 3a: Expected 1 occurrence, found {content.count(old3)}"
content = content.replace(old3, new3)

# Close the tolerance legend and add toggle
old3b = '''                            <span><i class="fas fa-times-circle text-red-500 mr-0.5"></i> &gt; 5mm (0.20")</span>
                        </div>

                        <!-- Per-Opening Comparison Tables -->'''

new3b = '''                            <span><i class="fas fa-times-circle text-red-500 mr-0.5"></i> &gt; 5mm (0.20")</span>
                            </div>
                            <div class="inline-flex items-center bg-gray-100 rounded-lg p-0.5 text-[10px] font-semibold">
                                <button id="unitBtnInch_verif_${project.id}" onclick="toggleZBUnit('${project.id}')" class="px-2.5 py-1 rounded-md transition-all bg-purple-600 text-white shadow-sm">in</button>
                                <button id="unitBtnMM_verif_${project.id}" onclick="toggleZBUnit('${project.id}')" class="px-2.5 py-1 rounded-md transition-all text-gray-500 hover:text-gray-700">mm</button>
                            </div>
                        </div>

                        <!-- Per-Opening Comparison Tables -->'''

assert content.count(old3b) == 1, f"Change 3b: Expected 1 occurrence, found {content.count(old3b)}"
content = content.replace(old3b, new3b)
print("✓ Change 3: Added unit toggle in Verification panel")


# ── Change 4: Add vinit_ ID to Initial column for dimension fields ──
# Replace the initialDisplay assignment for numeric fields
old4 = "                                initialDisplay = initialVal + (mf.key.includes('_in') ? '\"' : '');"

new4 = """                                if (mf.key === 'width_in' || mf.key === 'height_in') {
                                    initialDisplay = `<span id="vinit_${perKey}_${project.id}">${initialVal}"</span>`;
                                } else {
                                    initialDisplay = initialVal;
                                }"""

assert content.count(old4) == 1, f"Change 4: Expected 1 occurrence, found {content.count(old4)}"
content = content.replace(old4, new4)
print("✓ Change 4: Added vinit_ IDs to Initial column")


# ── Change 5: Add data-unit-label to verification field labels ──
old5 = '''                            <td class="py-2 text-[11px] text-gray-600 pr-2"><i class="fas ${mf.icon} text-purple-400 text-[9px] mr-1"></i>${mf.label}</td>'''

new5 = '''                            <td class="py-2 text-[11px] text-gray-600 pr-2" ${(mf.key === 'width_in' || mf.key === 'height_in') ? 'data-unit-label="' + (mf.key === 'width_in' ? 'Width' : 'Height') + '"' : ''}><i class="fas ${mf.icon} text-purple-400 text-[9px] mr-1"></i>${mf.label}</td>'''

assert content.count(old5) == 1, f"Change 5: Expected 1 occurrence, found {content.count(old5)}"
content = content.replace(old5, new5)
print("✓ Change 5: Added data-unit-label to verification field labels")


# ── Verify ──
assert content != original, "No changes were made!"
print(f"\nAll 5 changes applied successfully.")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✓ File saved: {FILE}")
