/**
 * Nestopia 全局命名空间初始化
 * ============================================================
 * 必须作为第一个加载的应用 JS 文件（仅 Supabase CDN 在之前）
 *
 * 所有模块统一挂载到 window.Nestopia.*，按以下结构组织：
 *   Nestopia.db       — Supabase 客户端
 *   Nestopia.storage  — 文件存储操作
 *   Nestopia.auth     — 认证 / 会话
 *   Nestopia.tenant   — 多租户配置
 *   Nestopia.i18n     — 国际化
 *   Nestopia.router   — 页面路由
 *   Nestopia.data.*   — 静态数据 / 配置
 *   Nestopia.agents.* — AI Agent 模块
 *   Nestopia.steps.*  — 工作流步骤实现
 *   Nestopia.utils.*  — 工具函数
 *   Nestopia.[module] — 功能模块（products, customers, etc.）
 *
 * 版本: 1.0.0
 * 日期: 2026-04-17
 * ============================================================
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};

    // ── 版本 ──
    N.VERSION = '1.0.0';

    // ── 子命名空间预初始化 ──
    N.data   = N.data   || {};
    N.agents = N.agents || {};
    N.steps  = N.steps  || {};
    N.utils  = N.utils  || {};

    // ── 调试工具 ──
    N.debug = function() {
        var modules = Object.keys(N).filter(function(k) {
            return typeof N[k] === 'object' && N[k] !== null && k !== 'data' && k !== 'agents' && k !== 'steps' && k !== 'utils';
        });
        var dataKeys = Object.keys(N.data);
        var agentKeys = Object.keys(N.agents);
        var stepKeys = Object.keys(N.steps);
        var utilKeys = Object.keys(N.utils);

        console.group('Nestopia v' + N.VERSION + ' — Module Status');
        console.log('Core/Modules:', modules.join(', ') || '(none loaded)');
        console.log('Data:',         dataKeys.join(', ') || '(none loaded)');
        console.log('Agents:',       agentKeys.join(', ') || '(none loaded)');
        console.log('Steps:',        stepKeys.join(', ') || '(none loaded)');
        console.log('Utils:',        utilKeys.join(', ') || '(none loaded)');
        console.groupEnd();

        return {
            version: N.VERSION,
            modules: modules,
            data: dataKeys,
            agents: agentKeys,
            steps: stepKeys,
            utils: utilKeys
        };
    };

})();
