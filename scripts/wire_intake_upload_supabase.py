#!/usr/bin/env python3
"""
wire_intake_upload_supabase.py — Intake Form 文件上传接入 Supabase Storage
==========================================================================
解决问题：
1. 三个 handleFileUpload 同名函数互相覆盖 — 重命名为各自独立名称
2. Intake Form 上传只存元数据到内存 — 接入 Supabase Storage 真正上传
3. Workflow Step Upload 是 alert placeholder — 接入真正上传
4. 上传后显示缩略图预览 + 签名 URL

修改清单：
  Mod 1: 重命名第 10466 行 handleFileUpload → handleIntakeFileUpload（Intake Form 用）
  Mod 2: 更新 Intake Form 的 onchange 调用指向新名称
  Mod 3: 重写 handleIntakeFileUpload 接入 Supabase Storage
  Mod 4: 重写 removeUploadedFile 支持 Supabase 删除
  Mod 5: 更新 upload list 展示签名 URL 缩略图
  Mod 6: 重写第 14029 行 handleFileUpload → handleStepFileUpload（Workflow Step 用）
  Mod 7: 更新 Workflow Step Upload 按钮调用指向新名称
"""

import sys
import os

TARGET = os.path.join(os.path.dirname(__file__), '..', 'company-operations.html')
TARGET = os.path.abspath(TARGET)


def safe_replace(src, old_str, new_str, label, count=1):
    """安全替换：old_str 必须在 src 中恰好出现 count 次"""
    actual = src.count(old_str)
    if actual == 0:
        print(f"  ✗ {label} — 找不到目标字符串")
        print(f"    期望: {old_str[:80]}...")
        sys.exit(1)
    if actual != count:
        print(f"  ✗ {label} — 找到 {actual} 处但期望 {count} 处")
        sys.exit(1)
    result = src.replace(old_str, new_str, count)
    print(f"  ✓ {label}")
    return result


