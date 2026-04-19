/**
 * pricing-data.js — Zip Blinds 定价数据（样本数据，非真实供应商数据）
 * 从 company-operations.html 提取（Phase 1.2）
 * 命名空间: Nestopia.data.pricing
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    N.data.pricing = {
        // Strategy 5: Good-Better-Best product tiers × Strategy 2: Volume-tiered area pricing
        zbProductTiers: {
            good: {
                name: 'ZB-100 Standard', tube: '65mm', fabric: 'Standard',
                tiers: [
                    { maxArea: 5, label: '<5 sqm', retail: 45, wholesale: 37 },
                    { maxArea: Infinity, label: '≥5 sqm', retail: 38, wholesale: 31 }
                ]
            },
            better: {
                name: 'ZB-200 Professional', tube: '65-75mm', fabric: 'Premium',
                tiers: [
                    { maxArea: 5, label: '<5 sqm', retail: 62, wholesale: 51 },
                    { maxArea: Infinity, label: '≥5 sqm', retail: 52, wholesale: 43 }
                ]
            },
            best: {
                name: 'ZB-300 Elite', tube: '75mm', fabric: 'Elite',
                tiers: [
                    { maxArea: 3, label: '<3 sqm', retail: 85, wholesale: 70 },
                    { maxArea: 6, label: '3–6 sqm', retail: 72, wholesale: 59 },
                    { maxArea: Infinity, label: '>6 sqm', retail: 58, wholesale: 48 }
                ]
            }
        },

        // Strategy 1: Modular drive system pricing (independent from fabric)
        zbDriveSystems: {
            'bead-chain':    { name: 'Bead Chain',        category: 'Manual',  retail: 18,  wholesale: 14 },
            'spring-crank':  { name: 'Spring Crank',      category: 'Manual',  retail: 35,  wholesale: 28 },
            'electric-std':  { name: 'Standard Electric',  category: 'Electric', retail: 68,  wholesale: 55 },
            'electric-prem': { name: 'Premium Electric',   category: 'Electric', retail: 92,  wholesale: 75 },
            'dual-mode':     { name: 'Dual Mode',          category: 'Premium', retail: 165, wholesale: 135 },
            'solar-kit':     { name: 'Solar Power Kit',    category: 'Premium', retail: 215, wholesale: 176 }
        },

        // Fabric upgrade surcharges (per sqm, on top of base tier price)
        zbFabricUpgrades: {
            'np4000': { name: 'NP-Standard', surcharge: 0 },
            'np6000': { name: 'NP-Premium', surcharge: 8 },
            'np8000': { name: 'NP-Elite', surcharge: 18 }
        },

        // Strategy 4: Height surcharges (baseline 1.5m — shorter blinds cost MORE due to cutting waste)
        zbHeightSurcharges: [
            { maxHeight: 1.0,      surcharge: 15, label: '≤1.0m' },
            { maxHeight: 1.3,      surcharge: 8,  label: '1.01–1.3m' },
            { maxHeight: 1.5,      surcharge: 4,  label: '1.31–1.5m' },
            { maxHeight: Infinity, surcharge: 0,  label: '≥1.51m (standard)' }
        ],

        // Hardware base cost per unit (rails, brackets, end caps)
        zbHardwareCostPerUnit: 30
    };

    // ── 全局别名桥接（step4-quotation.js / inline script 兼容） ──
    window.zbProductTiers    = N.data.pricing.zbProductTiers;
    window.zbDriveSystems    = N.data.pricing.zbDriveSystems;
    window.zbFabricUpgrades  = N.data.pricing.zbFabricUpgrades;
    window.zbHeightSurcharges = N.data.pricing.zbHeightSurcharges;
    window.zbHardwareCostPerUnit = N.data.pricing.zbHardwareCostPerUnit;

    console.log('[Nestopia] pricing-data.js loaded');
})();
