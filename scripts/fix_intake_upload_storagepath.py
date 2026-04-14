#!/usr/bin/env python3
"""
修复 Intake 文件上传预览失败 — 根因：kb_documents_category_check 约束
拒绝 'intake/xxx' category，导致 DB 插入失败，storagePath 丢失。

修复内容：
1. uploadProjectFile .catch — 保留 storagePath（文件已成功上传到 Storage）
2. handleIntakeFileUpload — category 改为 'site-photos'（使用现有允许的类别值），
   通过 description 字段区分是 intake 文件
"""
import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# ── Fix 1: uploadProjectFile .catch — 保留 storagePath 和 storageMode ──
# 修改两处 LocalStorage.saveFile 调用，增加 storagePath 和 storageMode

# 1a: 大文件路径 (>5MB)
old_1a = "resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: null, url: null, note: 'Cloud upload failed: ' + err.message })); return;"
new_1a = "resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: null, url: null, storagePath: storagePath, storageMode: 'supabase', note: 'Cloud upload failed: ' + err.message })); return;"

if old_1a in content:
    content = content.replace(old_1a, new_1a, 1)
    changes += 1
    print('Fix 1a: .catch large file — storagePath preserved')
else:
    print('WARN: Fix 1a needle not found')

# 1b: 普通文件路径
old_1b = "resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: isImg ? e.target.result : null, url: e.target.result, note: 'Cloud upload failed, saved locally' }));"
new_1b = "resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: isImg ? e.target.result : null, url: e.target.result, storagePath: storagePath, storageMode: 'supabase', note: 'Cloud upload failed, saved locally' }));"

if old_1b in content:
    content = content.replace(old_1b, new_1b, 1)
    changes += 1
    print('Fix 1b: .catch normal file — storagePath preserved')
else:
    print('WARN: Fix 1b needle not found')

# ── Fix 2: handleIntakeFileUpload — category 改为 'site-photos' ──
old_2 = "NestopiaStorage.uploadProjectFile(projectId, file, { category: 'intake/' + uploadKey })"
new_2 = "NestopiaStorage.uploadProjectFile(projectId, file, { category: 'site-photos', description: 'Intake: ' + uploadKey })"

if old_2 in content:
    content = content.replace(old_2, new_2, 1)
    changes += 1
    print('Fix 2: category intake/xxx → site-photos')
else:
    print('WARN: Fix 2 needle not found')

if changes == 0:
    print('ERROR: No changes made')
    sys.exit(1)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'\nOK: {changes}/3 fixes applied')
