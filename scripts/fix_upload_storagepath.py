#!/usr/bin/env python3
"""修复 uploadProjectFile 返回值缺少 storagePath 字段的 bug。
根因：NestopiaStorage.uploadProjectFile() 返回的对象没有 storagePath，
导致 handleIntakeFileUpload 无法生成签名 URL，文件点击预览失败。
"""
import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Fix 1: 在 uploadProjectFile 返回对象中加入 storagePath
old_return = "return { id: dbRecord.id, name: dbRecord.name, type: dbRecord.mime_type, size: dbRecord.file_size_bytes, category: dbRecord.category, url: dbRecord.file_url, status: 'uploaded', storageMode: 'supabase', uploadedAt: dbRecord.created_at };"
new_return = "return { id: dbRecord.id, name: dbRecord.name, type: dbRecord.mime_type, size: dbRecord.file_size_bytes, category: dbRecord.category, url: dbRecord.file_url, storagePath: dbRecord.storage_path, status: 'uploaded', storageMode: 'supabase', uploadedAt: dbRecord.created_at };"

count1 = content.count(old_return)
if count1 != 1:
    print(f"[FAIL] Fix 1: Expected 1 match, found {count1}")
    sys.exit(1)
content = content.replace(old_return, new_return)
print(f"[OK] Fix 1: Added storagePath to uploadProjectFile return object")

if content == original:
    print("[SKIP] No changes needed")
    sys.exit(0)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n[DONE] 1 modification applied to {FILE}")
