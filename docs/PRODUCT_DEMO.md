# Nestopia B2B Platform - Product Demo
## 过去 24-36 小时开发成果演示

**演示日期**: 2026-03-11  
**版本**: v2.0.0  
**演示时长**: 约 10-15 分钟

---

## 🎯 演示目标

向利益相关者展示 Nestopia B2B 合作伙伴平台的核心功能，包括：
1. 多租户架构下的完整数据隔离
2. 4 个 AI Agent 的业务流程集成
3. Products / Orders / Customers / Pricing 完整管理功能
4. 严格的数据库 Schema 设计和测试数据

---

## 📋 演示大纲

### 第一部分：平台概览 (2 分钟)
- 多租户架构介绍
- 用户角色与权限体系
- UI 定制能力

### 第二部分：核心业务功能 (5 分钟)
- Products 产品管理
- Customers 客户管理
- Orders 订单管理
- Pricing 定价管理

### 第三部分：AI Agent 集成 (4 分钟)
- AI Designer Agent
- Pricing & Cost Controller Agent
- Compliance Manager Agent
- Customer Service Executive Agent

### 第四部分：技术架构 (3 分钟)
- 数据库 Schema 设计
- 多租户隔离机制
- 测试数据展示

---

## 🎬 详细演示脚本

### 【开场 - 30秒】

**画面**: 浏览器打开 https://nestopia.com

**旁白**:
> "大家好，今天我将演示 Nestopia B2B 合作伙伴平台在过去 36 小时内的开发成果。这是一个面向户外阳光房行业的小型企业主和合作伙伴的 SaaS 平台。"

---

### 【第一部分：多租户登录 - 1.5分钟】

**画面**: 显示登录页面 `login.html`

**操作**:
1. 展示租户定制化登录页面（Greenscape Builders 品牌）
2. 输入演示账号：`demo@nestopia.com` / `Demo123!`
3. 点击 "Sign In"

**旁白**:
> "平台采用多租户架构，每个合作伙伴都有独立的品牌登录页面。系统支持 subdomain、path-based 和 custom domain 三种租户识别方式。"

**画面**: 登录成功，进入 Dashboard 主页

**旁白**:
> "登录后，用户只能看到自己租户的数据，实现完全的数据隔离。"

---

### 【第二部分：Dashboard 概览 - 1分钟】

**画面**: Dashboard 主页 (`page-overview`)

**操作**:
1. 展示统计卡片：Total Revenue, Active Projects, Pending Orders, Customer Satisfaction
2. 展示 Recent Activity 时间线
3. 展示 Quick Actions 快捷操作

**旁白**:
> "Dashboard 提供业务概览，让小型企业主一眼看到关键指标。Recent Activity 显示最新的订单、项目动态。"

---

### 【第三部分：Products 产品管理 - 1.5分钟】

**画面**: 点击左侧菜单 "Products"

**操作**:
1. 展示产品列表（左侧面板）
   - 6 个产品：可伸缩阳光房、固定阳光房、智能阳光房、凉亭、配件
   - 每个产品显示：缩略图、名称、分类、状态
2. 点击产品 "可伸缩阳光房 A100系列"
3. 展示右侧详情面板：
   - 产品图片、规格参数（JSONB）
   - 定价配置（分层定价、选项加价）
   - 文件管理（支持上传 CAD/PDF/图片）
4. 点击 "Upload Files" 按钮
5. 展示支持的文件类型：image, pdf, dwg, dxf, skp, obj, step, stl

**旁白**:
> "Products 页面支持完整的产品目录管理。每个产品有详细的规格参数，使用 JSONB 存储灵活的结构化数据。定价支持分层定价、选项加价、折扣规则。文件管理支持 CAD 图纸、3D 模型、PDF 文档等多种格式。"

---

### 【第四部分：Customers 客户管理 - 1.5分钟】

**画面**: 点击左侧菜单 "Customers"

