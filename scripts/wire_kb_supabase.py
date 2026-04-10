#!/usr/bin/env python3
"""
将 KB 页面从 dummy data 模式连接到 Supabase 后端。
修改 company-operations.html 中的 5 个函数。
"""
import re, sys

FILE = 'company-operations.html'
with open(FILE, 'r') as f:
    content = f.read()

changes = []

# ═══════════════════════════════════════════════════════
# 1. renderKBDocuments: 从 kbState.documents 读取
# ═══════════════════════════════════════════════════════
old1 = "            let docs = [...kbDummyDocuments];"
new1 = "            let docs = [...kbState.documents];"
if old1 in content:
    content = content.replace(old1, new1, 1)
    changes.append("1. renderKBDocuments: kbDummyDocuments → kbState.documents")
else:
    print("ERROR: 找不到 renderKBDocuments 中的 kbDummyDocuments 引用")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 2. initKnowledgeBase: 加载 Supabase 数据 + dummy 回退
# ═══════════════════════════════════════════════════════
old2 = """        function initKnowledgeBase() {
            renderKBDocuments();
        }"""
new2 = """        function initKnowledgeBase() {
            // 尝试从 Supabase 加载租户级 KB 文档
            if (typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                NestopiaStorage.documents.getTenantFiles().then(function(rows) {
                    if (rows && rows.length > 0) {
                        kbState.documents = rows.map(function(row) {
                            // 映射 DB 字段到 UI 字段
                            var ext = (row.file_type || '').toLowerCase();
                            var type = 'pdf';
                            if (['doc','docx','pptx'].indexOf(ext) >= 0) type = 'doc';
                            if (['xls','xlsx','csv'].indexOf(ext) >= 0) type = 'xls';
                            if (['jpg','jpeg','png','webp','gif'].indexOf(ext) >= 0) type = 'img';
                            if (['mp4','mov'].indexOf(ext) >= 0) type = 'video';
                            return {
                                id: row.id,
                                name: row.name,
                                category: row.category || 'installation',
                                size: row.file_size_bytes || 0,
                                type: type,
                                status: row.status === 'uploaded' ? 'indexed' : (row.status || 'processing'),
                                agents: row.ai_agents || [],
                                tags: row.tags || [],
                                uploaded: (row.created_at || '').substring(0, 10),
                                description: row.description || '',
                                file_url: row.file_url,
                                storage_path: row.storage_path
                            };
                        });
                        // 更新统计
                        var total = kbState.documents.length;
                        var indexed = kbState.documents.filter(function(d){ return d.status === 'indexed'; }).length;
                        var processing = kbState.documents.filter(function(d){ return d.status === 'processing'; }).length;
                        var cats = new Set(kbState.documents.map(function(d){ return d.category; }));
                        var el;
                        el = document.getElementById('kbTotalDocs'); if (el) el.textContent = total;
                        el = document.getElementById('kbProcessed'); if (el) el.textContent = indexed;
                        el = document.getElementById('kbPending'); if (el) el.textContent = processing;
                        el = document.getElementById('kbCategories'); if (el) el.textContent = cats.size;
                        console.log('[KB] Loaded ' + total + ' documents from Supabase');
                    } else {
                        console.log('[KB] No Supabase docs, using demo data');
                        kbState.documents = [...kbDummyDocuments];
                    }
                    renderKBDocuments();
                }).catch(function(err) {
                    console.warn('[KB] Supabase load failed, using demo data:', err.message);
                    kbState.documents = [...kbDummyDocuments];
                    renderKBDocuments();
                });
            } else {
                console.log('[KB] Supabase not connected, using demo data');
                kbState.documents = [...kbDummyDocuments];
                renderKBDocuments();
            }
        }"""
if old2 in content:
    content = content.replace(old2, new2, 1)
    changes.append("2. initKnowledgeBase: 加载 Supabase 数据 + dummy 回退")
else:
    print("ERROR: 找不到 initKnowledgeBase 函数")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 3. submitKBUpload: 调用 NestopiaStorage.uploadTenantFile
