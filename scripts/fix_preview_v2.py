#!/usr/bin/env python3
"""综合修复文件预览 4 个关联 Bug"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()
original = content
fixes = []

# Bug 1: selectProject() 添加 syncProjectFilesFromCloud
n = 'renderProjectWorkflow(project);\n\n            // Risk List'
r = 'renderProjectWorkflow(project);\n\n            // 异步刷新项目文件签名 URL（Private Bucket 签名 URL 1 小时过期）\n            syncProjectFilesFromCloud(projectId);\n\n            // Risk List'
assert n in content, "FAIL Bug 1"
content = content.replace(n, r, 1)
fixes.append("Bug 1: selectProject 添加 syncProjectFilesFromCloud")

# Bug 2: LocalStorage.saveFile 保留 caller storageMode
n = "storageMode: 'local' });"
si = content.find("saveFile: function(projectId, fileObj)")
assert si > 0, "FAIL Bug 2a"
ni = content.find(n, si)
assert ni > 0 and (ni - si) < 400, "FAIL Bug 2b"
content = content[:ni] + "storageMode: fileObj.storageMode || 'local' });" + content[ni + len(n):]
fixes.append("Bug 2: LocalStorage.saveFile 保留 storageMode")

# Bug 2b: syncProjectFilesFromCloud 条件放宽
n = "if (f.storagePath && f.storageMode === 'supabase') {"
assert n in content, "FAIL Bug 2b"
content = content.replace(n, "if (f.storagePath) {", 1)
fixes.append("Bug 2b: sync 条件放宽为 storagePath")

# Bug 2c: thumbnailUrl 不限 site-photos
n = "if (f.category === 'site-photos') f.thumbnailUrl = signedUrl;"
assert n in content, "FAIL Bug 2c"
content = content.replace(n, "f.thumbnailUrl = signedUrl;", 1)
fixes.append("Bug 2c: thumbnailUrl 全类型生效")

# Bug 3+4: previewProjectFile 签名 URL + mimeType
start_marker = "// 如果 URL 为空但有 storagePath，尝试生成签名 URL"
end_marker = "if (freshUrl) url = freshUrl;\n"
idx_s = content.find(start_marker)
assert idx_s > 0, "FAIL Bug 3 start"
idx_e = content.find(end_marker, idx_s)
assert idx_e > 0, "FAIL Bug 3 end"
idx_e += len(end_marker)
brace_end = content.find("}", idx_e)
assert brace_end > 0, "FAIL Bug 3 brace"
brace_end += 1

line_start = content.rfind('\n', 0, idx_s) + 1
indent = content[line_start:idx_s]

new_block = (
    indent + "// 自动检测 mimeType — 当调用方传入空值时基于文件扩展名推断\n"
    + indent + "if (!mimeType || mimeType === 'file') {\n"
    + indent + "    if (/\\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name)) mimeType = 'image';\n"
    + indent + "    else if (/\\.(mp4|mov|webm|avi)$/i.test(name)) mimeType = 'video';\n"
    + indent + "    else if (/\\.pdf$/i.test(name)) mimeType = 'application/pdf';\n"
    + indent + "}\n"
    + indent + "// 只要有 storagePath，始终生成最新签名 URL（Private Bucket 必须签名访问）\n"
    + indent + "if (storagePath) {\n"
    + indent + "    var freshUrl = await getProjectFileSignedUrl(storagePath);\n"
    + indent + "    if (freshUrl) url = freshUrl;\n"
    + indent + "}"
)

content = content[:idx_s] + new_block + content[brace_end:]
fixes.append("Bug 3: previewProjectFile 始终刷新签名 URL")
fixes.append("Bug 4: previewProjectFile 自动检测 mimeType")

assert content != original, "Nothing changed!"
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

for fx in fixes:
    print(f"  {fx}")
print(f"\nDone: {FILE} ({len(content):,} bytes)")
