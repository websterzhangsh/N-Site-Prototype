-- ============================================================
-- tenant_products — 租户自定义产品目录
-- 每个租户拥有独立的产品列表，支持 CRUD
-- ============================================================

CREATE TABLE IF NOT EXISTS tenant_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '550e8400-e29b-41d4-a716-446655440000',
    product_key TEXT NOT NULL,
    product_data JSONB NOT NULL DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, product_key)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tenant_products_tenant ON tenant_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_products_category ON tenant_products USING gin ((product_data->'category'));

-- RLS
ALTER TABLE tenant_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_products_all" ON tenant_products;
CREATE POLICY "tenant_products_all" ON tenant_products FOR ALL USING (true) WITH CHECK (true);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_tenant_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_products_updated ON tenant_products;
CREATE TRIGGER trg_tenant_products_updated
    BEFORE UPDATE ON tenant_products
    FOR EACH ROW EXECUTE FUNCTION update_tenant_products_updated_at();
