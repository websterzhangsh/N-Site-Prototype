# 多租户系统架构设计 (Multi-Tenant Architecture)

> 版本: v1.0
> 日期: 2026-03-09
> 目标: 支持多租户合作伙伴平台，每个租户拥有独立数据和可定制UI

---

## 一、架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                        前端层 (Frontend)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  公共网站     │  │  租户登录页   │  │   租户管理后台        │  │
│  │  (index.html)│  │(login.html)  │  │  (dashboard.html)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API 网关层 (API Gateway)                    │
├─────────────────────────────────────────────────────────────────┤
│  • 路由分发 (基于 subdomain/path)                                │
│  • JWT 认证验证                                                  │
│  • 租户上下文注入 (Tenant Context)                                │
│  • 速率限制 / CORS                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      服务层 (Backend Services)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  认证服务     │  │  租户服务     │  │   业务服务            │  │
│  │  Auth API    │  │  Tenant API  │  │  (Projects/Orders)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      数据层 (Data Layer)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Supabase PostgreSQL (共享数据库)              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │ 租户元数据   │  │ 用户表       │  │  租户隔离数据    │  │  │
│  │  │ (tenants)   │  │ (users)     │  │ (RLS 行级安全)  │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、租户识别策略

### 2.1 识别方式 (Tenant Resolution)

| 方式 | 示例 | 适用场景 |
|------|------|----------|
| **Subdomain** | `partner1.nestopia.com` | 主要方式，品牌化 |
| **Path-based** | `nestopia.com/p/partner1` | 备用方式，简单部署 |
| **Custom Domain** | `partner1.com` | 高级租户，完全定制 |
| **Header** | `X-Tenant-ID: partner1` | API 调用 |

### 2.2 租户上下文 (Tenant Context)

```typescript
interface TenantContext {
  tenantId: string;           // 租户唯一标识
  tenantName: string;         // 显示名称
  slug: string;               // URL slug
  plan: 'basic' | 'pro' | 'enterprise';  // 套餐级别
  features: string[];         // 启用的功能
  uiConfig: UIConfig;         // UI 定制配置
  dbSchema?: string;          // 独立 schema (可选)
}

interface UIConfig {
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  customCss?: string;
  hiddenSections?: string[];
  customSections?: CustomSection[];
}
```

---

## 三、数据库设计

### 3.1 共享数据库 + 行级安全 (RLS) 方案

采用 **Shared Database, Separate Schema** 或 **Shared Schema, Row-Level Security**

```sql
-- 主租户表
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,        -- 唯一标识，用于URL
    name VARCHAR(100) NOT NULL,              -- 显示名称
    status VARCHAR(20) DEFAULT 'active',     -- active, suspended, deleted
    plan VARCHAR(20) DEFAULT 'basic',        -- 套餐级别
    
    -- 联系信息
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    address TEXT,
    
    -- UI 定制配置 (JSON)
    ui_config JSONB DEFAULT '{}',
    
    -- 功能开关
    features JSONB DEFAULT '[]',
    
    -- 配额限制
    max_projects INTEGER DEFAULT 10,
    max_users INTEGER DEFAULT 5,
    storage_quota_mb INTEGER DEFAULT 1024,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 用户表 (跨租户，通过 tenant_id 关联)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- 认证信息
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255),              -- bcrypt hash
    
    -- 用户信息
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- 角色权限
    role VARCHAR(20) DEFAULT 'member',       -- super_admin, admin, manager, member
    permissions JSONB DEFAULT '[]',
    
    -- 状态
    status VARCHAR(20) DEFAULT 'active',     -- active, inactive, pending
    email_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, email)
);

-- 登录会话表
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,        -- JWT token hash
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 业务数据表 (示例：项目表)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- 项目信息
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft',      -- draft, in_progress, completed, cancelled
    
    -- 客户信息
    client_name VARCHAR(100),
    client_email VARCHAR(100),
    client_phone VARCHAR(20),
    
    -- 项目详情
    project_type VARCHAR(50),                -- sunroom, pavilion, shutter
    budget_range VARCHAR(50),
    preferred_timeline VARCHAR(50),
    
    -- 附件
    attachments JSONB DEFAULT '[]',
    
    -- 元数据
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 订单表
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id),
    
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',    -- pending, confirmed, in_production, shipped, installed, completed
    
    -- 金额信息
    total_amount DECIMAL(12, 2),
    currency VARCHAR(3) DEFAULT 'CNY',
    
    -- 付款阶段
    deposit_paid BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(12, 2),
    second_payment_paid BOOLEAN DEFAULT FALSE,
    second_payment_amount DECIMAL(12, 2),
    final_payment_paid BOOLEAN DEFAULT FALSE,
    final_payment_amount DECIMAL(12, 2),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 行级安全策略 (RLS)

```sql
-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 用户只能看到同租户的数据
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_projects ON projects
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

