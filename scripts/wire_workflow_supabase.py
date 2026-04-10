#!/usr/bin/env python3
"""
将工作流状态 (workflowProjects) 对接到 Supabase project_workflow_state 表。
3 处修改：
1. 在 workflowProjects 声明后添加 Supabase 持久化辅助函数
2. 修改 renderWorkflowPipeline: 初次渲染时从 Supabase 加载覆写
3. 修改 advanceStep: 真正推进步骤并保存到 Supabase
"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r') as f:
    content = f.read()

changes = []

# ═══════════════════════════════════════════════════════
# 1. 在 workflowProjects 声明后添加 Supabase 辅助函数
# ═══════════════════════════════════════════════════════
anchor1 = """        const workflowProjects = getWorkflowProjects();

        function getStepMeta(step) { return WORKFLOW_STEPS.find(s => s.step === step) || WORKFLOW_STEPS[0]; }"""

insert1 = """        const workflowProjects = getWorkflowProjects();
        var _workflowDbLoaded = false;  // 标记是否已从 DB 加载

        // ── Supabase Workflow 持久化 ──────────────────────────
        function loadWorkflowFromDB() {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
            return NestopiaDB.getClient()
                .from('project_workflow_state')
                .select('project_key,workflow_data')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .then(function(res) {
                    if (res.error) { console.warn('[Workflow] DB load error:', res.error.message); return null; }
                    return res.data || [];
                })
                .catch(function(err) { console.warn('[Workflow] DB load failed:', err.message); return null; });
        }

        function saveWorkflowToDB(projectId) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            var project = workflowProjects.find(function(p) { return p.id === projectId; });
            if (!project) return Promise.resolve(false);
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                workflow_data: JSON.parse(JSON.stringify({
                    workflowStep: project.workflowStep,
                    payments: project.payments,
                    checklist: project.checklist,
                    documents: project.documents,
                    questionnaire: project.questionnaire,
                    hoa: project.hoa,
                    notes: project.notes,
                    config: project.config,
                    installation: project.installation
                })),
                updated_at: new Date().toISOString()
            };
            return NestopiaDB.getClient()
                .from('project_workflow_state')
                .upsert(payload, { onConflict: 'tenant_id,project_key' })
                .then(function(res) {
                    if (res.error) { console.warn('[Workflow] DB save error:', res.error.message); return false; }
                    console.log('[Workflow] Saved to Supabase:', projectId);
                    return true;
                })
                .catch(function(err) { console.warn('[Workflow] DB save failed:', err.message); return false; });
        }

        function applyWorkflowOverrides(dbRows) {
            if (!dbRows || !Array.isArray(dbRows)) return;
            dbRows.forEach(function(row) {
                var project = workflowProjects.find(function(p) { return p.id === row.project_key; });
                if (!project || !row.workflow_data) return;
                var d = row.workflow_data;
                if (d.workflowStep !== undefined) project.workflowStep = d.workflowStep;
                if (d.payments) project.payments = d.payments;
                if (d.checklist) project.checklist = d.checklist;
                if (d.documents) project.documents = d.documents;
                if (d.questionnaire) project.questionnaire = d.questionnaire;
                if (d.hoa !== undefined) project.hoa = d.hoa;
                if (d.notes !== undefined) project.notes = d.notes;
                if (d.config) project.config = d.config;
                if (d.installation) project.installation = d.installation;
            });
            console.log('[Workflow] Applied', dbRows.length, 'overrides from Supabase');
        }

        function getStepMeta(step) { return WORKFLOW_STEPS.find(s => s.step === step) || WORKFLOW_STEPS[0]; }"""

if anchor1 in content:
    content = content.replace(anchor1, insert1, 1)
    changes.append("1. 添加 loadWorkflowFromDB / saveWorkflowToDB / applyWorkflowOverrides 辅助函数")
else:
    print("ERROR: 找不到 workflowProjects 锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 2. 修改 renderWorkflowPipeline: 首次渲染时从 Supabase 加载
# ═══════════════════════════════════════════════════════
old_render = """        function renderWorkflowPipeline() {
            const el = document.getElementById('workflowPipeline');
            if (!el) return;"""

new_render = """        function renderWorkflowPipeline() {
            const el = document.getElementById('workflowPipeline');
            if (!el) return;
            // 首次渲染时从 Supabase 加载覆写数据
            if (!_workflowDbLoaded && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                _workflowDbLoaded = true;
                loadWorkflowFromDB().then(function(rows) {
                    if (rows && rows.length > 0) {
                        applyWorkflowOverrides(rows);
                        renderWorkflowPipeline();  // 重新渲染
                        renderWorkflowTable();
                    }
                });
            }"""

if old_render in content:
    content = content.replace(old_render, new_render, 1)
    changes.append("2. renderWorkflowPipeline: 首次渲染时从 Supabase 加载覆写")
else:
    print("ERROR: 找不到 renderWorkflowPipeline 函数开头")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 3. 修改 advanceStep: 真正推进步骤并保存到 Supabase
# ═══════════════════════════════════════════════════════
old_advance = """        function advanceStep(projectId) {
            var project = workflowProjects.find(function(p) { return p.id === projectId; });
            if (!project || project.workflowStep >= 6) return;
            alert('Advance to Step ' + (project.workflowStep + 1) + '\\n\\nProject: ' + project.name + '\\nFrom: Step ' + project.workflowStep + ' (' + getStepMeta(project.workflowStep).name + ')\\nTo: Step ' + (project.workflowStep + 1) + ' (' + getStepMeta(project.workflowStep + 1).name + ')\\n\\n(Backend integration pending)');
        }"""

new_advance = """        function advanceStep(projectId) {
            var project = workflowProjects.find(function(p) { return p.id === projectId; });
            if (!project || project.workflowStep >= 6) return;
            var fromStep = project.workflowStep;
            var toStep = fromStep + 1;
            if (!confirm('Advance project "' + project.name + '" from Step ' + fromStep + ' (' + getStepMeta(fromStep).name + ') to Step ' + toStep + ' (' + getStepMeta(toStep).name + ')?')) return;
            project.workflowStep = toStep;
            // 初始化新步骤的 checklist
            if (!project.checklist[toStep]) project.checklist[toStep] = { total: 5, done: 0 };
            if (!project.documents[toStep]) project.documents[toStep] = 0;
            // 保存到 Supabase
            saveWorkflowToDB(projectId);
            // 重新渲染
            renderWorkflowPipeline();
            renderWorkflowTable();
            showToast('Project advanced to Step ' + toStep + ': ' + getStepMeta(toStep).name, 'success');
        }"""

if old_advance in content:
    content = content.replace(old_advance, new_advance, 1)
    changes.append("3. advanceStep: 真正推进步骤并保存到 Supabase（替代 alert 占位符）")
else:
    print("ERROR: 找不到 advanceStep 函数")
    sys.exit(1)

with open(FILE, 'w') as f:
    f.write(content)

print(f"✅ 成功修改 {len(changes)} 处:")
for c in changes:
    print(f"   {c}")
