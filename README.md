# N-Site-Prototype

Nestopia 多租户运营管理平台原型

## 项目概述
Nestopia 阳光房 / 遮阳产品行业的 SaaS 运营平台，支持多租户、项目管理、KB 知识库、AI 辅助等功能。

## 主要特性
- 🏠 多租户公司运营管理（Company Operations）
- 📋 项目全流程跟踪（Workflow Steps）
- 📚 KB 知识库 + 文件云端存储
- 🤖 AI Knowledge Agent（规划中）
- 📱 完全适配移动端设备

## 技术栈
- HTML5 + CSS3 + JavaScript（Vanilla）
- Tailwind CSS
- Supabase（PostgreSQL + Auth + Storage）
- Cloudflare Pages（静态托管 + Edge Functions）

## 项目结构
```
├── index.html              # 首页
├── company-operations.html # 公司运营主页面
├── login.html              # 登录页
├── js/                     # JavaScript 模块
│   ├── supabase-config.js  # Supabase 连接配置
│   └── supabase-storage.js # 存储操作封装
├── supabase/               # Supabase 迁移脚本
│   └── migrations/         # SQL 迁移文件
├── scripts/                # 工具脚本
│   └── check-deploy.sh     # Cloudflare 部署状态检查
├── docs/                   # 项目文档
├── _routes.json            # Cloudflare Pages 路由配置
└── README.md
```

## 部署

### Staging（自动）
推送到 `main` 分支即自动部署至 Cloudflare Pages：
```bash
git push origin main
```
Staging 站点：`n-site-prototype.pages.dev`

### Production
需手动触发，部署至 `ai-nestopia.com`。

## 关键文档
- `docs/STORAGE_STRATEGY.md` — 存储策略
- `docs/DATA_AI_STRATEGY.md` — 数据与 AI 策略
- `docs/KB_STORAGE_DESIGN.md` — KB 存储架构
- `docs/BASELINES.md` — 版本基线记录