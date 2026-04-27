/**
 * helpers.js — 全局辅助函数
 * Phase 3.1: 通用 UI 工具函数
 * 依赖: 无
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.utils = N.utils || {};

    // ===== Toast Notification =====
    function showToast(message, type) {
        type = type || 'info';
        var toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 ' +
            (type === 'success' ? 'bg-green-600 text-white' :
             type === 'error' ? 'bg-red-600 text-white' :
             'bg-gray-800 text-white');
        toast.innerHTML =
            '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') + '"></i>' +
            '<span>' + message + '</span>';
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    // ===== Badge Utility Functions =====
    function getPriorityBadge(priority) {
        var badges = {
            high: '<span class="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium"><i class="fas fa-arrow-up mr-1"></i>High</span>',
            medium: '<span class="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium"><i class="fas fa-arrow-right mr-1"></i>Medium</span>',
            low: '<span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium"><i class="fas fa-arrow-down mr-1"></i>Low</span>'
        };
        return badges[priority] || '';
    }

    function getIssuStatusBadge(status) {
        var badges = {
            open: '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Open</span>',
            in_progress: '<span class="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">In Progress</span>',
            resolved: '<span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Resolved</span>',
            closed: '<span class="px-2 py-0.5 bg-gray-50 text-gray-700 rounded-full text-xs font-medium">Closed</span>'
        };
        return badges[status] || '';
    }

    function getRiskBadge(risk) {
        var badges = {
            high: '<span class="px-2 py-0.5 bg-red-50 text-red-700 rounded-full text-xs font-medium"><i class="fas fa-fire mr-1"></i>High</span>',
            medium: '<span class="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium"><i class="fas fa-exclamation-triangle mr-1"></i>Medium</span>',
            low: '<span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium"><i class="fas fa-check-circle mr-1"></i>Low</span>'
        };
        return badges[risk] || '';
    }

    function getStageBadge(stage) {
        var badges = {
            design: '<span class="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">Design</span>',
            permit: '<span class="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">Permit</span>',
            manufacturing: '<span class="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">Manufacturing</span>',
            installation: '<span class="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">Installation</span>',
            completed: '<span class="px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">Completed</span>'
        };
        return badges[stage] || '';
    }

    // ===== Regression Safety: 渲染函数安全包装器 =====
    // 包装任何 UI 渲染函数，捕获异常防止传播导致后续流程中断。
    // 用法: renderSidebarProjects = safetyWrap(renderSidebarProjects, 'renderSidebarProjects');
    function safetyWrap(fn, label) {
        label = label || fn.name || 'anonymous';
        return function() {
            try {
                return fn.apply(this, arguments);
            } catch(e) {
                console.error('[SafetyWrap] ' + label + ' crashed — suppressed to prevent cascade:', e.message);
                // 不重新抛出异常 — 防止 DOMContentLoaded / Promise 链中断
            }
        };
    }

    // ===== Data Safety: 从任意对象中安全提取字符串字段 =====
    // 永远返回 string，绝不为 null/undefined
    function safeStr(val, fallback) {
        fallback = fallback || '';
        return (val !== null && val !== undefined) ? String(val) : fallback;
    }

    // ===== Register on namespace =====
    N.utils.showToast = showToast;
    N.utils.getPriorityBadge = getPriorityBadge;
    N.utils.getIssuStatusBadge = getIssuStatusBadge;
    N.utils.getRiskBadge = getRiskBadge;
    N.utils.getStageBadge = getStageBadge;
    N.utils.safetyWrap = safetyWrap;
    N.utils.safeStr = safeStr;

    // ===== Global aliases (backward compat) =====
    window.showToast = showToast;
    window.getPriorityBadge = getPriorityBadge;
    window.getIssuStatusBadge = getIssuStatusBadge;
    window.getRiskBadge = getRiskBadge;
    window.getStageBadge = getStageBadge;
    window.safetyWrap = safetyWrap;
    window.safeStr = safeStr;
})();
