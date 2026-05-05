/**
 * tenant.js — 多租户配置 / slug 管理
 * 从 company-operations.html 提取（Phase 2.4）
 * 命名空间: Nestopia.tenant
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    var tenantConfigs = {
        'default':       { name: 'Greenscape Builders', logo: 'images/partner-logo.png', language: 'en',        unitSystem: 'imperial', dbTenantId: 'a3000000-0000-0000-0000-000000000003' },
        'partner1':      { name: 'Greenscape Builders', logo: 'images/partner-logo.png', language: 'en',        unitSystem: 'imperial', dbTenantId: 'a3000000-0000-0000-0000-000000000003' },
        'greenscape-us': { name: 'GreenScape Builders (US)', logo: 'images/partner-logo.png', language: 'en',   unitSystem: 'imperial', dbTenantId: 'a3000000-0000-0000-0000-000000000003' },
        'omeya-sin':     { name: 'Omeya-SIN', logo: 'images/omeya-logo.png',             language: 'en',        unitSystem: 'imperial', dbTenantId: 'a2000000-0000-0000-0000-000000000002' },
        'nestopia-chn':  { name: 'Nestopia-CHN', logo: 'images/nestopia-logo.png',        language: 'bilingual', unitSystem: 'metric',   dbTenantId: 'a1000000-0000-0000-0000-000000000001' }
    };

    // ── 租户级显示偏好（默认值） ─────────────────────────────
    // 所有租户共享同一份默认值；个别租户可通过 System Settings 覆盖（存 localStorage）
    var _displayDefaults = {
        showInheritedMeasurementData: false   // Step 3 "Inherited from Steps 1–2" 区域
    };

    /**
     * 获取显示偏好值
     * 优先级: localStorage (用户在 Settings 中手动设置) > _displayDefaults
     * @param {string} key — 如 'showInheritedMeasurementData'
     * @returns {boolean}
     */
    function getDisplaySetting(key) {
        var slug = N.tenant.getCurrentSlug();
        var lsKey = 'nestopia_display_' + slug + '_' + key;
        var stored = localStorage.getItem(lsKey);
        if (stored !== null) return stored === 'true';
        return _displayDefaults[key] !== undefined ? _displayDefaults[key] : false;
    }

    /**
     * 设置显示偏好值（存入 localStorage）
     * @param {string} key
     * @param {boolean} value
     */
    function setDisplaySetting(key, value) {
        var slug = N.tenant.getCurrentSlug();
        var lsKey = 'nestopia_display_' + slug + '_' + key;
        localStorage.setItem(lsKey, String(!!value));
    }

    N.tenant = {
        configs: tenantConfigs,

        getCurrentSlug: function() {
            return localStorage.getItem('tenant_slug') || sessionStorage.getItem('tenant_slug') || 'default';
        },

        /**
         * 获取当前租户在 Supabase 中的 UUID (用于 distributor_price_list 等表)
         * 如果找不到映射，回退到 NestopiaDB.getTenantId()
         */
        getDbTenantId: function() {
            var slug = N.tenant.getCurrentSlug();
            var cfg = tenantConfigs[slug] || tenantConfigs['default'];
            if (cfg && cfg.dbTenantId) return cfg.dbTenantId;
            return (typeof NestopiaDB !== 'undefined' && NestopiaDB.getTenantId) ? NestopiaDB.getTenantId() : null;
        },

        /**
         * 当前租户是否为平台方（nestopia-chn）
         */
        isPlatform: function() {
            return N.tenant.getCurrentSlug() === 'nestopia-chn';
        },

        /**
         * 当前租户是否为分销商（非平台方）
         */
        isDistributor: function() {
            return !N.tenant.isPlatform();
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
        },

        getDisplaySetting: getDisplaySetting,
        setDisplaySetting: setDisplaySetting
    };

    // ── 全局别名桥接（原始函数名兼容） ──
    window.getCurrentTenantSlug = N.tenant.getCurrentSlug;
    window.getDbTenantId = N.tenant.getDbTenantId;
    window.tenantConfigs = tenantConfigs;
    window.getTenantUnitSystem = N.tenant.getUnitSystem;
    window.getTenantLanguage = N.tenant.getLanguage;
    window.getLocalizedName = N.tenant.getLocalizedName;
    window.getDisplaySetting = getDisplaySetting;
    window.setDisplaySetting = setDisplaySetting;

    console.log('[Nestopia] tenant.js loaded');
})();
