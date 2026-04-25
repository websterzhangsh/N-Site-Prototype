/**
 * pricing-data.js — Nestopia 定价数据
 * 命名空间: Nestopia.data.pricing
 *
 * v2.0 — 基于产品 SKU 目录价（RMB/m2）的统一定价引擎。
 * zbSKUCatalog 是所有定价面板（Smart Quote + Quotation Detail）的唯一数据源。
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    N.data.pricing = {

        // ===== SKU 产品目录价 — 单一定价数据源 =====
        // 价格单位: RMB / m2
        zbSKUCatalog: {
            'WR110A-78': {
                name: 'WR110A-78 电动防风卷帘 / Motorized Zip Blinds (\u22645.5m)',
                nameShort: 'WR110A-78 Motorized (\u22645.5m)',
                price: 680,
                type: 'motorized',
                maxHeightMM: 5500
            },
            'WR110B-63': {
                name: 'WR110B-63 电动防风卷帘 / Motorized Zip Blinds (\u22643.8m)',
                nameShort: 'WR110B-63 Motorized (\u22643.8m)',
                price: 580,
                type: 'motorized',
                maxHeightMM: 3800
            },
            'WR85-M38': {
                name: 'WR85 手动防风卷帘 / Manual Zip Blinds (\u22643.8m)',
                nameShort: 'WR85 Manual (\u22643.8m)',
                price: 380,
                type: 'manual',
                maxHeightMM: 3800
            },
            'WR85-M55': {
                name: 'WR85 手动防风卷帘 / Manual Zip Blinds (\u22645.5m)',
                nameShort: 'WR85 Manual (\u22645.5m)',
                price: 450,
                type: 'manual',
                maxHeightMM: 5500
            }
        },

        // 配件预设（RMB 单价）
        zbAccessoryPresets: [
            { name: '奥技45-20N电机 配双频遥控器 / A-OK Motor 45-20N w/ remote', price: 350 },
            { name: 'WR120 转角立柱 / Corner Post', price: 180 },
            { name: '方管立柱 / Square Tube Post', price: 120 },
            { name: '安装费 / Installation Fee', price: 0 }
        ],

        // 默认汇率（1 外币 = X RMB）
        defaultExchangeRates: {
            USD: 7.25,
            SGD: 5.40
        },

        // ===== Legacy: 旧版多策略定价数据 =====
        // 保留向后兼容（Sunroom / Pergola 仍使用旧逻辑）

        zbProductTiers: {
            good: {
                name: 'ZB-100 Standard', tube: '65mm', fabric: 'Standard',
                tiers: [
                    { maxArea: 5, label: '<5 sqm', retail: 45, wholesale: 37 },
                    { maxArea: Infinity, label: '\u22655 sqm', retail: 38, wholesale: 31 }
                ]
            },
            better: {
                name: 'ZB-200 Professional', tube: '65-75mm', fabric: 'Premium',
                tiers: [
                    { maxArea: 5, label: '<5 sqm', retail: 62, wholesale: 51 },
                    { maxArea: Infinity, label: '\u22655 sqm', retail: 52, wholesale: 43 }
                ]
            },
            best: {
                name: 'ZB-300 Elite', tube: '75mm', fabric: 'Elite',
                tiers: [
                    { maxArea: 3, label: '<3 sqm', retail: 85, wholesale: 70 },
                    { maxArea: 6, label: '3\u20136 sqm', retail: 72, wholesale: 59 },
                    { maxArea: Infinity, label: '>6 sqm', retail: 58, wholesale: 48 }
                ]
            }
        },

        zbDriveSystems: {
            'bead-chain':    { name: 'Bead Chain',        category: 'Manual',  retail: 18,  wholesale: 14 },
            'spring-crank':  { name: 'Spring Crank',      category: 'Manual',  retail: 35,  wholesale: 28 },
            'electric-std':  { name: 'Standard Electric',  category: 'Electric', retail: 68,  wholesale: 55 },
            'electric-prem': { name: 'Premium Electric',   category: 'Electric', retail: 92,  wholesale: 75 },
            'dual-mode':     { name: 'Dual Mode',          category: 'Premium', retail: 165, wholesale: 135 },
            'solar-kit':     { name: 'Solar Power Kit',    category: 'Premium', retail: 215, wholesale: 176 }
        },

        zbFabricUpgrades: {
            'np4000': { name: 'NP-Standard', surcharge: 0 },
            'np6000': { name: 'NP-Premium', surcharge: 8 },
            'np8000': { name: 'NP-Elite', surcharge: 18 }
        },

        zbHeightSurcharges: [
            { maxHeight: 1.0,      surcharge: 15, label: '\u22641.0m' },
            { maxHeight: 1.3,      surcharge: 8,  label: '1.01\u20131.3m' },
            { maxHeight: 1.5,      surcharge: 4,  label: '1.31\u20131.5m' },
            { maxHeight: Infinity, surcharge: 0,  label: '\u22651.51m (standard)' }
        ],

        zbHardwareCostPerUnit: 30
    };

    // ── 全局别名桥接 ──
    window.zbProductTiers       = N.data.pricing.zbProductTiers;
    window.zbDriveSystems       = N.data.pricing.zbDriveSystems;
    window.zbFabricUpgrades     = N.data.pricing.zbFabricUpgrades;
    window.zbHeightSurcharges   = N.data.pricing.zbHeightSurcharges;
    window.zbHardwareCostPerUnit = N.data.pricing.zbHardwareCostPerUnit;
    window.zbSKUCatalog         = N.data.pricing.zbSKUCatalog;

    console.log('[Nestopia] pricing-data.js v2.0 loaded');
})();
