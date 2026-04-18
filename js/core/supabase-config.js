/**
 * supabase-config.js — Supabase 客户端初始化 (NestopiaDB)
 * 从 company-operations.html 内联 <script> 提取（Phase 2.1）
 * 命名空间: Nestopia.db (别名 window.NestopiaDB)
 */
(function() {
    'use strict';
    var CONFIG = {
        url: 'https://drofojkakxitrqxnxrhh.supabase.co',
        anonKey: 'sb_publishable_0Y4N6oQzbdU-lcbVZW4pJQ_CxPrqZRJ',
        defaultTenantId: '550e8400-e29b-41d4-a716-446655440000',
        buckets: { tenantFiles: 'kb-tenant-files', projectFiles: 'kb-project-files' },
        maxFileSize: 50 * 1024 * 1024,
        warnFileSize: 10 * 1024 * 1024,
        debug: false
    };
    var PLACEHOLDER_URL = 'https://YOUR_PROJECT_ID.supabase.co';
    var PLACEHOLDER_KEY = 'YOUR_ANON_KEY';
    function isConfigured() {
        return CONFIG.url !== PLACEHOLDER_URL && CONFIG.anonKey !== PLACEHOLDER_KEY;
    }
    var _client = null;
    var _initError = null;
    function initClient() {
        if (_client) return _client;
        if (!isConfigured()) { return null; }
        if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
            console.warn('[NestopiaDB] Supabase JS SDK 未加载');
            _initError = 'SDK not loaded';
            return null;
        }
        try {
            _client = window.supabase.createClient(CONFIG.url, CONFIG.anonKey, {
                auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
                global: { headers: { 'x-nestopia-source': 'web-frontend' } }
            });
            console.info('[NestopiaDB] Supabase 客户端初始化成功:', CONFIG.url, '| storage:', typeof (_client && _client.storage), '| auth:', typeof (_client && _client.auth));
            return _client;
        } catch (e) {
            console.error('[NestopiaDB] Supabase 初始化失败:', e.message);
            _initError = e.message;
            return null;
        }
    }
    window.NestopiaDB = {
        config: CONFIG,
        getClient: function() { if (!_client && !_initError) initClient(); return _client; },
        isConnected: function() { return !!this.getClient(); },
        isConfigured: isConfigured,
        getError: function() { return _initError; },
        getTenantId: function() { return CONFIG.defaultTenantId; },
        getBucket: function(type) { return CONFIG.buckets[type] || null; },
        formatFileSize: function(bytes) {
            if (!bytes) return '0 B';
            var units = ['B', 'KB', 'MB', 'GB'];
            var i = 0, size = bytes;
            while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
            return size.toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
        },
        getStatusSummary: function() {
            if (this.isConnected()) return { status: 'connected', icon: 'fa-cloud', color: 'text-green-500', label: 'Cloud Storage' };
            if (isConfigured() && _initError) return { status: 'error', icon: 'fa-exclamation-triangle', color: 'text-red-500', label: 'Connection Error' };
            return { status: 'local', icon: 'fa-hdd', color: 'text-gray-400', label: 'Local Storage' };
        },
        testConnection: function() {
            var client = this.getClient();
            if (!client) return Promise.resolve({ ok: false, reason: 'no client' });
            return client.auth.getSession()
                .then(function(res) {
                    return { ok: !res.error, reason: res.error ? res.error.message : 'connected', session: !!res.data.session };
                })
                .catch(function(err) { return { ok: false, reason: err.message }; });
        }
    };
    if (window.Nestopia) window.Nestopia.db = window.NestopiaDB;
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initClient); }
    else { initClient(); }
})();
console.log('[Nestopia] supabase-config.js loaded');
