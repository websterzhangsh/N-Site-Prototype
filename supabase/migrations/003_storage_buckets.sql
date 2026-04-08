-- ============================================================
-- Migration 003: Supabase Storage Buckets + RLS 策略
-- ============================================================
-- 创建 KB 文件存储的 Supabase Storage Buckets
-- 对应 STORAGE_STRATEGY.md §4.2 的 Bucket 设计
--
-- Bucket 架构：
--   kb-tenant-files/  → 租户级产品知识库（手册、规格、营销、视频）
--   kb-project-files/ → 项目级客户文件（现场照片、视频、量尺、设计、合同）
--
-- 安全策略：
--   - 两个 Bucket 都设为 private（不允许匿名访问）
--   - 通过 RLS 策略控制读写权限
--   - 租户隔离：通过 JWT 中的 tenant_id 实现
--
-- 执行顺序：schema.sql → 001 → 002 → 003（本文件）
-- 执行位置：Supabase SQL Editor 或 supabase db push
-- ============================================================

-- ── 前置检查 ──────────────────────────────────────────────────

-- 确保 storage schema 存在（Supabase 自动创建）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        RAISE EXCEPTION 'storage schema not found. This migration must run on Supabase.';
    END IF;
END $$;


-- ============================================================
-- 1. 创建 Storage Buckets
-- ============================================================

-- 租户级 KB 文件 Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'kb-tenant-files',
    'kb-tenant-files',
    false,  -- private bucket, 通过签名 URL 或 RLS 访问
    52428800,  -- 50MB max file size
    ARRAY[
        -- 文档类
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        -- 图片类
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        -- 视频类
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'video/x-msvideo',
        -- 其他
        'application/zip',
        'text/plain',
        'text/csv'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 项目级文件 Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'kb-project-files',
    'kb-project-files',
    false,  -- private bucket
    52428800,  -- 50MB max file size
    ARRAY[
        -- 文档类
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        -- 图片类（现场照片）
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/heic',
        'image/heif',
        -- 视频类（现场视频）
        'video/mp4',
        'video/quicktime',
        'video/webm',
        'video/x-msvideo',
        -- CAD / 设计
        'application/octet-stream',  -- DWG 等二进制格式
        'image/vnd.dwg',
        'application/acad',
        -- 其他
        'application/zip',
        'text/plain',
        'text/csv'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ============================================================
-- 2. RLS 策略 — 租户级 KB 文件 (kb-tenant-files)
-- ============================================================

-- 2.1 同租户成员可读
CREATE POLICY "tenant_kb_read"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'kb-tenant-files'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);

-- 2.2 租户管理员可上传
CREATE POLICY "tenant_kb_upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'kb-tenant-files'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'super_admin')
);

-- 2.3 租户管理员可更新
CREATE POLICY "tenant_kb_update"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'kb-tenant-files'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'super_admin')
);

-- 2.4 租户管理员可删除
CREATE POLICY "tenant_kb_delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'kb-tenant-files'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'super_admin')
);


-- ============================================================
-- 3. RLS 策略 — 项目级文件 (kb-project-files)
-- ============================================================

-- 3.1 项目成员可读（通过 tenant_id 隔离 + 未来扩展 project_members 表）
-- Demo/POC 阶段：同租户所有成员可读所有项目文件
-- Phase 3：改为基于 project_members 表的精确控制
CREATE POLICY "project_files_read"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'kb-project-files'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);

-- 3.2 同租户成员可上传项目文件
CREATE POLICY "project_files_upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'kb-project-files'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);

-- 3.3 同租户成员可更新
CREATE POLICY "project_files_update"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'kb-project-files'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
);

-- 3.4 仅管理员可删除项目文件
CREATE POLICY "project_files_delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'kb-project-files'
    AND (storage.foldername(name))[1] = (auth.jwt() ->> 'tenant_id')
    AND (auth.jwt() ->> 'role') IN ('admin', 'super_admin')
);


-- ============================================================
-- 4. Demo/POC 阶段临时策略（无 Auth 时的开发用）
-- ============================================================
-- 注意：以下策略仅用于 Demo/开发阶段，正式上线前必须移除！
-- 允许匿名用户（anon key）读写两个 Bucket

-- 标记：[DEV-ONLY] 开发用临时策略

-- kb-tenant-files: anon 可读
CREATE POLICY "dev_tenant_kb_anon_read"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'kb-tenant-files'
);

-- kb-tenant-files: anon 可写
CREATE POLICY "dev_tenant_kb_anon_insert"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'kb-tenant-files'
);

-- kb-project-files: anon 可读
CREATE POLICY "dev_project_files_anon_read"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'kb-project-files'
);

-- kb-project-files: anon 可写
CREATE POLICY "dev_project_files_anon_insert"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'kb-project-files'
);

-- kb-project-files: anon 可删
CREATE POLICY "dev_project_files_anon_delete"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'kb-project-files'
);


-- ============================================================
-- 5. 验证
-- ============================================================

DO $$
DECLARE
    bucket_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bucket_count
    FROM storage.buckets
    WHERE id IN ('kb-tenant-files', 'kb-project-files');

    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname LIKE '%kb%' OR policyname LIKE '%tenant%' OR policyname LIKE '%project_files%';

    RAISE NOTICE '✅ Storage Buckets 创建完成: % 个', bucket_count;
    RAISE NOTICE '✅ RLS 策略创建完成: % 条', policy_count;

    IF bucket_count < 2 THEN
        RAISE WARNING '⚠️ 部分 Bucket 创建失败，请手动检查';
    END IF;
END $$;


-- ============================================================
-- 注释
-- ============================================================
COMMENT ON COLUMN storage.buckets.id IS '
Nestopia KB Storage Buckets:
- kb-tenant-files: 租户级产品知识库（手册、规格书、营销材料、培训视频）
- kb-project-files: 项目级客户文件（现场照片、视频、设计图、合同）

目录结构：
  kb-tenant-files/{tenant-id}/{product-line}/{category}/{filename}
  kb-project-files/{tenant-id}/{project-id}/{category}/{filename}

RLS 策略摘要：
  租户级: 同租户可读，管理员可写/删
  项目级: 同租户可读写，管理员可删
  [DEV-ONLY]: anon 临时策略（正式上线前移除）
';
