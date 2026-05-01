# Nestopia B2B 平台 — 安全策略

> **版本**: v1.0  
> **最后更新**: 2026-05-01 (commit `ece2630`)  
> **维护者**: Webster / Qoder  
> **状态**: 活跃文档 — 随安全实施进展持续更新

---

## 目录

1. [概述](#1-概述)
2. [安全架构全景](#2-安全架构全景)
3. [认证层](#3-认证层)
4. [多租户隔离](#4-多租户隔离)
5. [API 安全](#5-api-安全)
6. [存储安全](#6-存储安全)
7. [敏感数据保护](#7-敏感数据保护)
8. [安全成熟度评估](#8-安全成熟度评估)
9. [关键漏洞清单](#9-关键漏洞清单)
10. [生产上线安全路线图](#10-生产上线安全路线图)
11. [合规与法律](#11-合规与法律)
12. [相关文档](#12-相关文档)

---

## 1. 概述

Nestopia B2B 平台采用**多层纵深防御**安全策略，覆盖认证、数据隔离、API 保护和存储安全四个维度。

### 1.1 安全原则

| 原则 | 说明 |
|------|------|
| **纵深防御** | 每层独立生效，单层被突破不影响整体安全 |
| **最小权限** | 用户/租户仅能访问自身数据，默认拒绝 |
| **零信任前端** | 前端过滤仅为 UX 优化，真正的安全边界在数据库层（RLS） |
| **审计可追溯** | 所有关键操作（登录、数据变更）留有审计日志 |
| **向后兼容** | 安全加固不破坏现有数据和功能（参见 `webster-guidance.md` 回归预防规则） |

### 1.2 当前阶段

```
当前: Phase 2 (MVP) — 适用于内部 Demo / Staging
目标: Phase 3 — 适用于付费客户生产环境
差距: 安全实施完成度 ~35%，设计完成度 ~90%
```

---

## 2. 安全架构全景

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端 (浏览器)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │login.html│  │auth.js   │  │tenant.js │  │projects.js   │  │
│  │          │  │          │  │          │  │              │  │
│  │• 凭证验证│  │• Token   │  │• Slug    │  │• 客户端      │  │
│  │• 租户选择│  │  校验    │  │  管理    │  │  租户过滤    │  │
│  │• 已认证  │  │• 租户    │  │• 配置    │  │• DB 查询     │  │
│  │  自动跳转│  │  一致性  │  │  映射    │  │  tenant_id   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │             │             │                │           │
├───────┼─────────────┼─────────────┼────────────────┼───────────┤
│       │         Cloudflare Pages Functions          │           │
│  ┌────┴─────────────┴─────────────┴────────────────┴───────┐  │
│  │  /api/chat      /api/design-generate    /api/design-status│  │
│  │  • DASHSCOPE_API_KEY (环境变量)                          │  │
│  │  • 模型降级策略                                          │  │
│  │  • SSE 流式响应                                          │  │
│  └────────────────────────────┬─────────────────────────────┘  │
│                               │                                │
├───────────────────────────────┼────────────────────────────────┤
│                        Supabase                                │
│  ┌────────────────────────────┴─────────────────────────────┐  │
│  │  PostgreSQL (RLS)          │  Storage (Buckets)           │  │
│  │  • 18 张业务表             │  • kb-tenant-files           │  │
│  │  • get_current_tenant_id() │  • kb-project-files          │  │
│  │  • is_super_admin()        │  • 路径隔离:                 │  │
│  │  • 行级安全策略            │    {tenant}/{project}/{cat}  │  │
│  └────────────────────────────┴─────────────────────────────┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Edge Functions (待部署)                                  │  │
│  │  • auth-login (JWT + bcrypt + 审计)                      │  │
│  │  • auth-middleware (租户上下文注入)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 认证层

### 3.1 当前实现

#### 前端登录 (`login.html`)

| 组件 | 实现 | 状态 |
|------|------|------|
| 邮箱验证 | 仅接受 `@ai-nestopia.com` 后缀 | ✅ 已实现 |
| 密码方案 | `{prefix}123!` 固定模式 | ⚠️ 仅 Demo 用 |
| 凭证验证位置 | 客户端 JavaScript | ⚠️ 不安全 |
| Token 生成 | `nestopia-auth-{prefix}-{timestamp}` 合成 | ⚠️ 非真实 JWT |
| 存储策略 | Remember Me → localStorage / 否则 → sessionStorage | ✅ 已实现 |

#### 3 层跨租户防护 (2026-05-01 `ece2630`)

```
第 1 层 [login.html] — 入口拦截
  已认证用户访问登录页 → 自动跳转操作台
  → 必须先 Logout 才能切换租户

第 2 层 [login.html] — 存储清洁
  新登录前清除 localStorage + sessionStorage 全部旧认证数据
  → 消除跨存储残留

第 3 层 [auth.js] — 运行时校验
  checkAuth() 验证 auth_data.tenant === tenant_slug
  → 不一致则强制 logout
```

#### 会话管理 (`auth.js`)

```javascript
// Token 检查 + 租户一致性验证
checkAuth() {
    token = localStorage || sessionStorage;
    if (!token) → redirect login.html;
    
    // 租户一致性
    if (auth_data.tenant !== tenant_slug) → logout();
    
    return true;
}

// 登出：清除所有存储
logout() {
    clear localStorage (auth_token, auth_data, auth_remember, tenant_slug);
    clear sessionStorage (auth_token, auth_data, tenant_slug);
    redirect login.html;
}
```

### 3.2 后端认证系统（已设计，待部署）

**Edge Function: `supabase/functions/auth-login/index.ts`**

| 功能 | 设计 |
|------|------|
| 密码哈希 | bcrypt 比对 `user.password_hash` |
| JWT 生成 | HS256，24 小时有效期 |
| Refresh Token | 7 天有效期 |
| 会话追踪 | `user_sessions` 表记录 token hash + 设备信息 |
| 审计日志 | 成功/失败登录记录（含 IP 地址） |

**Edge Function: `supabase/functions/auth-middleware/index.ts`**

| 功能 | 设计 |
|------|------|
| JWT 验证 | 签名校验 + 有效期检查 |
| 租户上下文 | 设置 PostgreSQL 会话变量供 RLS 使用 |
| 用户状态 | 检查 `status = 'active'` |
| 特性开关 | 注入租户级 feature flags |

---

## 4. 多租户隔离

### 4.1 租户标识体系

```
登录页下拉框 → tenant_slug → localStorage/sessionStorage
                                    ↓
                            getCurrentTenantSlug()
                                    ↓
              ┌─────────────────────┼─────────────────────┐
              ↓                     ↓                     ↓
        UI 品牌/语言         项目过滤              DB 查询
     (tenantConfigs)    (product_config     (getTenantId()
                         .tenant_slug)      → 固定 UUID ⚠️)
```

### 4.2 当前租户配置 (`tenant.js`)

```javascript
tenantConfigs = {
    'default':      { name: 'Greenscape Builders', language: 'en',        unitSystem: 'imperial' },
    'partner1':     { name: 'Greenscape Builders', language: 'en',        unitSystem: 'imperial' },
    'omeya-sin':    { name: 'Omeya-SIN',           language: 'en',        unitSystem: 'imperial' },
    'nestopia-chn': { name: 'Nestopia-CHN',         language: 'bilingual', unitSystem: 'metric'   }
};
```

### 4.3 数据库行级安全 (RLS)

**设计状态: 完整 | 部署状态: POC 策略（非生产强度）**

所有 18 张业务表均定义了 RLS 策略（`supabase/schema.sql`）：

```sql
-- 核心隔离函数
CREATE FUNCTION get_current_tenant_id() RETURNS UUID
  -- 读取 PostgreSQL 会话变量: app.current_tenant_id
  -- 未设置时返回 NULL（阻止所有查询）

CREATE FUNCTION is_super_admin() RETURNS BOOLEAN
  -- 读取: app.is_super_admin = 'true'

-- 统一 RLS 策略模式
CREATE POLICY rls_{table} ON {table} FOR ALL
  USING (tenant_id = get_current_tenant_id() OR is_super_admin());
```

**受保护表清单:**

| 类别 | 表名 |
|------|------|
| 平台级 | `tenants`, `users`, `user_sessions`, `audit_logs`, `system_configs` |
| 业务级 | `partners`, `customers`, `product_categories`, `products`, `product_files`, `pricing`, `cost_components`, `projects`, `designs`, `orders`, `order_items`, `payments`, `documents` |

**复合唯一约束（多租户安全键）:**

```
users:       UNIQUE(tenant_id, email)
customers:   UNIQUE(tenant_id, customer_number)
products:    UNIQUE(tenant_id, sku)
orders:      UNIQUE(tenant_id, order_number)
payments:    UNIQUE(tenant_id, payment_number)
```

### 4.4 前端租户过滤 (`projects.js`)

```javascript
// DB 查询: 使用 tenant_id 过滤
.from('projects').select('*').eq('tenant_id', tenantId)

// 客户端二次过滤: 使用 product_config.tenant_slug
var currentSlug = getCurrentTenantSlug();
var greenscapeSlugs = ['default', 'partner1', 'partner2'];
rows = rows.filter(function(row) {
    var cfg = row.product_config || {};
    if (!cfg.tenant_slug) return true;  // 向后兼容
    if (isGreenscape) return greenscapeSlugs.indexOf(cfg.tenant_slug) >= 0;
    return cfg.tenant_slug === currentSlug;
});
```

> ⚠️ **重要提醒**: 前端过滤仅为 UX 优化，不构成安全边界。真正的隔离依赖 RLS。

---

## 5. API 安全

### 5.1 Cloudflare Pages Functions

| 端点 | 认证 | 密钥 | CORS | 限流 |
|------|------|------|------|------|
| `/api/chat` | ❌ 无 | `DASHSCOPE_API_KEY` (环境变量) | `*` (开放) | ❌ 依赖 DashScope |
| `/api/design-generate` | ❌ 无 | `DASHSCOPE_API_KEY` (环境变量) | `*` (开放) | ❌ 依赖 DashScope |
| `/api/design-status` | ❌ 无 | `DASHSCOPE_API_KEY` (环境变量) | `*` (开放) | ❌ 无 |

**模型降级策略 (design-generate):**

```
MODEL_PRIORITY: [
    'qwen3.6-flash-2026-04-16',    // 首选
    'qwen3.6-plus-2026-04-02',     // 降级 1
    'qwen3.6-plus'                  // 降级 2（兜底）
]

429/503 → 自动尝试下一个模型
全部失败 → 返回错误
```

### 5.2 Supabase 数据库访问

```javascript
// 客户端直连 Supabase (Anon Key 暴露在前端 — 这是 Supabase 的设计模式)
supabase-config.js:
    url:     'https://drofojkakxitrqxnxrhh.supabase.co'
    anonKey: 'sb_publishable_...'  // 公开可见

// 安全依赖: RLS 策略必须处于活跃状态
// 当前状态: POC 策略 → 允许匿名读取 ⚠️
```

### 5.3 密钥管理

| 密钥 | 存储位置 | 暴露级别 |
|------|---------|---------|
| `DASHSCOPE_API_KEY` | Cloudflare Functions 环境变量 | 🔐 仅服务端 |
| `JWT_SECRET` | Supabase Edge Functions 环境变量 | 🔐 仅服务端 |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions 环境变量 | 🔐 仅服务端（绝不暴露给客户端） |
| `Supabase Anon Key` | 客户端 JS 代码 | 🌐 公开（by design，依赖 RLS） |

---

## 6. 存储安全

### 6.1 存储桶结构

```
kb-tenant-files/
├── {tenant-id}/
│   ├── zip-blinds/manuals/      # 产品手册
│   ├── zip-blinds/specs/        # 技术规格
│   └── compliance/              # 合规文件

kb-project-files/
├── {tenant-id}/
│   └── {project-id}/
│       ├── site-photos/         # 现场照片
│       ├── site-videos/         # 现场视频
│       ├── measurements/        # 测量数据
│       ├── designs/             # 设计文件
│       └── quotations/          # 报价单
```

### 6.2 访问控制策略（已设计，待激活）

```sql
-- 租户文件: 同租户成员可读，管理员可写
CREATE POLICY tenant_access ON kb_documents FOR SELECT
  USING (scope = 'tenant' AND tenant_id = auth.jwt() ->> 'tenant_id');

-- 项目文件: 仅项目成员可访问
CREATE POLICY project_access ON kb_documents FOR SELECT
  USING (scope = 'project' AND project_id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ));
```

### 6.3 文件上传安全

| 检查项 | 状态 |
|--------|------|
| 文件大小限制 (50MB) | ✅ 已实现 |
| 路径隔离 `{tenant}/{project}/{category}` | ✅ 已实现 |
| 上传失败降级到 localStorage | ✅ 已实现 |
| 文件类型白名单 | ⚠️ 仅 MIME 检测，无强制白名单 |
| 病毒扫描 | ❌ 未实现 |
| 签名 URL（临时访问） | ❌ 未实现（当前使用永久 publicUrl） |

---

## 7. 敏感数据保护

### 7.1 客户端代码暴露分析

| 数据 | 位置 | 风险等级 | 说明 |
|------|------|---------|------|
| Supabase Anon Key | `supabase-config.js:10` | 🟡 设计如此 | Supabase 模式，依赖 RLS 保护 |
| Supabase URL | `supabase-config.js:9` | 🟡 低 | 端点 URL |
| 密码规则 | `login.html:569` | 🔴 严重 | `{prefix}123!` 可见于源码 |
| 租户 Slug 列表 | `login.html:347-350` | 🟡 低 | Demo 租户 |
| 固定 Tenant ID | `supabase-config.js:11` | 🟠 高 | 所有租户共享同一 UUID |

### 7.2 服务端安全存储

| 数据 | 位置 | 状态 |
|------|------|------|
| `DASHSCOPE_API_KEY` | Cloudflare Functions 环境变量 | ✅ 安全 |
| `JWT_SECRET` | Supabase Edge Functions 环境变量 | ✅ 安全 |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions 环境变量 | ✅ 安全 |
| `.env` 文件 | 本地开发（.gitignore 排除） | ✅ 安全 |

### 7.3 审计日志（已设计，待部署）

```sql
-- 登录失败审计
INSERT INTO audit_logs (tenant_id, user_id, action, details)
  VALUES (..., 'login_failed', { reason: 'invalid_password', ip: '...' });

-- 登录成功审计
INSERT INTO audit_logs (..., 'login_success', { ip: '...', device: '...' });

-- 用户最后登录更新
UPDATE users SET last_login_at, last_login_ip WHERE id = user_id;
```

---

## 8. 安全成熟度评估

```
┌─────────────────────────────────────────────────────────┐
│ 安全实施记分卡                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  认证层                ▓▓▓░░░░░░░░  30%                │
│  └─ Mock 登录 + 3 层跨租户防护                         │
│                                                         │
│  多租户隔离            ▓▓▓▓▓░░░░░░  50%                │
│  └─ RLS 已设计, POC 策略在线, 前端过滤已实现            │
│                                                         │
│  API 安全              ▓▓░░░░░░░░░  20%                │
│  └─ 密钥服务端隔离, 但端点无认证                       │
│                                                         │
│  存储安全              ▓░░░░░░░░░░  10%                │
│  └─ 路径隔离, RLS 未强制执行                           │
│                                                         │
│  数据保护              ▓░░░░░░░░░░  10%                │
│  └─ 审计日志已设计, 未部署                             │
│                                                         │
│  综合安全              ▓▓▓░░░░░░░░  ~35%               │
│                                                         │
│  适用于:         内部 Demo / Staging                    │
│  不适用于:       生产环境 / 付费客户                    │
└─────────────────────────────────────────────────────────┘
```

---

## 9. 关键漏洞清单

### 🔴 Tier 1: 外部用户接入前必须修复

| # | 漏洞 | 影响 | 修复方案 | 预计周期 |
|---|------|------|---------|---------|
| 1 | **客户端硬编码密码规则** | 任何人可从源码推导密码 | 部署 `auth-login` Edge Function + bcrypt | 1 周 |
| 2 | **生产 RLS 未激活** | Anon Key 可读取所有数据 | 删除 POC 策略，激活生产 RLS | 1 周 |
| 3 | **固定 tenant_id** | 所有租户共享 DB 查询范围 | 从 JWT claims 读取 tenant_id | 1 周 |
| 4 | **API 端点无认证** | 全球任何人可调用 AI 服务 | 添加 Bearer Token 验证 | 1 周 |

### 🟠 Tier 2: 生产上线前必须修复

| # | 漏洞 | 影响 | 修复方案 | 预计周期 |
|---|------|------|---------|---------|
| 5 | Token 明文存储 (localStorage) | XSS 可窃取认证信息 | 迁移到 HttpOnly Cookie | 1 周 |
| 6 | CORS 全开放 (`*`) | 第三方网站可调用 API | 限制为 `*.nestopia.com` + staging | 1 天 |
| 7 | 无登录限流 | 暴力破解风险 | 5 次/15 分钟限制 | 2 天 |
| 8 | 存储桶无签名 URL | 文件链接永久有效 | 实现 Signed URL 机制 | 3 天 |

### 🟡 Tier 3: Phase 3 实现

| # | 漏洞 | 影响 | 修复方案 |
|---|------|------|---------|
| 9 | 无 2FA/MFA | 账户安全薄弱 | TOTP 支持 |
| 10 | 无文件病毒扫描 | 恶意文件上传风险 | 集成 ClamAV 或云扫描 |
| 11 | 无 API 密钥轮换 | 泄漏后影响范围大 | 90 天轮换策略 |
| 12 | 无用量追踪 | 无法按租户计费/限额 | per-tenant API quota |

---

## 10. 生产上线安全路线图

```
Week 1-2: 认证基础设施
  ├─ 部署 auth-login Edge Function (JWT + bcrypt)
  ├─ 部署 auth-middleware (租户上下文注入)
  ├─ 迁移密码到 bcrypt 哈希
  └─ 替换 Mock Token 为真实 JWT

Week 2-3: 数据隔离加固
  ├─ 激活生产 RLS 策略（删除 POC 策略）
  ├─ getTenantId() 从 JWT claims 读取
  ├─ 存储桶 RLS 策略激活
  └─ 跨租户隔离回归测试

Week 3-4: API 安全加固
  ├─ /api/chat + /api/design-generate 添加 Bearer Token
  ├─ CORS 白名单限制
  ├─ 登录限流 (5次/15分钟)
  └─ Token 迁移到 HttpOnly Cookie

Week 4-6: 审计与监控
  ├─ 审计日志系统上线
  ├─ 登录/操作审计面板
  ├─ 存储用量监控告警
  └─ API 用量追踪

Week 6-8: 外部审计
  ├─ 第三方安全评估（重点: 多租户隔离）
  ├─ 渗透测试
  └─ 安全文档交付客户
```

---

## 11. 合规与法律

| 标准 | 当前状态 | 差距 |
|------|---------|------|
| **GDPR** | ⚠️ 部分 | 数据删除/导出已设计未实现；无同意管理 |
| **CCPA** | ⚠️ 部分 | 数据可移植性路线图存在；无隐私仪表板 |
| **SOC 2** | ❌ 未就绪 | 审计日志未完整；RLS 未强制执行 |
| **ISO 27001** | ❌ 未就绪 | 访问控制矩阵不完整；无正式风险评估 |

**建议**: 在接受第一个付费客户之前，需与法律/合规团队完成 GDPR 和 CCPA 基础合规框架。

---

## 12. 相关文档

| 文档 | 内容 |
|------|------|
| `docs/multi-tenant-architecture.md` | 多租户架构设计（含 RLS 详细策略） |
| `docs/STORAGE_STRATEGY.md` | 存储策略（Supabase + Cloudflare R2） |
| `docs/KB_STORAGE_DESIGN.md` | KB 存储架构细节 |
| `docs/DATA_AI_STRATEGY.md` | 数据与 AI 策略 |
| `supabase/schema.sql` | 数据库 DDL（含 RLS 策略定义） |
| `supabase/functions/auth-login/` | 后端认证 Edge Function（待部署） |
| `supabase/functions/auth-middleware/` | 认证中间件 Edge Function（待部署） |
| `.qoder/rules/webster-guidance.md` | 项目全局规则（含回归预防） |

---

## 变更历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-01 | v1.0 | 初始版本 — 安全策略全景报告 |
| 2026-05-01 | — | 修复跨租户访问漏洞 (commit `ece2630`): 3 层防护 |
| 2026-05-01 | — | 报价单品牌跟随项目 tenant_slug (commit `680c2cc`) |
