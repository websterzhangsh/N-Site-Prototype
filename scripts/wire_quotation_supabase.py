#!/usr/bin/env python3
"""
将 Quotation Editor 报价数据对接到 Supabase project_quotations 表。
涉及变量：quotLineItemsData, quotAccessoriesData, step4QuotationState
4 处修改：
1. 在 quotation 变量声明后添加 Supabase 持久化辅助函数
2. 修改 saveQuotation: 保存到 localStorage 的同时同步到 Supabase
3. 修改 getAllSavedQuotations: 首次调用时从 Supabase 加载
4. 修改 toggleStep4Panel: 打开面板时先从 Supabase 加载 step4 状态
"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r') as f:
    content = f.read()

changes = []

# ═══════════════════════════════════════════════════════
# 1. 在 step4QuotationState 声明后添加 Supabase 持久化辅助函数
# ═══════════════════════════════════════════════════════
anchor1 = """        var step4QuotationState = {};

        function getStep4State(projectId) {"""

insert1 = """        var step4QuotationState = {};
        var _step4DbLoaded = {};  // 标记已从 DB 加载的项目
        var _quotDbLoaded = {};   // 报价列表已从 DB 加载的项目

        // ── Supabase Quotation 持久化 ──────────────────────────
        function loadStep4FromDB(projectId) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
            return NestopiaDB.getClient()
                .from('project_quotations')
                .select('quotation_data')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .eq('project_key', projectId)
                .maybeSingle()
                .then(function(res) {
                    if (res.error) { console.warn('[Quotation] DB load error:', res.error.message); return null; }
                    return (res.data && res.data.quotation_data) ? res.data.quotation_data : null;
                })
                .catch(function(err) { console.warn('[Quotation] DB load failed:', err.message); return null; });
        }

        function saveStep4ToDBAuto(projectId, stateObj) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                quotation_data: JSON.parse(JSON.stringify({
                    step4State: {
                        pricingMode: stateObj.pricingMode,
                        productTier: stateObj.productTier,
                        selectedQuote: stateObj.selectedQuote,
                        discount: stateObj.discount,
                        quantity: stateObj.quantity,
                        widthM: stateObj.widthM,
                        heightM: stateObj.heightM,
                        unitArea: stateObj.unitArea,
                        fabric: stateObj.fabric,
                        driveSystem: stateObj.driveSystem,
                        lengthFt: stateObj.lengthFt,
                        widthFt: stateObj.widthFt,
                        areaSqft: stateObj.areaSqft,
                        glassType: stateObj.glassType,
                        louverType: stateObj.louverType
                    }
                })),
                updated_at: new Date().toISOString()
            };
            return NestopiaDB.getClient()
                .from('project_quotations')
                .upsert(payload, { onConflict: 'tenant_id,project_key' })
                .then(function(res) {
                    if (res.error) { console.warn('[Quotation] DB save error:', res.error.message); return false; }
                    console.log('[Quotation] Step4 state saved to Supabase:', projectId);
                    return true;
                })
                .catch(function(err) { console.warn('[Quotation] DB save failed:', err.message); return false; });
        }

        function saveQuotListToDB(projectId, quotList) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            // 读取现有记录并合并 savedQuotations 字段
            return loadStep4FromDB(projectId).then(function(existing) {
                var data = (existing && typeof existing === 'object') ? existing : {};
                data.savedQuotations = quotList;
                var payload = {
                    tenant_id: NestopiaDB.getTenantId(),
                    project_key: projectId,
                    quotation_data: JSON.parse(JSON.stringify(data)),
                    updated_at: new Date().toISOString()
                };
                return NestopiaDB.getClient()
                    .from('project_quotations')
                    .upsert(payload, { onConflict: 'tenant_id,project_key' })
                    .then(function(res) {
                        if (res.error) { console.warn('[Quotation] DB save list error:', res.error.message); return false; }
                        console.log('[Quotation] Quotation list saved to Supabase:', projectId);
                        return true;
                    });
            }).catch(function(err) { console.warn('[Quotation] DB save list failed:', err.message); return false; });
        }

        function getStep4State(projectId) {"""

if anchor1 in content:
    content = content.replace(anchor1, insert1, 1)
    changes.append("1. 添加 loadStep4FromDB / saveStep4ToDBAuto / saveQuotListToDB 辅助函数")
else:
    print("ERROR: 找不到 step4QuotationState 锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 2. 修改 toggleStep4Panel: 打开面板时先从 Supabase 加载 step4 状态
# ═══════════════════════════════════════════════════════
old_toggle = """            if (panel.classList.contains('hidden')) {
                // Warn if project is at Step 5 or 6 — contract re-generation risk
                var project = allProjectsData.find(function(p) { return p.id === projectId; });
                if (project && project.workflowStep >= 5) {
                    var stepNames = { 5: 'Production', 6: 'Installation' };
                    if (!confirm('⚠️ This project is currently at Step ' + project.workflowStep + ' (' + (stepNames[project.workflowStep] || '') + ').\\n\\nRe-opening the Quotation panel at this stage may trigger Contract Re-generation, which could affect production schedules, material orders, and existing agreements.\\n\\nAre you sure you want to proceed?')) {
                        return;
                    }
                }
                panel.classList.remove('hidden');"""

new_toggle = """            if (panel.classList.contains('hidden')) {
                // Warn if project is at Step 5 or 6 — contract re-generation risk
                var project = allProjectsData.find(function(p) { return p.id === projectId; });
                if (project && project.workflowStep >= 5) {
                    var stepNames = { 5: 'Production', 6: 'Installation' };
                    if (!confirm('⚠️ This project is currently at Step ' + project.workflowStep + ' (' + (stepNames[project.workflowStep] || '') + ').\\n\\nRe-opening the Quotation panel at this stage may trigger Contract Re-generation, which could affect production schedules, material orders, and existing agreements.\\n\\nAre you sure you want to proceed?')) {
                        return;
                    }
                }
                // 打开前先从 Supabase 加载最新 Step4 状态（仅首次）
                if (!_step4DbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                    _step4DbLoaded[projectId] = true;
                    loadStep4FromDB(projectId).then(function(dbData) {
                        if (dbData && dbData.step4State && typeof dbData.step4State === 'object') {
                            var state = getStep4State(projectId);
                            var s4 = dbData.step4State;
                            // 合并 DB 数据到内存（DB 优先）
                            if (s4.pricingMode) state.pricingMode = s4.pricingMode;
                            if (s4.productTier) state.productTier = s4.productTier;
                            if (s4.selectedQuote) state.selectedQuote = s4.selectedQuote;
                            if (s4.discount !== undefined) state.discount = s4.discount;
                            if (s4.quantity !== undefined) state.quantity = s4.quantity;
                            if (s4.widthM !== undefined) state.widthM = s4.widthM;
                            if (s4.heightM !== undefined) state.heightM = s4.heightM;
                            if (s4.unitArea !== undefined) state.unitArea = s4.unitArea;
                            if (s4.fabric) state.fabric = s4.fabric;
                            if (s4.driveSystem) state.driveSystem = s4.driveSystem;
                            if (s4.lengthFt !== undefined) state.lengthFt = s4.lengthFt;
                            if (s4.widthFt !== undefined) state.widthFt = s4.widthFt;
                            if (s4.areaSqft !== undefined) state.areaSqft = s4.areaSqft;
                            if (s4.glassType) state.glassType = s4.glassType;
                            if (s4.louverType) state.louverType = s4.louverType;
                            // 重新计算定价
                            var proj = allProjectsData.find(function(p) { return p.id === projectId; });
                            state.costSummary = calcStep4Cost(proj, state);
                            console.log('[Quotation] Step4 state loaded from Supabase for', projectId);
                            refreshStep4Panel(projectId);
                        }
                    });
                }
                panel.classList.remove('hidden');"""

if old_toggle in content:
    content = content.replace(old_toggle, new_toggle, 1)
    changes.append("2. toggleStep4Panel: 打开面板时先从 Supabase 加载 Step4 状态")
else:
    print("ERROR: 找不到 toggleStep4Panel 面板展开锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 3. 修改 saveQuotation: 保存后同步到 Supabase
# ═══════════════════════════════════════════════════════
old_save = """            try {
                localStorage.setItem(getQuotStorageKey(quotCurrentProjectId), JSON.stringify(list));
                showToast('Quotation saved ✓', 'success');
                refreshQuotLoadDropdown(quotCurrentProjectId);
            } catch(e) {
                showToast('Failed to save: storage full', 'error');
            }"""

new_save = """            try {
                localStorage.setItem(getQuotStorageKey(quotCurrentProjectId), JSON.stringify(list));
                showToast('Quotation saved ✓', 'success');
                refreshQuotLoadDropdown(quotCurrentProjectId);
                // 同步到 Supabase
                saveQuotListToDB(quotCurrentProjectId, list);
            } catch(e) {
                showToast('Failed to save: storage full', 'error');
            }"""

if old_save in content:
    content = content.replace(old_save, new_save, 1)
    changes.append("3. saveQuotation: 保存后同步报价列表到 Supabase")
else:
    print("ERROR: 找不到 saveQuotation localStorage 锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 4. 修改 getAllSavedQuotations: 首次调用时从 Supabase 补充
# ═══════════════════════════════════════════════════════
old_getall = """        function getAllSavedQuotations(projectId) {
            try {
                var key = getQuotStorageKey(projectId);
                var data = localStorage.getItem(key);
                return data ? JSON.parse(data) : [];
            } catch(e) { return []; }
        }"""

new_getall = """        function getAllSavedQuotations(projectId) {
            try {
                var key = getQuotStorageKey(projectId);
                var data = localStorage.getItem(key);
                var localList = data ? JSON.parse(data) : [];
                // 首次调用时从 Supabase 补充（异步，下次调用生效）
                if (!_quotDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                    _quotDbLoaded[projectId] = true;
                    loadStep4FromDB(projectId).then(function(dbData) {
                        if (dbData && dbData.savedQuotations && Array.isArray(dbData.savedQuotations)) {
                            var localKey = getQuotStorageKey(projectId);
                            var existingRaw = localStorage.getItem(localKey);
                            var existingList = existingRaw ? JSON.parse(existingRaw) : [];
                            var existingIds = {};
                            existingList.forEach(function(q) { existingIds[q.id] = true; });
                            var merged = existingList.slice();
                            dbData.savedQuotations.forEach(function(q) {
                                if (!existingIds[q.id]) merged.push(q);
                            });
                            // 按时间倒序
                            merged.sort(function(a, b) { return new Date(b.savedAt) - new Date(a.savedAt); });
                            if (merged.length > 20) merged = merged.slice(0, 20);
                            localStorage.setItem(localKey, JSON.stringify(merged));
                            console.log('[Quotation] Synced', dbData.savedQuotations.length, 'quotations from Supabase');
                            refreshQuotLoadDropdown(projectId);
                        }
                    });
                }
                return localList;
            } catch(e) { return []; }
        }"""

if old_getall in content:
    content = content.replace(old_getall, new_getall, 1)
    changes.append("4. getAllSavedQuotations: 首次调用时从 Supabase 补充报价列表")
else:
    print("ERROR: 找不到 getAllSavedQuotations 函数")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 5. 修改 updateStep4Config: 更新配置后自动保存到 Supabase
# ═══════════════════════════════════════════════════════
old_config = """        function updateStep4Config(projectId) {
            var state = getStep4State(projectId);
            var project = allProjectsData.find(p => p.id === projectId);
            var isZB = project && project.type === 'Zip Blinds';
            var isSR = project && project.type === 'Sunroom';
            if (isZB) {
                var fabEl = document.getElementById('step4Fabric_' + projectId);
                var driveEl = document.getElementById('step4Drive_' + projectId);
                var discEl = document.getElementById('step4Discount_' + projectId);
                if (fabEl) state.fabric = fabEl.value;
                if (driveEl) state.driveSystem = driveEl.value;
                if (discEl) state.discount = parseInt(discEl.value) || 0;
            } else if (isSR) {
                var glassEl = document.getElementById('step4Glass_' + projectId);
                if (glassEl) state.glassType = glassEl.value;
            } else {
                var louverEl = document.getElementById('step4Louver_' + projectId);
                if (louverEl) state.louverType = louverEl.value;
            }
            state.costSummary = calcStep4Cost(project, state);
            refreshStep4Panel(projectId);
        }"""

new_config = """        function updateStep4Config(projectId) {
            var state = getStep4State(projectId);
            var project = allProjectsData.find(p => p.id === projectId);
            var isZB = project && project.type === 'Zip Blinds';
            var isSR = project && project.type === 'Sunroom';
            if (isZB) {
                var fabEl = document.getElementById('step4Fabric_' + projectId);
                var driveEl = document.getElementById('step4Drive_' + projectId);
                var discEl = document.getElementById('step4Discount_' + projectId);
                if (fabEl) state.fabric = fabEl.value;
                if (driveEl) state.driveSystem = driveEl.value;
                if (discEl) state.discount = parseInt(discEl.value) || 0;
            } else if (isSR) {
                var glassEl = document.getElementById('step4Glass_' + projectId);
                if (glassEl) state.glassType = glassEl.value;
            } else {
                var louverEl = document.getElementById('step4Louver_' + projectId);
                if (louverEl) state.louverType = louverEl.value;
            }
            state.costSummary = calcStep4Cost(project, state);
            refreshStep4Panel(projectId);
            // 自动同步到 Supabase
            saveStep4ToDBAuto(projectId, state);
        }"""

if old_config in content:
    content = content.replace(old_config, new_config, 1)
    changes.append("5. updateStep4Config: 配置变更后自动同步到 Supabase")
else:
    print("ERROR: 找不到 updateStep4Config 函数")
    sys.exit(1)

with open(FILE, 'w') as f:
    f.write(content)

print(f"✅ 成功修改 {len(changes)} 处:")
for c in changes:
    print(f"   {c}")
