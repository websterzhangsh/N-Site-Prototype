/**
 * auth.js — 认证 / 会话管理
 * 从 company-operations.html 提取（Phase 2.3）
 * 命名空间: Nestopia.auth
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    N.auth = {
        checkAuth: function() {
            var token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            if (!token) {
                window.location.href = 'login.html';
                return false;
            }
            return true;
        },

        getAuthData: function() {
            var dataStr = localStorage.getItem('auth_data') || sessionStorage.getItem('auth_data');
            if (dataStr) {
                try { return JSON.parse(dataStr); } catch(e) { return null; }
            }
            return null;
        },

        logout: function() {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_data');
            localStorage.removeItem('auth_remember');
            localStorage.removeItem('tenant_slug');
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('auth_data');
            sessionStorage.removeItem('tenant_slug');
            window.location.href = 'login.html';
        },

        toggleUserDropdown: function(e) {
            e.stopPropagation();
            var dd = document.getElementById('userDropdown');
            dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
        }
    };

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        var dd = document.getElementById('userDropdown');
        if (dd) dd.style.display = 'none';
    });

    // ── 全局别名桥接（onclick 兼容） ──
    window.checkAuth = N.auth.checkAuth;
    window.getAuthData = N.auth.getAuthData;
    window.logout = N.auth.logout;
    window.toggleUserDropdown = N.auth.toggleUserDropdown;

    console.log('[Nestopia] auth.js loaded');
})();
