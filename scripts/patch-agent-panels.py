#!/usr/bin/env python3
"""
在 Compliance Agent 和 Knowledge Base 页面添加静态摘要面板。
Changes:
1. Compliance Agent 页面 Output 区顶部 → Compliance Pre-Check 面板
2. Knowledge Base 页面 Stats 和 Category Tabs 之间 → KB Quick Reference 面板
3. 在 renderKBQuickRefHTML 之后添加两个 JS 渲染函数
"""
import sys

filepath = 'company-operations.html'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

original = content
changes = 0

# ============================================================
# Change 1: Compliance Pre-Check panel in Compliance Agent page
# Insert before "<!-- Compliance Status Overview -->"
# ============================================================
MARKER1 = '                            <!-- Compliance Status Overview -->'

PANEL1 = '''                            <!-- Compliance Pre-Check Summary (动态: 从当前项目 Step 3 状态拉取) -->
                            <div id="compliancePreCheckPanel" class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
                                    <div class="flex items-center justify-between">
                                        <h3 class="font-semibold text-gray-900"><i class="fas fa-shield-alt text-amber-600 mr-2"></i>Compliance Pre-Check</h3>
                                        <span id="compliancePreCheckBadge" class="text-xs font-medium text-gray-500"></span>
                                    </div>
                                </div>
                                <div id="compliancePreCheckItems" class="p-5">
                                    <div class="text-sm text-gray-400 text-center py-3"><i class="fas fa-info-circle mr-1"></i>Select a project to view compliance pre-check</div>
                                </div>
                            </div>

'''

idx1 = content.find(MARKER1)
if idx1 >= 0:
    content = content[:idx1] + PANEL1 + content[idx1:]
    changes += 1
    sys.stderr.write('[1] OK - Compliance Pre-Check panel inserted\n')
else:
    sys.stderr.write('[1] SKIP - marker not found\n')

# ============================================================
# Change 2: KB Quick Reference panel in Knowledge Base page
# Insert before "<!-- Category Filter Tabs -->"
# ============================================================
MARKER2 = '                        <!-- Category Filter Tabs -->'

PANEL2 = '''                        <!-- KB Quick Reference Summary (动态: 根据工作流阶段推荐相关文档) -->
                        <div id="kbQuickRefPanel" class="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                            <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                                <div class="flex items-center justify-between">
                                    <h3 class="font-semibold text-gray-900"><i class="fas fa-book-reader text-purple-600 mr-2"></i>KB Quick Reference</h3>
                                    <span id="kbQuickRefBadge" class="text-xs font-medium text-purple-500"></span>
                                </div>
                            </div>
                            <div id="kbQuickRefItems" class="p-4">
                                <div class="text-sm text-gray-400 text-center py-3"><i class="fas fa-info-circle mr-1"></i>Loading recommendations...</div>
                            </div>
                        </div>

'''

idx2 = content.find(MARKER2)
if idx2 >= 0:
    content = content[:idx2] + PANEL2 + content[idx2:]
    changes += 1
    sys.stderr.write('[2] OK - KB Quick Reference panel inserted\n')
else:
    sys.stderr.write('[2] SKIP - marker not found\n')

# ============================================================
# Change 3: Add JS rendering functions after renderKBQuickRefHTML
# Find the closing "}" of renderKBQuickRefHTML function
# ============================================================
MARKER3 = "                + '</div>';\n        }\n\n        // Render project file gallery"

