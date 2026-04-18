/**
 * i18n.js — 国际化工具函数
 * 从 company-operations.html 提取（Phase 2.5）
 * 命名空间: Nestopia.i18n
 * 依赖: Nestopia.data.i18nDict, Nestopia.tenant
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    N.i18n = {
        getQuotText: function(key) {
            var lang = N.tenant.getLanguage();
            var quotI18n = N.data.i18nDict.quotI18n;
            var dict = quotI18n[lang] || quotI18n['en'];
            return dict[key] || quotI18n['en'][key] || key;
        }
    };

    // ── 全局别名桥接 ──
    window.getQuotText = N.i18n.getQuotText;

    console.log('[Nestopia] i18n.js loaded');
})();
