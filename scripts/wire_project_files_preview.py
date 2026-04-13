#!/usr/bin/env python3
"""
wire_project_files_preview.py
修复项目文件缩略图（Private Bucket → Signed URL）+ 添加点击预览 Lightbox

修改清单（5 处）:
1. 添加 getProjectFileSignedUrl() 辅助函数
2. 改造 syncProjectFilesFromCloud() 为 async，生成签名 URL 后再缓存
3. 照片 HTML 模板添加 onclick → previewProjectFile()
4. 视频/文档 HTML 模板添加 onclick → previewProjectFile()
5. 添加 previewProjectFile() Lightbox 函数
6. 上传成功后也生成签名 URL 缓存
"""

import sys, os

FILE = os.path.join(os.path.dirname(__file__), '..', 'company-operations.html')

def read_file():
    with open(FILE, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(content):
    with open(FILE, 'w', encoding='utf-8') as f:
        f.write(content)

def safe_replace(src, old, new, label, count=1):
    if old not in src:
        print(f"  ✗ 找不到锚点: {label}")
        sys.exit(1)
    result = src.replace(old, new, count)
    print(f"  ✓ {label}")
    return result

# ──────────────────────────────────────────────
content = read_file()
print(f"读入 {len(content)} 字符")

# ===== 1. 在 syncProjectFilesFromCloud 前，添加 getProjectFileSignedUrl helper =====
ANCHOR1 = """        // 从 Supabase 同步文件列表到 localStorage 缓存（页面加载时调用）
        function syncProjectFilesFromCloud(projectId) {"""

NEW1 = """        // 生成项目文件的签名 URL（Private Bucket 需要签名才能访问）
        async function getProjectFileSignedUrl(storagePath) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return null;
            try {
                var client = NestopiaDB.getClient();
                if (!client || !client.storage) return null;
                var bucket = NestopiaDB.getBucket('projectFiles');
                var res = await client.storage.from(bucket).createSignedUrl(storagePath, 3600);
                return (res.data && res.data.signedUrl) ? res.data.signedUrl : null;
            } catch(e) { return null; }
        }

        // 从 Supabase 同步文件列表到 localStorage 缓存（页面加载时调用）
        async function syncProjectFilesFromCloud(projectId) {"""

content = safe_replace(content, ANCHOR1, NEW1, "Mod1: 添加 getProjectFileSignedUrl + async syncProjectFilesFromCloud")

# ===== 2. 改造 syncProjectFilesFromCloud 内部逻辑：生成签名 URL 后再缓存 =====
OLD_SYNC_BODY = """            if (typeof NestopiaStorage === 'undefined' || !NestopiaDB.isConnected()) return;
            NestopiaStorage.getProjectFiles(projectId)
                .then(function(files) {
                    if (files && files.length) {
                        localStorage.setItem('nestopia_pf_' + projectId, JSON.stringify(files));
                        refreshProjectFilesPanel(projectId);
                    }
                })
                .catch(function() { /* 静默失败，使用本地缓存 */ });"""

NEW_SYNC_BODY = """            if (typeof NestopiaStorage === 'undefined' || !NestopiaDB.isConnected()) return;
            try {
                var files = await NestopiaStorage.getProjectFiles(projectId);
                if (files && files.length) {
                    // 为 Supabase 文件生成签名 URL（Private Bucket 必须用签名 URL）
                    for (var i = 0; i < files.length; i++) {
                        var f = files[i];
                        if (f.storagePath && f.storageMode === 'supabase') {
                            var signedUrl = await getProjectFileSignedUrl(f.storagePath);
                            if (signedUrl) {
                                f.url = signedUrl;
                                if (f.category === 'site-photos') f.thumbnailUrl = signedUrl;
                            }
                        }
                    }
                    localStorage.setItem('nestopia_pf_' + projectId, JSON.stringify(files));
                    refreshProjectFilesPanel(projectId);
                }
            } catch(e) { /* 静默失败，使用本地缓存 */ }"""

content = safe_replace(content, OLD_SYNC_BODY, NEW_SYNC_BODY, "Mod2: syncProjectFilesFromCloud → async + 签名 URL")

# ===== 3. 照片 HTML 模板添加 onclick 预览 =====
OLD_PHOTO_HTML = """                    html += '<div class="relative group">'
                        + '<div class="w-full h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">'
                        + (p.thumbnailUrl ? '<img src="' + p.thumbnailUrl + '" class="w-full h-full object-cover">'
                            : (p.url ? '<img src="' + p.url + '" class="w-full h-full object-cover">'
                            : '<i class="fas fa-image text-gray-300 text-lg"></i>'))
                        + '</div>'
                        + '<div class="text-[8px] text-gray-500 truncate mt-0.5">' + p.name + '</div>'
                        + (sizeLabel ? '<div class="text-[7px] text-gray-300">' + sizeLabel + '</div>' : '')"""

NEW_PHOTO_HTML = """                    var imgUrl = p.thumbnailUrl || p.url || '';
                    html += '<div class="relative group cursor-pointer" onclick="previewProjectFile(\\'' + encodeURIComponent(imgUrl) + '\\', \\'' + encodeURIComponent(p.name) + '\\', \\'' + (p.type || 'image') + '\\', \\'' + (p.storagePath || '') + '\\')">'
                        + '<div class="w-full h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-blue-400 transition">'
                        + (imgUrl ? '<img src="' + imgUrl + '" class="w-full h-full object-cover">'
                            : '<i class="fas fa-image text-gray-300 text-lg"></i>')
                        + '</div>'
                        + '<div class="text-[8px] text-gray-500 truncate mt-0.5">' + p.name + '</div>'
                        + (sizeLabel ? '<div class="text-[7px] text-gray-300">' + sizeLabel + '</div>' : '')"""

content = safe_replace(content, OLD_PHOTO_HTML, NEW_PHOTO_HTML, "Mod3: 照片 HTML 添加 onclick 预览")

# ===== 4. 视频和文档 HTML 添加 onclick 预览 =====
# 视频
OLD_VIDEO_HTML = """                    html += '<div class="flex items-center gap-2 py-1 px-2 bg-indigo-50/50 rounded-lg mb-1">'
                        + '<i class="fas fa-video text-indigo-400 text-xs"></i>'
                        + '<span class="text-[10px] text-gray-700 flex-1 truncate">' + v.name + '</span>'"""

NEW_VIDEO_HTML = """                    var vidUrl = v.url || '';
                    html += '<div class="flex items-center gap-2 py-1 px-2 bg-indigo-50/50 rounded-lg mb-1 cursor-pointer hover:bg-indigo-100/50 transition" onclick="previewProjectFile(\\'' + encodeURIComponent(vidUrl) + '\\', \\'' + encodeURIComponent(v.name) + '\\', \\'' + (v.type || 'video') + '\\', \\'' + (v.storagePath || '') + '\\')">'
                        + '<i class="fas fa-video text-indigo-400 text-xs"></i>'
                        + '<span class="text-[10px] text-gray-700 flex-1 truncate">' + v.name + '</span>'"""

content = safe_replace(content, OLD_VIDEO_HTML, NEW_VIDEO_HTML, "Mod4a: 视频 HTML 添加 onclick 预览")

# 文档
OLD_DOC_HTML = """                    html += '<div class="flex items-center gap-2 py-1 px-2 bg-gray-50/50 rounded-lg mb-1">'
                        + '<i class="fas fa-file-pdf text-red-400 text-xs"></i>'
                        + '<span class="text-[10px] text-gray-700 flex-1 truncate">' + d.name + '</span>'"""

NEW_DOC_HTML = """                    var docUrl = d.url || '';
                    html += '<div class="flex items-center gap-2 py-1 px-2 bg-gray-50/50 rounded-lg mb-1 cursor-pointer hover:bg-gray-100/50 transition" onclick="previewProjectFile(\\'' + encodeURIComponent(docUrl) + '\\', \\'' + encodeURIComponent(d.name) + '\\', \\'' + (d.type || 'application/pdf') + '\\', \\'' + (d.storagePath || '') + '\\')">'
                        + '<i class="fas fa-file-pdf text-red-400 text-xs"></i>'
                        + '<span class="text-[10px] text-gray-700 flex-1 truncate">' + d.name + '</span>'"""

content = safe_replace(content, OLD_DOC_HTML, NEW_DOC_HTML, "Mod4b: 文档 HTML 添加 onclick 预览")

# ===== 5. 添加 previewProjectFile() Lightbox 函数 =====
ANCHOR5 = """        function refreshProjectFilesPanel(projectId) {"""

LIGHTBOX = """        // 项目文件预览 Lightbox — 支持图片/视频/文档
        async function previewProjectFile(encodedUrl, encodedName, mimeType, storagePath) {
            var url = decodeURIComponent(encodedUrl);
            var name = decodeURIComponent(encodedName);

            // 如果 URL 为空但有 storagePath，尝试生成签名 URL
            if (!url && storagePath) {
                url = await getProjectFileSignedUrl(storagePath);
            }
            // 如果 URL 过期或无效，尝试重新生成
            if (storagePath && url && url.includes('token=')) {
                var freshUrl = await getProjectFileSignedUrl(storagePath);
                if (freshUrl) url = freshUrl;
            }
            if (!url) {
                showToast('File URL not available. Try refreshing the page.', 'error');
                return;
            }

            var existing = document.getElementById('projectFilePreview');
            if (existing) existing.remove();

            var isImage = mimeType && (mimeType.startsWith('image') || /\\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(name));
            var isVideo = mimeType && (mimeType.startsWith('video') || /\\.(mp4|mov|webm|avi)$/i.test(name));
            var isPdf = mimeType && (mimeType.includes('pdf') || /\\.pdf$/i.test(name));

            var contentHTML = '';
            if (isImage) {
                contentHTML = '<img src="' + url + '" class="max-w-full max-h-[75vh] rounded-lg shadow-lg object-contain" alt="' + name + '">';
            } else if (isVideo) {
                contentHTML = '<video src="' + url + '" controls autoplay class="max-w-full max-h-[75vh] rounded-lg shadow-lg" style="min-width:320px"></video>';
            } else if (isPdf) {
                contentHTML = '<iframe src="' + url + '" class="w-full rounded-lg shadow-lg" style="height:75vh;min-width:600px" frameborder="0"></iframe>';
            } else {
                contentHTML = '<div class="bg-white rounded-xl p-8 text-center shadow-lg">'
                    + '<i class="fas fa-file text-gray-300 text-5xl mb-3"></i>'
                    + '<div class="text-sm font-medium text-gray-700">' + name + '</div>'
                    + '<a href="' + url + '" target="_blank" download class="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">'
                    + '<i class="fas fa-download"></i> Download File</a></div>';
            }

            var overlay = document.createElement('div');
            overlay.id = 'projectFilePreview';
            overlay.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[400] flex flex-col items-center justify-center p-4';
            overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
            overlay.innerHTML = '<div class="flex items-center gap-3 mb-3" onclick="event.stopPropagation()">'
                + '<div class="text-white/90 text-sm font-medium truncate max-w-md">' + name + '</div>'
                + '<a href="' + url + '" target="_blank" download class="text-white/60 hover:text-white transition" title="Download"><i class="fas fa-download"></i></a>'
                + '<a href="' + url + '" target="_blank" class="text-white/60 hover:text-white transition" title="Open in new tab"><i class="fas fa-external-link-alt"></i></a>'
                + '<button onclick="document.getElementById(\'projectFilePreview\').remove()" class="text-white/60 hover:text-white transition ml-2" title="Close"><i class="fas fa-times text-lg"></i></button>'
                + '</div>'
                + '<div onclick="event.stopPropagation()">' + contentHTML + '</div>';
            document.body.appendChild(overlay);
        }

        """ + "function refreshProjectFilesPanel(projectId) {"

content = safe_replace(content, ANCHOR5, LIGHTBOX, "Mod5: 添加 previewProjectFile Lightbox")

# ===== 6. 上传成功后也生成签名 URL =====
OLD_UPLOAD_SUCCESS = """                    NestopiaStorage.uploadProjectFile(projectId, file)
                        .then(function(record) {
                            // 上传成功，record 已自动写入 localStorage 缓存
                            refreshProjectFilesPanel(projectId);
                        })"""

NEW_UPLOAD_SUCCESS = """                    NestopiaStorage.uploadProjectFile(projectId, file)
                        .then(async function(record) {
                            // 上传成功 — 生成签名 URL 更新缓存
                            if (record && record.storagePath) {
                                var signedUrl = await getProjectFileSignedUrl(record.storagePath);
                                if (signedUrl) {
                                    var cached = getProjectFiles(projectId);
                                    var found = cached.find(function(f) { return f.id === record.id; });
                                    if (found) {
                                        found.url = signedUrl;
                                        found.thumbnailUrl = signedUrl;
                                        localStorage.setItem('nestopia_pf_' + projectId, JSON.stringify(cached));
                                    }
                                }
                            }
                            refreshProjectFilesPanel(projectId);
                        })"""

content = safe_replace(content, OLD_UPLOAD_SUCCESS, NEW_UPLOAD_SUCCESS, "Mod6: 上传成功后生成签名 URL")

# ===== 写回 =====
write_file(content)
print(f"\n全部 6 处修改完成 ✅  ({len(content)} 字符)")
