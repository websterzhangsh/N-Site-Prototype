#!/usr/bin/env python3
"""
修复：排除 Supabase 种子项目 + 添加 tenant_slug 隔离
"""

HTML_PATH = 'company-operations.html'

with open(HTML_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ── Change 1: persistProjectToDB — product_config 加 tenant_slug ──
old1 = """                product_config: {
                    product_type: project.type,"""
new1 = """                product_config: {
                    tenant_slug: (typeof getCurrentTenantSlug === 'function') ? getCurrentTenantSlug() : 'default',
                    product_type: project.type,"""

assert content.count(old1) == 1, f"Change 1: expected 1, found {content.count(old1)}"
content = content.replace(old1, new1, 1)
print("OK Change 1: tenant_slug added to product_config")

# ── Change 2: loadProjectsFromDB — 排除 project_number IS NULL ──
# 使用更多上下文来唯一匹配 loadProjectsFromDB 中的查询
old2 = """                .eq('tenant_id', tenantId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .then(function(res) {"""
new2 = """                .eq('tenant_id', tenantId)
                .eq('is_deleted', false)
                .not('project_number', 'is', null)
                .order('created_at', { ascending: false })
                .then(function(res) {"""

assert content.count(old2) == 1, f"Change 2: expected 1, found {content.count(old2)}"
content = content.replace(old2, new2, 1)
print("OK Change 2: .not project_number is null filter added")

# ── Change 3: loadProjectsFromDB — 客户端 tenant_slug 过滤 ──
old3 = """                    var rows = res.data || [];
                    // Build lookup of existing in-memory project IDs"""
new3 = """                    var rows = res.data || [];
                    // Filter by tenant slug — isolate sub-tenants sharing same tenant_id
                    var currentSlug = (typeof getCurrentTenantSlug === 'function') ? getCurrentTenantSlug() : 'default';
                    rows = rows.filter(function(row) {
                        var cfg = row.product_config || {};
                        if (cfg.tenant_slug) return cfg.tenant_slug === currentSlug;
                        return true;
                    });
                    // Build lookup of existing in-memory project IDs"""

assert content.count(old3) == 1, f"Change 3: expected 1, found {content.count(old3)}"
content = content.replace(old3, new3, 1)
print("OK Change 3: client-side tenant_slug filter added")

# ── Write ──
assert content != original, "No changes made!"
with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("DONE: All 3 changes applied")
