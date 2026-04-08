/**
 * Nestopia — Supabase Storage 操作封装
 * ============================================================
 * 封装所有文件上传/下载/元数据 CRUD 操作。
 * 核心设计：Supabase 优先 → localStorage 自动回退（Phase 1 兼容）
 *
 * 依赖：
 *   1. js/supabase-config.js （window.NestopiaDB）
 *   2. @supabase/supabase-js CDN
 *
 * Phase 2 — 2026-04-08
 * ============================================================
 */

(function() {
    'use strict';

    // ── localStorage 键名前缀 ─────────────────────────────────
    var LS_PREFIX = 'nestopia_pf_';

    // ── 工具函数 ──────────────────────────────────────────────

    /**
     * 根据 MIME type 推断文件分类
     */
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

    /**
     * 从文件名提取扩展名
     */
    function getFileExtension(filename) {
        if (!filename) return 'unknown';
        var parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toLowerCase() : 'unknown';
    }

    /**
     * 生成唯一的文件存储路径
     * 格式: {tenant-id}/{project-id}/{category}/{timestamp}-{filename}
     */
    function buildStoragePath(tenantId, projectId, category, filename) {
        var ts = Date.now();
        var safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
        if (projectId) {
            return tenantId + '/' + projectId + '/' + category + '/' + ts + '-' + safeName;
        }
        return tenantId + '/' + category + '/' + ts + '-' + safeName;
    }

    /**
     * 生成本地文件 ID
     */
    function generateLocalId() {
        return 'pf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    }

    /**
     * 验证字符串是否为合法 UUID 格式
     */
    function isValidUUID(s) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    }

    // ── localStorage 操作（Phase 1 回退） ─────────────────────

    var LocalStorage = {
        getFiles: function(projectId) {
            try {
                return JSON.parse(localStorage.getItem(LS_PREFIX + projectId)) || [];
            } catch(e) {
                return [];
            }
        },

        saveFile: function(projectId, fileObj) {
            var files = this.getFiles(projectId);
            var record = Object.assign({}, fileObj, {
                id: fileObj.id || generateLocalId(),
                uploadedAt: new Date().toISOString(),
                storageMode: 'local'
            });
            files.push(record);
            localStorage.setItem(LS_PREFIX + projectId, JSON.stringify(files));
            return record;
        },

        removeFile: function(projectId, fileId) {
            var files = this.getFiles(projectId).filter(function(f) {
                return f.id !== fileId;
            });
            localStorage.setItem(LS_PREFIX + projectId, JSON.stringify(files));
            return files;
        },

        clearProject: function(projectId) {
            localStorage.removeItem(LS_PREFIX + projectId);
        }
    };

    // ── Supabase Storage 操作 ─────────────────────────────────

    var SupabaseStorage = {

        /**
         * 上传文件到 Supabase Storage
         * @param {string} bucket - Bucket 名称（kb-tenant-files / kb-project-files）
         * @param {string} path - 存储路径
         * @param {File} file - 文件对象
         * @returns {Promise<{data, error}>}
         */
        uploadFile: function(bucket, path, file) {
            try {
                var client = NestopiaDB.getClient();
                if (!client) return Promise.reject(new Error('Supabase not connected'));
                if (!client.storage) return Promise.reject(new Error('Supabase storage module not available'));
                console.log('[SupabaseStorage] upload →', bucket, path, file.name, file.size);
                return client.storage
                    .from(bucket)
                    .upload(path, file, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: file.type
                    });
            } catch(e) {
                console.error('[SupabaseStorage] uploadFile sync error:', e);
                return Promise.reject(e);
            }
        },

        /**
         * 获取文件的公开/签名 URL
         * @param {string} bucket - Bucket 名称
         * @param {string} path - 存储路径
         * @param {boolean} signed - 是否使用签名 URL（私有文件）
         * @returns {string|null}
         */
        getFileUrl: function(bucket, path, signed) {
            try {
                var client = NestopiaDB.getClient();
                if (!client || !client.storage) return null;

                if (signed) {
                    // 签名 URL，有效期 1 小时
                    return client.storage
                        .from(bucket)
                        .createSignedUrl(path, 3600)
                        .then(function(res) {
                            return res.data ? res.data.signedUrl : null;
                        });
                }

                // 公开 URL
                var result = client.storage.from(bucket).getPublicUrl(path);
                return result.data ? result.data.publicUrl : null;
            } catch(e) {
                console.error('[SupabaseStorage] getFileUrl error:', e);
                return null;
            }
        },

        /**
         * 删除 Storage 中的文件
         * @param {string} bucket - Bucket 名称
         * @param {string[]} paths - 要删除的文件路径数组
         * @returns {Promise<{data, error}>}
         */
        deleteFiles: function(bucket, paths) {
            try {
                var client = NestopiaDB.getClient();
                if (!client) return Promise.reject(new Error('Supabase not connected'));
                if (!client.storage) return Promise.reject(new Error('Supabase storage module not available'));
                return client.storage.from(bucket).remove(paths);
            } catch(e) { return Promise.reject(e); }
        },

        /**
         * 列出 Bucket 中的文件
         * @param {string} bucket - Bucket 名称
         * @param {string} folder - 文件夹路径
         * @returns {Promise<{data, error}>}
         */
        listFiles: function(bucket, folder) {
            try {
                var client = NestopiaDB.getClient();
                if (!client) return Promise.reject(new Error('Supabase not connected'));
                if (!client.storage) return Promise.reject(new Error('Supabase storage module not available'));
                return client.storage.from(bucket).list(folder, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' }
                });
            } catch(e) { return Promise.reject(e); }
        }
    };

    // ── KB Documents 元数据操作（PostgreSQL） ──────────────────

    var KBDocuments = {

        /**
         * 查询项目文件列表
         * @param {string} projectId - 项目 ID
         * @param {object} filters - 可选过滤条件
         * @returns {Promise<Array>}
         */
        getProjectFiles: function(projectId, filters) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(LocalStorage.getFiles(projectId));

            // 非 UUID projectId（如 OMY-001）无法查询 UUID 列，回退 localStorage
            if (!isValidUUID(projectId)) {
                console.log('[KBDocuments] projectId 非 UUID，回退 localStorage:', projectId);
                return Promise.resolve(LocalStorage.getFiles(projectId));
            }

            var query = client
                .from('kb_documents')
                .select('*')
                .eq('scope', 'project')
                .eq('project_id', projectId)
                .eq('is_deleted', false)
                .eq('is_latest', true)
                .order('created_at', { ascending: false });

            if (filters) {
                if (filters.category) query = query.eq('category', filters.category);
                if (filters.status) query = query.eq('status', filters.status);
                if (filters.product_line) query = query.eq('product_line', filters.product_line);
            }

            return query.then(function(res) {
                if (res.error) {
                    console.warn('[NestopiaStorage] DB 查询失败，回退 localStorage:', res.error.message);
                    return LocalStorage.getFiles(projectId);
                }
                return (res.data || []).map(function(row) {
                    // 统一转换为前端展示格式
                    return {
                        id: row.id,
                        name: row.name,
                        type: row.mime_type || row.file_type,
                        size: row.file_size_bytes,
                        category: row.category,
                        thumbnailUrl: row.media_metadata ? row.media_metadata.thumbnailUrl : null,
                        url: row.file_url,
                        status: row.status,
                        note: row.description,
                        uploadedAt: row.created_at,
                        storageMode: 'supabase',
                        storagePath: row.storage_path,
                        tags: row.tags || []
                    };
                });
            }).catch(function(err) {
                console.warn('[NestopiaStorage] 网络错误，回退 localStorage:', err.message);
                return LocalStorage.getFiles(projectId);
            });
        },

        /**
         * 查询租户级 KB 文件列表
         * @param {object} filters - 过滤条件
         * @returns {Promise<Array>}
         */
        getTenantFiles: function(filters) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve([]);

            var query = client
                .from('kb_documents')
                .select('*')
                .eq('scope', 'tenant')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .eq('is_deleted', false)
                .eq('is_latest', true)
                .order('created_at', { ascending: false });

            if (filters) {
                if (filters.product_line) query = query.eq('product_line', filters.product_line);
                if (filters.category) query = query.eq('category', filters.category);
            }

            return query.then(function(res) {
                return res.error ? [] : (res.data || []);
            });
        },

        /**
         * 写入 KB 文档元数据
         * @param {object} doc - 文档元数据
         * @returns {Promise<object>}
         */
        insert: function(doc) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(null);

            return client
                .from('kb_documents')
                .insert(doc)
                .select()
                .single()
                .then(function(res) {
                    if (res.error) {
                        console.error('[NestopiaStorage] 元数据写入失败:', res.error.message);
                        return null;
                    }
                    return res.data;
                });
        },

        /**
         * 更新 KB 文档元数据
         * @param {string} docId - 文档 ID
         * @param {object} updates - 要更新的字段
         * @returns {Promise<object>}
         */
        update: function(docId, updates) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(null);

            return client
                .from('kb_documents')
                .update(updates)
                .eq('id', docId)
                .select()
                .single()
                .then(function(res) {
                    return res.error ? null : res.data;
                });
        },

        /**
         * 软删除 KB 文档
         * @param {string} docId - 文档 ID
         * @returns {Promise<boolean>}
         */
        softDelete: function(docId) {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(false);

            return client
                .from('kb_documents')
                .update({ is_deleted: true })
                .eq('id', docId)
                .then(function(res) {
                    return !res.error;
                });
        },

        /**
         * 获取 KB 统计数据
         * @returns {Promise<object>}
         */
        getStats: function() {
            var client = NestopiaDB.getClient();
            if (!client) return Promise.resolve(null);

            return client
                .from('v_kb_stats')
                .select('*')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .then(function(res) {
                    return res.error ? null : res.data;
                });
        }
    };

    // ── 高级操作（组合 Storage + DB） ─────────────────────────

    var Operations = {

        /**
         * 完整的项目文件上传流程：
         *   1. 上传文件到 Supabase Storage
         *   2. 写入元数据到 kb_documents 表
         *   3. 如果 Supabase 不可用，回退到 localStorage
         *
         * @param {string} projectId - 项目 ID
         * @param {File} file - 文件对象
         * @param {object} options - 可选参数 { category, description, tags }
         * @returns {Promise<object>} - 上传后的文件记录
         */
        uploadProjectFile: function(projectId, file, options) {
            options = options || {};
            var category = options.category || detectCategory(file);
            var tenantId = NestopiaDB.getTenantId();

            // 文件大小检查
            if (file.size > NestopiaDB.config.maxFileSize) {
                return Promise.reject(new Error(
                    'File too large: ' + NestopiaDB.formatFileSize(file.size) +
                    ' (max ' + NestopiaDB.formatFileSize(NestopiaDB.config.maxFileSize) + ')'
                ));
            }

            // 如果 Supabase 未连接，使用 localStorage
            if (!NestopiaDB.isConnected()) {
                return new Promise(function(resolve) {
                    var isImg = file.type.startsWith('image/');

                    // 大文件（>5MB）仅存元数据
                    if (file.size > 5 * 1024 * 1024) {
                        var record = LocalStorage.saveFile(projectId, {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            category: category,
                            thumbnailUrl: null,
                            url: null,
                            note: options.description || 'Pending cloud storage (Phase 2)'
                        });
                        resolve(record);
                        return;
                    }

                    // 小文件读取 base64 存入 localStorage
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var record = LocalStorage.saveFile(projectId, {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            category: category,
                            thumbnailUrl: isImg ? e.target.result : null,
                            url: e.target.result,
                            note: options.description || ''
                        });
                        resolve(record);
                    };
                    reader.onerror = function() {
                        var record = LocalStorage.saveFile(projectId, {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            category: category,
                            thumbnailUrl: null,
                            url: null,
                            note: 'Read error — metadata only'
                        });
                        resolve(record);
                    };
                    reader.readAsDataURL(file);
                });
            }

            // ── Supabase 上传路径 ──
            var bucket = NestopiaDB.getBucket('projectFiles');
            var storagePath = buildStoragePath(tenantId, projectId, category, file.name);

            return SupabaseStorage.uploadFile(bucket, storagePath, file)
                .then(function(uploadRes) {
                    if (uploadRes.error) throw uploadRes.error;

                    // 获取公开 URL
                    var publicUrl = SupabaseStorage.getFileUrl(bucket, storagePath, false);

                    // 验证 projectId 是否为合法 UUID（UI 可能传入如 'OMY-001' 等非 UUID）
                    var uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    var dbProjectId = uuidRegex.test(projectId) ? projectId : null;
                    var dbScope = dbProjectId ? 'project' : 'tenant';

                    // 写入元数据到 kb_documents
                    return KBDocuments.insert({
                        tenant_id: tenantId,
                        scope: dbScope,
                        project_id: dbProjectId,
                        category: category,
                        name: file.name,
                        description: options.description || (dbProjectId ? null : ('Project: ' + projectId)),
                        file_url: publicUrl,
                        file_type: getFileExtension(file.name),
                        file_size_bytes: file.size,
                        mime_type: file.type,
                        storage_path: storagePath,
                        status: 'uploaded',
                        tags: options.tags || [],
                        uploaded_by: null  // Phase 2+: 接入 Auth 后填充
                    });
                })
                .then(function(dbRecord) {
                    if (!dbRecord) throw new Error('Metadata save failed');

                    // 同步到 localStorage 作为缓存
                    LocalStorage.saveFile(projectId, {
                        id: dbRecord.id,
                        name: dbRecord.name,
                        type: dbRecord.mime_type,
                        size: dbRecord.file_size_bytes,
                        category: dbRecord.category,
                        thumbnailUrl: null,
                        url: dbRecord.file_url,
                        storageMode: 'supabase',
                        storagePath: dbRecord.storage_path
                    });

                    return {
                        id: dbRecord.id,
                        name: dbRecord.name,
                        type: dbRecord.mime_type,
                        size: dbRecord.file_size_bytes,
                        category: dbRecord.category,
                        url: dbRecord.file_url,
                        status: 'uploaded',
                        storageMode: 'supabase',
                        uploadedAt: dbRecord.created_at
                    };
                })
                .catch(function(err) {
                    console.error('[NestopiaStorage] Supabase 上传失败，回退 localStorage:', err.message);
                    // 回退到 localStorage
                    return new Promise(function(resolve) {
                        var isImg = file.type.startsWith('image/');
                        if (file.size > 5 * 1024 * 1024) {
                            resolve(LocalStorage.saveFile(projectId, {
                                name: file.name, type: file.type, size: file.size,
                                category: category, thumbnailUrl: null, url: null,
                                note: 'Cloud upload failed: ' + err.message
                            }));
                            return;
                        }
                        var reader = new FileReader();
                        reader.onload = function(e) {
                            resolve(LocalStorage.saveFile(projectId, {
                                name: file.name, type: file.type, size: file.size,
                                category: category,
                                thumbnailUrl: isImg ? e.target.result : null,
                                url: e.target.result,
                                note: 'Cloud upload failed, saved locally'
                            }));
                        };
                        reader.readAsDataURL(file);
                    });
                });
        },

        /**
         * 上传租户级 KB 文件
         * @param {File} file - 文件对象
         * @param {object} options - { productLine, category, description, tags, aiAgents }
         * @returns {Promise<object>}
         */
        uploadTenantFile: function(file, options) {
            options = options || {};
            var tenantId = NestopiaDB.getTenantId();

            if (!NestopiaDB.isConnected()) {
                return Promise.reject(new Error('Tenant file upload requires Supabase connection'));
            }

            if (file.size > NestopiaDB.config.maxFileSize) {
                return Promise.reject(new Error(
                    'File too large: ' + NestopiaDB.formatFileSize(file.size) +
                    ' (max ' + NestopiaDB.formatFileSize(NestopiaDB.config.maxFileSize) + ')'
                ));
            }

            var bucket = NestopiaDB.getBucket('tenantFiles');
            var category = options.category || detectCategory(file);
            var productLine = options.productLine || 'general';
            var storagePath = buildStoragePath(tenantId, null, productLine + '/' + category, file.name);

            return SupabaseStorage.uploadFile(bucket, storagePath, file)
                .then(function(uploadRes) {
                    if (uploadRes.error) throw uploadRes.error;

                    var publicUrl = SupabaseStorage.getFileUrl(bucket, storagePath, false);

                    return KBDocuments.insert({
                        tenant_id: tenantId,
                        scope: 'tenant',
                        project_id: null,
                        product_line: productLine,
                        category: category,
                        name: file.name,
                        description: options.description || null,
                        file_url: publicUrl,
                        file_type: getFileExtension(file.name),
                        file_size_bytes: file.size,
                        mime_type: file.type,
                        storage_path: storagePath,
                        status: 'uploaded',
                        ai_agents: options.aiAgents || [],
                        tags: options.tags || [],
                        uploaded_by: null
                    });
                });
        },

        /**
         * 删除项目文件（Storage + DB + localStorage）
         * @param {string} projectId - 项目 ID
         * @param {string} fileId - 文件 ID
         * @param {string} storagePath - Storage 路径（可选）
         * @returns {Promise<boolean>}
         */
        removeProjectFile: function(projectId, fileId, storagePath) {
            // 始终从 localStorage 删除
            LocalStorage.removeFile(projectId, fileId);

            if (!NestopiaDB.isConnected()) {
                return Promise.resolve(true);
            }

            // 从 Supabase DB 软删除
            var dbPromise = KBDocuments.softDelete(fileId);

            // 如果有 Storage 路径，同时删除文件
            var storagePromise = storagePath
                ? SupabaseStorage.deleteFiles(
                      NestopiaDB.getBucket('projectFiles'),
                      [storagePath]
                  )
                : Promise.resolve({ data: null, error: null });

            return Promise.all([dbPromise, storagePromise])
                .then(function(results) {
                    return results[0]; // DB 删除结果
                })
                .catch(function(err) {
                    console.warn('[NestopiaStorage] 删除部分失败:', err.message);
                    return true; // localStorage 已删除，不阻塞 UI
                });
        },

        /**
         * 获取项目文件列表（优先 Supabase，回退 localStorage）
         * @param {string} projectId - 项目 ID
         * @returns {Promise<Array>}
         */
        getProjectFiles: function(projectId) {
            return KBDocuments.getProjectFiles(projectId);
        },

        /**
         * 同步 localStorage 缓存（从 Supabase 拉取最新数据）
         * @param {string} projectId - 项目 ID
         * @returns {Promise<Array>}
         */
        syncProjectFiles: function(projectId) {
            if (!NestopiaDB.isConnected()) {
                return Promise.resolve(LocalStorage.getFiles(projectId));
            }

            return KBDocuments.getProjectFiles(projectId)
                .then(function(files) {
                    // 用 Supabase 数据覆盖 localStorage 缓存
                    localStorage.setItem(LS_PREFIX + projectId, JSON.stringify(files));
                    return files;
                });
        }
    };

    // ── 公开 API ──────────────────────────────────────────────

    window.NestopiaStorage = {
        // 底层操作
        local: LocalStorage,
        storage: SupabaseStorage,
        documents: KBDocuments,

        // 高级操作（推荐使用）
        uploadProjectFile: Operations.uploadProjectFile.bind(Operations),
        uploadTenantFile: Operations.uploadTenantFile.bind(Operations),
        removeProjectFile: Operations.removeProjectFile.bind(Operations),
        getProjectFiles: Operations.getProjectFiles.bind(Operations),
        syncProjectFiles: Operations.syncProjectFiles.bind(Operations),

        // 工具函数
        detectCategory: detectCategory,
        getFileExtension: getFileExtension,
        formatFileSize: NestopiaDB.formatFileSize
    };

})();
