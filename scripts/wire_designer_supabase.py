#!/usr/bin/env python3
"""
将 Step 2 设计师状态 (step2DesignerState / designerSelectedStyles) 对接到 Supabase project_designer_state 表。
3 处修改：
1. 在 step2DesignerState 声明后添加 Supabase 持久化辅助函数
2. 修改 toggleStep2Designer: 打开面板时先从 Supabase 加载最新数据
3. 在照片上传/清除/产品选择/风格切换后自动保存
"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r') as f:
    content = f.read()

changes = []

# ═══════════════════════════════════════════════════════
# 1. 在 step2DesignerState 声明后添加 Supabase 持久化辅助函数
# ═══════════════════════════════════════════════════════
anchor1 = """        var step2DesignerState = {};

        function getStep2State(projectId) {"""

insert1 = """        var step2DesignerState = {};
        var _designerDbLoaded = {};  // 标记已从 DB 加载的项目

        // ── Supabase Designer 持久化 ──────────────────────────
        function loadDesignerFromDB(projectId) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
            return NestopiaDB.getClient()
                .from('project_designer_state')
                .select('designer_data')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .eq('project_key', projectId)
                .maybeSingle()
                .then(function(res) {
                    if (res.error) { console.warn('[Designer] DB load error:', res.error.message); return null; }
                    return (res.data && res.data.designer_data) ? res.data.designer_data : null;
                })
                .catch(function(err) { console.warn('[Designer] DB load failed:', err.message); return null; });
        }

        function saveDesignerToDB(projectId) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            var state = getStep2State(projectId);
            var styles = designerSelectedStyles[projectId] || [];
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                designer_data: JSON.parse(JSON.stringify({
                    photos: state.photos,
                    selectedProduct: state.selectedProduct,
                    generated: state.generated,
                    lastResultImage: state.lastResultImage,
                    currentIteration: state.currentIteration,
                    maxIterations: state.maxIterations,
                    selectedStyles: styles
                })),
                updated_at: new Date().toISOString()
            };
            return NestopiaDB.getClient()
                .from('project_designer_state')
                .upsert(payload, { onConflict: 'tenant_id,project_key' })
                .then(function(res) {
                    if (res.error) { console.warn('[Designer] DB save error:', res.error.message); return false; }
                    console.log('[Designer] Saved to Supabase:', projectId);
                    return true;
                })
                .catch(function(err) { console.warn('[Designer] DB save failed:', err.message); return false; });
        }

        function getStep2State(projectId) {"""

if anchor1 in content:
    content = content.replace(anchor1, insert1, 1)
    changes.append("1. 添加 loadDesignerFromDB / saveDesignerToDB 辅助函数")
else:
    print("ERROR: 找不到 step2DesignerState 锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 2. 修改 toggleStep2Designer: 打开面板时先从 Supabase 加载
# ═══════════════════════════════════════════════════════
old_toggle = """            if (panel.classList.contains('hidden')) {
                // Warn if project is past Step 2 — additional fees may apply
                var project = allProjectsData.find(p => p.id === projectId);
                var stepNames = { 3: 'Measurement & Design', 4: 'Quotation', 5: 'Production', 6: 'Installation' };
                if (project && project.workflowStep > 2) {
                    if (!confirm('⚠️ This project is currently at Step ' + project.workflowStep + ' (' + (stepNames[project.workflowStep] || '') + ').\\n\\nRe-launching the AI Designer at this stage may incur additional design fees.\\n\\nDo you want to proceed?')) {
                        return;
                    }
                }
                panel.classList.remove('hidden');"""

new_toggle = """            if (panel.classList.contains('hidden')) {
                // Warn if project is past Step 2 — additional fees may apply
                var project = allProjectsData.find(p => p.id === projectId);
                var stepNames = { 3: 'Measurement & Design', 4: 'Quotation', 5: 'Production', 6: 'Installation' };
                if (project && project.workflowStep > 2) {
                    if (!confirm('⚠️ This project is currently at Step ' + project.workflowStep + ' (' + (stepNames[project.workflowStep] || '') + ').\\n\\nRe-launching the AI Designer at this stage may incur additional design fees.\\n\\nDo you want to proceed?')) {
                        return;
                    }
                }
                // 打开前先从 Supabase 加载最新设计师数据（仅首次）
                if (!_designerDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                    _designerDbLoaded[projectId] = true;
                    loadDesignerFromDB(projectId).then(function(dbData) {
                        if (dbData && typeof dbData === 'object') {
                            var state = getStep2State(projectId);
                            if (dbData.photos && Array.isArray(dbData.photos)) state.photos = dbData.photos;
                            if (dbData.selectedProduct) state.selectedProduct = dbData.selectedProduct;
                            if (dbData.generated !== undefined) state.generated = dbData.generated;
                            if (dbData.lastResultImage) state.lastResultImage = dbData.lastResultImage;
                            if (dbData.currentIteration !== undefined) state.currentIteration = dbData.currentIteration;
                            if (dbData.selectedStyles && Array.isArray(dbData.selectedStyles)) {
                                designerSelectedStyles[projectId] = dbData.selectedStyles;
                            }
                            console.log('[Designer] Loaded from Supabase for', projectId);
                            // 重新渲染面板以反映加载的数据
                            if (expandedStep === 2 && currentDetailProject) {
                                toggleStepDetail(expandedStep, currentDetailProject);
                                toggleStepDetail(expandedStep, currentDetailProject);
                            }
                        }
                    });
                }
                panel.classList.remove('hidden');"""

if old_toggle in content:
    content = content.replace(old_toggle, new_toggle, 1)
    changes.append("2. toggleStep2Designer: 打开面板时先从 Supabase 加载最新设计师数据")
else:
    print("ERROR: 找不到 toggleStep2Designer 面板展开锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 3. 照片上传后自动保存到 Supabase
# ═══════════════════════════════════════════════════════
old_photo_upload = """                    updateStep2PhotoCount(projectId);
                    updateStep2GenerateBtn(projectId);
                };
                reader.readAsDataURL(file);"""

new_photo_upload = """                    updateStep2PhotoCount(projectId);
                    updateStep2GenerateBtn(projectId);
                    // 自动同步到 Supabase
                    saveDesignerToDB(projectId);
                };
                reader.readAsDataURL(file);"""

if old_photo_upload in content:
    content = content.replace(old_photo_upload, new_photo_upload, 1)
    changes.append("3. triggerStep2PhotoUpload: 照片上传后自动保存到 Supabase")
else:
    print("ERROR: 找不到照片上传结束锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 4. 照片清除后自动保存到 Supabase
# ═══════════════════════════════════════════════════════
old_photo_clear = """        function clearStep2Photo(projectId, slotIndex) {
            var state = getStep2State(projectId);
            state.photos[slotIndex] = null;
            var slot = document.getElementById('step2PhotoSlot' + slotIndex + '_' + projectId);
            if (slot) {
                var placeholder = slot.querySelector('.step2-photo-placeholder');
                var img = slot.querySelector('.step2-photo-img');
                var removeBtn = slot.querySelector('.step2-photo-remove');
                if (placeholder) placeholder.classList.remove('hidden');
                if (img) { img.classList.add('hidden'); img.src = ''; }
                if (removeBtn) removeBtn.classList.add('hidden');
            }
            updateStep2PhotoCount(projectId);
            updateStep2GenerateBtn(projectId);
        }"""

new_photo_clear = """        function clearStep2Photo(projectId, slotIndex) {
            var state = getStep2State(projectId);
            state.photos[slotIndex] = null;
            var slot = document.getElementById('step2PhotoSlot' + slotIndex + '_' + projectId);
            if (slot) {
                var placeholder = slot.querySelector('.step2-photo-placeholder');
                var img = slot.querySelector('.step2-photo-img');
                var removeBtn = slot.querySelector('.step2-photo-remove');
                if (placeholder) placeholder.classList.remove('hidden');
                if (img) { img.classList.add('hidden'); img.src = ''; }
                if (removeBtn) removeBtn.classList.add('hidden');
            }
            updateStep2PhotoCount(projectId);
            updateStep2GenerateBtn(projectId);
            // 自动同步到 Supabase
            saveDesignerToDB(projectId);
        }"""

if old_photo_clear in content:
    content = content.replace(old_photo_clear, new_photo_clear, 1)
    changes.append("4. clearStep2Photo: 照片清除后自动保存到 Supabase")
else:
    print("ERROR: 找不到 clearStep2Photo 函数")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 5. 产品选择后自动保存到 Supabase
# ═══════════════════════════════════════════════════════
old_product_select = """            updateStep2GenerateBtn(projectId);
        }

        // --- Generate Button Enable/Disable ---"""

