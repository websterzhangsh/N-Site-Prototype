/**
 * step-progress.js — ZB Workflow 自动推进引擎
 * 命名空间: Nestopia.utils.stepProgress
 *
 * 当各 step 的完成条件满足时，自动推进 workflowStep。
 * 完成条件:
 *   Step 1 → 2: measurementComplete === true (方法+量尺员+日期+openings+opening_1 尺寸)
 *   Step 2 → 3: 至少保存了 1 个报价单 (savedQuotations.length > 0)
 *   Step 3 → 4: verificationComplete === true (所有 opening 验证完 + 验证人+日期)
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.utils = N.utils || {};

    // ── 检查 Step 1 (Measurement) 是否完成 ──
    function isStep1Complete(projectId) {
        var step3 = N.steps && N.steps.step3;
        if (!step3 || !step3.getState) return false;
        var state = step3.getState(projectId);
        return state && state.measurementComplete === true;
    }

    // ── 检查 Step 2 (Quotation) 是否完成 ──
    function isStep2Complete(projectId) {
        // 检查是否有已保存的报价单
        if (typeof getAllSavedQuotations === 'function') {
            var list = getAllSavedQuotations(projectId);
            return list && list.length > 0;
        }
        // 备选：检查 localStorage
        try {
            var key = 'nestopia_quot_' + projectId;
            var data = localStorage.getItem(key);
            if (data) {
                var parsed = JSON.parse(data);
                return Array.isArray(parsed) && parsed.length > 0;
            }
        } catch(e) {}
        return false;
    }

    // ── 检查 Step 3 (Verification) 是否完成 ──
    function isStep3Complete(projectId) {
        var zbV = N.steps && N.steps.zbVerification;
        if (!zbV || !zbV.getVerificationState) return false;
        var state = zbV.getVerificationState(projectId);
        return state && state.verificationComplete === true;
    }

    // ── 核心：检查并自动推进 ──
    function checkAndAdvance(projectId) {
        // 1) 在 allProjectsData 中找到项目
        var project = null;
        if (typeof allProjectsData !== 'undefined' && Array.isArray(allProjectsData)) {
            project = allProjectsData.find(function(p) { return p.id === projectId; });
        }
        if (!project) {
            console.log('[StepProgress] Project not found in allProjectsData:', projectId);
            return false;
        }

        // 只处理 Zip Blinds 项目
        if (project.type !== 'Zip Blinds') return false;

        var currentStep = project.workflowStep || 1;
        var shouldAdvanceTo = null;

        // Step 1 → 2: 量尺完成
        if (currentStep === 1 && isStep1Complete(projectId)) {
            shouldAdvanceTo = 2;
        }
        // Step 2 → 3: 报价生成
        else if (currentStep === 2 && isStep2Complete(projectId)) {
            shouldAdvanceTo = 3;
        }
        // Step 3 → 4: 验证完成（Step 4 = Order & Install, 目前是 placeholder）
        else if (currentStep === 3 && isStep3Complete(projectId)) {
            shouldAdvanceTo = 4;
        }

        if (!shouldAdvanceTo) return false;

        var ZB_STEP_NAMES = { 1: 'Measurement', 2: 'Quotation', 3: 'Verification', 4: 'Order & Install' };
        console.log('[StepProgress] Auto-advancing project', projectId,
            'from Step', currentStep, '(' + ZB_STEP_NAMES[currentStep] + ')',
            'to Step', shouldAdvanceTo, '(' + ZB_STEP_NAMES[shouldAdvanceTo] + ')');

        // 2) 更新 allProjectsData 中的 project
        project.workflowStep = shouldAdvanceTo;

        // 3) 同步到 workflowProjects（如果存在）
        var wfMod = N.modules && N.modules.workflow;
        if (wfMod && wfMod.workflowProjects) {
            var wfProj = wfMod.workflowProjects.find(function(p) { return p.id === projectId; });
            if (wfProj) {
                wfProj.workflowStep = shouldAdvanceTo;
            }
        }

        // 4) 保存到 Supabase
        if (wfMod && typeof wfMod.saveWorkflowToDB === 'function') {
            wfMod.saveWorkflowToDB(projectId).then(function(ok) {
                if (ok) {
                    console.log('[StepProgress] Workflow step saved to Supabase:', shouldAdvanceTo);
                }
            });
        }

        // 5) 刷新 UI: 工作流进度条
        if (typeof renderProjectWorkflow === 'function') {
            renderProjectWorkflow(project);
        }
        // 刷新 Workflow Pipeline（Service Workflow 页面的 pipeline 视图）
        if (wfMod && typeof wfMod.renderWorkflowPipeline === 'function') {
            wfMod.renderWorkflowPipeline();
        }

        // 6) Toast 通知
        if (typeof showToast === 'function') {
            showToast(
                'Step ' + currentStep + ' completed — advanced to Step ' + shouldAdvanceTo + ': ' + ZB_STEP_NAMES[shouldAdvanceTo],
                'success'
            );
        }

        return true;
    }

    // ── 注册 ──
    N.utils.stepProgress = {
        isStep1Complete: isStep1Complete,
        isStep2Complete: isStep2Complete,
        isStep3Complete: isStep3Complete,
        checkAndAdvance: checkAndAdvance
    };

    window.checkAndAdvanceZBStep = checkAndAdvance;

    console.log('[Nestopia] step-progress.js loaded');
})();
