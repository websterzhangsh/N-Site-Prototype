#!/usr/bin/env python3
"""
将 Step 3 测量数据 (step3MeasurementState) 对接到 Supabase project_measurements 表。
3 处修改：
1. 在 step3MeasurementState 声明后添加 Supabase 持久化辅助函数
2. 修改 toggleStep3Panel: 打开面板时先从 Supabase 加载最新数据
3. 修改 saveStep3Measurement: 保存后同步写入 Supabase
"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r') as f:
    content = f.read()

changes = []

# ═══════════════════════════════════════════════════════
# 1. 在 step3MeasurementState 声明后添加 Supabase 持久化辅助函数
# ═══════════════════════════════════════════════════════
anchor1 = """        var step3MeasurementState = {};

        function getStep3State(projectId) {"""

insert1 = """        var step3MeasurementState = {};
        var _measurementDbLoaded = {};  // 标记已从 DB 加载的项目

        // ── Supabase Measurement 持久化 ──────────────────────────
        function loadMeasurementFromDB(projectId) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
            return NestopiaDB.getClient()
                .from('project_measurements')
                .select('measurement_data')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .eq('project_key', projectId)
                .maybeSingle()
                .then(function(res) {
                    if (res.error) { console.warn('[Measurement] DB load error:', res.error.message); return null; }
                    return (res.data && res.data.measurement_data) ? res.data.measurement_data : null;
                })
                .catch(function(err) { console.warn('[Measurement] DB load failed:', err.message); return null; });
        }

        function saveMeasurementToDB(projectId, stateObj) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                measurement_data: JSON.parse(JSON.stringify({
                    measurementData: stateObj.measurementData,
                    obstacles: stateObj.obstacles,
                    appointmentScheduled: stateObj.appointmentScheduled,
                    appointmentDate: stateObj.appointmentDate,
                    appointmentTime: stateObj.appointmentTime,
                    measurementComplete: stateObj.measurementComplete
                })),
                updated_at: new Date().toISOString()
            };
            return NestopiaDB.getClient()
                .from('project_measurements')
                .upsert(payload, { onConflict: 'tenant_id,project_key' })
                .then(function(res) {
                    if (res.error) { console.warn('[Measurement] DB save error:', res.error.message); return false; }
                    console.log('[Measurement] Saved to Supabase:', projectId);
                    return true;
                })
                .catch(function(err) { console.warn('[Measurement] DB save failed:', err.message); return false; });
        }

        function getStep3State(projectId) {"""

if anchor1 in content:
    content = content.replace(anchor1, insert1, 1)
    changes.append("1. 添加 loadMeasurementFromDB / saveMeasurementToDB 辅助函数")
else:
    print("ERROR: 找不到 step3MeasurementState 锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 2. 修改 toggleStep3Panel: 打开面板时先从 Supabase 加载
# ═══════════════════════════════════════════════════════
old_toggle = """        function toggleStep3Panel(projectId) {
            var panel = document.getElementById('step3MeasurementPanel_' + projectId);
            var btn = document.getElementById('step3LaunchBtn_' + projectId);
            if (!panel) return;

            if (panel.classList.contains('hidden')) {
                panel.classList.remove('hidden');"""

new_toggle = """        function toggleStep3Panel(projectId) {
            var panel = document.getElementById('step3MeasurementPanel_' + projectId);
            var btn = document.getElementById('step3LaunchBtn_' + projectId);
            if (!panel) return;

            if (panel.classList.contains('hidden')) {
                // 打开前先从 Supabase 加载最新数据（仅首次）
                if (!_measurementDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                    _measurementDbLoaded[projectId] = true;
                    loadMeasurementFromDB(projectId).then(function(dbData) {
                        if (dbData && typeof dbData === 'object') {
                            var state = getStep3State(projectId);
                            if (dbData.measurementData) {
                                Object.keys(dbData.measurementData).forEach(function(k) {
                                    state.measurementData[k] = dbData.measurementData[k];
                                });
                            }
                            if (dbData.obstacles && Array.isArray(dbData.obstacles)) state.obstacles = dbData.obstacles;
                            if (dbData.appointmentScheduled !== undefined) state.appointmentScheduled = dbData.appointmentScheduled;
                            if (dbData.appointmentDate) state.appointmentDate = dbData.appointmentDate;
                            if (dbData.appointmentTime) state.appointmentTime = dbData.appointmentTime;
                            if (dbData.measurementComplete !== undefined) state.measurementComplete = dbData.measurementComplete;
                            console.log('[Measurement] Loaded from Supabase for', projectId);
                            // 重新渲染面板
                            if (expandedStep === 3 && currentDetailProject) {
                                toggleStepDetail(expandedStep, currentDetailProject);
                                toggleStepDetail(expandedStep, currentDetailProject);
                            }
                        }
                    });
                }
                panel.classList.remove('hidden');"""

if old_toggle in content:
    content = content.replace(old_toggle, new_toggle, 1)
    changes.append("2. toggleStep3Panel: 打开面板时先从 Supabase 加载最新数据")
else:
    print("ERROR: 找不到 toggleStep3Panel 函数开头")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 3. 修改 saveStep3Measurement: 保存后同步到 Supabase
# ═══════════════════════════════════════════════════════
old_save = """            showToast('Measurement data saved successfully', 'success');

            // Update generate button"""

new_save = """            showToast('Measurement data saved successfully', 'success');

            // 同步到 Supabase
            saveMeasurementToDB(projectId, state);

            // Update generate button"""

if old_save in content:
    content = content.replace(old_save, new_save, 1)
    changes.append("3. saveStep3Measurement: 保存后同步到 Supabase")
else:
    print("ERROR: 找不到 saveStep3Measurement 保存锚点")
    sys.exit(1)

with open(FILE, 'w') as f:
    f.write(content)

print(f"✅ 成功修改 {len(changes)} 处:")
for c in changes:
    print(f"   {c}")
