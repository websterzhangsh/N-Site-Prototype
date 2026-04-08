/**
 * Nestopia — Supabase 共享客户端初始化
 * ============================================================
 * 所有页面（index.html, company-operations.html 等）统一通过此文件
 * 初始化 Supabase 客户端，确保配置集中管理。
 *
 * 使用方式：
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="js/supabase-config.js"></script>
 *   然后访问 window.NestopiaDB.client / .isConnected() / .getClient()
 *
 * 安全说明：
 *   - SUPABASE_ANON_KEY 是公开安全的（设计如此），安全由 RLS 策略保障
 *   - Service Role Key 绝不放在前端代码中
 *
 * Phase 2 — 2026-04-08
 * ============================================================
 */

(function() {
    'use strict';

    // ── 配置常量 ──────────────────────────────────────────────
    // 注册 Supabase 项目后，将下方占位值替换为真实凭证
    // 部署到不同环境时，通过 Cloudflare Pages 环境变量或构建脚本替换
    var CONFIG = {
        // Supabase 项目 URL（格式: https://<project-ref>.supabase.co）
        url: 'https://dtrsfsjlakshtpqsnvrfh.supabase.co',

        // Supabase 匿名公钥（anon key，可安全暴露在前端）
        anonKey: 'sb_publishable_0Y4N6oQzbdU-lcbVZW4pJQ_CxPrqZRJ',

        // 默认租户 ID（Demo/POC 阶段使用固定值）
        defaultTenantId: '550e8400-e29b-41d4-a716-446655440000',

        // Storage Bucket 名称（与 003_storage_buckets.sql 一致）
        buckets: {
            tenantFiles: 'kb-tenant-files',
            projectFiles: 'kb-project-files'
        },

        // 文件大小限制（字节）
        maxFileSize: 50 * 1024 * 1024,      // 50MB — Supabase 免费层上限
        warnFileSize: 10 * 1024 * 1024,      // 10MB — 显示警告

        // 调试模式
        debug: false
    };

    // ── 占位值检测 ────────────────────────────────────────────
    var PLACEHOLDER_URL = 'https://YOUR_PROJECT_ID.supabase.co';
    var PLACEHOLDER_KEY = 'YOUR_ANON_KEY';

    function isConfigured() {
        return CONFIG.url !== PLACEHOLDER_URL && CONFIG.anonKey !== PLACEHOLDER_KEY;
    }

    // ── 客户端初始化 ──────────────────────────────────────────
    var _client = null;
    var _initError = null;

    function initClient() {
        if (_client) return _client;

        if (!isConfigured()) {
            if (CONFIG.debug) {
                console.info('[NestopiaDB] Supabase 未配置，使用 localStorage 回退模式');
            }
            return null;
        }

        if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
            console.warn('[NestopiaDB] Supabase JS SDK 未加载，请确认 CDN 脚本已引入');
            _initError = 'SDK not loaded';
            return null;
        }

        try {
            _client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey, {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                },
                global: {
                    headers: {
                        'x-nestopia-source': 'web-frontend'
                    }
                }
            });

            if (CONFIG.debug) {
                console.info('[NestopiaDB] Supabase 客户端初始化成功:', CONFIG.url);
            }

            return _client;
        } catch (e) {
            console.error('[NestopiaDB] Supabase 初始化失败:', e.message);
            _initError = e.message;
            return null;
        }
    }

    // ── 公开 API ──────────────────────────────────────────────
    window.NestopiaDB = {
        // 配置
        config: CONFIG,

        // 获取客户端（惰性初始化）
        getClient: function() {
            if (!_client && !_initError) initClient();
            return _client;
        },

        // 是否已连接到 Supabase
        isConnected: function() {
            return !!this.getClient();
        },

        // 是否已配置（URL/Key 非占位值）
        isConfigured: isConfigured,

        // 获取初始化错误
        getError: function() {
            return _initError;
        },

        // 获取默认租户 ID
        getTenantId: function() {
            return CONFIG.defaultTenantId;
        },

        // 获取 Bucket 名称
        getBucket: function(type) {
            return CONFIG.buckets[type] || null;
        },

        // 格式化文件大小
        formatFileSize: function(bytes) {
            if (!bytes) return '0 B';
            var units = ['B', 'KB', 'MB', 'GB'];
            var i = 0;
            var size = bytes;
            while (size >= 1024 && i < units.length - 1) {
                size /= 1024;
                i++;
            }
            return size.toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
        },

        // 连接状态摘要（用于 UI 显示）
        getStatusSummary: function() {
            if (this.isConnected()) {
                return { status: 'connected', icon: 'fa-cloud', color: 'text-green-500', label: 'Cloud Storage' };
            }
            if (isConfigured() && _initError) {
                return { status: 'error', icon: 'fa-exclamation-triangle', color: 'text-red-500', label: 'Connection Error' };
            }
            return { status: 'local', icon: 'fa-hdd', color: 'text-gray-400', label: 'Local Storage' };
        },

        // 测试连接（异步）
        testConnection: function() {
            var client = this.getClient();
            if (!client) return Promise.resolve({ ok: false, reason: 'no client' });

            return client.auth.getSession()
                .then(function(res) {
                    return {
                        ok: !res.error,
                        reason: res.error ? res.error.message : 'connected',
                        session: !!res.data.session
                    };
                })
                .catch(function(err) {
                    return { ok: false, reason: err.message };
                });
        }
    };

    // ── 自动初始化 ────────────────────────────────────────────
    // DOM 加载完成后尝试初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initClient);
    } else {
        initClient();
    }

})();
