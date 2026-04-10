#!/usr/bin/env python3
"""
将 intake form 上传文件引用 (intakeUploadedFiles) 持久化到 Supabase。
方案：复用已有的 project_intake_data 表，将文件元数据保存到 form_data._uploadedFiles 字段。
3 处修改：
1. 修改 saveIntakeToDB: 同时保存 intakeUploadedFiles
2. 修改 loadIntakeFromDB 后的合并逻辑: 也恢复 uploadedFiles
3. 修改 handleFileUpload: 文件上传后自动同步到 Supabase
4. 修改 removeUploadedFile: 文件删除后自动同步到 Supabase
"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r') as f:
    content = f.read()

changes = []

# ═══════════════════════════════════════════════════════
# 1. 修改 saveIntakeToDB: 合并 intakeUploadedFiles 到 form_data
# ═══════════════════════════════════════════════════════
old_save = """        function saveIntakeToDB(projectId, data) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                form_data: JSON.parse(JSON.stringify(data)),
                updated_at: new Date().toISOString()
            };"""

new_save = """        function saveIntakeToDB(projectId, data) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            // 合并上传文件引用到 form_data
            var dataClone = JSON.parse(JSON.stringify(data));
            var uploadedFiles = getUploadedFiles(projectId);
            if (uploadedFiles && Object.keys(uploadedFiles).length > 0) {
                dataClone._uploadedFiles = JSON.parse(JSON.stringify(uploadedFiles));
            }
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                form_data: dataClone,
                updated_at: new Date().toISOString()
            };"""

if old_save in content:
    content = content.replace(old_save, new_save, 1)
    changes.append("1. saveIntakeToDB: 合并 intakeUploadedFiles 到 form_data._uploadedFiles")
else:
    print("ERROR: 找不到 saveIntakeToDB 函数开头")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 2. 修改 DB 加载后的合并逻辑: 也恢复 uploadedFiles
# ═══════════════════════════════════════════════════════
old_merge = """                    if (dbData && typeof dbData === 'object') {
                        var local = getIntakeData(projectId);
                        // DB 数据合并到内存（DB 优先）
                        Object.keys(dbData).forEach(function(k) { local[k] = dbData[k]; });
                        console.log('[Intake] Loaded from Supabase for', projectId);
                    }"""

new_merge = """                    if (dbData && typeof dbData === 'object') {
                        var local = getIntakeData(projectId);
                        // DB 数据合并到内存（DB 优先）
                        Object.keys(dbData).forEach(function(k) {
                            if (k === '_uploadedFiles') return;  // 单独处理
                            local[k] = dbData[k];
                        });
                        // 恢复上传文件引用
                        if (dbData._uploadedFiles && typeof dbData._uploadedFiles === 'object') {
                            var localFiles = getUploadedFiles(projectId);
                            Object.keys(dbData._uploadedFiles).forEach(function(fk) {
                                if (!localFiles[fk] || localFiles[fk].length === 0) {
                                    localFiles[fk] = dbData._uploadedFiles[fk];
                                }
                            });
                            console.log('[Intake] Restored uploaded file refs from Supabase');
                        }
                        console.log('[Intake] Loaded from Supabase for', projectId);
                    }"""

if old_merge in content:
    content = content.replace(old_merge, new_merge, 1)
    changes.append("2. openIntakeModule: DB 加载后也恢复 intakeUploadedFiles")
else:
    print("ERROR: 找不到 DB 数据合并锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 3. 修改 handleFileUpload: 文件上传后自动同步到 Supabase
# ═══════════════════════════════════════════════════════
old_file_upload = """        function handleFileUpload(projectId, uploadKey, input) {
            const files = getUploadedFiles(projectId);
            if (!files[uploadKey]) files[uploadKey] = [];
            for (const f of input.files) {
                files[uploadKey].push({ name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString() });
            }"""

new_file_upload = """        function handleFileUpload(projectId, uploadKey, input) {
            const files = getUploadedFiles(projectId);
            if (!files[uploadKey]) files[uploadKey] = [];
            for (const f of input.files) {
                files[uploadKey].push({ name: f.name, size: f.size, type: f.type, uploadedAt: new Date().toISOString() });
            }
            // 自动同步文件引用到 Supabase
            saveIntakeToDB(projectId, getIntakeData(projectId));"""

if old_file_upload in content:
    content = content.replace(old_file_upload, new_file_upload, 1)
    changes.append("3. handleFileUpload: 文件上传后自动同步到 Supabase")
else:
    print("ERROR: 找不到 handleFileUpload(projectId, uploadKey, input) 函数")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 4. 修改 removeUploadedFile: 文件删除后自动同步到 Supabase
# ═══════════════════════════════════════════════════════
old_remove = """        function removeUploadedFile(projectId, uploadKey, fileIndex) {
            const files = getUploadedFiles(projectId);
            if (files[uploadKey]) {
                files[uploadKey].splice(fileIndex, 1);
            }"""

new_remove = """        function removeUploadedFile(projectId, uploadKey, fileIndex) {
            const files = getUploadedFiles(projectId);
            if (files[uploadKey]) {
                files[uploadKey].splice(fileIndex, 1);
            }
            // 自动同步文件引用到 Supabase
            saveIntakeToDB(projectId, getIntakeData(projectId));"""

if old_remove in content:
    content = content.replace(old_remove, new_remove, 1)
    changes.append("4. removeUploadedFile: 文件删除后自动同步到 Supabase")
else:
    print("ERROR: 找不到 removeUploadedFile 函数开头")
    sys.exit(1)

with open(FILE, 'w') as f:
    f.write(content)

print(f"✅ 成功修改 {len(changes)} 处:")
for c in changes:
    print(f"   {c}")
