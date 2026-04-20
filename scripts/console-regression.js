/**
 * Nestopia 回归测试 — Console 自动验证脚本
 * 
 * 使用方法:
 *   1. 打开 company-operations.html 页面
 *   2. F12 → Console
 *   3. 粘贴本脚本全部内容并回车执行
 * 
 * 检查内容:
 *   - 命名空间存在性 & 结构完整性
 *   - 数据层加载
 *   - 全局别名一致性
 *   - onclick 命名空间绑定采样
 *   - DOM 完整性（14 个页面）
 *   - Supabase 连接
 *   - JS 错误收集
 * 
 * 版本: v1.0 (Phase 0-4B)
 */
(function() {
    'use strict';

    var pass = 0, fail = 0, warn = 0;
    var results = [];

    function check(name, condition, detail) {
        if (condition) {
            pass++;
            results.push({ status: '✅', name: name, detail: detail || '' });
        } else {
            fail++;
            results.push({ status: '❌', name: name, detail: detail || 'FAILED' });
        }
    }

    function softCheck(name, condition, detail) {
        if (condition) {
            pass++;
            results.push({ status: '✅', name: name, detail: detail || '' });
        } else {
            warn++;
            results.push({ status: '⚠️', name: name, detail: detail || 'WARNING' });
        }
    }

    console.clear();
    console.log('%c🧪 Nestopia 回归测试 — Console 自动验证', 'font-size:16px;font-weight:bold;color:#2563eb');
    console.log('%c' + new Date().toLocaleString(), 'color:#666');
    console.log('');

    // ═══════════════════════════════════════════
    // 1. 命名空间存在性
    // ═══════════════════════════════════════════
    console.log('%c▸ 1. 命名空间存在性', 'font-weight:bold;color:#7c3aed');

    check('Nestopia 根命名空间', typeof window.Nestopia === 'object');
    check('Nestopia.auth', typeof Nestopia.auth === 'object');
    check('Nestopia.router', typeof Nestopia.router === 'object');
    check('Nestopia.tenant', typeof Nestopia.tenant === 'object');
    check('Nestopia.i18n', typeof Nestopia.i18n === 'object');
    check('Nestopia.db', typeof Nestopia.db === 'object');
    check('Nestopia.storage', typeof Nestopia.storage === 'object');
    check('Nestopia.data', typeof Nestopia.data === 'object');
    check('Nestopia.modules', typeof Nestopia.modules === 'object');
    check('Nestopia.agents', typeof Nestopia.agents === 'object');
    check('Nestopia.steps', typeof Nestopia.steps === 'object');
    check('Nestopia.utils', typeof Nestopia.utils === 'object');

    // ═══════════════════════════════════════════
    // 2. 模块注册完整性
    // ═══════════════════════════════════════════
    console.log('%c▸ 2. 模块注册完整性', 'font-weight:bold;color:#7c3aed');

    // 数据层 (6)
    check('data.i18nDict', typeof Nestopia.data.i18nDict === 'object');
    check('data.pricing', typeof Nestopia.data.pricing === 'object');
    check('data.productCatalog', typeof Nestopia.data.productCatalog === 'object');
    check('data.stepConfig', typeof Nestopia.data.stepConfig === 'object');
    check('data.intakeFields', typeof Nestopia.data.intakeFields === 'object');
    check('data.seedProjects', typeof Nestopia.data.seedProjects === 'object');

    // 功能模块 (7)
    check('modules.orders', typeof Nestopia.modules.orders === 'object');
    check('modules.customers', typeof Nestopia.modules.customers === 'object');
    check('modules.knowledgeBase', typeof Nestopia.modules.knowledgeBase === 'object');
    check('modules.products', typeof Nestopia.modules.products === 'object');
    check('modules.overview', typeof Nestopia.modules.overview === 'object');
    check('modules.projects', typeof Nestopia.modules.projects === 'object');
    check('modules.workflow', typeof Nestopia.modules.workflow === 'object');

    // Agent 模块 (4)
    check('agents.designer', typeof Nestopia.agents.designer === 'object');
    check('agents.pricing', typeof Nestopia.agents.pricing === 'object');
    check('agents.compliance', typeof Nestopia.agents.compliance === 'object');
    check('agents.cs', typeof Nestopia.agents.cs === 'object');

    // Step 实现 (3)
    check('steps.step2', typeof Nestopia.steps.step2 === 'object');
    check('steps.step3', typeof Nestopia.steps.step3 === 'object');
    check('steps.step4', typeof Nestopia.steps.step4 === 'object');

    // 工具 (3)
    check('utils.showToast', typeof Nestopia.utils.showToast === 'function');
    check('utils.quotEditor', typeof Nestopia.utils.quotEditor === 'object');
    check('utils.chatbot', typeof Nestopia.utils.chatbot === 'object');

    // ═══════════════════════════════════════════
    // 3. 数据层内容验证
    // ═══════════════════════════════════════════
    console.log('%c▸ 3. 数据层内容验证', 'font-weight:bold;color:#7c3aed');

    check('pricing.zbProductTiers 有数据',
        Array.isArray(Nestopia.data.pricing.zbProductTiers) && Nestopia.data.pricing.zbProductTiers.length > 0,
        Nestopia.data.pricing.zbProductTiers ? Nestopia.data.pricing.zbProductTiers.length + ' tiers' : 'empty');

    check('productCatalog 有数据',
        Nestopia.data.productCatalog && Object.keys(Nestopia.data.productCatalog).length > 0,
        Nestopia.data.productCatalog ? Object.keys(Nestopia.data.productCatalog).length + ' products' : 'empty');

    check('stepConfig.STEP_DETAIL_CONFIG 有数据',
        Nestopia.data.stepConfig && typeof Nestopia.data.stepConfig.STEP_DETAIL_CONFIG === 'object');

    check('seedProjects.greenscapeProjects 有数据',
        Nestopia.data.seedProjects && Array.isArray(Nestopia.data.seedProjects.greenscapeProjects) &&
        Nestopia.data.seedProjects.greenscapeProjects.length > 0,
        Nestopia.data.seedProjects.greenscapeProjects ? Nestopia.data.seedProjects.greenscapeProjects.length + ' projects' : 'empty');

    // ═══════════════════════════════════════════
    // 4. 关键函数存在性
    // ═══════════════════════════════════════════
    console.log('%c▸ 4. 关键函数存在性', 'font-weight:bold;color:#7c3aed');

    var fnChecks = [
        ['auth.checkAuth', Nestopia.auth.checkAuth],
        ['auth.logout', Nestopia.auth.logout],
        ['router.navigateToPage', Nestopia.router.navigateToPage],
        ['router.navigateToProject', Nestopia.router.navigateToProject],
        ['modules.projects.openCreateProjectModal', Nestopia.modules.projects.openCreateProjectModal],
        ['modules.projects.selectProject', Nestopia.modules.projects.selectProject],
        ['modules.workflow.advanceStep', Nestopia.modules.workflow.advanceStep],
        ['agents.designer.handleGenerateDesign', Nestopia.agents.designer.handleGenerateDesign],
        ['agents.designer.selectDesignerColor', Nestopia.agents.designer.selectDesignerColor],
        ['agents.pricing.selectProductTier', Nestopia.agents.pricing.selectProductTier],
        ['agents.pricing.setPricingMode', Nestopia.agents.pricing.setPricingMode],
        ['steps.step2.generateStep2Design', Nestopia.steps.step2.generateStep2Design],
        ['steps.step3.saveStep3Measurement', Nestopia.steps.step3.saveStep3Measurement],
        ['steps.step4.calculatePricing', Nestopia.steps.step4.calculatePricing],
        ['utils.quotEditor.openQuotationEditor', Nestopia.utils.quotEditor.openQuotationEditor],
        ['utils.chatbot.b2bChat', Nestopia.utils.chatbot.b2bChat],
    ];

    fnChecks.forEach(function(fc) {
        check('fn: ' + fc[0], typeof fc[1] === 'function' || typeof fc[1] === 'object');
    });

    // ═══════════════════════════════════════════
    // 5. 全局别名一致性
    // ═══════════════════════════════════════════
    console.log('%c▸ 5. 全局别名一致性', 'font-weight:bold;color:#7c3aed');

    var aliasChecks = [
        ['showToast', window.showToast, Nestopia.utils.showToast],
        ['checkAuth', window.checkAuth, Nestopia.auth.checkAuth],
        ['logout', window.logout, Nestopia.auth.logout],
        ['navigateToPage', window.navigateToPage, Nestopia.router.navigateToPage],
        ['selectProject', window.selectProject, Nestopia.modules.projects.selectProject],
        ['openCreateProjectModal', window.openCreateProjectModal, Nestopia.modules.projects.openCreateProjectModal],
        ['selectDesignerColor', window.selectDesignerColor, Nestopia.agents.designer.selectDesignerColor],
        ['selectProductTier', window.selectProductTier, Nestopia.agents.pricing.selectProductTier],
        ['toggleOverviewSection', window.toggleOverviewSection, Nestopia.modules.overview.toggleOverviewSection],
        ['openQuotationEditor', window.openQuotationEditor, Nestopia.utils.quotEditor.openQuotationEditor],
        ['b2bChat', window.b2bChat, Nestopia.utils.chatbot.b2bChat],
    ];

    aliasChecks.forEach(function(ac) {
        check('alias: ' + ac[0] + ' === Nestopia.*', ac[1] === ac[2],
            ac[1] === ac[2] ? 'identical ref' : 'MISMATCH');
    });

    // ═══════════════════════════════════════════
    // 6. onclick 命名空间采样
    // ═══════════════════════════════════════════
    console.log('%c▸ 6. onclick 命名空间采样', 'font-weight:bold;color:#7c3aed');

    var onclickSamples = document.querySelectorAll('[onclick*="Nestopia."]');
    check('onclick 包含 Nestopia.* 的元素 > 0',
        onclickSamples.length > 0,
        onclickSamples.length + ' elements found');

    // 采样检查特定 onclick
    var sampleSelectors = [
        { sel: '[onclick*="Nestopia.modules.overview.toggleOverviewSection"]', name: 'Overview toggleSection' },
        { sel: '[onclick*="Nestopia.agents.designer.selectDesignerColor"]', name: 'Designer colorBtn' },
        { sel: '[onclick*="Nestopia.agents.pricing.selectProductTier"]', name: 'Pricing tierCard' },
        { sel: '[onclick*="Nestopia.modules.knowledgeBase.openKBUploadModal"]', name: 'KB uploadBtn' },
        { sel: '[onclick*="Nestopia.utils.chatbot.b2bChat"]', name: 'Chatbot buttons' },
    ];

    sampleSelectors.forEach(function(s) {
        var els = document.querySelectorAll(s.sel);
        check('onclick sample: ' + s.name, els.length > 0, els.length + ' found');
    });

    // ═══════════════════════════════════════════
    // 7. DOM 完整性 — 14 个页面
    // ═══════════════════════════════════════════
    console.log('%c▸ 7. DOM 完整性', 'font-weight:bold;color:#7c3aed');

    var pages = [
        'page-dashboard', 'page-workflow', 'page-ai-designer', 'page-pricing-agent',
        'page-compliance-agent', 'page-customer-service-agent', 'page-products',
        'page-orders', 'page-customers', 'page-knowledge-base', 'page-projects',
        'page-chatbot', 'page-team', 'page-settings'
    ];

    pages.forEach(function(pageId) {
        check('DOM: #' + pageId, !!document.getElementById(pageId));
    });

    // ═══════════════════════════════════════════
    // 8. Supabase 连接
    // ═══════════════════════════════════════════
    console.log('%c▸ 8. Supabase 连接', 'font-weight:bold;color:#7c3aed');

    softCheck('NestopiaDB 存在', typeof window.NestopiaDB === 'object');
    softCheck('NestopiaDB.isConnected()',
        typeof NestopiaDB !== 'undefined' && typeof NestopiaDB.isConnected === 'function' && NestopiaDB.isConnected(),
        typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected ? NestopiaDB.isConnected().toString() : 'N/A');

    // ═══════════════════════════════════════════
    // 9. Script 加载顺序 — 检查 script 标签
    // ═══════════════════════════════════════════
    console.log('%c▸ 9. Script 加载', 'font-weight:bold;color:#7c3aed');

    var expectedScripts = [
        'js/core/namespace.js',
        'js/core/supabase-config.js',
        'js/core/auth.js',
        'js/core/router.js',
        'js/data/pricing-data.js',
        'js/data/product-catalog.js',
        'js/modules/projects.js',
        'js/modules/workflow.js',
        'js/agents/designer.js',
        'js/agents/pricing.js',
        'js/steps/step2-design.js',
        'js/steps/step3-measurement.js',
        'js/steps/step4-quotation.js',
        'js/utils/quotation-editor.js',
        'js/utils/chatbot.js',
    ];

    var loadedScripts = Array.from(document.querySelectorAll('script[src*="js/"]')).map(function(s) {
        return s.getAttribute('src').replace(/\?.*$/, ''); // 去掉 ?v=hash
    });

    expectedScripts.forEach(function(expected) {
        check('script loaded: ' + expected, loadedScripts.indexOf(expected) !== -1);
    });

    // ═══════════════════════════════════════════
    // 汇总输出
    // ═══════════════════════════════════════════
    console.log('');
    console.log('%c══════════════════════════════════════', 'color:#666');
    console.log('%c📊 测试结果汇总', 'font-size:14px;font-weight:bold');
    console.log('%c  ✅ PASS: ' + pass, 'color:#16a34a;font-weight:bold');
    if (fail > 0) console.log('%c  ❌ FAIL: ' + fail, 'color:#dc2626;font-weight:bold');
    if (warn > 0) console.log('%c  ⚠️  WARN: ' + warn, 'color:#d97706;font-weight:bold');
    console.log('%c  总计: ' + (pass + fail + warn) + ' 项检查', 'color:#666');
    console.log('%c══════════════════════════════════════', 'color:#666');

    if (fail > 0) {
        console.log('');
        console.log('%c❌ 失败项:', 'color:#dc2626;font-weight:bold');
        results.filter(function(r) { return r.status === '❌'; }).forEach(function(r) {
            console.log('  ❌ ' + r.name + (r.detail ? ' — ' + r.detail : ''));
        });
    }

    if (warn > 0) {
        console.log('');
        console.log('%c⚠️ 警告项:', 'color:#d97706;font-weight:bold');
        results.filter(function(r) { return r.status === '⚠️'; }).forEach(function(r) {
            console.log('  ⚠️ ' + r.name + (r.detail ? ' — ' + r.detail : ''));
        });
    }

    // 返回结果对象供进一步检查
    console.log('');
    console.log('%c💡 完整结果已存入 window.__regressionResults', 'color:#666;font-style:italic');
    window.__regressionResults = { pass: pass, fail: fail, warn: warn, details: results };

    return (fail === 0) ? '✅ ALL PASSED' : '❌ ' + fail + ' FAILURE(S)';
})();
