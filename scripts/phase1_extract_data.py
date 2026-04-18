#!/usr/bin/env python3
"""Phase 1.7: 修改 company-operations.html — 数据定义 → 命名空间别名 + script 标签"""
import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    lines = f.readlines()

original_count = len(lines)
print(f'原始行数: {original_count}')


def find_idx(pattern, start=0):
    for i in range(start, len(lines)):
        if pattern in lines[i]:
            return i
    raise ValueError(f'NOT FOUND: "{pattern}" from line {start}')


def find_idx_rev(pattern, before):
    for i in range(before - 1, -1, -1):
        if pattern in lines[i]:
            return i
    raise ValueError(f'NOT FOUND (reverse): "{pattern}" before line {before}')


changes = []

# Block 1: quotI18n
b1_start = find_idx('// ===== Quotation i18n Dictionary =====')
b1_end_after = find_idx('function getQuotText(key)', b1_start)
b1_end = find_idx_rev('};', b1_end_after)
print(f'Block 1 (quotI18n): lines {b1_start+1}-{b1_end+1}')
changes.append((b1_start, b1_end, [
    '        // ===== Quotation i18n Dictionary (→ js/data/i18n-dict.js) =====\n',
    '        const quotI18n = Nestopia.data.i18nDict.quotI18n;\n',
]))

# Block 2: ZB Pricing Data
b2_start = find_idx('// ===== Zip Blinds Pricing Data (SAMPLE')
b2_end = find_idx('const zbHardwareCostPerUnit = 30;', b2_start)
print(f'Block 2 (pricing): lines {b2_start+1}-{b2_end+1}')
changes.append((b2_start, b2_end, [
    '        // ===== Zip Blinds Pricing Data (→ js/data/pricing-data.js) =====\n',
    '        const zbProductTiers = Nestopia.data.pricing.zbProductTiers;\n',
    '        const zbDriveSystems = Nestopia.data.pricing.zbDriveSystems;\n',
    '        const zbFabricUpgrades = Nestopia.data.pricing.zbFabricUpgrades;\n',
    '        const zbHeightSurcharges = Nestopia.data.pricing.zbHeightSurcharges;\n',
    '        const zbHardwareCostPerUnit = Nestopia.data.pricing.zbHardwareCostPerUnit;\n',
]))

# Block 3: productCatalog
b3_start = find_idx('// Product Catalog Data (from')
b3_end_after = find_idx('Product Catalog: Supabase CRUD', b3_start)
b3_end = find_idx_rev('};', b3_end_after)
print(f'Block 3 (productCatalog): lines {b3_start+1}-{b3_end+1}')
changes.append((b3_start, b3_end, [
    '        // Product Catalog Data (→ js/data/product-catalog.js)\n',
    '        let productCatalog = Nestopia.data.productCatalog;\n',
]))

# Block 4: STEP_DETAIL_CONFIG + ZB configs
b4_start = find_idx('// ===== Step Detail Data (per-step')
b4_end_after = find_idx('// ===== Zip Blinds Tenant-Level Product Knowledge Base', b4_start)
b4_end = find_idx_rev('];', b4_end_after)
print(f'Block 4 (stepConfig): lines {b4_start+1}-{b4_end+1}')
changes.append((b4_start, b4_end, [
    '        // ===== Step/Workflow Config (→ js/data/step-config.js) =====\n',
    '        const STEP_DETAIL_CONFIG = Nestopia.data.stepConfig.STEP_DETAIL_CONFIG;\n',
    '        const ZB_STEP_CONFIGS = Nestopia.data.stepConfig.ZB_STEP_CONFIGS;\n',
    '        const ZB_COMBINED_CONFIG = Nestopia.data.stepConfig.ZB_COMBINED_CONFIG;\n',
    '        const ZB_WORKFLOW_STEPS = Nestopia.data.stepConfig.ZB_WORKFLOW_STEPS;\n',
]))

# Block 5: INTAKE_MODULE_FIELDS
b5_start = find_idx('const INTAKE_MODULE_FIELDS = {')
b5_end_after = find_idx('function getIntakeData(', b5_start)
b5_end = find_idx_rev('};', b5_end_after)
print(f'Block 5 (intakeFields): lines {b5_start+1}-{b5_end+1}')
changes.append((b5_start, b5_end, [
    '        // Intake 表单模块字段定义 (→ js/data/intake-fields.js)\n',
    '        const INTAKE_MODULE_FIELDS = Nestopia.data.intakeFields.INTAKE_MODULE_FIELDS;\n',
]))

# Block 6: Seed Projects
b6_start = find_idx('// --- Greenscape Builders')
b6_end_after = find_idx('let allProjectsData = tenantProjectsMap', b6_start)
b6_end = find_idx_rev('};', b6_end_after)
print(f'Block 6 (seedProjects): lines {b6_start+1}-{b6_end+1}')
changes.append((b6_start, b6_end, [
    '        // Seed Projects (→ js/data/seed-projects.js)\n',
    '        const greenscapeProjects = Nestopia.data.seedProjects.greenscapeProjects;\n',
    '        const omeyaSinProjects = Nestopia.data.seedProjects.omeyaSinProjects;\n',
    '        const nestopiaChnProjects = Nestopia.data.seedProjects.nestopiaChnProjects;\n',
    '        const tenantProjectsMap = Nestopia.data.seedProjects.tenantProjectsMap;\n',
]))

# 从后往前替换
changes.sort(key=lambda x: x[0], reverse=True)
total_removed = 0
for start, end, replacement in changes:
    old_count = end - start + 1
    lines[start:end + 1] = replacement
    removed = old_count - len(replacement)
    total_removed += removed
    print(f'  替换 {old_count} 行 → {len(replacement)} 行 (净减 {removed})')

# 插入 script 标签
auth_idx = find_idx('// ===== Authentication =====')
script_tag_idx = find_idx_rev('<script>', auth_idx)
print(f'\n插入 script 标签在行 {script_tag_idx + 1} 前')

script_tags = [
    '\n',
    '    <!-- JS 模块化文件 (Phase 1 — 数据层) -->\n',
    '    <script src="js/core/namespace.js"></script>\n',
    '    <script src="js/data/i18n-dict.js"></script>\n',
    '    <script src="js/data/pricing-data.js"></script>\n',
    '    <script src="js/data/product-catalog.js"></script>\n',
    '    <script src="js/data/step-config.js"></script>\n',
    '    <script src="js/data/intake-fields.js"></script>\n',
    '    <script src="js/data/seed-projects.js"></script>\n',
]
lines[script_tag_idx:script_tag_idx] = script_tags

with open(FILE, 'w', encoding='utf-8') as f:
    f.writelines(lines)

new_count = len(lines)
print(f'\n完成! {original_count} → {new_count} 行 (净减 {original_count - new_count} 行)')
