# Webster's Guidance（项目全局规则）

## 语言规则
- 所有文档（.md、注释、commit message 等）默认使用**中文**
- UI 代码（HTML/JS/CSS 中面向用户的文本）保持**英文**
- 与用户对话时使用**中文**

## 代码变更流程
- 本地代码变更后，**自动执行** git add → commit → push，触发 Cloudflare Pages 部署
- 不需要用户确认即可推送（除非涉及破坏性操作）
- 部署平台：**Cloudflare Pages**（非 Vercel），已连接 GitHub repo 自动部署
- GitHub repo：`websterzhangsh/N-Site-Prototype`（origin/main）
- push 到 main 后 Cloudflare 自动构建，无需手动触发

## 上下文管理
- 在 70% 上下文使用率时自动压缩

## 关键参考文档
- `docs/Strategic_Positioning.md` — 战略定位（北极星文档）
- `docs/Webster's_guidance_to_Qoder.md` — 原始指导文件
- `docs/Product Features and Selling Points.md` — 产品卖点
- `docs/DATA_AI_STRATEGY.md` — 数据与 AI 策略
- `docs/Product_Range_Structure.md` — 产品线结构
- `docs/产品选型与报价表.xlsx` — 产品选型与报价（Excel 数据源）
- `docs/PRODUCT_DEMO.md` — 产品演示说明
- `docs/business-workflow.md` — 业务流程
- `docs/multi-tenant-architecture.md` — 多租户架构

## 项目结构要点
- `company-operations.html` — 公司运营管理后台（含 Overview、Products、Workflow 等页面）
- `images/products/icons/` — 产品 3D 等距渲染图标（6 张，覆盖 Sunroom/Pergola/Zip Blinds/ADU）
- `wrangler.toml` — Cloudflare Pages 配置
- `vercel.json` — 历史遗留配置（实际使用 Cloudflare 部署）
