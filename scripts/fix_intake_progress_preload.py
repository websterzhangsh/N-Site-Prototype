#!/usr/bin/env python3
"""
Fix: selectProject() 预加载 intake DB 数据，确保进度条反映真实完成状态。

根因：硬编码种子数据只有 A.1 completed, 但 DB 中全部 8 模块已完成。
     DB 数据仅在 openIntakeModule() 时懒加载，selectProject() 不加载，
     导致进度条永远显示种子数据的 1/8。

方案：在 selectProject() 中 syncProjectFilesFromCloud() 之后异步预加载
     intake DB 数据，加载完成后若有展开的 step detail 则刷新进度条。
"""
import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 定位插入点 ──
# 在 syncProjectFilesFromCloud(projectId); 之后、// Risk List 之前插入
anchor = '            syncProjectFilesFromCloud(projectId);\n\n            // Risk List'

if anchor not in content:
    print('ERROR: anchor not found')
    sys.exit(1)

new_block = '''            syncProjectFilesFromCloud(projectId);

            // 预加载 Intake 表单数据（确保进度条反映 DB 中的真实完成状态，而非硬编码种子数据）
            if (!_intakeDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                _intakeDbLoaded[projectId] = true;
                loadIntakeFromDB(projectId).then(function(dbData) {
                    if (dbData && typeof dbData === 'object') {
                        var local = getIntakeData(projectId);
                        Object.keys(dbData).forEach(function(k) {
                            if (k === '_uploadedFiles') return;
                            local[k] = dbData[k];
                        });
                        if (dbData._uploadedFiles && typeof dbData._uploadedFiles === 'object') {
                            var localFiles = getUploadedFiles(projectId);
                            Object.keys(dbData._uploadedFiles).forEach(function(fk) {
                                if (!localFiles[fk] || localFiles[fk].length === 0) {
                                    localFiles[fk] = dbData._uploadedFiles[fk];
                                }
                            });
                        }
                        // 如果当前有展开的 Step Detail，重新渲染以刷新进度条
                        if (expandedStep && currentDetailProject && currentDetailProject.id === projectId) {
                            toggleStepDetail(expandedStep, currentDetailProject);
                            toggleStepDetail(expandedStep, currentDetailProject);
                        }
                    }
                });
            }

            // Risk List'''

content = content.replace(anchor, new_block, 1)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print('OK: selectProject() intake DB preload injected')
