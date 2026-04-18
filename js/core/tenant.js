/**
 * tenant.js — 多租户配置 / slug 管理
 * 从 company-operations.html 提取（Phase 2.4）
 * 命名空间: Nestopia.tenant
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    var tenantConfigs = {
        'default':      { name: 'Greenscape Builders', logo: 'images/partner-logo.png', language: 'en',        unitSystem: 'imperial' },
        'partner1':     { name: 'Greenscape Builders', logo: 'images/partner-logo.png', language: 'en',        unitSystem: 'imperial' },
        'omeya-sin':    { name: 'Omeya-SIN', logo: 'images/omeya-logo.png',             language: 'en',        unitSystem: 'imperial' },
        'nestopia-chn': { name: 'Nestopia-CHN', logo: 'images/nestopia-logo.png',        language: 'bilingual', unitSystem: 'metric' }
    };

    N.tenant = {
        configs: tenantConfigs,

        getCurrentSlug: function() {
            return localStorage.getItem('tenant_slug') || sessionStorage.getItem('tenant_slug') || 'default';
        },

        getUnitSystem: function() {
            var slug = N.tenant.getCurrentSlug();
            var cfg = tenantConfigs[slug] || tenantConfigs['default'];
            return cfg.unitSystem || 'imperial';
        },

        getLanguage: function() {
            var slug = N.tenant.getCurrentSlug();
            var cfg = tenantConfigs[slug] || tenantConfigs['default'];
            return cfg.language || 'en';
        },

        getLocalizedName: function(bilingualName, lang) {
            if (!bilingualName) return '';
            if (lang === 'en') {
                var parts = bilingualName.split(' / ');
                return parts.length > 1 ? parts[parts.length - 1] : bilingualName;
            }
            return bilingualName;
        }
    };

    // ── 全局别名桥接（原始函数名兼容） ──
    window.getCurrentTenantSlug = N.tenant.getCurrentSlug;
    window.tenantConfigs = tenantConfigs;
    window.getTenantUnitSystem = N.tenant.getUnitSystem;
    window.getTenantLanguage = N.tenant.getLanguage;
    window.getLocalizedName = N.tenant.getLocalizedName;

    console.log('[Nestopia] tenant.js loaded');
})();
