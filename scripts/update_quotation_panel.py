#!/usr/bin/env python3
"""
更新 company-operations.html 中的 ZB Quotation Panel HTML 模板。
替换旧的 SKU Grid + Smart Quote 布局为新的 v3.0 利润测算布局。
"""
import re

FILE = '/Users/websterzhang/Documents/Webster Private Info/~Nestopia/Qoder/company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 定位旧的 ZB quotation panel (lines ~7114-7306) ──
# 标记: "// ---- Zip Blinds pricing panel (v2.0 SKU Catalog) ----"
# 到: 闭合 return 后的 "}"

OLD_START = '// ---- Zip Blinds pricing panel (v2.0 SKU Catalog) ----'
# 结束标记: 在 `// ---- Sunroom / Pergola pricing panel ----` 之前
OLD_END = '// ---- Sunroom / Pergola pricing panel ----'

start_idx = content.find(OLD_START)
end_idx = content.find(OLD_END)

if start_idx < 0:
    print(f"ERROR: Cannot find start marker: {OLD_START}")
    exit(1)
if end_idx < 0:
    print(f"ERROR: Cannot find end marker: {OLD_END}")
    exit(1)

# 需要保留 end marker 及其之后的内容
# 我们要替换 start_idx 到 end_idx 之间的内容