CREATE POLICY tenant_isolation_orders ON orders
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- 超级管理员可以看到所有数据
CREATE POLICY super_admin_all_users ON users
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'super_admin');
```

---

## 四、认证流程

### 4.1 登录流程

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant AuthAPI
    participant Supabase
    participant TenantDB

    User->>Browser: 访问 partner1.nestopia.com/login
    Browser->>AuthAPI: GET /api/tenant?slug=partner1
    AuthAPI->>TenantDB: 查询租户信息
    TenantDB-->>AuthAPI: 返回租户配置
    AuthAPI-->>Browser: 返回租户UI配置
    Browser->>User: 渲染定制化的登录页

    User->>Browser: 输入邮箱/密码
    Browser->>AuthAPI: POST /api/auth/login
    AuthAPI->>TenantDB: 验证用户凭证
    TenantDB-->>AuthAPI: 用户数据 + 租户信息
    AuthAPI->>AuthAPI: 生成 JWT (包含 tenant_id, user_id, role)
    AuthAPI-->>Browser: 返回 {token, user, tenant}
    Browser->>Browser: 存储 token (httpOnly cookie)
    Browser->>User: 跳转到租户 Dashboard
```

### 4.2 JWT Token 结构

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-uuid",
    "tenant_id": "tenant-uuid",
    "tenant_slug": "partner1",
    "email": "user@partner1.com",
    "role": "admin",
    "permissions": ["projects.read", "projects.write", "orders.read"],
    "iat": 1709990400,
    "exp": 1710076800
  }
}
```

---

## 五、API 设计

### 5.1 认证相关 API

```typescript
// POST /api/auth/login
interface LoginRequest {
  email: string;
  password: string;
  tenantSlug: string;  // 从 URL 自动提取
}

interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    uiConfig: UIConfig;
  };
}

// POST /api/auth/logout
interface LogoutRequest {
  token: string;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/forgot-password
interface ForgotPasswordRequest {
  email: string;
  tenantSlug: string;
}

// POST /api/auth/reset-password
interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
```

### 5.2 租户管理 API (仅超管)

```typescript
// GET /api/tenants
// POST /api/tenants
interface CreateTenantRequest {
  name: string;
  slug: string;
  contactEmail: string;
  plan: 'basic' | 'pro' | 'enterprise';
}

// GET /api/tenants/:id
// PUT /api/tenants/:id
// DELETE /api/tenants/:id

// PUT /api/tenants/:id/ui-config
interface UpdateUIConfigRequest {
  primaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
  hiddenSections?: string[];
}
```

### 5.3 用户管理 API

```typescript
// GET /api/users
// POST /api/users
interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'manager' | 'member';
  sendInvite: boolean;
}

// GET /api/users/:id
// PUT /api/users/:id
// DELETE /api/users/:id
```

---

## 六、前端架构

### 6.1 页面结构

```
/public
├── index.html              # 公共首页
├── login.html              # 租户登录页
├── partners.html           # 合作伙伴介绍页
├── dashboard.html          # 租户管理后台
├── /assets
│   ├── css/
│   ├── js/
│   └── images/
└── /tenant-assets          # 租户上传的资源
    ├── /partner1
    │   ├── logo.png
    │   └── custom.css
    └── /partner2
```

### 6.2 登录页动态渲染

```javascript
// login.js
async function initLoginPage() {
  // 1. 从 URL 提取租户 slug
  const tenantSlug = extractTenantSlug(); // partner1.nestopia.com or nestopia.com/p/partner1
  
  // 2. 获取租户配置
  const tenant = await fetch(`/api/tenant?slug=${tenantSlug}`).then(r => r.json());
  
  // 3. 应用 UI 定制
  applyTenantUI(tenant.uiConfig);
  
  // 4. 渲染登录表单
  renderLoginForm(tenant);
}

function applyTenantUI(config) {
  // 应用主色调
  document.documentElement.style.setProperty('--primary-color', config.primaryColor);
  
  // 替换 Logo
  document.getElementById('tenant-logo').src = config.logoUrl;
  
  // 应用自定义 CSS
  if (config.customCss) {
    const style = document.createElement('style');
    style.textContent = config.customCss;
    document.head.appendChild(style);
  }
  
  // 页面标题
  document.title = `${config.name} - 登录`;
}
```

### 6.3 Dashboard 权限控制

```javascript
// dashboard.js
const PERMISSIONS = {
  PROJECTS_READ: 'projects.read',
  PROJECTS_WRITE: 'projects.write',
  ORDERS_READ: 'orders.read',
  ORDERS_WRITE: 'orders.write',
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  SETTINGS_READ: 'settings.read',
  SETTINGS_WRITE: 'settings.write',
};

function checkPermission(permission) {
  const user = getCurrentUser();
  return user.permissions.includes(permission) || user.role === 'admin';
}

