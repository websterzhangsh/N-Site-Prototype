#!/usr/bin/env python3
"""
将 intake form 保存/加载对接到 Supabase project_intake_data 表。
3 处修改：
1. 在 getIntakeData 后添加 Supabase 持久化辅助函数
2. 修改 openIntakeModule: 先从 Supabase 加载数据再渲染
3. 修改 saveIntakeModule: 保存后同步写入 Supabase
"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r') as f:
    content = f.read()

changes = []

# ═══════════════════════════════════════════════════════
# 1. 在 getUploadedFiles 函数后添加 Supabase 持久化辅助函数
# ═══════════════════════════════════════════════════════
anchor1 = """        function getUploadedFiles(projectId) {
            if (!intakeUploadedFiles[projectId]) intakeUploadedFiles[projectId] = {};
            return intakeUploadedFiles[projectId];
        }"""

insert_after1 = """        function getUploadedFiles(projectId) {
            if (!intakeUploadedFiles[projectId]) intakeUploadedFiles[projectId] = {};
            return intakeUploadedFiles[projectId];
        }

        // ── Supabase Intake Form 持久化 ──────────────────────────
        var _intakeDbLoaded = {};  // 标记哪些项目已从 DB 加载

        function loadIntakeFromDB(projectId) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
            return NestopiaDB.getClient()
                .from('project_intake_data')
                .select('form_data')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .eq('project_key', projectId)
                .maybeSingle()
                .then(function(res) {
                    if (res.error) { console.warn('[Intake] DB load error:', res.error.message); return null; }
                    return (res.data && res.data.form_data) ? res.data.form_data : null;
                })
                .catch(function(err) { console.warn('[Intake] DB load failed:', err.message); return null; });
        }

        function saveIntakeToDB(projectId, data) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                form_data: JSON.parse(JSON.stringify(data)),
                updated_at: new Date().toISOString()
            };
            return NestopiaDB.getClient()
                .from('project_intake_data')
                .upsert(payload, { onConflict: 'tenant_id,project_key' })
                .then(function(res) {
                    if (res.error) { console.warn('[Intake] DB save error:', res.error.message); return false; }
                    console.log('[Intake] Saved to Supabase:', projectId);
                    return true;
                })
                .catch(function(err) { console.warn('[Intake] DB save failed:', err.message); return false; });
        }"""

if anchor1 in content:
    content = content.replace(anchor1, insert_after1, 1)
    changes.append("1. 添加 loadIntakeFromDB / saveIntakeToDB 辅助函数")
else:
    print("ERROR: 找不到 getUploadedFiles 锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 2. 修改 openIntakeModule: 先从 Supabase 加载再渲染
# ═══════════════════════════════════════════════════════
old_open = """        function openIntakeModule(moduleKey, projectId) {
            const config = INTAKE_MODULE_FIELDS[moduleKey];
            if (!config) return;
            const data = getIntakeData(projectId);
            const files = getUploadedFiles(projectId);"""

new_open = """        function openIntakeModule(moduleKey, projectId) {
            const config = INTAKE_MODULE_FIELDS[moduleKey];
            if (!config) return;

            // 如果还没从 Supabase 加载过，先加载再渲染
            if (!_intakeDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                _intakeDbLoaded[projectId] = true;
                loadIntakeFromDB(projectId).then(function(dbData) {
                    if (dbData && typeof dbData === 'object') {
                        var local = getIntakeData(projectId);
                        // DB 数据合并到内存（DB 优先）
                        Object.keys(dbData).forEach(function(k) { local[k] = dbData[k]; });
                        console.log('[Intake] Loaded from Supabase for', projectId);
                    }
                    _renderIntakeModal(moduleKey, projectId);
                });
                return;
            }

            _renderIntakeModal(moduleKey, projectId);
        }

        function _renderIntakeModal(moduleKey, projectId) {
            const config = INTAKE_MODULE_FIELDS[moduleKey];
            if (!config) return;
            const data = getIntakeData(projectId);
            const files = getUploadedFiles(projectId);"""

if old_open in content:
    content = content.replace(old_open, new_open, 1)
    changes.append("2. openIntakeModule: 先从 Supabase 加载数据再渲染")
else:
    print("ERROR: 找不到 openIntakeModule 函数开头")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 3. 修改 saveIntakeModule: 保存后同步到 Supabase
# ═══════════════════════════════════════════════════════
old_save_end = """            closeIntakeModal();

            // Re-render step detail if open
            if (expandedStep && currentDetailProject) {
                toggleStepDetail(expandedStep, currentDetailProject);
                toggleStepDetail(expandedStep, currentDetailProject);
            }
        }"""

new_save_end = """            closeIntakeModal();

            // 同步到 Supabase
            saveIntakeToDB(projectId, data);

            // Re-render step detail if open
            if (expandedStep && currentDetailProject) {
                toggleStepDetail(expandedStep, currentDetailProject);
                toggleStepDetail(expandedStep, currentDetailProject);
            }
        }"""

if old_save_end in content:
    content = content.replace(old_save_end, new_save_end, 1)
    changes.append("3. saveIntakeModule: 保存后同步到 Supabase")
else:
    print("ERROR: 找不到 saveIntakeModule 尾部")
    sys.exit(1)

with open(FILE, 'w') as f:
    f.write(content)

print(f"✅ 成功修改 {len(changes)} 处:")
for c in changes:
    print(f"   {c}")
