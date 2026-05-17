# Omeya-SIN 租户 Bug 修复报告

**报告日期**: 2026-05-07  
**修复提交**: `3c4fad5`  
**影响环境**: Staging (`n-site-prototype.pages.dev`) + Production Preview  
**报告人**: Webster  

---

## 问题概述

Omeya-SIN 租户页面出现两个独立故障：
1. **Logo 不显示** — 页面顶部一直显示 "Logo" alt 文字 + "Loading..."，等待数分钟无改善
2. **Service Workflow 无步骤** — 点击 Zip Blinds 类型项目后，右侧 Service Workflow 区域为空白，仅能看到 Agent Toolbar（Compliance / CS Exec / Knowledge）

其他租户（如 Greenscape）功能正常。

---

## 根因分析

### Bug 1: Logo / 租户名称不加载

| 项目 | 详情 |
|------|------|
| **根因** | `loadDashboardData()` 函数虽然定义在 `company-operations.html`（第 4462 行），但**从未被调用** |
| **函数职责** | 读取 localStorage 中的 tenant config，设置 `tenantLogo.src`、`tenantName.textContent`、用户头像等 |
| **影响范围** | 所有租户都受影响（Greenscape 等之所以"能看到 Logo"，是因为用户可能之前访问过有缓存，或者是旧代码版本仍有调用链） |
| **文件** | `company-operations.html` 第 4462~4501 行 |

**修复方式**：在函数定义之后立即调用：
```javascript
// ── 立即执行：应用租户 UI（Logo、名称、用户信息）──
loadDashboardData();
```

---

### Bug 2: Zip Blinds Workflow 步骤不渲染

| 项目 | 详情 |
|------|------|
| **根因** | `projects.js` 第 624 行直接引用 `ZB_WORKFLOW_STEPS`（裸变量），但该变量仅定义在 `step-config.js` 的 IIFE 闭包内，未暴露到全局作用域 |
| **暴露路径** | `step-config.js` 通过 `N.data.stepConfig.ZB_WORKFLOW_STEPS` 挂载到命名空间，但 `projects.js` 并不通过命名空间读取 |
| **错误类型** | `ReferenceError: ZB_WORKFLOW_STEPS is not defined` |
| **影响范围** | 仅影响 `project.type === 'Zip Blinds'` 的项目（Omeya-SIN 主营 Zip Blinds） |
| **为何 Greenscape 正常** | Greenscape 项目走 non-ZB 路径（第 658 行），使用本地定义的 `stepNames`/`stepIcons`/`stepColors` 数组，不依赖 `ZB_WORKFLOW_STEPS` |
| **文件** | `js/data/step-config.js`（变量定义处）、`js/modules/projects.js`（引用处第 624 行） |

**修复方式**：在 `step-config.js` IIFE 末尾添加全局别名桥接：
```javascript
// ── 全局别名桥接（projects.js 等模块直接引用）──
window.ZB_WORKFLOW_STEPS = ZB_WORKFLOW_STEPS;
window.STEP_DETAIL_CONFIG = STEP_DETAIL_CONFIG;
window.ZB_STEP_CONFIGS = ZB_STEP_CONFIGS;
window.ZB_COMBINED_CONFIG = ZB_COMBINED_CONFIG;
```

---

## 修复验证

| 检查项 | 状态 |
|--------|------|
| Staging 部署 | ✅ SUCCESS |
| Production Preview 部署 | ✅ SUCCESS |
| Logo 显示（Omeya-SIN） | ✅ 已修复 |
| Zip Blinds Workflow 步骤 | ✅ 已修复 |
| Greenscape 租户无回归 | ✅ 确认 |

---

## 架构反思 & 后续建议

### 问题本质
1. **函数定义但未调用** — 开发过程中可能是原来由其他初始化链调用，后来重构后调用链断裂
2. **IIFE 作用域隔离过度** — `step-config.js` 将所有变量封闭在 IIFE 内，仅通过命名空间暴露，但消费方（`projects.js`）并未使用命名空间路径

### 建议
- [ ] 考虑统一全局变量暴露方式：要么所有模块都通过 `N.data.*` 命名空间访问，要么在 IIFE 底部统一桥接到 `window`
- [ ] 为关键初始化函数添加自检日志（如 `console.log('[Nestopia] loadDashboardData executed')`），方便快速定位"未调用"类问题
- [ ] 引入 E2E 冒烟测试：登录 → 检查 Logo 元素 src 非空 → 点击项目 → 检查 Workflow 步骤 ≥ 1

---

## 相关文件清单

| 文件 | 修改内容 |
|------|----------|
| `company-operations.html` | 第 ~4503 行新增 `loadDashboardData();` 调用 |
| `js/data/step-config.js` | IIFE 末尾新增 4 行 `window.*` 全局别名 |
| `js/modules/projects.js` | 未修改（消费方，引用路径保持不变） |
| `js/core/tenant.js` | 未修改（租户配置正常，logo 文件存在） |
