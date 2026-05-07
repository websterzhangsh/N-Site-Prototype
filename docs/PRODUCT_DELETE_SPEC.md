# Product Delete 功能规范

> 适用范围：Company Overview → Product Information 面板中的 "Delete" 按钮

---

## 1. 删除策略：软删除（Soft Delete）

| 行为 | 说明 |
|------|------|
| **不物理删除数据** | 产品记录标记为 `status = 'deleted'`，不从数据库中移除 |
| **可恢复** | 管理员可在 30 天内通过 System Settings 恢复已删除产品 |
| **30 天后清理** | 超过 30 天的软删除产品由定时任务执行硬删除（Phase 2） |
| **列表隐藏** | 标记为 deleted 的产品不出现在 Overview 产品列表和报价选择器中 |

---

## 2. 权限模型

| 角色 | 允许操作 | 条件 |
|------|----------|------|
| **Platform Admin**（Nestopia-CHN） | ✅ 可删除任何产品（含已发布到分销商的） | 无限制 |
| **Distributor Admin** | ✅ 可删除本租户已导入的产品 | 仅限本租户范围 |
| **Distributor Staff** | ❌ 不允许删除 | Delete 按钮不显示 |
| **Viewer / Read-only** | ❌ 不允许删除 | Delete 按钮不显示 |

### 权限检查逻辑
```javascript
function canDeleteProduct(user, product) {
    if (user.role === 'platform_admin') return true;
    if (user.role === 'distributor_admin' && product.tenantId === user.tenantId) return true;
    return false;
}
```

---

## 3. 依赖检查（Impact Analysis）

删除前系统必须检查以下关联数据：

| 关联类型 | 检查方式 | 影响级别 |
|----------|----------|----------|
| **活跃项目引用** | `allProjectsData` 中 `openings[].sku === productKey` 的项目 | 🔴 阻止删除 |
| **分销商已导入** | `distributor_price_list` 中 `sku_key === productKey && import_status = 'imported'` | ⚠️ 警告（需确认） |
| **已发布报价单** | `quotation` 表中引用该 SKU 的已发送报价 | ⚠️ 警告（不影响历史） |
| **无关联** | 无任何引用 | ✅ 允许直接删除 |

### 阻止删除条件
当存在**活跃项目**正在使用该产品（Step 3~6 未完成）时，**禁止删除**，弹窗提示：
> "Cannot delete: This product is currently used by X active project(s). Please complete or remove the product from those projects first."

---

## 4. 确认弹窗流程

### 4.1 无关联 — 简单确认
```
┌───────────────────────────────────────────┐
│  ⚠️  Delete Product                       │
│                                           │
│  Are you sure you want to delete          │
│  "WR110A-78"?                             │
│                                           │
│  This product will be hidden from all     │
│  lists and will be permanently removed    │
│  after 30 days.                           │
│                                           │
│         [Cancel]    [Delete Product]      │
└───────────────────────────────────────────┘
```

### 4.2 有关联 — 影响分析确认
```
┌───────────────────────────────────────────┐
│  ⚠️  Delete Product with Dependencies     │
│                                           │
│  "WR110A-78" has the following refs:      │
│                                           │
│  • 2 distributor(s) have imported this    │
│    product (Omeya-SIN, GreenScape)        │
│  • 1 historical quotation references it   │
│                                           │
│  Deleting will:                           │
│  ✓ Remove from all product catalogs       │
│  ✓ Remove from distributors' imported     │
│    lists                                  │
│  ✗ NOT affect historical quotations       │
│                                           │
│  Type "DELETE" to confirm:                │
│  ┌─────────────────────────────────┐      │
│  │                                 │      │
│  └─────────────────────────────────┘      │
│                                           │
│         [Cancel]    [Confirm Delete]      │
└───────────────────────────────────────────┘
```

### 4.3 被活跃项目引用 — 阻止
```
┌───────────────────────────────────────────┐
│  🚫  Cannot Delete                        │
│                                           │
│  "WR110A-78" is used by 2 active          │
│  project(s):                              │
│                                           │
│  • SG - Cady Fang's Zip... (Step 4)      │
│  • MX Zip Blinds (Step 3)                │
│                                           │
│  Please complete or reassign these        │
│  projects before deleting this product.   │
│                                           │
│                          [Understood]     │
└───────────────────────────────────────────┘
```

---

## 5. 删除执行（Technical）

### 5.1 软删除操作
```javascript
// 1. 标记产品状态
UPDATE products SET status = 'deleted', deleted_at = now(), deleted_by = :userId
WHERE sku_key = :skuKey AND tenant_id = :tenantId;

// 2. 级联更新分销商导入记录
UPDATE distributor_price_list SET import_status = 'removed'
WHERE sku_key = :skuKey AND import_status IN ('imported', 'pending');

// 3. 写入审计日志
INSERT INTO audit_log (action, entity_type, entity_id, details, created_by)
VALUES ('product_delete', 'product', :skuKey, :detailsJson, :userId);
```

### 5.2 前端行为
1. Delete 按钮点击 → 权限检查
2. 权限通过 → 依赖检查（API 调用或前端内存扫描）
3. 依赖结果 → 对应弹窗（简单确认 / 影响分析 / 阻止）
4. 用户确认 → 执行软删除 API
5. 成功 → Toast "Product deleted successfully" + 刷新产品列表
6. 失败 → Toast error + 保持原状

---

## 6. UI 行为

| 状态 | Delete 按钮表现 |
|------|----------------|
| 有权限 | 显示红色 Delete 按钮 |
| 无权限 | **不显示** Delete 按钮（不是 disabled，是完全不渲染） |
| 正在执行 | 按钮显示 spinner，禁止重复点击 |
| 删除成功 | 产品从列表消失，自动选中列表中下一个产品 |

---

## 7. 恢复机制（Phase 2）

- System Settings → Deleted Products 列表
- 显示：产品名、删除时间、删除人、剩余恢复天数
- "Restore" 按钮恢复产品（重置 status = 'active'，恢复 distributor 关联）
- 超 30 天自动清理不可逆

---

## 8. 审计日志字段

```json
{
  "action": "product_delete",
  "sku_key": "WR110A-78",
  "product_name": "WR110A-78防风卷帘",
  "reason": "user_initiated",
  "impact": {
    "distributors_affected": ["omeya-sin", "greenscape-us"],
    "active_projects": 0,
    "historical_quotations": 1
  },
  "deleted_by": "webster.zhang",
  "deleted_at": "2026-05-05T15:30:00Z",
  "reversible_until": "2026-06-04T15:30:00Z"
}
```

---

## 9. 实现优先级

| Phase | 功能 | 依赖 |
|-------|------|------|
| **Phase 1** (Now) | 权限检查 + 确认弹窗 + 前端软删除（localStorage/内存标记） | 无 |
| **Phase 2** | Supabase `products` 表 status 字段 + API | DB schema |
| **Phase 3** | 恢复机制 + 定时硬删除 + 审计日志 | Phase 2 |