**操作**:
1. 展示客户列表（左侧面板）
   - 筛选按钮：All / Active / New / VIP
   - 搜索框
   - 5 个客户：显示头像、姓名、徽章（VIP/Active/New）、项目名、消费金额
2. 点击客户 "王建国"
3. 展示右侧详情面板：
   - 头像、姓名、VIP 徽章
   - 联系信息：邮箱、电话、微信、地址
   - 统计卡片：订单数、总消费、项目数、满意度
   - Recent Orders 表格
   - Tags 标签：["高净值", "复购客户", "推荐客户"]
   - Notes 备注
   - Action Buttons：New Order, Send Email, Call
4. 切换筛选按钮 "VIP"，展示 VIP 客户列表

**旁白**:
> "Customers 页面提供完整的客户关系管理。左侧列表支持筛选和搜索，右侧详情展示客户的完整画像，包括场地信息、消费记录、满意度评分。系统自动追踪客户来源（website/referral/partner/exhibition）。"

---

### 【第五部分：Orders 订单管理 - 1.5分钟】

**画面**: 点击左侧菜单 "Orders"

**操作**:
1. 展示订单统计卡片：
   - Total Orders: 156
   - Pending: 12
   - In Production: 8
   - Shipped: 5
   - Completed: 131
2. 展示筛选区域：
   - 搜索框
   - Status 下拉菜单
   - Date Range 选择器
3. 展示订单表格：
   - 列：Order #, Customer, Product, Total, Payment Status, Status, Date, Actions
   - 5 行订单数据
   - 状态徽章颜色：Pending(amber), In Production(blue), Shipped(purple), Completed(green)
4. 点击订单行，展示订单详情（模拟）
5. 展示分页控件：1-5 of 156

**旁白**:
> "Orders 页面支持完整的订单生命周期管理。系统采用 13 状态流转：从 pending 到 completed，支持三阶段付款（定金30%、二期40%、尾款30%）。Payment Status 显示付款进度。"

---

### 【第六部分：Pricing & Cost Controller Agent - 1分钟】

**画面**: 点击左侧菜单 "Agents" → "Pricing Agent"

**操作**:
1. 展示 Input 面板：
   - Project Selection 下拉菜单
   - Product Configuration 区域
   - Area Input (平方米)
   - Options 复选框：Premium Glass, Smart Shading, Heating System, LED Lighting
2. 展示 Output 面板：
   - Cost Breakdown 表格：
     - Material Cost: ¥185,000
     - Labor Cost: ¥45,000
     - Shipping Cost: ¥8,500
     - Installation Cost: ¥52,000
     - Options Cost: ¥25,300
   - Margin Analysis: 15%
   - Suggested Price: ¥326,800
   - Risk Alerts: "Margin below 20% threshold"
3. 展示 "Generate Quote" 按钮

**旁白**:
> "Pricing & Cost Controller Agent 自动计算项目成本，提供透明的成本分解。系统从 cost_components 表读取材料、人工、物流、安装等成本项，保护利润率。当利润率低于阈值时，系统会发出风险警告。"

---

### 【第七部分：AI Designer Agent - 1分钟】

**画面**: 点击左侧菜单 "Agents" → "AI Designer"

**操作**:
1. 展示 Input 面板：
   - Upload Site Photo 区域（拖拽上传）
   - Product Type 选择：Sunroom / Pergola / Shutter
   - Style Preferences：Modern / Classic / Minimalist
   - Color Scheme 选择
   - Special Requirements 文本框
2. 展示 Output 面板：
   - AI Generated Renders（3 张渲染图）
   - Design Specifications
   - Estimated Cost
   - Compliance Pre-check Status: ✅ Passed
3. 展示 "Create Proposal" 按钮

**旁白**:
> "AI Designer Agent 在 15 分钟内生成光写实设计渲染。用户上传场地照片，选择产品类型和偏好，系统自动生成多个设计变体。Compliance Pre-check 自动检查设计是否符合当地建筑法规。"

---

