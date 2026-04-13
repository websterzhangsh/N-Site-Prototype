#!/usr/bin/env python3
"""修复 Intake Form 进度条硬编码 5/8 的 bug。
根因：getProjectStepStatus() 对 Step 1 返回硬编码 questionnaireCompleted: 5，
不读取实际 _modules 完成状态。

修复：
1. 在函数顶部添加动态计算 _modules 完成数的逻辑
2. 将 Step 1 的 questionnaireCompleted: 5 替换为动态值
"""
import sys

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ── Fix 1: 在 deliverableTotal 之后添加动态问卷完成数计算 ──
old_1 = "const deliverableTotal = config ? config.keyDeliverables.length : 3;"
new_1 = """const deliverableTotal = config ? config.keyDeliverables.length : 3;

            // 动态计算问卷完成模块数（取代硬编码值）
            var _mData = getIntakeData(project.id);
            var _qDynamic = 0;
            if (_mData && _mData._modules) {
                Object.keys(_mData._modules).forEach(function(k) {
                    if (_mData._modules[k] === 'completed') _qDynamic++;
                });
            }"""

count_1 = content.count(old_1)
if count_1 != 1:
    print(f"[FAIL] Fix 1: Expected 1 match, found {count_1}")
    sys.exit(1)
content = content.replace(old_1, new_1)
print("[OK] Fix 1: Added dynamic _qDynamic computation")

# ── Fix 2: 替换 Step 1 当前步骤的硬编码 questionnaireCompleted: 5 ──
old_2 = "if (stepNum === 1) return { actionsCompleted: 3, actionTotal, deliverablesCompleted: 0, deliverableTotal, questionnaireCompleted: 5, questionnaireTotal: 8, paymentStatus: 'pending' };"
new_2 = "if (stepNum === 1) return { actionsCompleted: 3, actionTotal, deliverablesCompleted: 0, deliverableTotal, questionnaireCompleted: _qDynamic, questionnaireTotal: 8, paymentStatus: 'pending' };"

count_2 = content.count(old_2)
if count_2 != 1:
    print(f"[FAIL] Fix 2: Expected 1 match, found {count_2}")
    sys.exit(1)
content = content.replace(old_2, new_2)
print("[OK] Fix 2: Replaced questionnaireCompleted: 5 → _qDynamic")

if content == original:
    print("[SKIP] No changes needed")
    sys.exit(0)

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n[DONE] 2 modifications applied to {FILE}")
