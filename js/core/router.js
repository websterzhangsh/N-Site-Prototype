/**
 * router.js — 页面路由 / 导航
 * 从 company-operations.html 提取（Phase 2.6）
 * 命名空间: Nestopia.router
 * 依赖: DOM ready
 */
(function() {
    'use strict';
    var N = window.Nestopia;

    // ── 路由状态 ──
    var _currentSelectedProjectId = null;
    var _currentActiveAgent = null;

    N.router = {
        get currentSelectedProjectId() { return _currentSelectedProjectId; },
        set currentSelectedProjectId(v) { _currentSelectedProjectId = v; },
        get currentActiveAgent() { return _currentActiveAgent; },
        set currentActiveAgent(v) { _currentActiveAgent = v; },

        navigateToPage: function(pageName) {
            // Update nav active state
            document.querySelectorAll('.nav-item').forEach(function(i) { i.classList.remove('active'); });
            var navItem = document.querySelector('.nav-item[data-page="' + pageName + '"]');
            if (navItem) {
                navItem.classList.add('active');
                document.getElementById('pageTitle').textContent = navItem.querySelector('span').textContent;
            }

            // Show/hide page content
            document.querySelectorAll('.page-content').forEach(function(p) { p.classList.remove('active'); });
            var page = document.getElementById('page-' + pageName);
            if (page) {
                page.classList.add('active');
            } else {
                var placeholder = document.getElementById('page-dashboard');
                if (placeholder) placeholder.classList.add('active');
            }

            // B2B Chatbot: manage FAB visibility
            var fab = document.getElementById('b2bChatFab');
            if (fab) {
                fab.classList.remove('hidden-fab');
            }

            // Clear sidebar project selection when going to non-project pages
            if (pageName !== 'projects') {
                document.querySelectorAll('.sidebar-project-item').forEach(function(el) { el.classList.remove('selected'); });
            }

            // Initialize AI Designer dropdown when navigating to that page
            if (pageName === 'ai-designer') {
                if (typeof initDesignerProjects === 'function') initDesignerProjects();
            }

            // Compliance Agent: 渲染 Compliance Pre-Check 摘要面板
            if (pageName === 'compliance-agent') {
                if (typeof renderCompliancePreCheckPanel === 'function') renderCompliancePreCheckPanel();
            }

            // Knowledge Base: 渲染 KB Quick Reference 摘要面板
            if (pageName === 'knowledge-base') {
                if (typeof renderKBQuickRefPanel === 'function') renderKBQuickRefPanel();
            }
        },

        navigateToProject: function(projectId) {
            // Show projects page
            document.querySelectorAll('.nav-item').forEach(function(i) { i.classList.remove('active'); });
            document.querySelectorAll('.page-content').forEach(function(p) { p.classList.remove('active'); });
            var page = document.getElementById('page-projects');
            if (page) page.classList.add('active');
            document.getElementById('pageTitle').textContent = 'Projects';

            // Select the project
            _currentSelectedProjectId = projectId;
            if (typeof selectProject === 'function') selectProject(projectId);
            N.router.renderSidebarProjects();
        },

        renderSidebarProjects: function() {
            var container = document.getElementById('sidebarProjectList');
            if (!container || typeof allProjectsData === 'undefined') return;

            var searchEl = document.getElementById('sidebarProjectSearch');
            var searchVal = (searchEl ? searchEl.value : '').toLowerCase();
            var filtered = allProjectsData.filter(function(p) { return !p.hidden; }).filter(function(p) {
                return p.name.toLowerCase().indexOf(searchVal) >= 0 ||
                       p.customer.toLowerCase().indexOf(searchVal) >= 0 ||
                       p.type.toLowerCase().indexOf(searchVal) >= 0;
            });

            var riskColors = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e', normal: '#22c55e' };
            var stageLabels = { intent:'Step 1', design:'Step 2', measurement:'Step 3', quotation:'Step 4', production:'Step 5', installation:'Step 6' };

            container.innerHTML = filtered.map(function(p) {
                var initials = p.customer.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
                var isSelected = p.id === _currentSelectedProjectId;
                var isZB = p.type === 'Zip Blinds';
                var stageDisplay = isZB ? 'Measure & Quote' : (stageLabels[p.stage] || 'Step ' + p.workflowStep);
                return '<div class="sidebar-project-item ' + (isSelected ? 'selected' : '') + '" onclick="Nestopia.router.navigateToProject(\'' + p.id + '\')">' +
                    '<div class="proj-avatar" style="' + (isSelected ? 'background:#222;color:#fff;' : '') + '">' + initials + '</div>' +
                    '<div class="proj-info">' +
                        '<div class="proj-name">' + p.name + '</div>' +
                        '<div class="proj-meta">' + p.type + ' · ' + stageDisplay + '</div>' +
                    '</div>' +
                    '<div class="proj-risk-dot" style="background:' + (riskColors[p.riskLevel] || '#22c55e') + '"></div>' +
                '</div>';
            }).join('');

            if (filtered.length === 0) {
                container.innerHTML = '<div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">No projects found</div>';
            }
        }
    };

    // ── 侧栏 nav-item 点击事件绑定 ──
    // 为所有带 data-page 属性的 .nav-item 绑定 click → navigateToPage
    function _bindNavItems() {
        document.querySelectorAll('.nav-item[data-page]').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                var pageName = this.getAttribute('data-page');
                if (pageName) N.router.navigateToPage(pageName);
            });
        });
    }
    // DOM 可能已 ready（脚本在 body 尾部加载），也可能还没 ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _bindNavItems);
    } else {
        _bindNavItems();
    }

    // ── 全局别名桥接（onclick 兼容） ──
    window.navigateToPage = N.router.navigateToPage;
    window.navigateToProject = N.router.navigateToProject;
    window.renderSidebarProjects = N.router.renderSidebarProjects;
    // 兼容原始变量引用
    Object.defineProperty(window, 'currentSelectedProjectId', {
        get: function() { return _currentSelectedProjectId; },
        set: function(v) { _currentSelectedProjectId = v; }
    });
    Object.defineProperty(window, 'currentActiveAgent', {
        get: function() { return _currentActiveAgent; },
        set: function(v) { _currentActiveAgent = v; }
    });

    console.log('[Nestopia] router.js loaded');
})();