# ═══════════════════════════════════════════════════════
old3 = """        function submitKBUpload() {
            const category = document.getElementById('kbUploadCategory').value;
            if (!category) { showToast('Please select a category', 'error'); return; }
            if (kbState.selectedFiles.length === 0) { showToast('Please select files to upload', 'error'); return; }

            const agents = Array.from(document.querySelectorAll('.kb-agent-check:checked')).map(c => c.value);
            const desc = document.getElementById('kbUploadDesc').value;

            // Simulate upload
            showToast(`Uploading ${kbState.selectedFiles.length} file(s)... Processing will begin automatically.`, 'success');
            closeKBUploadModal();

            // Add to dummy data
            kbState.selectedFiles.forEach(f => {
                const ext = f.name.split('.').pop().toLowerCase();
                let type = 'pdf';
                if (['doc', 'docx', 'pptx'].includes(ext)) type = 'doc';
                if (['xls', 'xlsx', 'csv'].includes(ext)) type = 'xls';
                if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) type = 'img';
                if (['mp4', 'mov'].includes(ext)) type = 'video';

                kbDummyDocuments.unshift({
                    id: 'kb-new-' + Date.now() + Math.random().toString(36).substr(2, 5),
                    name: f.name,
                    category: category,
                    size: f.size,
                    type: type,
                    status: 'processing',
                    agents: agents,
                    tags: [...kbState.uploadTags],
                    uploaded: new Date().toISOString().split('T')[0],
                    description: desc
                });
            });

            renderKBDocuments();
        }"""
new3 = """        function submitKBUpload() {
            const category = document.getElementById('kbUploadCategory').value;
            if (!category) { showToast('Please select a category', 'error'); return; }
            if (kbState.selectedFiles.length === 0) { showToast('Please select files to upload', 'error'); return; }

            const agents = Array.from(document.querySelectorAll('.kb-agent-check:checked')).map(c => c.value);
            const desc = document.getElementById('kbUploadDesc').value;
            const tags = [...kbState.uploadTags];
            const files = [...kbState.selectedFiles];

            showToast('Uploading ' + files.length + ' file(s)...', 'success');
            closeKBUploadModal();

            // 如果 Supabase 已连接，上传到云端
            if (typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                var uploadPromises = files.map(function(f) {
                    return NestopiaStorage.uploadTenantFile(f, {
                        category: category,
                        description: desc,
                        tags: tags,
                        aiAgents: agents,
                        productLine: 'general'
                    });
                });
                Promise.all(uploadPromises).then(function(results) {
                    var successCount = results.filter(function(r){ return r !== null; }).length;
                    showToast(successCount + ' file(s) uploaded to cloud successfully!', 'success');
                    // 重新加载 KB 数据
                    initKnowledgeBase();
                }).catch(function(err) {
                    showToast('Upload error: ' + err.message, 'error');
                    console.error('[KB] Upload failed:', err);
                });
            } else {
                // 回退到内存模式
                files.forEach(function(f) {
                    var ext = f.name.split('.').pop().toLowerCase();
                    var type = 'pdf';
                    if (['doc', 'docx', 'pptx'].indexOf(ext) >= 0) type = 'doc';
                    if (['xls', 'xlsx', 'csv'].indexOf(ext) >= 0) type = 'xls';
                    if (['jpg', 'jpeg', 'png', 'webp'].indexOf(ext) >= 0) type = 'img';
                    if (['mp4', 'mov'].indexOf(ext) >= 0) type = 'video';
                    kbState.documents.unshift({
                        id: 'kb-new-' + Date.now() + Math.random().toString(36).substr(2, 5),
                        name: f.name, category: category, size: f.size, type: type,
                        status: 'processing', agents: agents, tags: tags,
                        uploaded: new Date().toISOString().split('T')[0], description: desc
                    });
                });
                renderKBDocuments();
            }
        }"""
if old3 in content:
    content = content.replace(old3, new3, 1)
    changes.append("3. submitKBUpload: 连接 NestopiaStorage.uploadTenantFile")
else:
    print("ERROR: 找不到 submitKBUpload 函数")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 4. viewKBDoc: 打开文件 URL 或显示详情
