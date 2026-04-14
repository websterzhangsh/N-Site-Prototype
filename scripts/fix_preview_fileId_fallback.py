#!/usr/bin/env python3
"""
修复 Intake 旧文件预览失败 — storagePath 为 null 时通过 fileId 从 DB 查找
1. previewProjectFile 新增第 5 参数 fileId
2. 无 storagePath 时用 fileId 查 kb_documents 获取 storage_path
3. Intake 模态框 onclick 传递 ef.fileId
"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()
original = content
fixes = []

# ============================================================
# 1. previewProjectFile 增加 fileId 参数 + DB 回退查找
# ============================================================
old_sig = "async function previewProjectFile(encodedUrl, encodedName, mimeType, storagePath) {"
new_sig = "async function previewProjectFile(encodedUrl, encodedName, mimeType, storagePath, fileId) {"
assert old_sig in content, "FAIL: previewProjectFile signature not found"
content = content.replace(old_sig, new_sig, 1)
fixes.append("previewProjectFile 增加 fileId 参数")

# 在 storagePath 签名 URL 块之前插入 DB 回退
old_sp_check = "// 只要有 storagePath，始终生成最新签名 URL（Private Bucket 必须签名访问）"
assert old_sp_check in content, "FAIL: storagePath comment not found"
db_fallback = """// 如果没有 storagePath 但有 fileId，从 DB 回退查找 storage_path（兼容旧上传数据）
            if (!storagePath && fileId && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                try {
                    var client = NestopiaDB.getClient();
                    if (client) {
                        var dbRes = await client.from('kb_documents').select('storage_path').eq('id', fileId).single();
                        if (dbRes.data && dbRes.data.storage_path) storagePath = dbRes.data.storage_path;
                    }
                } catch(e) { /* silent */ }
            }
            """ + old_sp_check
content = content.replace(old_sp_check, db_fallback, 1)
fixes.append("无 storagePath 时通过 fileId 从 DB 查找 storage_path")

# ============================================================
# 2. Intake 模态框 onclick — 外层 div (line ~10798)
# ============================================================
old_outer = "previewProjectFile('${encodeURIComponent(ef.url || '')}', '${encodeURIComponent(ef.name)}', '${ef.type || ''}', '${ef.storagePath || ''}')\""
new_outer = "previewProjectFile('${encodeURIComponent(ef.url || '')}', '${encodeURIComponent(ef.name)}', '${ef.type || ''}', '${ef.storagePath || ''}', '${ef.fileId || ''}')\""
assert old_outer in content, "FAIL: intake outer onclick not found"
content = content.replace(old_outer, new_outer, 1)
fixes.append("Intake 外层 div onclick 传递 fileId")

# ============================================================
# 3. Intake 缩略图 img onclick (line ~10800)
# ============================================================
old_thumb = "' + (ef.storagePath || '') + '\\')\">"
new_thumb = "' + (ef.storagePath || '') + '\\', \\'' + (ef.fileId || '') + '\\')\">"
# This pattern appears twice (img and icon lines), replace both
count = content.count(old_thumb)
if count > 0:
    content = content.replace(old_thumb, new_thumb)
    fixes.append(f"Intake 缩略图/icon onclick 传递 fileId ({count} 处)")

# ============================================================
# 4. Intake icon onclick (line ~10801) — slightly different pattern
# The icon line ends with ')"></i>'
# ============================================================
old_icon = "' + (ef.storagePath || '') + '\\')\"></i>'"
new_icon = "' + (ef.storagePath || '') + '\\', \\'' + (ef.fileId || '') + '\\')\"></i>'"
if old_icon in content:
    content = content.replace(old_icon, new_icon, 1)
    fixes.append("Intake icon onclick 传递 fileId")

# ============================================================
# Write
# ============================================================
assert content != original, "Nothing changed!"
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

for fx in fixes:
    print(f"  {fx}")
print(f"\nDone: {FILE} ({len(content):,} bytes)")