### 【第八部分：Compliance Manager Agent - 1分钟】

**画面**: 点击左侧菜单 "Agents" → "Compliance Manager"

**操作**:
1. 展示 Input 面板：
   - Design Selection 下拉菜单
   - Site Address
   - Building Type: Residential / Commercial
   - Local Jurisdiction 选择
2. 展示 Output 面板：
   - Compliance Status: ✅ PASSED
   - Checklist:
     - ✅ Setback Requirements: 1.5m minimum
     - ✅ Height Restrictions: Under 4m limit
     - ✅ Fire Safety: Meets code
     - ⚠️ Permit Required: Yes - Building permit needed
   - Recommendations
   - Required Documents List

**旁白**:
> "Compliance Manager Agent 自动化可行性和合规性检查。系统根据设计数据和当地建筑法规，生成通过/失败决定，提供风险警告和调整建议。"

---

### 【第九部分：Customer Service Executive Agent - 1分钟】

**画面**: 点击左侧菜单 "Agents" → "CS Agent"

**操作**:
1. 展示 Input 面板：
   - Customer Query 文本框
   - Channel 选择：WeChat / Email / Phone
   - Priority: Low / Medium / High
2. 展示 Output 面板：
   - Suggested Response
   - Related Order Info
   - Customer History Summary
   - Escalation Recommendation
3. 展示 Conversation History

**旁白**:
> "Customer Service Executive Agent 提供多渠道客户支持。系统自动查询订单状态、交付追踪、常见问题解答。复杂问题会自动升级到人工客服。"

---

### 【第十部分：数据库架构 - 2分钟】

**画面**: 打开 VS Code，展示 `supabase/schema.sql`

**操作**:
1. 滚动展示表结构：
   - tenants (租户表)
   - users (用户表，含 tenant_id FK)
   - customers (客户表，含 tenant_id FK)
   - products (产品表，含 tenant_id FK)
   - pricing (定价表)
   - cost_components (成本构成表)
   - orders (订单表，13状态)
   - order_items (订单明细)
   - payments (支付记录)
2. 展示 RLS 策略：
   ```sql
   CREATE POLICY rls_customers ON customers FOR ALL
       USING (tenant_id = get_current_tenant_id() OR is_super_admin());
   ```
3. 展示复合唯一约束：
   ```sql
   UNIQUE(tenant_id, sku)  -- products
   UNIQUE(tenant_id, order_number)  -- orders
   ```
4. 打开 `supabase/seed_data.sql`，展示测试数据

**旁白**:
> "数据库采用严格的多租户设计。所有 18 张业务表都有 tenant_id 外键。RLS 行级安全策略在数据库层面强制租户隔离。复合唯一约束确保业务键在租户维度内唯一。seed_data.sql 包含真实感的合成测试数据：4 个租户、28 个客户、18 个产品、7 个订单。"

---

### 【第十一部分：文档体系 - 1分钟】

**画面**: 展示文档目录

**操作**:
1. 打开 `DATABASE_SCHEMA.md`
   - 展示 ER 图
   - 展示表设计说明
   - 展示 AI Agent 数据需求映射
2. 打开 `docs/multi-tenant-architecture.md`
   - 展示架构图
   - 展示 API 设计
3. 打开 `docs/AI_Designer_Agent_Spec.md` 等 4 个 Agent 规格文档

**旁白**:
> "完整的文档体系支持开发和维护。DATABASE_SCHEMA.md 详细说明每个表的字段、索引、约束。multi-tenant-architecture.md 描述租户识别策略、认证流程、API 设计。4 个 AI Agent 规格文档定义用户故事、功能需求、数据模型。"

---

### 【结尾 - 30秒】

**画面**: 回到 Dashboard 主页

**旁白**:
> "以上是 Nestopia B2B 平台在过去 36 小时内的开发成果。系统已完成核心功能开发，包括多租户架构、4 个 AI Agent 集成、Products/Orders/Customers/Pricing 完整管理、严格的数据库设计和测试数据。下一步将进行后端集成、用户测试和部署上线。"

