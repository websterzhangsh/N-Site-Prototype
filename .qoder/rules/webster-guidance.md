---
trigger: always_on
---
# Webster's Guidance（项目全局规则）

## 语言规则
- 所有文档（.md、注释、commit message 等）默认使用**中文**
- UI 代码（HTML/JS/CSS 中面向用户的文本）保持**英文**
- 与用户对话时使用**中文**

## 代码变更流程
- 本地代码变更后，**自动执行** git add → commit → push，触发 CloudFlare 部署
- 不需要用户确认即可推送（除非涉及破坏性操作）

## 部署状态检查
- 每次 git push 之后，**必须**运行 `scripts/check-deploy.sh` 检查 Cloudflare Pages 构建状态
- 如果构建**失败**，立即在对话中提醒用户，并主动排查失败原因
- 如果构建**成功**，简要报告状态即可（一行）
- 凭证存储在 `.env`（已被 .gitignore 排除，不会提交到 git）

## 上下文管理
- 在 70% 上下文使用率时自动压缩

## 关键参考文档
- `docs/Strategic_Positioning.md` — 战略定位（北极星文档）
- `docs/Webster's_guidance_to_Qoder.md` — 原始指导文件
- `docs/Product Features and Selling Points.md` — 产品卖点
- `docs/DATA_AI_STRATEGY.md` — 数据与 AI 策略