NEW_CONTENT = r'''// ---- Zip Blinds pricing panel (v3.0 Profit Calculation Engine) ----
                if (isZB) {
                    const cs = step4State.costSummary;
                    const bp = step4State.businessParams || {};
                    const currOptions = ['SGD', 'RMB', 'USD'];

                    return `
                    <div class="bg-white rounded-lg border border-gray-100 p-4">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center gap-2">
                                <div class="w-7 h-7 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-calculator text-orange-600 text-sm"></i>
                                </div>
                                <div>
                                    <span class="text-sm font-semibold text-gray-700">Profit Calculation Engine</span>
                                    <span class="text-[10px] text-orange-500 ml-2 font-medium">v3.0</span>
                                </div>
                            </div>
                            <button id="step4LaunchBtn_${project.id}" onclick="Nestopia.steps.step4.togglePanel('${project.id}')" class="px-3 py-1.5 bg-orange-600 text-white text-xs font-semibold rounded-lg hover:bg-orange-700 transition flex items-center gap-1.5 shadow-sm">
                                <i class="fas fa-calculator text-[10px]"></i> Open Quotation
                            </button>
                        </div>

                        <!-- Inherited from Measurement -->
                        <div id="step4InheritedSummary_${project.id}" class="mb-4 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                            <div class="flex items-center gap-2 mb-2">
                                <i class="fas fa-arrow-right text-orange-500 text-[10px]"></i>
                                <span class="text-xs font-semibold text-orange-700">Inherited from Measurement</span>
                                <span class="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">${step4State.quantity} opening${step4State.quantity > 1 ? 's' : ''}</span>
                            </div>
                            ${step4State.openings && step4State.openings.length > 1 ? `
                            <div class="space-y-1.5">
                                ${step4State.openings.map((op, idx) => `
                                <div class="flex items-center gap-3 text-[10px]">
                                    <span class="w-4 h-4 bg-indigo-100 rounded flex items-center justify-center text-[9px] font-bold text-indigo-600">${idx + 1}</span>
                                    <span class="text-gray-600">${op.widthIn}" \u00d7 ${op.heightIn}"</span>
                                    <span class="text-gray-500">${op.widthMM}mm \u00d7 ${op.heightMM}mm</span>
                                    <span class="text-orange-600 font-semibold">${op.area.toFixed(2)} m\u00b2</span>
                                    <span class="text-[9px] text-gray-400 ml-auto">${op.sku}</span>
                                </div>`).join('')}
                                <div class="border-t border-orange-200 pt-1.5 mt-1 flex items-center gap-3 text-[10px]">
                                    <span class="w-4 h-4"></span>
                                    <span class="text-gray-700 font-semibold">Total Area</span>
                                    <span class="text-orange-700 font-bold">${step4State.totalArea.toFixed(2)} m\u00b2</span>
                                </div>
                            </div>` : `
                            <div class="grid grid-cols-4 gap-3 text-center">
                                <div><div class="text-[10px] text-gray-500">Openings</div><div class="text-sm font-bold text-gray-800">${step4State.quantity}</div></div>
                                <div><div class="text-[10px] text-gray-500">Width</div><div class="text-sm font-bold text-gray-800">${step4State.openings ? step4State.openings[0].widthIn : '72'}"</div></div>
                                <div><div class="text-[10px] text-gray-500">Height</div><div class="text-sm font-bold text-gray-800">${step4State.openings ? step4State.openings[0].heightIn : '96'}"</div></div>
                                <div><div class="text-[10px] text-gray-500">Area</div><div class="text-sm font-bold text-orange-600">${step4State.unitArea ? step4State.unitArea.toFixed(2) : '0.00'} m\u00b2</div></div>
                            </div>`}
                        </div>

                        <!-- Expandable Quotation Panel -->
                        <div id="step4QuotationPanel_${project.id}" class="hidden" style="animation: fadeInSlide 0.3s ease">

                            <!-- Business Parameters (Collapsible) -->
                            <div class="mb-4 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
                                <div class="flex items-center justify-between mb-2 cursor-pointer" onclick="var el=document.getElementById('step4ParamsGrid_${project.id}');el.classList.toggle('hidden');this.querySelector('.fa-chevron-down,.fa-chevron-up').classList.toggle('fa-chevron-down');this.querySelector('.fa-chevron-down,.fa-chevron-up').classList.toggle('fa-chevron-up')">
                                    <span class="text-[10px] font-semibold text-gray-600"><i class="fas fa-sliders-h text-orange-400 mr-1.5"></i>Business Parameters</span>
                                    <div class="flex items-center gap-2">
                                        <button onclick="event.stopPropagation();Nestopia.steps.step4.resetParams('${project.id}')" class="text-[9px] text-gray-400 hover:text-orange-600" title="Reset to defaults"><i class="fas fa-undo"></i></button>
                                        <i class="fas fa-chevron-down text-[9px] text-gray-400 transition"></i>
                                    </div>
                                </div>
                                <div id="step4ParamsGrid_${project.id}" class="grid grid-cols-3 gap-x-3 gap-y-2 hidden">
                                    <div>
                                        <label class="text-[9px] text-gray-400 block mb-0.5">Supplier Disc.</label>
                                        <input id="step4ParamDisc_${project.id}" type="number" step="0.01" min="0" max="1" value="${bp.supplierDiscountRate || 0.9}" class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] bg-white focus:ring-1 focus:ring-orange-300" onchange="Nestopia.steps.step4.updateParam('${project.id}','supplierDiscountRate',this.value)">
                                    </div>
                                    <div>
                                        <label class="text-[9px] text-gray-400 block mb-0.5">Shipping Rate</label>
                                        <input id="step4ParamShip_${project.id}" type="number" step="0.01" min="0" max="1" value="${bp.shippingCostRate || 0.30}" class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] bg-white focus:ring-1 focus:ring-orange-300" onchange="Nestopia.steps.step4.updateParam('${project.id}','shippingCostRate',this.value)">
                                    </div>
                                    <div>
                                        <label class="text-[9px] text-gray-400 block mb-0.5">Install \u00a5/m\u00b2</label>
                                        <input id="step4ParamInstall_${project.id}" type="number" step="1" min="0" value="${bp.installationFeePerSqm || 191}" class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] bg-white focus:ring-1 focus:ring-orange-300" onchange="Nestopia.steps.step4.updateParam('${project.id}','installationFeePerSqm',this.value)">
                                    </div>
                                    <div>
                                        <label class="text-[9px] text-gray-400 block mb-0.5">Market Markup</label>
                                        <input id="step4ParamMarkup_${project.id}" type="number" step="0.01" min="1" value="${bp.marketMarkup || 2.92}" class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] bg-white focus:ring-1 focus:ring-orange-300" onchange="Nestopia.steps.step4.updateParam('${project.id}','marketMarkup',this.value)">
                                    </div>
                                    <div>
                                        <label class="text-[9px] text-gray-400 block mb-0.5">Pref. Discount</label>
                                        <input id="step4ParamPref_${project.id}" type="number" step="0.01" min="0" max="1" value="${bp.preferentialDiscount || 0.50}" class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] bg-white focus:ring-1 focus:ring-orange-300" onchange="Nestopia.steps.step4.updateParam('${project.id}','preferentialDiscount',this.value)">
                                    </div>
                                    <div>
                                        <label class="text-[9px] text-gray-400 block mb-0.5">Accessory Markup</label>
                                        <input id="step4ParamAcc_${project.id}" type="number" step="0.01" min="0" value="${bp.accessoryMarkupRate || 0.13}" class="w-full px-2 py-1 border border-gray-200 rounded text-[10px] bg-white focus:ring-1 focus:ring-orange-300" onchange="Nestopia.steps.step4.updateParam('${project.id}','accessoryMarkupRate',this.value)">
                                    </div>
                                </div>
                            </div>

                            <!-- Per-Opening Details (dynamically rendered by refreshStep4Panel) -->
                            <div id="step4OpeningsBody_${project.id}" class="mb-4">
                                <div class="text-center text-[10px] text-gray-400 py-4"><i class="fas fa-spinner fa-spin mr-1"></i>Calculating...</div>
                            </div>

                            <!-- Summary (dynamically rendered) -->
                            <div id="step4SummaryBody_${project.id}" class="mb-3"></div>

                            <!-- Profit Bar (dynamically rendered) -->
                            <div id="step4ProfitBar_${project.id}" class="mb-3"></div>

                            <!-- Currency & Exchange Rate -->
                            <div class="grid grid-cols-2 gap-2 mb-3">
                                <div class="space-y-0.5">
                                    <label class="text-[9px] text-gray-400 block"><i class="fas fa-coins text-orange-400 mr-1"></i>Display Currency</label>
                                    <select id="step4Currency_${project.id}" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-orange-300" onchange="updateStep4Config('${project.id}')">
                                        ${currOptions.map(c => '<option value="' + c + '"' + (step4State.currency === c ? ' selected' : '') + '>' + (c === 'RMB' ? 'RMB (\u00a5)' : c === 'USD' ? 'USD ($)' : 'SGD (S$)') + '</option>').join('')}
                                    </select>
                                </div>
                                <div class="space-y-0.5">
                                    <label class="text-[9px] text-gray-400 block"><i class="fas fa-exchange-alt text-orange-400 mr-1"></i>Exchange Rate</label>
                                    <input id="step4ExRate_${project.id}" type="number" step="0.0001" min="0.01" value="${step4State.exchangeRate}" class="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-orange-300" onchange="updateStep4Config('${project.id}')" ${step4State.currency === 'RMB' ? 'disabled' : ''}>
                                </div>
                            </div>

                            <!-- KB Quick Reference -->
                            ${renderKBQuickRefHTML('quotation', project.id)}

                            <!-- Action Buttons -->
                            <div class="flex gap-2 mt-3">
                                <button onclick="Nestopia.steps.step4.calculatePricing('${project.id}')" class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition flex items-center gap-1.5">
                                    <i class="fas fa-sync-alt text-[10px]"></i> Recalculate
                                </button>
                                <button onclick="Nestopia.utils.quotEditor.openQuotationEditor('${project.id}')" class="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold text-xs hover:from-blue-700 hover:to-blue-800 transition shadow-md flex items-center justify-center gap-1.5">
                                    <i class="fas fa-file-invoice-dollar"></i> Generate Quotation
                                </button>
                            </div>
                        </div>
                    </div>`;
                }

                '''

content_new = content[:start_idx] + NEW_CONTENT + content[end_idx:]

# Verify
if '// ---- Zip Blinds pricing panel (v3.0 Profit Calculation Engine) ----' in content_new:
    print("OK: New ZB panel template inserted")
else:
    print("ERROR: New template not found in output")
    exit(1)

if '// ---- Sunroom / Pergola pricing panel ----' in content_new:
    print("OK: Legacy Sunroom/Pergola panel preserved")
else:
    print("ERROR: Legacy panel lost!")
    exit(1)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content_new)

# Count lines
lines_old = content.count('\n')
lines_new = content_new.count('\n')
print(f"File updated: {lines_old} -> {lines_new} lines (delta: {lines_new - lines_old:+d})")
print("SUCCESS: ZB Quotation panel template replaced with v3.0 Profit Calculation Engine")
