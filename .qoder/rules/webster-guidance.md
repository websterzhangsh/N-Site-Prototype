---
trigger: always_on
---
# Webster's Guidance（项目全局规则）

## 语言规则
- 所有文档（.md、注释、commit message 等）默认使用**中文**
- UI 代码（HTML/JS/CSS 中面向用户的文本）保持**英文**
- 与用户对话时使用**中文**

## 代码变更流程
- 本地代码变更后，**自动执行** git add → commit → push 到 `main` 分支，触发 Staging 部署
- 推送到 `main` 分支不需要用户确认（除非涉及破坏性操作）
- **⚠️ 推送到 Production 分支（触发 ai-nestopia.com 商业站点部署）必须获得用户显式确认，未经确认严禁操作**

## 部署状态检查
- 每次 git push 之后，**必须**运行 `scripts/check-deploy.sh` 检查 Cloudflare Pages 构建状态
- 如果构建**失败**，立即在对话中提醒用户，并主动排查失败原因
- 如果构建**成功**，简要报告状态即可（一行）
- 凭证存储在 `.env`（已被 .gitignore 排除，不会提交到 git）

## 上下文管理
- 在 70% 上下文使用率时自动压缩

## 回归预防规则
**原则：每次代码变更都是潜在回归源。以下四条规则强制实施，不得忽略。**

### 1. 数据层向后兼容
- 从外部数据源（DB、API、localStorage）加载数据时，**永远不要因缺少字段而拒绝数据**
- 新增 required 字段时，老数据没有该字段视为"使用默认值"，**决不**执行 `return false`
- 反例（本次回归）: `if (!cfg.tenant_slug) return false;` → 导致旧项目集体消失
- 正例: `if (!cfg.tenant_slug) { cfg.tenant_slug = 'default'; /* 兼容旧数据 */ }`
- **强制使用 `normalizeProjectFromDB()` 统一数据入口**，所有新字段在此函数中添加默认值

### 2. 渲染函数空值安全
- 所有对 `allProjectsData` 或其他数组的 `.map()` / `.filter()` / `.forEach()` 操作中，**每个字段访问必须判空**
- 模板字符串中 `${p.field}` 不是安全的 — 应使用 `${p.field || 'fallback'}`
- 字符串方法调用 `.split()` / `.toLowerCase()` 前必须判空: `(p.customer || '').split(' ')`
- **推荐使用 `safeStr()` 工具** (`js/utils/helpers.js`) 统一处理空值

### 3. 关键执行链解耦
- 两个独立功能不应共享同一个执行路径（一个崩溃不能阻止另一个）
- `renderSidebarProjects()` 和 `loadProjectsFromDB()` 已在 `projects.js` 中**独立注册 DOMContentLoaded 监听器**
- 对关键渲染/加载函数**强制使用 `safetyWrap()` 包装**，用法:
  ```javascript
  window.renderSidebarProjects = safetyWrap(window.renderSidebarProjects, 'renderSidebarProjects');
  ```

### 4. Cache Buster 强制检查
- 每次修改 `company-operations.html` 中的 `?v=<HASH>` 缓存版本号时，**必须意识到它会导致所有 JS 文件重新加载**
- 即使只修改了一个 JS 文件，其他文件的部署时滞（latent bug）也可能被激活
- 修改缓存版本号后，**务必检查以下功能**：
  - 侧栏项目列表是否完整加载
  - 项目点击是否有响应
  - 所有页面导航是否正常

## 关键参考文档
- `docs/Strategic_Positioning.md` — 战略定位（北极星文档）
- `docs/Webster's_guidance_to_Qoder.md` — 原始指导文件
- `docs/Product Features and Selling Points.md` — 产品卖点
- `docs/DATA_AI_STRATEGY.md` — 数据与 AI 策略
- `docs/STORAGE_STRATEGY.md` — 存储策略（Supabase + Cloudflare R2）
- `docs/KB_STORAGE_DESIGN.md` — KB 存储架构细节
- `docs/ZB_KB_KNOWLEDGE_AGENT_DESIGN.md` — Zip Blinds KB & Knowledge Agent 设计