function renderNavigation() {
  const navItems = [
    { id: 'dashboard', label: '概览', icon: 'home', permission: null },
    { id: 'projects', label: '项目管理', icon: 'folder', permission: PERMISSIONS.PROJECTS_READ },
    { id: 'orders', label: '订单管理', icon: 'file-invoice', permission: PERMISSIONS.ORDERS_READ },
    { id: 'customers', label: '客户管理', icon: 'users', permission: PERMISSIONS.PROJECTS_READ },
    { id: 'team', label: '团队管理', icon: 'user-cog', permission: PERMISSIONS.USERS_READ },
    { id: 'settings', label: '设置', icon: 'cog', permission: PERMISSIONS.SETTINGS_READ },
  ];
  
  // 根据权限过滤
  const visibleItems = navItems.filter(item => 
    !item.permission || checkPermission(item.permission)
  );
  
  // 根据租户配置隐藏特定区块
  const tenant = getCurrentTenant();
  const finalItems = visibleItems.filter(item => 
    !tenant.uiConfig.hiddenSections?.includes(item.id)
  );
  
  renderNav(finalItems);
}
```

---

## 七、安全考虑

### 7.1 安全措施

| 层面 | 措施 |
|------|------|
| **认证** | bcrypt 密码哈希, JWT + Refresh Token, 2FA (可选) |
| **授权** | RBAC 角色权限, 租户隔离 (RLS), API 权限校验 |
| **传输** | HTTPS 强制, HSTS 头 |
| **存储** | 敏感数据加密, 定期备份 |
| **会话** | Token 过期, 单点登录控制, 异常登录检测 |
| **审计** | 操作日志, 登录日志, 数据变更历史 |

### 7.2 数据隔离验证

```javascript
// 中间件：验证租户访问权限
async function tenantMiddleware(req, res, next) {
  const token = extractToken(req);
  const decoded = verifyJWT(token);
  
  // 从请求中提取租户标识
  const requestTenant = req.headers['x-tenant-id'] || req.subdomain;
  
  // 验证 Token 中的租户与请求租户匹配
  if (decoded.tenant_slug !== requestTenant) {
    return res.status(403).json({ error: 'Tenant mismatch' });
  }
  
  // 设置租户上下文
  req.tenantId = decoded.tenant_id;
  req.userId = decoded.sub;
  req.userRole = decoded.role;
  
  // 设置数据库 RLS 上下文
  await db.query(`SET app.current_tenant = '${decoded.tenant_id}'`);
  
  next();
}
```

---

## 八、部署架构

### 8.1 基础设施

```
┌─────────────────────────────────────────────────────────────┐
│                        Cloudflare                            │
│  • DNS 管理 (多域名)                                          │
│  • CDN 加速                                                   │
│  • DDoS 防护                                                  │
│  • Edge Functions (可选，用于租户路由)                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Vercel / Netlify                        │
│  • 前端静态托管                                               │
│  • 自动部署                                                   │
│  • Edge Middleware (租户识别)                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│  • PostgreSQL 数据库                                          │
│  • Auth (可扩展)                                              │
│  • Storage (租户文件)                                         │
│  • Edge Functions (业务逻辑)                                  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 域名配置

```
# 主域名
nestopia.com              → 公共网站
app.nestopia.com          → 登录入口 (自动跳转)

# 租户子域名 (通配符 DNS)
*.nestopia.com            → 租户定制页面
partner1.nestopia.com     → 租户1登录页
partner2.nestopia.com     → 租户2登录页

# 自定义域名 (CNAME)
portal.partner1.com       → partner1.nestopia.com
```

---

## 九、实施路线图

### Phase 1: 基础多租户 (MVP)
- [ ] 租户表 + 用户表设计
- [ ] 登录/认证 API
- [ ] 基础登录页面
- [ ] 简单 Dashboard
- [ ] 租户隔离 (RLS)

### Phase 2: UI 定制
- [ ] 租户配置管理
- [ ] 登录页定制 (Logo, 颜色)
- [ ] Dashboard 模块开关
- [ ] 自定义 CSS

### Phase 3: 高级功能
- [ ] 自定义域名
- [ ] 细粒度权限控制
- [ ] 审计日志
- [ ] API 访问

### Phase 4: 企业级
- [ ] SSO (SAML/OIDC)
- [ ] 数据导出/备份
- [ ] 多区域部署
- [ ] SLA 保障

---

## 十、技术栈

| 组件 | 技术 |
|------|------|
| **前端** | Vanilla JS / React (可选) + Tailwind CSS |
| **后端** | Supabase Edge Functions (Deno) / Node.js |
| **数据库** | PostgreSQL (Supabase) |
| **认证** | JWT + bcrypt |
| **存储** | Supabase Storage |
| **部署** | Vercel / Netlify + Supabase |
| **监控** | Supabase Analytics / Sentry |

---

*本文档为多租户系统架构设计，后续可根据实际需求调整。*