def main():
    with open(TARGET, 'r', encoding='utf-8') as f:
        src = f.read()

    print(f"[wire_intake_upload] 处理 {os.path.basename(TARGET)} ({len(src)} chars)")

    # ═══════════════════════════════════════════════════════════
    # Mod 1: Intake Form 中的 onchange 调用改为 handleIntakeFileUpload
    # ═══════════════════════════════════════════════════════════
    src = safe_replace(src,
        """onchange="handleFileUpload('${projectId}', '${u.key}', this)""",
        """onchange="handleIntakeFileUpload('${projectId}', '${u.key}', this)""",
        "Mod 1: onchange → handleIntakeFileUpload"
    )

    # ═══════════════════════════════════════════════════════════
    # Mod 2: 重写 handleFileUpload(projectId, uploadKey, input) → handleIntakeFileUpload
    #         接入 Supabase Storage 真正上传文件
    # ═══════════════════════════════════════════════════════════
    OLD_INTAKE_UPLOAD = """        function handleFileUpload(projectId, uploadKey, input) {
            const files = getUploadedFiles(projectId);
            if (!files[uploadKey]) files[uploadKey] = [];
            for (const f of input.files) {
                files[uploadKey].push({ name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString() });
            }
            // 自动同步文件引用到 Supabase
            saveIntakeToDB(projectId, getIntakeData(projectId));
            // Refresh modal upload section
            const existingModal = document.getElementById('intakeFormModal');
            if (existingModal) {
                // Find module key from upload key mapping
                for (const [mk, mc] of Object.entries(INTAKE_MODULE_FIELDS)) {
                    if (mc.uploads && mc.uploads.some(u => u.key === uploadKey)) {
                        closeIntakeModal();
                        openIntakeModule(mk, projectId);
                        break;
                    }
                }
            }
        }"""

    NEW_INTAKE_UPLOAD = """        function handleIntakeFileUpload(projectId, uploadKey, input) {
            var fileList = Array.from(input.files);
            if (!fileList.length) return;
            var localFiles = getUploadedFiles(projectId);
            if (!localFiles[uploadKey]) localFiles[uploadKey] = [];
            var useCloud = (typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected());

            var pending = fileList.length;
            function oneDone() {
                pending--;
                if (pending <= 0) {
                    saveIntakeToDB(projectId, getIntakeData(projectId));
                    refreshIntakeModal(projectId, uploadKey);
                }
            }

            fileList.forEach(function(file) {
                if (useCloud) {
                    // Supabase Storage 上传
                    NestopiaStorage.uploadProjectFile(projectId, file, { category: 'intake/' + uploadKey })
                        .then(function(record) {
                            var entry = {
                                name: file.name, size: file.size, type: file.type,
                                uploadedAt: new Date().toISOString(),
                                storageMode: 'supabase',
                                storagePath: record.storagePath || null,
                                fileId: record.id || null,
                                url: null, thumbnailUrl: null
                            };
                            // 为图片生成签名 URL 作为缩略图
                            if (file.type && file.type.startsWith('image/') && record.storagePath) {
                                getProjectFileSignedUrl(record.storagePath).then(function(sUrl) {
                                    entry.url = sUrl;
                                    entry.thumbnailUrl = sUrl;
                                    localFiles[uploadKey].push(entry);
                                    oneDone();
                                });
                            } else {
                                localFiles[uploadKey].push(entry);
                                oneDone();
                            }
                        })
                        .catch(function(err) {
                            console.error('[IntakeUpload] Cloud upload failed:', err);
                            localFiles[uploadKey].push({
                                name: file.name, size: file.size, type: file.type,
                                uploadedAt: new Date().toISOString(),
                                storageMode: 'local', error: err.message
                            });
                            oneDone();
                        });
                } else {
                    // localStorage 回退（仅元数据）
                    localFiles[uploadKey].push({
                        name: file.name, size: file.size, type: file.type,
                        uploadedAt: new Date().toISOString(),
                        storageMode: 'local'
                    });
                    oneDone();
                }
            });
            // 清空 input 以便重复选择
            input.value = '';
        }

        function refreshIntakeModal(projectId, uploadKey) {
            for (var mk in INTAKE_MODULE_FIELDS) {
                var mc = INTAKE_MODULE_FIELDS[mk];
                if (mc.uploads && mc.uploads.some(function(u) { return u.key === uploadKey; })) {
                    closeIntakeModal();
                    openIntakeModule(mk, projectId);
                    break;
                }
            }
        }"""

    src = safe_replace(src, OLD_INTAKE_UPLOAD, NEW_INTAKE_UPLOAD,
                       "Mod 2: handleFileUpload(3-arg) → handleIntakeFileUpload + Supabase")

    # ═══════════════════════════════════════════════════════════
    # Mod 3: 重写 removeUploadedFile 支持 Supabase Storage 删除
    # ═══════════════════════════════════════════════════════════
    OLD_REMOVE = """        function removeUploadedFile(projectId, uploadKey, fileIndex) {
            const files = getUploadedFiles(projectId);
            if (files[uploadKey]) {
                files[uploadKey].splice(fileIndex, 1);
            }
            // 自动同步文件引用到 Supabase
            saveIntakeToDB(projectId, getIntakeData(projectId));
            // Find and refresh modal
            for (const [mk, mc] of Object.entries(INTAKE_MODULE_FIELDS)) {
                if (mc.uploads && mc.uploads.some(u => u.key === uploadKey)) {
                    closeIntakeModal();
                    openIntakeModule(mk, projectId);
                    break;
                }
            }
        }"""

    NEW_REMOVE = """        function removeUploadedFile(projectId, uploadKey, fileIndex) {
            var files = getUploadedFiles(projectId);
            if (!files[uploadKey]) return;
            var removed = files[uploadKey].splice(fileIndex, 1)[0];
            // 如果是 Supabase 文件，也从 Storage 删除
            if (removed && removed.storageMode === 'supabase' && removed.storagePath) {
                if (typeof NestopiaStorage !== 'undefined' && NestopiaDB.isConnected()) {
                    NestopiaStorage.removeProjectFile(projectId, removed.fileId || null, removed.storagePath)
                        .catch(function(e) { console.warn('[IntakeUpload] Storage delete failed:', e); });
                }
            }
            saveIntakeToDB(projectId, getIntakeData(projectId));
            refreshIntakeModal(projectId, uploadKey);
        }"""

    src = safe_replace(src, OLD_REMOVE, NEW_REMOVE,
                       "Mod 3: removeUploadedFile → 支持 Supabase 删除")

    # ═══════════════════════════════════════════════════════════
    # Mod 4: 升级 upload list 展示 — 图片显示缩略图，其他文件显示图标
    # ═══════════════════════════════════════════════════════════
    OLD_FILE_LIST = """                        const existingFiles = files[u.key] || [];
                        const fileListHTML = existingFiles.length > 0 ? `
                            <div class="mt-2 space-y-1">
                                ${existingFiles.map((ef, fi) => `
                                    <div class="flex items-center gap-2 py-1 px-2 bg-green-50 rounded text-xs text-green-700">
                                        <i class="fas fa-file-check"></i>
                                        <span class="flex-1 truncate">${ef.name}</span>
                                        <button onclick="removeUploadedFile('${projectId}', '${u.key}', ${fi})" class="text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
                                    </div>
                                `).join('')}
                            </div>` : '';"""

    NEW_FILE_LIST = """                        const existingFiles = files[u.key] || [];
                        const fileListHTML = existingFiles.length > 0 ? `
                            <div class="mt-2 space-y-1">
                                ${existingFiles.map((ef, fi) => {
                                    var isImg = ef.type && ef.type.startsWith('image/');
                                    var thumbSrc = ef.thumbnailUrl || ef.url || '';
                                    var cloudBadge = ef.storageMode === 'supabase'
                                        ? '<i class="fas fa-cloud text-green-400 text-[8px]" title="Cloud"></i>'
                                        : '<i class="fas fa-hdd text-gray-300 text-[8px]" title="Local"></i>';
                                    return `<div class="flex items-center gap-2 py-1.5 px-2 bg-green-50/80 rounded-lg text-xs text-green-700 group">
                                        ${isImg && thumbSrc
                                            ? '<img src="' + thumbSrc + '" class="w-8 h-8 rounded object-cover flex-shrink-0 cursor-pointer" onclick="previewProjectFile(\\'' + encodeURIComponent(thumbSrc) + '\\', \\'' + encodeURIComponent(ef.name) + '\\', \\'' + ef.type + '\\', \\'' + (ef.storagePath || '') + '\\')">'
                                            : '<i class="fas fa-file-check flex-shrink-0"></i>'}
                                        <span class="flex-1 truncate">${ef.name}</span>
                                        ${cloudBadge}
                                        <button onclick="removeUploadedFile('${projectId}', '${u.key}', ${fi})" class="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><i class="fas fa-times"></i></button>
                                    </div>`;
                                }).join('')}
                            </div>` : '';"""

    src = safe_replace(src, OLD_FILE_LIST, NEW_FILE_LIST,
                       "Mod 4: file list → 缩略图 + cloud badge + 点击预览")

    # ═══════════════════════════════════════════════════════════
    # Mod 5: 重命名 Workflow Step Upload 的 handleFileUpload → handleStepFileUpload
    # ═══════════════════════════════════════════════════════════
    # Step Upload 按钮调用（第 13927 行）— 代码中用 \\' 转义引号
    src = safe_replace(src,
        "event.stopPropagation();handleFileUpload(\\'",
        "event.stopPropagation();handleStepFileUpload(\\'",
        "Mod 5: Workflow button → handleStepFileUpload"
    )

    # ═══════════════════════════════════════════════════════════
    # Mod 6: 重写 handleFileUpload(projectId, docType) → handleStepFileUpload
    #         从 alert placeholder 改为打开 file picker + Supabase 上传
    # ═══════════════════════════════════════════════════════════
    OLD_STEP_UPLOAD = """        function handleFileUpload(projectId, docType) {
            var project = workflowProjects.find(function(p) { return p.id === projectId; });
            var uploadDef = Object.values(STEP_UPLOADS).flat().find(function(u) { return u.key === docType; });
            alert('File Upload Placeholder\\n\\nProject: ' + (project ? project.name : projectId) + '\\nDocument: ' + (uploadDef ? uploadDef.label : docType) + '\\nType: ' + docType + '\\nStep: ' + (project ? project.workflowStep : '?') + '\\n\\n(Backend integration with Supabase Storage pending)');
        }"""

    NEW_STEP_UPLOAD = """        function handleStepFileUpload(projectId, docType) {
            var uploadDef = Object.values(STEP_UPLOADS).flat().find(function(u) { return u.key === docType; });
            var accept = (uploadDef && uploadDef.accept) || '.pdf,.doc,.docx,.jpg,.png';
            // 创建隐藏 file input 并触发
            var input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;
            input.style.display = 'none';
            input.onchange = function() {
                if (!input.files || !input.files.length) return;
                var file = input.files[0];
                var useCloud = (typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected());
                if (useCloud) {
                    showToast('Uploading ' + file.name + '...', 'info');
                    NestopiaStorage.uploadProjectFile(projectId, file, { category: 'step-docs/' + docType })
                        .then(function(record) {
                            showToast(file.name + ' uploaded successfully', 'success');
                            // 更新 project document count
                            var project = workflowProjects.find(function(p) { return p.id === projectId; });
                            if (project) {
                                var step = project.workflowStep;
                                if (!project.documents[step]) project.documents[step] = 0;
                                project.documents[step]++;
                                saveWorkflowToDB(projectId);
                            }
                        })
                        .catch(function(err) {
                            showToast('Upload failed: ' + err.message, 'error');
                        });
                } else {
                    showToast(file.name + ' — connect Supabase for cloud upload', 'warning');
                }
                input.remove();
            };
            document.body.appendChild(input);
            input.click();
        }"""

    src = safe_replace(src, OLD_STEP_UPLOAD, NEW_STEP_UPLOAD,
                       "Mod 6: handleFileUpload(2-arg) → handleStepFileUpload + Supabase")

    # ── 添加 accept 属性到 STEP_UPLOADS 定义 ──
    # 让 handleStepFileUpload 能读取 accept 类型
    # 检查 STEP_UPLOADS 是否已经有 accept 字段
    if "accept:" not in src.split("const STEP_UPLOADS")[1].split("};")[0]:
        # 给第一个条目加 accept 示例
        src = safe_replace(src,
            """{ key: 'payment_receipt_intent', label: 'Intent Fee Receipt ($100)', icon: 'fa-receipt', required: true }""",
            """{ key: 'payment_receipt_intent', label: 'Intent Fee Receipt ($100)', icon: 'fa-receipt', required: true, accept: '.pdf,.jpg,.png' }""",
            "Mod 6b: STEP_UPLOADS[1][0] 添加 accept 属性"
        )

    # ═══════════════════════════════════════════════════════════
    # 写回
    # ═══════════════════════════════════════════════════════════
    with open(TARGET, 'w', encoding='utf-8') as f:
        f.write(src)

    print(f"\n✅ 完成！({len(src)} chars, {src.count(chr(10))+1} 行)")
    print("  → Intake Form 文件上传已接入 Supabase Storage")
    print("  → Workflow Step Upload 已从 placeholder 替换为真正上传")
    print("  → 3 个 handleFileUpload 同名函数冲突已解决")


if __name__ == '__main__':
    main()
