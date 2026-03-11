-- ============================================================
-- Nestopia Platform - Synthetic Test Data (Seed Data)
-- Version: 1.0.0
-- Created: 2026-03-11
-- 
-- This file contains realistic synthetic data for testing.
-- All data follows the multi-tenant schema design.
-- 
-- Usage: Run after supabase/schema.sql
-- ============================================================

-- ============================================================
-- SECTION A: TENANTS (3 test tenants + 1 default)
-- ============================================================

-- Tenant 1: Premium partner - Shanghai Sunrooms (高端合作伙伴)
INSERT INTO tenants (id, slug, name, status, plan, contact_email, contact_phone, address, 
    ui_config, features, max_projects, max_users, max_products, storage_quota_mb)
VALUES (
    'a1b2c3d4-0001-0001-0001-000000000001'::UUID,
    'shanghai-sunrooms',
    '上海阳光房科技有限公司',
    'active',
    'enterprise',
    'contact@shsunrooms.com',
    '021-5888-9999',
    '上海市浦东新区张江高科技园区博云路2号',
    '{
        "primaryColor": "#1E40AF",
        "logoUrl": "https://storage.example.com/tenants/shanghai-sunrooms/logo.png",
        "faviconUrl": null,
        "customCss": null,
        "hiddenSections": [],
        "customSections": []
    }'::jsonb,
    '["projects","orders","customers","products","ai_design","pricing","compliance","customer_service"]'::jsonb,
    100, 20, 500, 10240
);

-- Tenant 2: Standard partner - Beijing Outdoor Living (标准合作伙伴)
INSERT INTO tenants (id, slug, name, status, plan, contact_email, contact_phone, address,
    ui_config, features, max_projects, max_users, max_products, storage_quota_mb)
VALUES (
    'a1b2c3d4-0001-0001-0001-000000000002'::UUID,
    'beijing-outdoor',
    '北京户外生活空间设计有限公司',
    'active',
    'pro',
    'info@bjoutdoor.com',
    '010-8888-6666',
    '北京市朝阳区望京SOHO T3 12层',
    '{
        "primaryColor": "#059669",
        "logoUrl": "https://storage.example.com/tenants/beijing-outdoor/logo.png",
        "faviconUrl": null,
        "customCss": null,
        "hiddenSections": [],
        "customSections": []
    }'::jsonb,
    '["projects","orders","customers","products","ai_design","pricing"]'::jsonb,
    50, 10, 200, 5120
);

-- Tenant 3: Basic partner - Hangzhou Garden Solutions (基础合作伙伴)
INSERT INTO tenants (id, slug, name, status, plan, contact_email, contact_phone, address,
    ui_config, features, max_projects, max_users, max_products, storage_quota_mb)
VALUES (
    'a1b2c3d4-0001-0001-0001-000000000003'::UUID,
    'hangzhou-garden',
    '杭州庭院景观工程有限公司',
    'active',
    'basic',
    'sales@hzgarden.com',
    '0571-8765-4321',
    '浙江省杭州市西湖区文三路398号',
    '{
        "primaryColor": "#DC2626",
        "logoUrl": null,
        "faviconUrl": null,
        "customCss": null,
        "hiddenSections": ["compliance"],
        "customSections": []
    }'::jsonb,
    '["projects","orders","customers","products","ai_design"]'::jsonb,
    10, 5, 100, 1024
);

-- Update default tenant with more details
UPDATE tenants SET 
    name = 'Nestopia 官方演示租户',
    contact_email = 'demo@nestopia.com',
    contact_phone = '400-888-9999',
    address = '上海市徐汇区漕河泾开发区虹漕路421号',
    plan = 'enterprise',
    max_projects = 100,
    max_users = 50,
    max_products = 1000
WHERE slug = 'default';

-- ============================================================
-- SECTION B: USERS (per tenant)
-- ============================================================

-- Tenant 1 Users (Shanghai Sunrooms)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, email_verified) VALUES
('b1c2d3e4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 
    'zhang.wei@shsunrooms.com', crypt('Demo123!', gen_salt('bf')), '伟', '张', '138-1234-5678', 'admin', 'active', TRUE),
('b1c2d3e4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 
    'li.na@shsunrooms.com', crypt('Demo123!', gen_salt('bf')), '娜', '李', '138-2345-6789', 'manager', 'active', TRUE),
('b1c2d3e4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 
    'wang.ming@shsunrooms.com', crypt('Demo123!', gen_salt('bf')), '明', '王', '138-3456-7890', 'sales', 'active', TRUE),
('b1c2d3e4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 
    'chen.xia@shsunrooms.com', crypt('Demo123!', gen_salt('bf')), '霞', '陈', '138-4567-8901', 'sales', 'active', TRUE),
('b1c2d3e4-0001-0001-0001-000000000005'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 
    'liu.yang@shsunrooms.com', crypt('Demo123!', gen_salt('bf')), '洋', '刘', '138-5678-9012', 'member', 'active', TRUE);

-- Tenant 2 Users (Beijing Outdoor)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, email_verified) VALUES
('b1c2d3e4-0001-0001-0001-000000000011'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 
    'zhao.lei@bjoutdoor.com', crypt('Demo123!', gen_salt('bf')), '磊', '赵', '139-1234-5678', 'admin', 'active', TRUE),
('b1c2d3e4-0001-0001-0001-000000000012'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 
    'sun.hong@bjoutdoor.com', crypt('Demo123!', gen_salt('bf')), '红', '孙', '139-2345-6789', 'manager', 'active', TRUE),
('b1c2d3e4-0001-0001-0001-000000000013'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 
    'zhou.jun@bjoutdoor.com', crypt('Demo123!', gen_salt('bf')), '军', '周', '139-3456-7890', 'sales', 'active', TRUE);

-- Tenant 3 Users (Hangzhou Garden)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, email_verified) VALUES
('b1c2d3e4-0001-0001-0001-000000000021'::UUID, 'a1b2c3d4-0001-0001-0001-000000000003'::UUID, 
    'wu.fang@hzgarden.com', crypt('Demo123!', gen_salt('bf')), '芳', '吴', '137-1234-5678', 'admin', 'active', TRUE),
('b1c2d3e4-0001-0001-0001-000000000022'::UUID, 'a1b2c3d4-0001-0001-0001-000000000003'::UUID, 
    'zheng.qiang@hzgarden.com', crypt('Demo123!', gen_salt('bf')), '强', '郑', '137-2345-6789', 'sales', 'active', TRUE);

-- Default tenant users
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, email_verified) VALUES
('b1c2d3e4-0001-0001-0001-000000000031'::UUID, (SELECT id FROM tenants WHERE slug = 'default'), 
    'demo@nestopia.com', crypt('Demo123!', gen_salt('bf')), 'Demo', 'User', '400-888-9999', 'admin', 'active', TRUE),
('b1c2d3e4-0001-0001-0001-000000000032'::UUID, (SELECT id FROM tenants WHERE slug = 'default'), 
    'sales@nestopia.com', crypt('Demo123!', gen_salt('bf')), 'Sales', 'Team', '400-888-9990', 'sales', 'active', TRUE);

-- ============================================================
-- SECTION C: PARTNERS (per tenant)
-- ============================================================

-- Partners for Tenant 1
INSERT INTO partners (id, tenant_id, company_name, contact_name, email, phone, province, city, address, partner_type, commission_rate, status) VALUES
('c1d2e3f4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID,
    '江苏无锡建材经销有限公司', '马建国', 'majg@jsmaterials.com', '0510-8888-1234', '江苏省', '无锡市', '无锡市新吴区长江路88号', 'distributor', 15.00, 'active'),