# ═══════════════════════════════════════════════════════
old4 = """        function viewKBDoc(id) {
            const doc = kbDummyDocuments.find(d => d.id === id);
            if (doc) {
                alert(`Document: ${doc.name}\\n\\nCategory: ${kbCategoryMeta[doc.category].label}\\nSize: ${formatFileSize(doc.size)}\\nStatus: ${doc.status}\\nTags: ${doc.tags.join(', ')}\\nAgents: ${doc.agents.map(a => kbAgentMeta[a].label).join(', ')}\\n\\nDescription: ${doc.description || 'No description'}\\n\\n(Full document viewer will be implemented with backend integration)`);
            }
        }"""
new4 = """        function viewKBDoc(id) {
            const doc = kbState.documents.find(d => d.id === id);
            if (!doc) return;
            // 如果有 file_url 且是 Supabase 文件，获取签名 URL 并打开
            if (doc.storage_path && typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                var bucket = NestopiaDB.getBucket('tenantFiles');
                NestopiaStorage.storage.getFileUrl(bucket, doc.storage_path, true).then(function(url) {
                    if (url) { window.open(url, '_blank'); }
                    else { showToast('Could not generate file URL', 'error'); }
                }).catch(function(err) {
                    showToast('Error: ' + err.message, 'error');
                });
            } else if (doc.file_url) {
                window.open(doc.file_url, '_blank');
            } else {
                var cat = kbCategoryMeta[doc.category] || { label: doc.category };
                var agentLabels = (doc.agents || []).map(function(a){ return (kbAgentMeta[a] || {}).label || a; }).join(', ');
                alert('Document: ' + doc.name + '\\n\\nCategory: ' + cat.label + '\\nSize: ' + formatFileSize(doc.size) + '\\nStatus: ' + doc.status + '\\nTags: ' + (doc.tags || []).join(', ') + '\\nAgents: ' + agentLabels + '\\n\\nDescription: ' + (doc.description || 'No description'));
            }
        }"""
if old4 in content:
    content = content.replace(old4, new4, 1)
    changes.append("4. viewKBDoc: 支持打开 Supabase 签名 URL")
else:
    print("ERROR: 找不到 viewKBDoc 函数")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 5. deleteKBDoc: 调用 Supabase 软删除
# ═══════════════════════════════════════════════════════
old5 = """        function deleteKBDoc(id) {
            if (confirm('Are you sure you want to remove this document from the Knowledge Base?')) {
                const idx = kbDummyDocuments.findIndex(d => d.id === id);
                if (idx !== -1) {
                    kbDummyDocuments.splice(idx, 1);
                    renderKBDocuments();
                    showToast('Document removed from Knowledge Base', 'success');
                }
            }
        }"""
new5 = """        function deleteKBDoc(id) {
            if (!confirm('Are you sure you want to remove this document from the Knowledge Base?')) return;
            var doc = kbState.documents.find(function(d){ return d.id === id; });
            // 从 UI 列表中移除
            kbState.documents = kbState.documents.filter(function(d){ return d.id !== id; });
            renderKBDocuments();
            // 如果是 Supabase 文档，执行云端软删除
            if (doc && doc.storage_path && typeof NestopiaStorage !== 'undefined' && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                NestopiaStorage.documents.softDelete(id).then(function(ok) {
                    showToast(ok ? 'Document removed from Knowledge Base' : 'Removed locally (cloud sync pending)', ok ? 'success' : 'warning');
                }).catch(function(err) {
                    showToast('Removed locally. Cloud error: ' + err.message, 'warning');
                });
            } else {
                showToast('Document removed from Knowledge Base', 'success');
            }
        }"""
if old5 in content:
    content = content.replace(old5, new5, 1)
    changes.append("5. deleteKBDoc: 支持 Supabase 软删除")
else:
    print("ERROR: 找不到 deleteKBDoc 函数")
    sys.exit(1)

# 写回文件
with open(FILE, 'w') as f:
    f.write(content)

print(f"✅ 成功修改 {len(changes)} 处:")
for c in changes:
    print(f"   {c}")
