# Knowledge Base 文件存储目录

> Phase 1: 静态文件存放在 Git 仓库中，随 Cloudflare Pages 部署
> Phase 2: 迁移到 Supabase Storage (kb-tenant-files / kb-project-files buckets)

## 目录结构

```
public/kb/{tenant-slug}/
├── zip-blinds/          # Zip Blinds 产品线
│   ├── manuals/         # 安装手册、操作指南
│   ├── specs/           # 产品规格书、技术参数
│   ├── marketing/       # 销售材料、宣传册
│   ├── videos/          # 培训视频、安装教程
│   ├── compliance/      # 产品合规认证
│   ├── training/        # 培训材料
│   └── sops/            # 标准操作流程
├── sunroom/             # 阳光房产品线
├── pergola/             # 廊架产品线
├── adu/                 # ADU 产品线
├── compliance/          # 跨产品线合规文件
└── training/            # 跨产品线培训材料
```

## 文件命名规范

```
{类型}_{描述}_{日期}.{扩展名}
```

示例:
- `manual_zb100-installation_v3.2.pdf`
- `spec_fabric-catalog-np4000.pdf`
- `video_face-mount-tutorial.mp4`

## 限制 (Phase 1)

- 单文件 < 25MB（Git 仓库限制）
- 总量 < 500MB
- 大型视频使用外部链接（Google Drive / OneDrive）

## 相关文档

- `docs/KB_STORAGE_DESIGN.md` — 存储架构设计
- `docs/STORAGE_STRATEGY.md` — 存储策略总纲
- `supabase/migrations/002_kb_documents.sql` — 数据库元数据表
