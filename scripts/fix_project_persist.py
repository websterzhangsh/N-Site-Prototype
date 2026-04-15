#!/usr/bin/env python3
"""
修复 Project 持久化问题：
- 新建 Project 后写入 Supabase projects 表
- 页面加载时从 Supabase 读取用户创建的 projects 并合并到 allProjectsData
"""
import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ── Change 1: 在 submitCreateProject() 中添加 DB 持久化调用 ──
old1 = '''            allProjectsData.unshift(newProject);
            renderProjectList();
            closeCreateProjectModal();'''

new1 = '''            allProjectsData.unshift(newProject);
            persistProjectToDB(newProject);
            renderProjectList();
            closeCreateProjectModal();'''

assert content.count(old1) == 1, f"Change 1: expected 1 match, found {content.count(old1)}"
content = content.replace(old1, new1)
print("✅ Change 1: Added persistProjectToDB() call in submitCreateProject()")

# ── Change 2: 在 submitCreateProject() 后插入 persistProjectToDB 函数 ──
old2 = '''            // Auto-select the new project
            setTimeout(() => selectProject(projectId), 150);
        }

        // ===== Projects Page: Master-Detail ====='''

new2 = '''            // Auto-select the new project
            setTimeout(() => selectProject(projectId), 150);
        }

        // ── Supabase Project 持久化 ──────────────────────────
        function persistProjectToDB(project) {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) {
                console.warn('[Project] Supabase not connected — project not persisted to DB');
                return;
            }
            var tenantId = NestopiaDB.getTenantId();
            var payload = {
                tenant_id: tenantId,
                project_number: project.id,
                title: project.name,
                client_name: project.customer,
                client_email: project.customerEmail || null,
                client_phone: project.customerPhone || null,
                client_address: (project.customerAddress && project.customerAddress !== 'TBD') ? project.customerAddress : null,
                status: project.stage === 'intent' ? 'pending' : 'in_progress',
                project_type: 'residential',
                project_subtype: project.type,
                workflow_step: project.workflowStep || 1,
                budget_range: project.budget ? String(project.budget) : null,
                preferred_timeline: project.timeline || null,
                is_deleted: false,
                created_by: 'e20592c6-57da-464a-aecf-0d9c65b36a42',
                product_config: {
                    product_type: project.type,
                    stage: project.stage,
                    riskLevel: project.riskLevel,
                    budget: project.budget,
                    paid: project.paid,
                    timeline: project.timeline,
                    startDate: project.startDate,
                    risks: project.risks,
                    issues: project.issues,
                    order: project.order,
                    _step1: project._step1
                }
            };
            NestopiaDB.getClient()
                .from('projects')
                .insert(payload)
                .then(function(res) {
                    if (res.error) {
                        console.error('[Project] DB save error:', res.error.message);
                    } else {
                        console.log('[Project] ✅ Saved to DB:', project.id);
                    }
                })
                .catch(function(err) {
                    console.error('[Project] DB save failed:', err.message);
                });
        }

        function loadProjectsFromDB() {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return;
            if (_projectsDbLoaded) return;
            _projectsDbLoaded = true;
            var tenantId = NestopiaDB.getTenantId();
            NestopiaDB.getClient()
                .from('projects')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .then(function(res) {
                    if (res.error) {
                        console.warn('[Project] DB load error:', res.error.message);
                        _projectsDbLoaded = false;
                        return;
                    }
                    var rows = res.data || [];
                    // Build lookup of existing in-memory project IDs
                    var existingIds = {};
                    allProjectsData.forEach(function(p) { existingIds[p.id] = true; });
                    var added = 0;
                    rows.forEach(function(row) {
                        // Skip if this project_number already exists in memory (hardcoded demo data)
                        if (existingIds[row.project_number]) return;
                        var cfg = row.product_config || {};
                        var project = {
                            id: row.project_number,
                            name: row.title || 'Untitled',
                            customer: row.client_name || 'Unknown',
                            customerEmail: row.client_email || '',
                            customerPhone: row.client_phone || '',
                            customerAddress: row.client_address || 'TBD',
                            type: cfg.product_type || row.project_subtype || 'Sunroom',
                            workflowStep: row.workflow_step || 1,
                            stage: cfg.stage || 'intent',
                            riskLevel: cfg.riskLevel || 'low',
                            budget: cfg.budget || parseInt(String(row.budget_range || '0').replace(/[^0-9]/g, '')) || 0,
                            paid: cfg.paid || 0,
                            timeline: row.preferred_timeline || cfg.timeline || '',
                            startDate: cfg.startDate || (row.created_at ? row.created_at.split('T')[0] : ''),
                            risks: cfg.risks || [],
                            issues: cfg.issues || [],
                            order: cfg.order || null,
                            _step1: cfg._step1 || {
                                checklist: { initial_communication: false, intake_questionnaire: false, hoa_precheck: false, intent_fee_collected: false, client_signoff: false },
                                questionnaire: { status: 'not_started', modules: { a1: false, a2: false, a3: false, a4: false, a5: false, a6: false, a7: false, a8: false } },
                                payments: { intent_fee: { amount: 100, status: 'pending', date: null } },
                                documents: [],
                                notes: ''
                            },
                            _fromDB: true
                        };
                        allProjectsData.unshift(project);
                        existingIds[row.project_number] = true;
                        added++;
                    });
                    if (added > 0) {
                        console.log('[Project] ✅ Loaded ' + added + ' project(s) from DB');
                        renderProjectList();
                    }
                })
                .catch(function(err) {
                    console.warn('[Project] DB load failed:', err.message);
                    _projectsDbLoaded = false;
                });
        }

        // ===== Projects Page: Master-Detail ====='''

assert content.count(old2) == 1, f"Change 2: expected 1 match, found {content.count(old2)}"
content = content.replace(old2, new2)
print("✅ Change 2: Added persistProjectToDB() + loadProjectsFromDB() functions")

# ── Change 3: 在 allProjectsData 后添加 _projectsDbLoaded 标志 ──
old3 = '''        let allProjectsData = tenantProjectsMap[getCurrentTenantSlug()] || greenscapeProjects;

        let currentProjectFilter = 'all';'''

new3 = '''        let allProjectsData = tenantProjectsMap[getCurrentTenantSlug()] || greenscapeProjects;
        var _projectsDbLoaded = false;

        let currentProjectFilter = 'all';'''

assert content.count(old3) == 1, f"Change 3: expected 1 match, found {content.count(old3)}"
content = content.replace(old3, new3)
print("✅ Change 3: Added _projectsDbLoaded flag")

# ── Change 4: 在 DOMContentLoaded 中调用 loadProjectsFromDB() ──
old4 = '''                // v1.2.0: Initialize sidebar project list
                renderSidebarProjects();
            }
        });'''

new4 = '''                // v1.2.0: Initialize sidebar project list
                renderSidebarProjects();
                // v1.3.0: Load user-created projects from Supabase
                loadProjectsFromDB();
            }
        });'''

assert content.count(old4) == 1, f"Change 4: expected 1 match, found {content.count(old4)}"
content = content.replace(old4, new4)
print("✅ Change 4: Added loadProjectsFromDB() call in DOMContentLoaded")

# ── 写入文件 ──
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n🎉 All 4 changes applied successfully!")
print(f"   File size: {len(content):,} chars (was {len(original):,})")