**画面**: 显示 "Thank You" 页面

---

## 📊 演示数据说明

### 租户数据
- **Tenant 1**: 上海阳光房科技有限公司 (Enterprise Plan)
- **Tenant 2**: 北京户外生活空间设计有限公司 (Pro Plan)
- **Tenant 3**: 杭州庭院景观工程有限公司 (Basic Plan)

### 演示账号
- **Admin**: admin@nestopia.com / Demo123!
- **Sales**: sales@nestopia.com / Demo123!
- **Manager**: zhang.wei@shsunrooms.com / Demo123!

### 关键业务数据
- **Products**: 18 个产品，含 SKU、JSONB 规格、分层定价
- **Customers**: 28 个客户，含真实中文姓名、地址、场地信息
- **Orders**: 7 个订单，覆盖 pending → completed 完整流程
- **Payments**: 9 笔支付，展示三阶段付款

---

## 🛠️ 技术亮点

### 1. 多租户隔离
- RLS 行级安全策略
- tenant_id 外键约束
- 复合唯一约束
- 租户上下文注入

### 2. 数据库设计
- 18 张业务表
- JSONB 灵活字段
- 自动编号生成
- 审计触发器

### 3. AI Agent 集成
- Input/Output 标准化接口
- 与业务数据深度集成
- 风险警告机制
- 合规预检

### 4. 前端架构
- 多页面静态站点
- Tailwind CSS 响应式设计
- JavaScript 状态管理
- 模块化组件

---

## 📝 演示注意事项

### 准备工作
1. 启动本地服务器：`python3 -m http.server 8080`
2. 准备演示浏览器（Chrome 推荐）
3. 清除浏览器缓存
4. 准备备用截图（以防网络问题）

### 演示技巧
1. 放慢操作速度，让观众看清每个步骤
2. 鼠标移动要平滑，避免快速跳转
3. 关键功能停留 3-5 秒
4. 旁白与操作同步
5. 准备应对提问

### 常见问题预案
- **Q: 为什么选择多租户架构？**
  A: 降低运维成本，支持快速扩展，数据隔离安全
  
- **Q: AI Agent 如何保证准确性？**
  A: 基于规则引擎 + 历史数据训练，人工审核机制
  
- **Q: 如何处理大文件上传？**
  A: 分片上传，后台异步处理，支持断点续传

---

## 🎥 录制建议

### 设备要求
- 屏幕录制：OBS Studio 或 Camtasia
- 分辨率：1920x1080
- 帧率：30fps
- 音频：高质量麦克风

### 录制流程
1. 录制屏幕操作（无旁白）
2. 录制旁白音频
3. 后期合成
4. 添加字幕
5. 导出 MP4

### 后期处理
- 添加章节标记
- 关键操作添加高亮
- 底部添加进度条
- 开头添加 Logo 动画

---

## 📄 附录：文件清单

### 核心文件
- `dashboard.html` - 主 Dashboard 页面（5300+ 行）
- `supabase/schema.sql` - 数据库 Schema（880+ 行）
- `supabase/seed_data.sql` - 测试数据（496 行）
- `DATABASE_SCHEMA.md` - Schema 文档（770+ 行）

### 文档文件
- `docs/multi-tenant-architecture.md` - 多租户架构文档
- `docs/AI_Designer_Agent_Spec.md` - AI Designer 规格
- `docs/Pricing_Cost_Controller_Agent_Spec.md` - Pricing Agent 规格
- `docs/Compliance_Manager_Agent_Spec.md` - Compliance Agent 规格
- `docs/Customer_Service_Executive_Agent_Spec.md` - CS Agent 规格

### 其他文件
- `index.html` - 公共首页
- `login.html` - 登录页面
- `partners.html` - 合作伙伴介绍页

---

**文档版本**: 1.0.0  
**创建日期**: 2026-03-11  
**维护者**: Qoder AI Assistant