JS_FUNCTIONS = """                + '</div>';
        }

        // ===== Compliance Pre-Check 面板渲染（Compliance Agent 页面） =====
        function renderCompliancePreCheckPanel() {
            var container = document.getElementById('compliancePreCheckItems');
            var badge = document.getElementById('compliancePreCheckBadge');
            if (!container) return;

            var projectId = typeof currentSelectedProjectId !== 'undefined' ? currentSelectedProjectId : null;
            if (!projectId || typeof getStep3State !== 'function') {
                container.innerHTML = '<div class="text-sm text-gray-400 text-center py-3"><i class="fas fa-info-circle mr-1"></i>Select a project to view compliance pre-check</div>';
                if (badge) badge.textContent = '';
                return;
            }

            var state = getStep3State(projectId);
            if (!state || !state.complianceChecks || !state.complianceChecks.length) {
                container.innerHTML = '<div class="text-sm text-gray-400 text-center py-3"><i class="fas fa-info-circle mr-1"></i>No compliance data for this project</div>';
                if (badge) badge.textContent = '';
                return;
            }

            var checks = state.complianceChecks;
            var passed = checks.filter(function(c) { return c.status === 'pass'; }).length;
            var total = checks.length;

            var project = (typeof allProjectsData !== 'undefined') ? allProjectsData.find(function(p) { return p.id === projectId; }) : null;
            var projectName = project ? (project.name || project.client) : projectId;

            if (badge) {
                badge.className = 'text-xs font-medium ' + (passed === total ? 'text-green-600' : 'text-amber-600');
                badge.textContent = projectName + ' \\u2014 ' + passed + '/' + total + ' Passed';
            }

            var html = '<div class="space-y-2">';
            checks.forEach(function(c) {
                var iconCls = c.status === 'pass' ? 'fa-check-circle text-green-500' : c.status === 'warn' ? 'fa-exclamation-triangle text-amber-500' : c.status === 'fail' ? 'fa-times-circle text-red-500' : 'fa-circle text-gray-300';
                var statusCls = c.status === 'pass' ? 'text-green-600' : c.status === 'warn' ? 'text-amber-600' : c.status === 'fail' ? 'text-red-600' : 'text-gray-400';
                var detail = c.detail || (c.status === 'pass' ? 'OK' : c.status === 'warn' ? 'Review' : c.status === 'fail' ? 'Fail' : 'Pending');
                var bgCls = c.status === 'pass' ? 'bg-green-50/50' : c.status === 'warn' ? 'bg-amber-50/50' : c.status === 'fail' ? 'bg-red-50/50' : 'bg-gray-50';
                html += '<div class="flex items-center gap-3 py-2 px-3 rounded-lg ' + bgCls + '">'
                    + '<i class="fas ' + iconCls + '"></i>'
                    + '<span class="text-sm text-gray-700 flex-1">' + c.label + '</span>'
                    + '<span class="text-xs font-medium ' + statusCls + '">' + detail + '</span>'
                    + '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }

        // ===== KB Quick Reference 面板渲染（Knowledge Base 页面） =====
        function renderKBQuickRefPanel() {
            var container = document.getElementById('kbQuickRefItems');
            var badge = document.getElementById('kbQuickRefBadge');
            if (!container) return;

            if (typeof getKBRecommendations !== 'function') {
                container.innerHTML = '<div class="text-sm text-gray-400 text-center py-3">KB not available</div>';
                return;
            }

            var projectId = typeof currentSelectedProjectId !== 'undefined' ? currentSelectedProjectId : null;
            var project = (typeof allProjectsData !== 'undefined' && projectId) ? allProjectsData.find(function(p) { return p.id === projectId; }) : null;
            var context = (project && project.workflowStep >= 4) ? 'quotation' : 'measurement';
            var docs = getKBRecommendations(context);

            if (!docs || !docs.length) {
                container.innerHTML = '<div class="text-sm text-gray-400 text-center py-3">No recommendations for current context</div>';
                if (badge) badge.textContent = '';
                return;
            }

            var contextLabel = context === 'measurement' ? 'Measurement Guides' : 'Pricing & Sales';
            if (badge) badge.textContent = contextLabel + ' \\u2014 ' + docs.length + ' docs';

            var html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-2">';
            docs.forEach(function(d) {
                var isVid = d.type === 'video';
                var bgBox = isVid ? 'bg-indigo-50' : 'bg-red-50';
                html += '<div class="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer transition border border-gray-100" onclick="previewKBDocument(\\'' + d.id + '\\')">'
                    + '<div class="w-9 h-9 rounded-lg flex items-center justify-center ' + bgBox + '"><i class="fas ' + d.icon + ' ' + d.color + '"></i></div>'
                    + '<div class="flex-1 min-w-0">'
                    + '<div class="text-xs font-medium text-gray-700 truncate">' + d.title + '</div>'
                    + '<div class="text-[10px] text-gray-400">' + (isVid ? d.duration + ' \\u00b7 ' : '') + d.size + '</div>'
                    + '</div>'
                    + (isVid ? '<i class="fas fa-play-circle text-indigo-400"></i>' : '<i class="fas fa-external-link-alt text-gray-300 text-[10px]"></i>')
                    + '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }

        // Render project file gallery"""

idx3 = content.find(MARKER3)
if idx3 >= 0:
    content = content[:idx3] + JS_FUNCTIONS + content[idx3 + len(MARKER3):]
    changes += 1
    sys.stderr.write('[3] OK - JS rendering functions added\n')
else:
    sys.stderr.write('[3] SKIP - marker not found\n')

# ============================================================
# Write
# ============================================================
if changes > 0:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    sys.stderr.write('\nDone: %d changes, %d -> %d bytes\n' % (changes, len(original), len(content)))
else:
    sys.stderr.write('\nNo changes made.\n')