('c1d2e3f4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID,
    '苏州园林设计工作室', '林小燕', 'linxy@suzhou-design.com', '0512-6666-7890', '江苏省', '苏州市', '苏州市工业园区星湖街328号', 'agent', 8.00, 'active');

-- Partners for Tenant 2
INSERT INTO partners (id, tenant_id, company_name, contact_name, email, phone, province, city, address, partner_type, commission_rate, status) VALUES
('c1d2e3f4-0001-0001-0001-000000000011'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID,
    '天津滨海建材市场', '黄志远', 'huangzy@tjmaterials.com', '022-5555-6666', '天津市', '天津市', '天津市滨海新区开发区第三大街99号', 'dealer', 12.00, 'active');

-- ============================================================
-- SECTION D: CUSTOMERS (per tenant, realistic Chinese data)
-- ============================================================

-- Customers for Tenant 1 (Shanghai Sunrooms) - 15 customers
INSERT INTO customers (id, tenant_id, customer_number, name, company, email, phone, wechat, province, city, district, address, site_type, site_area, source, customer_type, tags, status, satisfaction_score, assigned_sales) VALUES
('d1e2f3a4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260101-ABC123', '王建国', '上海华信科技有限公司', 'wangjg@huaxin-tech.com', '139-0001-0001', 'wangjg001', '上海市', '上海市', '浦东新区', '浦东新区碧云路888号别墅', 'villa', 85.5, 'website', 'vip', '["高净值", "复购客户", "推荐客户"]', 'active', 4.8, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('d1e2f3a4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260102-DEF456', '李美玲', NULL, 'limeiling@163.com', '139-0002-0002', 'meiling_li', '上海市', '上海市', '闵行区', '闵行区莘庄镇春申路1234弄56号', 'townhouse', 42.0, 'referral', 'standard', '["首次购买"]', 'active', NULL, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('d1e2f3a4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260103-GHI789', '张伟民', '伟民贸易有限公司', 'zhangwm@weimin-trade.com', '139-0003-0003', 'zhangweimin', '上海市', '上海市', '徐汇区', '徐汇区田林路488号', 'commercial', 120.0, 'exhibition', 'enterprise', '["企业客户", "大型项目"]', 'active', 4.5, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
('d1e2f3a4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260104-JKL012', '陈晓燕', NULL, 'chenxiaoyan@qq.com', '139-0004-0004', 'xiaoyan_c', '上海市', '上海市', '长宁区', '长宁区虹桥路2288弄12号', 'apartment', 18.5, 'social_media', 'standard', '["年轻客户", "预算敏感"]', 'active', NULL, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('d1e2f3a4-0001-0001-0001-000000000005'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260105-MNO345', '刘志强', '志强实业集团', 'liuzq@zhiqiang-group.com', '139-0005-0005', 'liuzhiqiang', '江苏省', '苏州市', '工业园区', '苏州工业园区现代大道999号', 'villa', 95.0, 'partner', 'vip', '["企业主", "高端客户"]', 'active', 4.9, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
('d1e2f3a4-0001-0001-0001-000000000006'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260106-PQR678', '赵丽娟', NULL, 'zhaolijuan@126.com', '139-0006-0006', 'lijuan_zhao', '上海市', '上海市', '松江区', '松江区九亭镇九杜路888弄', 'townhouse', 38.0, 'phone', 'standard', '["口碑推荐"]', 'active', 4.2, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('d1e2f3a4-0001-0001-0001-000000000007'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260107-STU901', '孙明华', '明华投资咨询有限公司', 'sunmh@minghua-invest.com', '139-0007-0007', 'sunminghua', '上海市', '上海市', '静安区', '静安区南京西路1788号', 'commercial', 200.0, 'website', 'enterprise', '["高端商业", "投资客户"]', 'active', 4.7, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
('d1e2f3a4-0001-0001-0001-000000000008'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260108-VWX234', '周婷婷', NULL, 'zhoutt@sina.com', '139-0008-0008', 'tingting_zhou', '上海市', '上海市', '普陀区', '普陀区长征镇真华路888弄', 'apartment', 22.0, 'walk_in', 'standard', '["新客户"]', 'active', NULL, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('d1e2f3a4-0001-0001-0001-000000000009'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260109-YZA567', '吴海波', '海波餐饮连锁', 'wuhb@haibo-food.com', '139-0009-0009', 'wuhaibo', '上海市', '上海市', '嘉定区', '嘉定区安亭镇墨玉路288号', 'commercial', 150.0, 'referral', 'vip', '["连锁企业", "多店需求"]', 'active', 4.6, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
('d1e2f3a4-0001-0001-0001-000000000010'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260110-BCD890', '郑雅琴', NULL, 'zhengyaqin@163.com', '139-0010-0010', 'yaqin_zheng', '上海市', '上海市', '宝山区', '宝山区顾村镇菊太路1288弄', 'townhouse', 35.0, 'exhibition', 'standard', '["家庭客户"]', 'active', 4.0, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('d1e2f3a4-0001-0001-0001-000000000011'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260111-EFG123', '黄志明', '志明房地产开发有限公司', 'huangzm@zhiming-realestate.com', '139-0011-0011', 'huangzhiming', '江苏省', '无锡市', '滨湖区', '无锡市滨湖区蠡湖大道2000号', 'villa', 110.0, 'partner', 'enterprise', '["开发商", "批量采购"]', 'active', 4.8, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
('d1e2f3a4-0001-0001-0001-000000000012'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260112-HIJ456', '许文静', NULL, 'xuwenjing@qq.com', '139-0012-0012', 'wenjing_xu', '上海市', '上海市', '青浦区', '青浦区赵巷镇嘉松中路5888弄', 'villa', 78.0, 'website', 'vip', '["高端住宅", "设计师推荐"]', 'active', 4.9, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('d1e2f3a4-0001-0001-0001-000000000013'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260113-KLM789', '何伟东', '伟东物流集团', 'hewd@weidong-logistics.com', '139-0013-0013', 'heweidong', '上海市', '上海市', '奉贤区', '奉贤区南桥镇环城西路888号', 'commercial', 180.0, 'phone', 'enterprise', '["物流企业", "大型仓库"]', 'active', 4.3, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
('d1e2f3a4-0001-0001-0001-000000000014'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260114-NOP012', '林小燕', NULL, 'linxiaoyan@126.com', '139-0014-0014', 'xiaoyan_lin', '上海市', '上海市', '金山区', '金山区朱泾镇金龙新街528号', 'townhouse', 40.0, 'social_media', 'standard', '["年轻家庭"]', 'active', NULL, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('d1e2f3a4-0001-0001-0001-000000000015'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'CUS-20260115-QRS345', '杨秀芳', '秀芳美容连锁', 'yangxf@xiufang-beauty.com', '139-0015-0015', 'yangxiufang', '上海市', '上海市', '崇明区', '崇明区城桥镇八一路388号', 'commercial', 65.0, 'referral', 'vip', '["连锁美容", "多店扩张"]', 'active', 4.5, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID);

-- Customers for Tenant 2 (Beijing Outdoor) - 8 customers
INSERT INTO customers (id, tenant_id, customer_number, name, company, email, phone, province, city, district, address, site_type, site_area, source, customer_type, tags, status, assigned_sales) VALUES
('d1e2f3a4-0001-0001-0001-000000000101'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'CUS-20260201-ABC123', '马晓东', '北京东方科技有限公司', 'maxd@dongfang-tech.com', '138-0001-0001', '北京市', '北京市', '朝阳区', '朝阳区望京SOHO T1 2201', 'commercial', 88.0, 'website', 'vip', '["科技企业", "高端客户"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID),
('d1e2f3a4-0001-0001-0001-000000000102'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'CUS-20260202-DEF456', '冯丽华', NULL, 'fenglihua@163.com', '138-0002-0002', '北京市', '北京市', '海淀区', '海淀区中关村软件园二期', 'townhouse', 45.0, 'referral', 'standard', '["IT从业者"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID),
('d1e2f3a4-0001-0001-0001-000000000103'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'CUS-20260203-GHI789', '曹志刚', '志刚餐饮管理公司', 'caozg@zhigang-food.com', '138-0003-0003', '北京市', '北京市', '东城区', '东城区东直门外大街48号', 'commercial', 120.0, 'exhibition', 'enterprise', '["餐饮连锁", "多店需求"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID),
('d1e2f3a4-0001-0001-0001-000000000104'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'CUS-20260204-JKL012', '袁小红', NULL, 'yuanxiaohong@qq.com', '138-0004-0004', '北京市', '北京市', '西城区', '西城区金融街19号', 'apartment', 25.0, 'social_media', 'standard', '["金融从业者"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID),
('d1e2f3a4-0001-0001-0001-000000000105'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'CUS-20260205-MNO345', '邓国强', '国强地产开发集团', 'denggq@guoqiang-realestate.com', '138-0005-0005', '北京市', '北京市', '大兴区', '大兴区亦庄经济技术开发区荣华南路10号', 'villa', 150.0, 'partner', 'enterprise', '["开发商", "批量采购"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID),
('d1e2f3a4-0001-0001-0001-000000000106'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'CUS-20260206-PQR678', '许文娟', NULL, 'xuwenjuan@sina.com', '138-0006-0006', '北京市', '北京市', '丰台区', '丰台区丽泽商务区金融街广场', 'townhouse', 38.0, 'phone', 'standard', '["新客户"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID),
('d1e2f3a4-0001-0001-0001-000000000107'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'CUS-20260207-STU901', '彭伟民', '伟民医疗投资', 'pengwm@weimin-medical.com', '138-0007-0007', '北京市', '北京市', '昌平区', '昌平区回龙观东大街108号', 'commercial', 95.0, 'website', 'vip', '["医疗行业", "高端客户"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID),
('d1e2f3a4-0001-0001-0001-000000000108'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'CUS-20260208-VWX234', '蒋小燕', NULL, 'jiangxy@126.com', '138-0008-0008', '北京市', '北京市', '通州区', '通州区新华大街58号', 'townhouse', 42.0, 'walk_in', 'standard', '["家庭客户"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID);

-- Customers for Tenant 3 (Hangzhou Garden) - 5 customers
INSERT INTO customers (id, tenant_id, customer_number, name, company, email, phone, province, city, district, address, site_type, site_area, source, customer_type, tags, status, assigned_sales) VALUES
('d1e2f3a4-0001-0001-0001-000000000201'::UUID, 'a1b2c3d4-0001-0001-0001-000000000003'::UUID, 'CUS-20260301-ABC123', '沈国平', '杭州互联网科技有限公司', 'shengp@hzinternet.com', '137-0001-0001', '浙江省', '杭州市', '西湖区', '西湖区文三路398号东信大厦', 'commercial', 75.0, 'website', 'vip', '["互联网企业"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000022'::UUID),
('d1e2f3a4-0001-0001-0001-000000000202'::UUID, 'a1b2c3d4-0001-0001-0001-000000000003'::UUID, 'CUS-20260302-DEF456', '钱丽萍', NULL, 'qianliping@163.com', '137-0002-0002', '浙江省', '杭州市', '余杭区', '余杭区仓前街道梦想小镇', 'townhouse', 35.0, 'referral', 'standard', '["创业家庭"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000022'::UUID),
('d1e2f3a4-0001-0001-0001-000000000203'::UUID, 'a1b2c3d4-0001-0001-0001-000000000003'::UUID, 'CUS-20260303-GHI789', '潘志强', '志强电子商务有限公司', 'panzq@zhiqiang-ecom.com', '137-0003-0003', '浙江省', '杭州市', '滨江区', '滨江区长河街道江南大道588号', 'commercial', 100.0, 'exhibition', 'enterprise', '["电商企业", "大型项目"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000022'::UUID),
('d1e2f3a4-0001-0001-0001-000000000204'::UUID, 'a1b2c3d4-0001-0001-0001-000000000003'::UUID, 'CUS-20260304-JKL012', '杜小芳', NULL, 'duxiaofang@qq.com', '137-0004-0004', '浙江省', '杭州市', '拱墅区', '拱墅区大关路288号', 'villa', 68.0, 'social_media', 'standard', '["高端住宅"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000022'::UUID),
('d1e2f3a4-0001-0001-0001-000000000205'::UUID, 'a1b2c3d4-0001-0001-0001-000000000003'::UUID, 'CUS-20260305-MNO345', '蔡伟东', '伟东餐饮连锁', 'caiwd@weidong-food.com', '137-0005-0005', '浙江省', '杭州市', '萧山区', '萧山区市心北路188号', 'commercial', 85.0, 'phone', 'vip', '["餐饮连锁"]', 'active', 'b1c2d3e4-0001-0001-0001-000000000022'::UUID);

-- ============================================================
-- SECTION E: PRODUCT CATEGORIES (per tenant)
-- ============================================================

-- Product Categories for Tenant 1
INSERT INTO product_categories (id, tenant_id, name, name_en, description, sort_order, is_active) VALUES
('e1f2a3b4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, '可伸缩阳光房', 'Retractable Sunroom', '智能可伸缩阳光房系统，支持一键开合', 1, TRUE),
('e1f2a3b4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, '固定阳光房', 'Fixed Sunroom', '传统固定式阳光房，经典设计', 2, TRUE),
('e1f2a3b4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, '智能阳光房', 'Smart Sunroom', '集成智能控制系统的阳光房', 3, TRUE),
('e1f2a3b4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, '凉亭', 'Pavilion', '户外凉亭与遮阳系统', 4, TRUE),
('e1f2a3b4-0001-0001-0001-000000000005'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, '配件与附件', 'Accessories', '阳光房配件、五金件、装饰件', 5, TRUE);

-- Product Categories for Tenant 2
INSERT INTO product_categories (id, tenant_id, name, name_en, description, sort_order, is_active) VALUES
('e1f2a3b4-0001-0001-0001-000000000101'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, '可伸缩阳光房', 'Retractable Sunroom', '智能可伸缩阳光房系统', 1, TRUE),
('e1f2a3b4-0001-0001-0001-000000000102'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, '固定阳光房', 'Fixed Sunroom', '传统固定式阳光房', 2, TRUE),
('e1f2a3b4-0001-0001-0001-000000000103'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, '配件与附件', 'Accessories', '阳光房配件', 3, TRUE);

-- ============================================================
-- SECTION F: PRODUCTS (per tenant, realistic SKUs and specs)
-- ============================================================

-- Products for Tenant 1 (Shanghai Sunrooms) - 12 products
INSERT INTO products (id, tenant_id, category_id, sku, name, name_en, description, specs, status, is_customizable, created_by) VALUES
('f1a2b3c4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000001'::UUID, 'SR-R-A100', '可伸缩阳光房 A100系列', 'Retractable Sunroom A100', '入门级可伸缩阳光房，适合小型庭院和露台', 
    '{"material": "铝合金6063-T5", "glass_type": "钢化中空玻璃5+12A+5", "frame_colors": ["白色", "黑色", "香槟金", "灰色"], "min_width_mm": 2000, "max_width_mm": 6000, "min_depth_mm": 2000, "max_depth_mm": 4000, "min_height_mm": 2200, "max_height_mm": 3000, "weight_per_sqm_kg": 28, "motor_type": "德国进口电机", "control_type": "遥控+手机APP"}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000001'::UUID, 'SR-R-B200', '可伸缩阳光房 B200系列', 'Retractable Sunroom B200', '中端可伸缩阳光房，更大开合面积', 
    '{"material": "铝合金6063-T6", "glass_type": "Low-E钢化中空玻璃6+12A+6", "frame_colors": ["白色", "黑色", "香槟金", "深灰"], "min_width_mm": 3000, "max_width_mm": 8000, "min_depth_mm": 3000, "max_depth_mm": 6000, "min_height_mm": 2400, "max_height_mm": 3500, "weight_per_sqm_kg": 32, "motor_type": "德国进口电机双驱动", "control_type": "遥控+手机APP+语音控制"}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000001'::UUID, 'SR-R-C300', '可伸缩阳光房 C300系列', 'Retractable Sunroom C300', '高端可伸缩阳光房，超大跨度设计', 
    '{"material": "铝合金6063-T6加强型", "glass_type": "Low-E钢化夹胶中空玻璃8+12A+8", "frame_colors": ["白色", "黑色", "香槟金", "深灰", "木纹转印"], "min_width_mm": 4000, "max_width_mm": 12000, "min_depth_mm": 4000, "max_depth_mm": 8000, "min_height_mm": 2500, "max_height_mm": 4000, "weight_per_sqm_kg": 38, "motor_type": "德国进口电机四驱动", "control_type": "遥控+手机APP+语音+智能家居联动"}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000002'::UUID, 'SR-F-A100', '固定阳光房 A100系列', 'Fixed Sunroom A100', '经济型固定阳光房', 
    '{"material": "铝合金6063-T5", "glass_type": "钢化中空玻璃5+12A+5", "frame_colors": ["白色", "黑色", "灰色"], "min_width_mm": 2000, "max_width_mm": 6000, "min_depth_mm": 2000, "max_depth_mm": 5000, "min_height_mm": 2200, "max_height_mm": 3500, "weight_per_sqm_kg": 25}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000005'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000002'::UUID, 'SR-F-B200', '固定阳光房 B200系列', 'Fixed Sunroom B200', '中端固定阳光房，多种造型可选', 
    '{"material": "铝合金6063-T6", "glass_type": "Low-E钢化中空玻璃6+12A+6", "frame_colors": ["白色", "黑色", "香槟金", "深灰"], "min_width_mm": 3000, "max_width_mm": 8000, "min_depth_mm": 3000, "max_depth_mm": 6000, "min_height_mm": 2400, "max_height_mm": 4000, "weight_per_sqm_kg": 28, "roof_styles": ["平顶", "人字顶", "弧形顶"]}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000006'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000003'::UUID, 'SR-S-PRO', '智能阳光房 PRO系列', 'Smart Sunroom PRO', '全智能阳光房，集成温控、照明、通风', 
    '{"material": "铝合金6063-T6", "glass_type": "智能调光玻璃", "frame_colors": ["黑色", "深灰"], "min_width_mm": 3000, "max_width_mm": 10000, "min_depth_mm": 3000, "max_depth_mm": 8000, "min_height_mm": 2500, "max_height_mm": 4000, "weight_per_sqm_kg": 42, "smart_features": ["智能温控", "自动通风", "LED照明", "雨水感应", "语音控制", "远程监控"]}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000007'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000004'::UUID, 'PV-A-001', '铝合金凉亭 A款', 'Aluminum Pavilion A', '经典四角凉亭', 
    '{"material": "铝合金6063-T5", "roof_material": "聚碳酸酯板", "frame_colors": ["白色", "黑色", "香槟金", "木纹"], "sizes": ["3x3m", "3.5x3.5m", "4x4m", "5x5m"], "height_mm": 2800, "weight_kg": 180}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000008'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000004'::UUID, 'PV-B-001', '铝合金凉亭 B款', 'Aluminum Pavilion B', '六角凉亭，更大遮阳面积', 
    '{"material": "铝合金6063-T6", "roof_material": "聚碳酸酯板", "frame_colors": ["黑色", "深灰", "木纹"], "diameters": ["3m", "4m", "5m", "6m"], "height_mm": 3000, "weight_kg": 250}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000009'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000005'::UUID, 'ACC-LED-001', 'LED灯带套装', 'LED Lighting Kit', '阳光房专用LED灯带，防水设计', 
    '{"type": "LED灯带", "power": "14.4W/m", "color_temp": "3000K/4000K/6000K可选", "waterproof": "IP65", "length_m": [5, 10, 15, 20], "warranty_years": 2}'::jsonb, 'active', FALSE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000010'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000005'::UUID, 'ACC-HEAT-001', '电热膜地暖系统', 'Floor Heating System', '阳光房专用电热膜地暖', 
    '{"type": "电热膜", "power": "200W/sqm", "voltage": "220V", "thermostat": "智能温控器", "warranty_years": 5}'::jsonb, 'active', FALSE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000011'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000005'::UUID, 'ACC-SHADE-001', '智能遮阳系统', 'Smart Shading System', '电动遮阳帘，支持遥控和智能联动', 
    '{"type": "电动遮阳帘", "fabric": "防晒防紫外线面料", "control": "遥控+手机APP", "motor_warranty_years": 5}'::jsonb, 'active', FALSE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('f1a2b3c4-0001-0001-0001-000000000012'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'e1f2a3b4-0001-0001-0001-000000000005'::UUID, 'ACC-VENT-001', '智能通风系统', 'Smart Ventilation System', '自动通风系统，温湿度感应', 
    '{"type": "智能通风", "airflow_rate": "500m³/h", "control": "自动+遥控", "sensors": ["温度", "湿度", "CO2"], "noise_db": 35}'::jsonb, 'active', FALSE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID);

-- Products for Tenant 2 (Beijing Outdoor) - 6 products
INSERT INTO products (id, tenant_id, category_id, sku, name, name_en, description, specs, status, is_customizable, created_by) VALUES
('f1a2b3c4-0001-0001-0001-000000000101'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'e1f2a3b4-0001-0001-0001-000000000101'::UUID, 'BJ-R-A100', '可伸缩阳光房 A型', 'Retractable Sunroom Type A', '经济型可伸缩阳光房', 
    '{"material": "铝合金6063-T5", "glass_type": "钢化中空玻璃5+12A+5", "frame_colors": ["白色", "黑色", "灰色"], "min_width_mm": 2000, "max_width_mm": 6000, "min_depth_mm": 2000, "max_depth_mm": 4000}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('f1a2b3c4-0001-0001-0001-000000000102'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'e1f2a3b4-0001-0001-0001-000000000101'::UUID, 'BJ-R-B200', '可伸缩阳光房 B型', 'Retractable Sunroom Type B', '中端可伸缩阳光房', 
    '{"material": "铝合金6063-T6", "glass_type": "Low-E钢化中空玻璃6+12A+6", "frame_colors": ["白色", "黑色", "香槟金"], "min_width_mm": 3000, "max_width_mm": 8000, "min_depth_mm": 3000, "max_depth_mm": 6000}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('f1a2b3c4-0001-0001-0001-000000000103'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'e1f2a3b4-0001-0001-0001-000000000102'::UUID, 'BJ-F-A100', '固定阳光房 A型', 'Fixed Sunroom Type A', '经济型固定阳光房', 
    '{"material": "铝合金6063-T5", "glass_type": "钢化中空玻璃5+12A+5", "frame_colors": ["白色", "黑色"], "min_width_mm": 2000, "max_width_mm": 6000, "min_depth_mm": 2000, "max_depth_mm": 5000}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('f1a2b3c4-0001-0001-0001-000000000104'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'e1f2a3b4-0001-0001-0001-000000000102'::UUID, 'BJ-F-B200', '固定阳光房 B型', 'Fixed Sunroom Type B', '中端固定阳光房', 
    '{"material": "铝合金6063-T6", "glass_type": "Low-E钢化中空玻璃6+12A+6", "frame_colors": ["白色", "黑色", "香槟金"], "min_width_mm": 3000, "max_width_mm": 8000, "min_depth_mm": 3000, "max_depth_mm": 6000}'::jsonb, 'active', TRUE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('f1a2b3c4-0001-0001-0001-000000000105'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'e1f2a3b4-0001-0001-0001-000000000103'::UUID, 'BJ-ACC-LED', 'LED灯带', 'LED Lighting', '阳光房LED灯带', 
    '{"type": "LED灯带", "power": "14.4W/m", "waterproof": "IP65"}'::jsonb, 'active', FALSE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('f1a2b3c4-0001-0001-0001-000000000106'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'e1f2a3b4-0001-0001-0001-000000000103'::UUID, 'BJ-ACC-SHADE', '遮阳帘', 'Shading System', '电动遮阳帘', 
    '{"type": "电动遮阳帘", "fabric": "防晒面料"}'::jsonb, 'active', FALSE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID);

-- ============================================================
-- SECTION G: PRICING (per tenant, realistic pricing)
-- ============================================================

-- Pricing for Tenant 1 Products
INSERT INTO pricing (id, tenant_id, product_id, pricing_name, pricing_type, base_price, price_unit, currency, area_tiers, option_prices, discount_rules, effective_from, is_active, created_by) VALUES
-- A100 Retractable Sunroom
('g1a2b3c4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, 'A100标准定价', 'standard', 1580.00, 'per_sqm', 'CNY',
    '[{"min_sqm": 0, "max_sqm": 15, "multiplier": 1.15, "label": "小面积"}, {"min_sqm": 15, "max_sqm": 30, "multiplier": 1.0, "label": "标准"}, {"min_sqm": 30, "max_sqm": 999, "multiplier": 0.95, "label": "大面积优惠"}]'::jsonb,
    '{"premium_glass": {"price": 280, "unit": "per_sqm", "label": "Low-E升级玻璃"}, "custom_color": {"price": 150, "unit": "per_sqm", "label": "定制颜色"}, "smart_control": {"price": 3500, "unit": "per_unit", "label": "智能控制套装"}}'::jsonb,
    '{"early_bird": {"percent": 5, "valid_until": "2026-06-30"}, "repeat_customer": {"percent": 3}}'::jsonb,
    '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
-- B200 Retractable Sunroom
('g1a2b3c4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000002'::UUID, 'B200标准定价', 'standard', 2180.00, 'per_sqm', 'CNY',
    '[{"min_sqm": 0, "max_sqm": 20, "multiplier": 1.12, "label": "小面积"}, {"min_sqm": 20, "max_sqm": 40, "multiplier": 1.0, "label": "标准"}, {"min_sqm": 40, "max_sqm": 999, "multiplier": 0.92, "label": "大面积优惠"}]'::jsonb,
    '{"premium_glass": {"price": 350, "unit": "per_sqm", "label": "Low-E夹胶升级"}, "custom_color": {"price": 200, "unit": "per_sqm", "label": "定制颜色"}, "smart_control": {"price": 5800, "unit": "per_unit", "label": "智能家居套装"}}'::jsonb,
    '{"early_bird": {"percent": 5, "valid_until": "2026-06-30"}, "repeat_customer": {"percent": 3}}'::jsonb,
    '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
-- C300 Retractable Sunroom
('g1a2b3c4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000003'::UUID, 'C300标准定价', 'standard', 2980.00, 'per_sqm', 'CNY',
    '[{"min_sqm": 0, "max_sqm": 30, "multiplier": 1.1, "label": "小面积"}, {"min_sqm": 30, "max_sqm": 60, "multiplier": 1.0, "label": "标准"}, {"min_sqm": 60, "max_sqm": 999, "multiplier": 0.9, "label": "大面积优惠"}]'::jsonb,
    '{"premium_glass": {"price": 450, "unit": "per_sqm", "label": "智能调光玻璃"}, "wood_grain": {"price": 380, "unit": "per_sqm", "label": "木纹转印"}, "smart_control": {"price": 9800, "unit": "per_unit", "label": "全智能套装"}}'::jsonb,
    '{"early_bird": {"percent": 5, "valid_until": "2026-06-30"}, "repeat_customer": {"percent": 5}, "partner_discount": {"percent": 10, "partner_types": ["distributor"]}}'::jsonb,
    '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
-- Fixed A100
('g1a2b3c4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000004'::UUID, '固定A100标准定价', 'standard', 980.00, 'per_sqm', 'CNY',
    '[{"min_sqm": 0, "max_sqm": 15, "multiplier": 1.1, "label": "小面积"}, {"min_sqm": 15, "max_sqm": 999, "multiplier": 1.0, "label": "标准"}]'::jsonb,
    '{"premium_glass": {"price": 180, "unit": "per_sqm", "label": "Low-E升级玻璃"}}'::jsonb,
    '{}'::jsonb,
    '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
-- Fixed B200
('g1a2b3c4-0001-0001-0001-000000000005'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000005'::UUID, '固定B200标准定价', 'standard', 1380.00, 'per_sqm', 'CNY',
    '[{"min_sqm": 0, "max_sqm": 20, "multiplier": 1.08, "label": "小面积"}, {"min_sqm": 20, "max_sqm": 999, "multiplier": 1.0, "label": "标准"}]'::jsonb,
    '{"premium_glass": {"price": 250, "unit": "per_sqm", "label": "Low-E升级玻璃"}, "roof_style": {"price": 120, "unit": "per_sqm", "label": "异形屋顶"}}'::jsonb,
    '{}'::jsonb,
    '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
-- Smart PRO
('g1a2b3c4-0001-0001-0001-000000000006'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000006'::UUID, '智能PRO标准定价', 'standard', 3880.00, 'per_sqm', 'CNY',
    '[{"min_sqm": 0, "max_sqm": 999, "multiplier": 1.0, "label": "标准"}]'::jsonb,
    '{"voice_control": {"price": 2800, "unit": "per_unit", "label": "语音控制升级"}, "homekit": {"price": 1500, "unit": "per_unit", "label": "HomeKit集成"}}'::jsonb,
    '{"early_bird": {"percent": 8, "valid_until": "2026-06-30"}}'::jsonb,
    '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
-- Pavilion A
('g1a2b3c4-0001-0001-0001-000000000007'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000007'::UUID, '凉亭A款定价', 'standard', 28000.00, 'per_unit', 'CNY',
    '[]'::jsonb,
    '{"led_light": {"price": 1800, "unit": "per_unit", "label": "LED灯带套装"}, "mosquito_net": {"price": 1200, "unit": "per_unit", "label": "防蚊纱帘"}}'::jsonb,
    '{}'::jsonb,
    '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
-- Pavilion B
('g1a2b3c4-0001-0001-0001-000000000008'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000008'::UUID, '凉亭B款定价', 'standard', 38000.00, 'per_unit', 'CNY',
    '[]'::jsonb,
    '{"led_light": {"price": 2200, "unit": "per_unit", "label": "LED灯带套装"}, "mosquito_net": {"price": 1600, "unit": "per_unit", "label": "防蚊纱帘"}}'::jsonb,
    '{}'::jsonb,
    '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID);

-- Accessories pricing
INSERT INTO pricing (id, tenant_id, product_id, pricing_name, pricing_type, base_price, price_unit, currency, effective_from, is_active, created_by) VALUES
('g1a2b3c4-0001-0001-0001-000000000009'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000009'::UUID, 'LED灯带定价', 'standard', 85.00, 'per_linear_m', 'CNY', '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('g1a2b3c4-0001-0001-0001-000000000010'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000010'::UUID, '电热膜定价', 'standard', 280.00, 'per_sqm', 'CNY', '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('g1a2b3c4-0001-0001-0001-000000000011'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000011'::UUID, '遮阳系统定价', 'standard', 380.00, 'per_sqm', 'CNY', '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID),
('g1a2b3c4-0001-0001-0001-000000000012'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000012'::UUID, '通风系统定价', 'standard', 4500.00, 'per_unit', 'CNY', '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000001'::UUID);

-- Pricing for Tenant 2 Products
INSERT INTO pricing (id, tenant_id, product_id, pricing_name, pricing_type, base_price, price_unit, currency, area_tiers, effective_from, is_active, created_by) VALUES
('g1a2b3c4-0001-0001-0001-000000000101'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'f1a2b3c4-0001-0001-0001-000000000101'::UUID, 'A型定价', 'standard', 1680.00, 'per_sqm', 'CNY',
    '[{"min_sqm": 0, "max_sqm": 20, "multiplier": 1.1}, {"min_sqm": 20, "max_sqm": 999, "multiplier": 1.0}]'::jsonb, '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('g1a2b3c4-0001-0001-0001-000000000102'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'f1a2b3c4-0001-0001-0001-000000000102'::UUID, 'B型定价', 'standard', 2280.00, 'per_sqm', 'CNY',
    '[{"min_sqm": 0, "max_sqm": 30, "multiplier": 1.08}, {"min_sqm": 30, "max_sqm": 999, "multiplier": 1.0}]'::jsonb, '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('g1a2b3c4-0001-0001-0001-000000000103'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'f1a2b3c4-0001-0001-0001-000000000103'::UUID, '固定A型定价', 'standard', 1080.00, 'per_sqm', 'CNY',
    '[]'::jsonb, '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('g1a2b3c4-0001-0001-0001-000000000104'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'f1a2b3c4-0001-0001-0001-000000000104'::UUID, '固定B型定价', 'standard', 1480.00, 'per_sqm', 'CNY',
    '[]'::jsonb, '2026-01-01', TRUE, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID);

-- ============================================================
-- SECTION H: COST COMPONENTS (for Pricing Agent)
-- ============================================================

-- Cost components for Tenant 1, Product A100
INSERT INTO cost_components (id, tenant_id, product_id, component_name, component_type, unit_cost, cost_unit, currency, is_variable, margin_percent, supplier_name, lead_time_days, is_active) VALUES
('h1a2b3c4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, '铝合金型材', 'material', 320.00, 'per_sqm', 'CNY', TRUE, 15.0, '广东铝业集团', 7, TRUE),
('h1a2b3c4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, '钢化中空玻璃', 'material', 280.00, 'per_sqm', 'CNY', TRUE, 12.0, '南玻集团', 5, TRUE),
('h1a2b3c4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, '德国进口电机', 'material', 1800.00, 'per_unit', 'CNY', FALSE, 20.0, '德国Somfy', 14, TRUE),
('h1a2b3c4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, '五金配件', 'material', 85.00, 'per_sqm', 'CNY', TRUE, 10.0, '坚朗五金', 3, TRUE),
('h1a2b3c4-0001-0001-0001-000000000005'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, '工厂生产人工', 'labor', 120.00, 'per_sqm', 'CNY', TRUE, 0, NULL, 0, TRUE),
('h1a2b3c4-0001-0001-0001-000000000006'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, '物流运输', 'shipping', 50.00, 'per_sqm', 'CNY', TRUE, 0, '顺丰物流', 3, TRUE),
('h1a2b3c4-0001-0001-0001-000000000007'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, '现场安装', 'installation', 180.00, 'per_sqm', 'CNY', TRUE, 0, NULL, 0, TRUE),
('h1a2b3c4-0001-0001-0001-000000000008'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000001'::UUID, '质保预留', 'warranty', 45.00, 'per_sqm', 'CNY', FALSE, 0, NULL, 0, TRUE);

-- ============================================================
-- SECTION I: PROJECTS (per tenant)
-- ============================================================

-- Projects for Tenant 1
INSERT INTO projects (id, tenant_id, project_number, title, description, status, project_type, customer_id, client_name, client_email, client_phone, budget_range, square_meters, assigned_to, created_by) VALUES
('i1a2b3c4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'PRJ-20260101-ABC123', '王建国别墅阳光房项目', '85平米可伸缩阳光房，含智能控制系统', 'in_progress', 'sunroom', 'd1e2f3a4-0001-0001-0001-000000000001'::UUID, '王建国', 'wangjg@huaxin-tech.com', '139-0001-0001', '30万-50万', 85.0, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('i1a2b3c4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'PRJ-20260102-DEF456', '李美玲联排庭院改造', '42平米固定阳光房+凉亭', 'completed', 'sunroom', 'd1e2f3a4-0001-0001-0001-000000000002'::UUID, '李美玲', 'limeiling@163.com', '139-0002-0002', '10万-20万', 42.0, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('i1a2b3c4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'PRJ-20260103-GHI789', '伟民贸易公司办公楼', '120平米商业阳光房项目', 'pending', 'sunroom', 'd1e2f3a4-0001-0001-0001-000000000003'::UUID, '张伟民', 'zhangwm@weimin-trade.com', '139-0003-0003', '20万-30万', 120.0, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
('i1a2b3c4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'PRJ-20260104-JKL012', '刘志强苏州别墅', '95平米高端可伸缩阳光房', 'in_progress', 'sunroom', 'd1e2f3a4-0001-0001-0001-000000000005'::UUID, '刘志强', 'liuzq@zhiqiang-group.com', '139-0005-0005', '30万-50万', 95.0, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID);

-- ============================================================
-- SECTION J: DESIGNS (per tenant)
-- ============================================================

-- Designs for Tenant 1
INSERT INTO designs (id, tenant_id, customer_id, project_id, product_id, design_number, name, version, width, depth, height, area, options, quoted_price, price_breakdown, status, compliance_status, created_by) VALUES
('j1a2b3c4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000001'::UUID, 'i1a2b3c4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000003'::UUID, 'DSN-20260101-ABC123', '王建国别墅C300方案', 1, 8500, 10000, 3200, 85.0,
    '{"frame_color": "黑色", "glass_type": "low_e", "motor_type": "四驱动", "control_type": "智能家居联动", "led_lighting": true, "heating": true}'::jsonb,
    326800.00,
    '{"material_cost": 185000, "labor_cost": 45000, "shipping_cost": 8500, "installation_cost": 52000, "options_cost": 25300, "margin": 11000}'::jsonb,
    'approved', 'passed', 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('j1a2b3c4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000002'::UUID, 'i1a2b3c4-0001-0001-0001-000000000002'::UUID, 'f1a2b3c4-0001-0001-0001-000000000004'::UUID, 'DSN-20260102-DEF456', '李美玲固定阳光房方案', 1, 6000, 7000, 2800, 42.0,
    '{"frame_color": "香槟金", "glass_type": "standard", "roof_style": "人字顶"}'::jsonb,
    58800.00,
    '{"material_cost": 32000, "labor_cost": 8500, "shipping_cost": 2100, "installation_cost": 12600, "margin": 3600}'::jsonb,
    'approved', 'passed', 'b1c2d3e4-0001-0001-0001-000000000003'::UUID);

-- ============================================================
-- SECTION K: ORDERS (per tenant, various statuses)
-- ============================================================

-- Orders for Tenant 1 - Various statuses to demonstrate workflow
INSERT INTO orders (id, tenant_id, customer_id, project_id, design_id, order_number, subtotal, discount_amount, discount_reason, shipping_fee, total, currency, payment_plan, status, confirmed_at, deposit_paid_at, production_started_at, shipped_at, delivered_at, installed_at, completed_at, sales_rep_id, created_by) VALUES
-- Completed order
('k1a2b3c4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000002'::UUID, 'i1a2b3c4-0001-0001-0001-000000000002'::UUID, 'j1a2b3c4-0001-0001-0001-000000000002'::UUID, 'ORD-20260115-ABC123', 58800.00, 0, NULL, 0, 58800.00, 'CNY',
    '{"deposit": {"percent": 30, "amount": 17640, "status": "paid", "paid_at": "2026-01-15"}, "second": {"percent": 40, "amount": 23520, "status": "paid", "paid_at": "2026-02-01"}, "final": {"percent": 30, "amount": 17640, "status": "paid", "paid_at": "2026-02-15"}}'::jsonb,
    'completed', '2026-01-10 10:00:00+08', '2026-01-15 14:30:00+08', '2026-01-20 09:00:00+08', '2026-02-05 11:00:00+08', '2026-02-08 15:00:00+08', '2026-02-12 10:00:00+08', '2026-02-15 16:00:00+08',
    'b1c2d3e4-0001-0001-0001-000000000003'::UUID, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
-- In production order
('k1a2b3c4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000001'::UUID, 'i1a2b3c4-0001-0001-0001-000000000001'::UUID, 'j1a2b3c4-0001-0001-0001-000000000001'::UUID, 'ORD-20260201-DEF456', 326800.00, 16340.00, '早鸟优惠5%', 0, 310460.00, 'CNY',
    '{"deposit": {"percent": 30, "amount": 93138, "status": "paid", "paid_at": "2026-02-01"}, "second": {"percent": 40, "amount": 124184, "status": "pending"}, "final": {"percent": 30, "amount": 93138, "status": "pending"}}'::jsonb,
    'in_production', '2026-01-28 11:00:00+08', '2026-02-01 10:00:00+08', '2026-02-05 08:00:00+08', NULL, NULL, NULL, NULL,
    'b1c2d3e4-0001-0001-0001-000000000003'::UUID, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
-- Pending order
('k1a2b3c4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000003'::UUID, 'i1a2b3c4-0001-0001-0001-000000000003'::UUID, NULL, 'ORD-20260301-GHI789', 175680.00, 0, NULL, 2000.00, 177680.00, 'CNY',
    '{"deposit": {"percent": 30, "amount": 53304, "status": "pending"}, "second": {"percent": 40, "amount": 71072, "status": "pending"}, "final": {"percent": 30, "amount": 53304, "status": "pending"}}'::jsonb,
    'pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL,
    'b1c2d3e4-0001-0001-0001-000000000004'::UUID, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
-- Confirmed order (deposit paid)
('k1a2b3c4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000005'::UUID, 'i1a2b3c4-0001-0001-0001-000000000004'::UUID, NULL, 'ORD-20260215-JKL012', 258500.00, 7755.00, 'VIP客户3%折扣', 0, 250745.00, 'CNY',
    '{"deposit": {"percent": 30, "amount": 75223.5, "status": "paid", "paid_at": "2026-02-20"}, "second": {"percent": 40, "amount": 100298, "status": "pending"}, "final": {"percent": 30, "amount": 75223.5, "status": "pending"}}'::jsonb,
    'deposit_paid', '2026-02-16 09:00:00+08', '2026-02-20 14:00:00+08', NULL, NULL, NULL, NULL, NULL,
    'b1c2d3e4-0001-0001-0001-000000000004'::UUID, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
-- Shipped order
('k1a2b3c4-0001-0001-0001-000000000005'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000006'::UUID, NULL, NULL, 'ORD-20260120-MNO345', 68200.00, 0, NULL, 1500.00, 69700.00, 'CNY',
    '{"deposit": {"percent": 30, "amount": 20910, "status": "paid", "paid_at": "2026-01-22"}, "second": {"percent": 40, "amount": 27880, "status": "paid", "paid_at": "2026-02-05"}, "final": {"percent": 30, "amount": 20910, "status": "pending"}}'::jsonb,
    'shipped', '2026-01-20 15:00:00+08', '2026-01-22 11:00:00+08', '2026-01-25 08:00:00+08', '2026-03-05 09:00:00+08', NULL, NULL, NULL,
    'b1c2d3e4-0001-0001-0001-000000000003'::UUID, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID);

-- Orders for Tenant 2
INSERT INTO orders (id, tenant_id, customer_id, order_number, subtotal, discount_amount, shipping_fee, total, currency, payment_plan, status, sales_rep_id, created_by) VALUES
('k1a2b3c4-0001-0001-0001-000000000101'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'd1e2f3a4-0001-0001-0001-000000000101'::UUID, 'ORD-20260201-BJ001', 147840.00, 0, 3000.00, 150840.00, 'CNY',
    '{"deposit": {"percent": 30, "amount": 45252, "status": "paid"}, "second": {"percent": 40, "amount": 60336, "status": "pending"}, "final": {"percent": 30, "amount": 45252, "status": "pending"}}'::jsonb,
    'in_production', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID),
('k1a2b3c4-0001-0001-0001-000000000102'::UUID, 'a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'd1e2f3a4-0001-0001-0001-000000000102'::UUID, 'ORD-20260215-BJ002', 75600.00, 2268.00, '新客户优惠', 0, 73332.00, 'CNY',
    '{"deposit": {"percent": 30, "amount": 21999.6, "status": "pending"}, "second": {"percent": 40, "amount": 29332.8, "status": "pending"}, "final": {"percent": 30, "amount": 21999.6, "status": "pending"}}'::jsonb,
    'pending', 'b1c2d3e4-0001-0001-0001-000000000013'::UUID, 'b1c2d3e4-0001-0001-0001-000000000011'::UUID);

-- ============================================================
-- SECTION L: ORDER ITEMS
-- ============================================================

-- Order items for Tenant 1 orders
INSERT INTO order_items (id, tenant_id, order_id, product_id, product_snapshot, quantity, unit_price, subtotal, customization, dimensions) VALUES
('l1a2b3c4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000001'::UUID, 'f1a2b3c4-0001-0001-0001-000000000004'::UUID,
    '{"sku": "SR-F-A100", "name": "固定阳光房 A100系列", "base_price": 980}'::jsonb, 1, 1400.00, 58800.00,
    '{"frame_color": "香槟金", "glass_type": "standard", "roof_style": "人字顶"}'::jsonb,
    '{"width_mm": 6000, "depth_mm": 7000, "height_mm": 2800, "area_sqm": 42}'::jsonb),
('l1a2b3c4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000002'::UUID, 'f1a2b3c4-0001-0001-0001-000000000003'::UUID,
    '{"sku": "SR-R-C300", "name": "可伸缩阳光房 C300系列", "base_price": 2980}'::jsonb, 1, 3450.00, 293250.00,
    '{"frame_color": "黑色", "glass_type": "low_e", "motor_type": "四驱动", "control_type": "智能家居联动"}'::jsonb,
    '{"width_mm": 8500, "depth_mm": 10000, "height_mm": 3200, "area_sqm": 85}'::jsonb),
('l1a2b3c4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000002'::UUID, 'f1a2b3c4-0001-0001-0001-000000000009'::UUID,
    '{"sku": "ACC-LED-001", "name": "LED灯带套装", "base_price": 85}'::jsonb, 85, 85.00, 7225.00,
    '{"color_temp": "4000K"}'::jsonb, '{"length_m": 85}'::jsonb),
('l1a2b3c4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000002'::UUID, 'f1a2b3c4-0001-0001-0001-000000000010'::UUID,
    '{"sku": "ACC-HEAT-001", "name": "电热膜地暖系统", "base_price": 280}'::jsonb, 85, 310.00, 26350.00,
    '{}'::jsonb, '{"area_sqm": 85}'::jsonb);

-- ============================================================
-- SECTION M: PAYMENTS
-- ============================================================

-- Payments for Tenant 1 orders
INSERT INTO payments (id, tenant_id, order_id, customer_id, payment_number, payment_type, amount, currency, payment_method, transaction_id, status, due_date, paid_at, created_by) VALUES
-- Payments for completed order (k1a2b3c4-0001-0001-0001-000000000001)
('m1a2b3c4-0001-0001-0001-000000000001'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000002'::UUID, 'PAY-20260115-001', 'deposit', 17640.00, 'CNY', 'wechat_pay', 'WX2026011512345678', 'completed', '2026-01-15', '2026-01-15 14:30:00+08', 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('m1a2b3c4-0001-0001-0001-000000000002'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000002'::UUID, 'PAY-20260201-001', 'second_payment', 23520.00, 'CNY', 'bank_transfer', 'BK2026020187654321', 'completed', '2026-02-01', '2026-02-01 10:00:00+08', 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('m1a2b3c4-0001-0001-0001-000000000003'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000001'::UUID, 'd1e2f3a4-0001-0001-0001-000000000002'::UUID, 'PAY-20260215-001', 'final_payment', 17640.00, 'CNY', 'wechat_pay', 'WX2026021598765432', 'completed', '2026-02-15', '2026-02-15 16:00:00+08', 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
-- Payments for in_production order (k1a2b3c4-0001-0001-0001-000000000002)
('m1a2b3c4-0001-0001-0001-000000000004'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000002'::UUID, 'd1e2f3a4-0001-0001-0001-000000000001'::UUID, 'PAY-20260201-002', 'deposit', 93138.00, 'CNY', 'bank_transfer', 'BK2026020112345678', 'completed', '2026-02-01', '2026-02-01 10:00:00+08', 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('m1a2b3c4-0001-0001-0001-000000000005'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000002'::UUID, 'd1e2f3a4-0001-0001-0001-000000000001'::UUID, 'PAY-20260315-001', 'second_payment', 124184.00, 'CNY', NULL, NULL, 'pending', '2026-03-15', NULL, 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
-- Payments for pending order (k1a2b3c4-0001-0001-0001-000000000003)
('m1a2b3c4-0001-0001-0001-000000000006'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000003'::UUID, 'd1e2f3a4-0001-0001-0001-000000000003'::UUID, 'PAY-20260305-001', 'deposit', 53304.00, 'CNY', NULL, NULL, 'pending', '2026-03-05', NULL, 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
-- Payments for deposit_paid order (k1a2b3c4-0001-0001-0001-000000000004)
('m1a2b3c4-0001-0001-0001-000000000007'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000004'::UUID, 'd1e2f3a4-0001-0001-0001-000000000005'::UUID, 'PAY-20260220-001', 'deposit', 75223.50, 'CNY', 'alipay', 'AL2026022087654321', 'completed', '2026-02-20', '2026-02-20 14:00:00+08', 'b1c2d3e4-0001-0001-0001-000000000004'::UUID),
-- Payments for shipped order (k1a2b3c4-0001-0001-0001-000000000005)
('m1a2b3c4-0001-0001-0001-000000000008'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000005'::UUID, 'd1e2f3a4-0001-0001-0001-000000000006'::UUID, 'PAY-20260122-001', 'deposit', 20910.00, 'CNY', 'wechat_pay', 'WX2026012211112222', 'completed', '2026-01-22', '2026-01-22 11:00:00+08', 'b1c2d3e4-0001-0001-0001-000000000003'::UUID),
('m1a2b3c4-0001-0001-0001-000000000009'::UUID, 'a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'k1a2b3c4-0001-0001-0001-000000000005'::UUID, 'd1e2f3a4-0001-0001-0001-000000000006'::UUID, 'PAY-20260205-001', 'second_payment', 27880.00, 'CNY', 'bank_transfer', 'BK2026020533334444', 'completed', '2026-02-05', '2026-02-05 10:00:00+08', 'b1c2d3e4-0001-0001-0001-000000000003'::UUID);

-- ============================================================
-- SECTION N: SYSTEM CONFIGS (per tenant)
-- ============================================================

INSERT INTO system_configs (tenant_id, config_key, config_value, description, is_public) VALUES
-- Tenant 1 configs
('a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'company_info', '{"name": "上海阳光房科技有限公司", "phone": "021-5888-9999", "email": "contact@shsunrooms.com", "address": "上海市浦东新区张江高科技园区博云路2号"}'::jsonb, '公司信息', TRUE),
('a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'payment_methods', '["alipay", "wechat_pay", "bank_transfer"]'::jsonb, '支持的支付方式', TRUE),
('a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'order_status_flow', '["pending","confirmed","deposit_paid","in_production","quality_check","shipped","delivered","installing","installed","completed"]'::jsonb, '订单状态流程', FALSE),
('a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'supported_file_types', '{"products": ["image","pdf","dwg","dxf","skp","obj","step","stl"], "max_size_mb": 50}'::jsonb, '支持的上传文件类型', TRUE),
('a1b2c3d4-0001-0001-0001-000000000001'::UUID, 'notification_settings', '{"email_on_order_created": true, "email_on_payment_received": true, "sms_on_shipped": true}'::jsonb, '通知设置', FALSE),
-- Tenant 2 configs
('a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'company_info', '{"name": "北京户外生活空间设计有限公司", "phone": "010-8888-6666", "email": "info@bjoutdoor.com"}'::jsonb, '公司信息', TRUE),
('a1b2c3d4-0001-0001-0001-000000000002'::UUID, 'payment_methods', '["alipay", "wechat_pay", "bank_transfer"]'::jsonb, '支持的支付方式', TRUE),
-- Tenant 3 configs
('a1b2c3d4-0001-0001-0001-000000000003'::UUID, 'company_info', '{"name": "杭州庭院景观工程有限公司", "phone": "0571-8765-4321", "email": "sales@hzgarden.com"}'::jsonb, '公司信息', TRUE),
('a1b2c3d4-0001-0001-0001-000000000003'::UUID, 'payment_methods', '["wechat_pay", "bank_transfer"]'::jsonb, '支持的支付方式', TRUE);

-- ============================================================
-- END OF SEED DATA
-- 
-- Summary:
-- - Tenants: 4 (1 default + 3 test tenants)
-- - Users: 12 (across all tenants)
-- - Partners: 3
-- - Customers: 28 (15 + 8 + 5)
-- - Products: 18 (12 + 6)
-- - Pricing: 16 rules
-- - Cost Components: 8 (for A100 product)
-- - Projects: 4
-- - Designs: 2
-- - Orders: 7 (various statuses)
-- - Order Items: 4
-- - Payments: 9
-- - System Configs: 9
-- ============================================================
