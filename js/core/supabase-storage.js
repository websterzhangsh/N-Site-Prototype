/**
 * supabase-storage.js — 存储操作层 (NestopiaStorage)
 * 从 company-operations.html 内联 <script> 提取（Phase 2.2）
 * 命名空间: Nestopia.storage (别名 window.NestopiaStorage)
 */

/* ── Nestopia Supabase Storage (inlined) ── */
(function() {
    'use strict';
    var LS_PREFIX = 'nestopia_pf_';
    function detectCategory(file) {
        if (!file || !file.type) return 'other';
        if (file.type.startsWith('image/')) return 'site-photos';
        if (file.type.startsWith('video/')) return 'site-videos';
        if (file.type === 'application/pdf') return 'manuals';
        if (file.type.includes('word') || file.type.includes('document')) return 'manuals';
        if (file.type.includes('spreadsheet') || file.type.includes('excel')) return 'specs';
        if (file.type.includes('presentation') || file.type.includes('powerpoint')) return 'marketing';
        return 'other';
    }
    function getFileExtension(filename) {
        if (!filename) return 'unknown';
        var parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : 'unknown';
    }
    function buildStoragePath(tenantId, projectId, category, filename) {
        var ts = Date.now();
        var safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        if (projectId) return tenantId + '/' + projectId + '/' + category + '/' + ts + '-' + safeName;
        return tenantId + '/' + category + '/' + ts + '-' + safeName;
    }
    function generateLocalId() { return 'pf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6); }
    function isValidUUID(s) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s); }

    var LocalStorage = {
        getFiles: function(projectId) {
            try { return JSON.parse(localStorage.getItem(LS_PREFIX + projectId)) || []; } catch(e) { return []; }
        },
        saveFile: function(projectId, fileObj) {
            var files = this.getFiles(projectId);
            var record = Object.assign({}, fileObj, { id: fileObj.id || generateLocalId(), uploadedAt: new Date().toISOString(), storageMode: fileObj.storageMode || 'local' });
            files.push(record);
            localStorage.setItem(LS_PREFIX + projectId, JSON.stringify(files));
            return record;
        },
        removeFile: function(projectId, fileId) {
            var files = this.getFiles(projectId).filter(function(f) { return f.id !== fileId; });
            localStorage.setItem(LS_PREFIX + projectId, JSON.stringify(files));
            return files;
        },
        clearProject: function(projectId) { localStorage.removeItem(LS_PREFIX + projectId); }
    };

    var SupabaseStorage = {
        uploadFile: function(bucket, path, file) {
            try {
                var client = NestopiaDB.getClient();
                if (!client) return Promise.reject(new Error('Supabase not connected'));
                if (!client.storage) return Promise.reject(new Error('Supabase storage module not available'));
                console.log('[SupabaseStorage] upload →', bucket, path, file.name, file.size);
                return client.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
            } catch(e) {
                console.error('[SupabaseStorage] uploadFile sync error:', e);
                return Promise.reject(e);
            }
        },
        getFileUrl: function(bucket, path, signed) {
            try {
                var client = NestopiaDB.getClient();
                if (!client || !client.storage) return null;
                if (signed) {
                    return client.storage.from(bucket).createSignedUrl(path, 3600).then(function(res) { return res.data ? res.data.signedUrl : null; });
                }
                var result = client.storage.from(bucket).getPublicUrl(path);
                return result.data ? result.data.publicUrl : null;
            } catch(e) {
                console.error('[SupabaseStorage] getFileUrl error:', e);
                return null;
            }
        },
        deleteFiles: function(bucket, paths) {
            try {
                var client = NestopiaDB.getClient();
                if (!client) return Promise.reject(new Error('Supabase not connected'));
                if (!client.storage) return Promise.reject(new Error('Supabase storage module not available'));
                return client.storage.from(bucket).remove(paths);
            } catch(e) { return Promise.reject(e); }
        },
        listFiles: function(bucket, folder) {
            try {
                var client = NestopiaDB.getClient();
                if (!client) return Promise.reject(new Error('Supabase not connected'));
                if (!client.storage) return Promise.reject(new Error('Supabase storage module not available'));
                return client.storage.from(bucket).list(folder, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });
            } catch(e) { return Promise.reject(e); }
        }
    };

    var KBDocuments = {
        getProjectFiles: function(projectId, filters) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(LocalStorage.getFiles(projectId));
            // 非 UUID projectId（如 OMY-001）无法查询 UUID 列，回退 localStorage
            if (!isValidUUID(projectId)) {
                console.log('[KBDocuments] projectId 非 UUID，回退 localStorage:', projectId);
                return Promise.resolve(LocalStorage.getFiles(projectId));
            }
            var query = client.from('kb_documents').select('*').eq('scope', 'project').eq('project_id', projectId).eq('is_deleted', false).eq('is_latest', true).order('created_at', { ascending: false });
            if (filters) {
                if (filters.category) query = query.eq('category', filters.category);
                if (filters.status) query = query.eq('status', filters.status);
                if (filters.product_line) query = query.eq('product_line', filters.product_line);
            }
            return query.then(function(res) {
                if (res.error) { console.warn('[NestopiaStorage] DB 查询失败，回退 localStorage:', res.error.message); return LocalStorage.getFiles(projectId); }
                return (res.data || []).map(function(row) {
                    return { id: row.id, name: row.name, type: row.mime_type || row.file_type, size: row.file_size_bytes, category: row.category, thumbnailUrl: row.media_metadata ? row.media_metadata.thumbnailUrl : null, url: row.file_url, status: row.status, note: row.description, uploadedAt: row.created_at, storageMode: 'supabase', storagePath: row.storage_path, tags: row.tags || [] };
                });
            }).catch(function(err) { console.warn('[NestopiaStorage] 网络错误，回退 localStorage:', err.message); return LocalStorage.getFiles(projectId); });
        },
        getTenantFiles: function(filters) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve([]);
            var query = client.from('kb_documents').select('*').eq('scope', 'tenant').eq('tenant_id', NestopiaDB.getTenantId()).eq('is_deleted', false).eq('is_latest', true).order('created_at', { ascending: false });
            if (filters) { if (filters.product_line) query = query.eq('product_line', filters.product_line); if (filters.category) query = query.eq('category', filters.category); }
            return query.then(function(res) { return res.error ? [] : (res.data || []); });
        },
        insert: function(doc) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(null);
            return client.from('kb_documents').insert(doc).select().single().then(function(res) {
                if (res.error) { console.error('[NestopiaStorage] 元数据写入失败:', res.error.message); return null; }
                return res.data;
            });
        },
        update: function(docId, updates) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(null);
            return client.from('kb_documents').update(updates).eq('id', docId).select().single().then(function(res) { return res.error ? null : res.data; });
        },
        softDelete: function(docId) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(false);
            return client.from('kb_documents').update({ is_deleted: true }).eq('id', docId).then(function(res) { return !res.error; });
        },
        getStats: function() {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(null);
            return client.from('v_kb_stats').select('*').eq('tenant_id', NestopiaDB.getTenantId()).then(function(res) { return res.error ? null : res.data; });
        }
    };

    var Operations = {
        uploadProjectFile: function(projectId, file, options) {
            options = options || {};
            var category = options.category || detectCategory(file);
            var tenantId = NestopiaDB.getTenantId();
            if (file.size > NestopiaDB.config.maxFileSize) {
                return Promise.reject(new Error('File too large: ' + NestopiaDB.formatFileSize(file.size) + ' (max ' + NestopiaDB.formatFileSize(NestopiaDB.config.maxFileSize) + ')'));
            }
            if (!NestopiaDB.isConnected()) {
                return new Promise(function(resolve) {
                    var isImg = file.type.startsWith('image/');
                    if (file.size > 5 * 1024 * 1024) {
                        resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: null, url: null, note: options.description || 'Pending cloud storage' }));
                        return;
                    }
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: isImg ? e.target.result : null, url: e.target.result, note: options.description || '' }));
                    };
                    reader.onerror = function() {
                        resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: null, url: null, note: 'Read error — metadata only' }));
                    };
                    reader.readAsDataURL(file);
                });
            }
            var bucket = NestopiaDB.getBucket('projectFiles');
            var storagePath = buildStoragePath(tenantId, projectId, category, file.name);
            return SupabaseStorage.uploadFile(bucket, storagePath, file)
                .then(function(uploadRes) {
                    if (uploadRes.error) throw uploadRes.error;
                    var publicUrl = SupabaseStorage.getFileUrl(bucket, storagePath, false);
                    var dbProjectId = isValidUUID(projectId) ? projectId : null;
                    var dbScope = dbProjectId ? 'project' : 'tenant';
                    return KBDocuments.insert({ tenant_id: tenantId, scope: dbScope, project_id: dbProjectId, category: category, name: file.name, description: options.description || ('Project: ' + projectId), file_url: publicUrl, file_type: getFileExtension(file.name), file_size_bytes: file.size, mime_type: file.type, storage_path: storagePath, status: 'uploaded', tags: options.tags || [], uploaded_by: null });
                })
                .then(function(dbRecord) {
                    if (!dbRecord) throw new Error('Metadata save failed');
                    LocalStorage.saveFile(projectId, { id: dbRecord.id, name: dbRecord.name, type: dbRecord.mime_type, size: dbRecord.file_size_bytes, category: dbRecord.category, thumbnailUrl: null, url: dbRecord.file_url, storageMode: 'supabase', storagePath: dbRecord.storage_path });
                    return { id: dbRecord.id, name: dbRecord.name, type: dbRecord.mime_type, size: dbRecord.file_size_bytes, category: dbRecord.category, url: dbRecord.file_url, storagePath: dbRecord.storage_path, status: 'uploaded', storageMode: 'supabase', uploadedAt: dbRecord.created_at };
                })
                .catch(function(err) {
                    console.error('[NestopiaStorage] Supabase 上传失败，回退 localStorage:', err.message);
                    return new Promise(function(resolve) {
                        var isImg = file.type.startsWith('image/');
                        if (file.size > 5 * 1024 * 1024) { resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: null, url: null, storagePath: storagePath, storageMode: 'supabase', note: 'Cloud upload failed: ' + err.message })); return; }
                        var reader = new FileReader();
                        reader.onload = function(e) { resolve(LocalStorage.saveFile(projectId, { name: file.name, type: file.type, size: file.size, category: category, thumbnailUrl: isImg ? e.target.result : null, url: e.target.result, storagePath: storagePath, storageMode: 'supabase', note: 'Cloud upload failed, saved locally' })); };
                        reader.readAsDataURL(file);
                    });
                });
        },
        uploadTenantFile: function(file, options) {
            options = options || {};
            var tenantId = NestopiaDB.getTenantId();
            if (!NestopiaDB.isConnected()) return Promise.reject(new Error('Tenant file upload requires Supabase connection'));
            if (file.size > NestopiaDB.config.maxFileSize) return Promise.reject(new Error('File too large: ' + NestopiaDB.formatFileSize(file.size) + ' (max ' + NestopiaDB.formatFileSize(NestopiaDB.config.maxFileSize) + ')'));
            var bucket = NestopiaDB.getBucket('tenantFiles');
            var category = options.category || detectCategory(file);
            var productLine = options.productLine || 'general';
            var storagePath = buildStoragePath(tenantId, null, productLine + '/' + category, file.name);
            return SupabaseStorage.uploadFile(bucket, storagePath, file)
                .then(function(uploadRes) {
                    if (uploadRes.error) throw uploadRes.error;
                    var publicUrl = SupabaseStorage.getFileUrl(bucket, storagePath, false);
                    return KBDocuments.insert({ tenant_id: tenantId, scope: 'tenant', project_id: null, product_line: productLine, category: category, name: file.name, description: options.description || null, file_url: publicUrl, file_type: getFileExtension(file.name), file_size_bytes: file.size, mime_type: file.type, storage_path: storagePath, status: 'uploaded', ai_agents: options.aiAgents || [], tags: options.tags || [], uploaded_by: null });
                });
        },
        removeProjectFile: function(projectId, fileId, storagePath) {
            LocalStorage.removeFile(projectId, fileId);
            if (!NestopiaDB.isConnected()) return Promise.resolve(true);
            var dbPromise = KBDocuments.softDelete(fileId);
            var storagePromise = storagePath ? SupabaseStorage.deleteFiles(NestopiaDB.getBucket('projectFiles'), [storagePath]) : Promise.resolve({ data: null, error: null });
            return Promise.all([dbPromise, storagePromise]).then(function(results) { return results[0]; }).catch(function(err) { console.warn('[NestopiaStorage] 删除部分失败:', err.message); return true; });
        },
        getProjectFiles: function(projectId) { return KBDocuments.getProjectFiles(projectId); },
        syncProjectFiles: function(projectId) {
            if (!NestopiaDB.isConnected()) return Promise.resolve(LocalStorage.getFiles(projectId));
            return KBDocuments.getProjectFiles(projectId).then(function(files) { localStorage.setItem(LS_PREFIX + projectId, JSON.stringify(files)); return files; });
        }
    };

    window.NestopiaStorage = {
        local: LocalStorage,
        storage: SupabaseStorage,
        documents: KBDocuments,
        uploadProjectFile: Operations.uploadProjectFile.bind(Operations),
        uploadTenantFile: Operations.uploadTenantFile.bind(Operations),
        removeProjectFile: Operations.removeProjectFile.bind(Operations),
        getProjectFiles: Operations.getProjectFiles.bind(Operations),
        syncProjectFiles: Operations.syncProjectFiles.bind(Operations),
        detectCategory: detectCategory,
        getFileExtension: getFileExtension,
        formatFileSize: NestopiaDB.formatFileSize
    };

    if (window.Nestopia) window.Nestopia.storage = window.NestopiaStorage;
})();

console.log('[Nestopia] supabase-storage.js loaded');