new_product_select = """            updateStep2GenerateBtn(projectId);
            // 自动同步到 Supabase
            saveDesignerToDB(projectId);
        }

        // --- Generate Button Enable/Disable ---"""

if old_product_select in content:
    content = content.replace(old_product_select, new_product_select, 1)
    changes.append("5. selectStep2Product: 产品选择后自动保存到 Supabase")
else:
    print("ERROR: 找不到 selectStep2Product 尾部锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 6. 风格切换后自动保存到 Supabase
# ═══════════════════════════════════════════════════════
old_style_end = """                if (!el.querySelector('.fa-check-circle')) {
                    el.insertAdjacentHTML('beforeend', '<i class="fas fa-check-circle text-indigo-500 text-[10px]"></i>');
                }
            }
        }"""

new_style_end = """                if (!el.querySelector('.fa-check-circle')) {
                    el.insertAdjacentHTML('beforeend', '<i class="fas fa-check-circle text-indigo-500 text-[10px]"></i>');
                }
            }
            // 自动同步到 Supabase
            if (projectId) saveDesignerToDB(projectId);
        }"""

if old_style_end in content:
    content = content.replace(old_style_end, new_style_end, 1)
    changes.append("6. toggleDesignStyle: 风格切换后自动保存到 Supabase")
else:
    print("ERROR: 找不到 toggleDesignStyle 尾部锚点")
    sys.exit(1)

with open(FILE, 'w') as f:
    f.write(content)

print(f"✅ 成功修改 {len(changes)} 处:")
for c in changes:
    print(f"   {c}")
