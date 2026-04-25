/**
 * Nestopia - Inch ↔ mm 单位转换工具
 * 命名空间: Nestopia.utils.unitConverter
 *
 * 功能:
 * - 全局单位模式状态 (inch / mm)
 * - 双向转换: inch ↔ mm
 * - DOM 批量刷新: 切换时更新所有 width/height 输入框的值和标签
 * - 存储始终为 inch，显示层做转换
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.utils = N.utils || {};

    // ── 常量 ──────────────────────────────────────────────────
    var INCH_TO_MM = 25.4;
    var MM_TO_INCH = 1 / 25.4;  // 0.0393700787…

    // ── 全局单位状态 ──────────────────────────────────────────
    var _unitMode = 'inch'; // 'inch' | 'mm'

    function getUnitMode() { return _unitMode; }

    /**
     * 设置单位模式并刷新所有已打开的面板
     * @param {'inch'|'mm'} mode
     */
    function setUnitMode(mode) {
        if (mode !== 'inch' && mode !== 'mm') return;
        if (mode === _unitMode) return;
        _unitMode = mode;
        console.log('[UnitConverter] Mode switched to:', mode);
    }

    // ── 核心转换函数 ─────────────────────────────────────────

    /** inch → mm（四舍五入到 1 位小数） */
    function inchToMM(inch) {
        var num = parseFloat(inch);
        if (isNaN(num)) return '';
        return (num * INCH_TO_MM).toFixed(1);
    }

    /** mm → inch（四舍五入到 3 位小数） */
    function mmToInch(mm) {
        var num = parseFloat(mm);
        if (isNaN(num)) return '';
        return (num * MM_TO_INCH).toFixed(3);
    }

    /**
     * 将内部存储值（inch）转为当前模式的显示值
     * @param {string|number} inchValue - 存储的 inch 值
     * @returns {string} 当前模式下的显示值
     */
    function toDisplay(inchValue) {
        if (inchValue === '' || inchValue === null || inchValue === undefined) return '';
        if (_unitMode === 'mm') return inchToMM(inchValue);
        // inch 模式 — 保留原始精度（去除多余尾零）
        var num = parseFloat(inchValue);
        return isNaN(num) ? '' : String(num);
    }

    /**
     * 将用户输入值（当前模式）转为 inch 存储值
     * @param {string|number} inputValue - 用户输入的值
     * @returns {string} 转换后的 inch 值
     */
    function toInch(inputValue) {
        if (inputValue === '' || inputValue === null || inputValue === undefined) return '';
        if (_unitMode === 'mm') return mmToInch(inputValue);
        var num = parseFloat(inputValue);
        return isNaN(num) ? '' : String(num);
    }

    /**
     * 获取当前单位的标签文本
     * @returns {string} 'inches' | 'mm'
     */
    function unitLabel() {
        return _unitMode === 'mm' ? 'mm' : 'inches';
    }

    /**
     * 获取当前单位的短标签
     * @returns {string} 'in' | 'mm'
     */
    function unitShort() {
        return _unitMode === 'mm' ? 'mm' : 'in';
    }

    /**
     * 获取当前单位的 placeholder
     * @param {string} fieldKey - 字段 key（如 'width_in' 或 'height_in'）
     * @returns {string} placeholder 文本
     */
    function unitPlaceholder(fieldKey) {
        if (_unitMode === 'mm') {
            return fieldKey.indexOf('width') >= 0 ? 'e.g. 1829' : 'e.g. 2438';
        }
        return fieldKey.indexOf('width') >= 0 ? 'e.g. 72' : 'e.g. 96';
    }

    // ── DOM 批量刷新 ─────────────────────────────────────────

    /**
     * 刷新 Measurement 面板中所有 width/height 输入框的值和标签
     * 仅转换已有值，不改变存储
     */
    function refreshMeasurementPanel(projectId) {
        var state = window.getStep3State ? window.getStep3State(projectId) : null;
        if (!state) return;

        var numOpenings = parseInt(state.measurementData['openings'] || '1') || 1;
        for (var oi = 1; oi <= numOpenings; oi++) {
            ['width_in', 'height_in'].forEach(function(suffix) {
                var perKey = 'opening_' + oi + '_' + suffix;
                var el = document.getElementById('step3_' + perKey + '_' + projectId);
                if (!el) return;
                // 取存储的 inch 值
                var storedInch = state.measurementData[perKey];
                if (storedInch !== undefined && storedInch !== '') {
                    el.value = toDisplay(storedInch);
                }
                // 更新 placeholder
                el.placeholder = unitPlaceholder(suffix);
            });
        }

        // 更新标签文本
        _refreshDimensionLabels(projectId, 'step3');
    }

    /**
     * 刷新 Verification 面板中的值和标签
     * Initial 列显示跟随单位，Verified 输入跟随单位，Delta 保持 inch
     */
    function refreshVerificationPanel(projectId) {
        var verState = window.getZBVerificationState ? window.getZBVerificationState(projectId) : null;
        if (!verState) return;

        var numOpenings = parseInt(verState.initialData.openings || '1') || 1;
        for (var oi = 1; oi <= numOpenings; oi++) {
            ['width_in', 'height_in'].forEach(function(suffix) {
                var perKey = 'opening_' + oi + '_' + suffix;

                // Verified 输入框
                var verEl = document.getElementById('zv_' + perKey + '_' + projectId);
                if (verEl) {
                    var storedVerified = verState.verifiedData[perKey];
                    if (storedVerified !== undefined && storedVerified !== '') {
                        verEl.value = toDisplay(storedVerified);
                    }
                    verEl.placeholder = unitPlaceholder(suffix);
                }

                // Initial 列（纯文本显示）
                var initEl = document.getElementById('vinit_' + perKey + '_' + projectId);
                if (initEl) {
                    var storedInitial = verState.initialData[perKey];
                    if (storedInitial !== undefined && storedInitial !== '') {
                        initEl.textContent = toDisplay(storedInitial) + ' ' + unitShort();
                    }
                }
            });
        }

        // 更新标签文本
        _refreshDimensionLabels(projectId, 'verif');
    }

    /**
     * 更新所有 dimension 标签文本（Width/Height label 后缀）
     */
    function _refreshDimensionLabels(projectId, context) {
        var suffix = _unitMode === 'mm' ? '(mm)' : '(inches)';
        // 查找所有包含 "Width" 或 "Height" 的标签
        var labels = document.querySelectorAll('[data-unit-label]');
        labels.forEach(function(lbl) {
            var base = lbl.getAttribute('data-unit-label');
            if (base) {
                lbl.textContent = base + ' (' + unitLabel() + ')';
            }
        });
    }

    /**
     * 切换单位并刷新所有已打开的面板
     * @param {string} projectId
     */
    function toggleUnit(projectId) {
        var newMode = _unitMode === 'inch' ? 'mm' : 'inch';
        setUnitMode(newMode);

        // 刷新 Measurement 面板输入框
        refreshMeasurementPanel(projectId);

        // ★ 使用 rebuildVerificationContent 同时刷新 Initial Summary（始终可见）
        //   和 Per-Opening 比较表（如已展开）；若不可用则回退旧逻辑
        if (N.steps && N.steps.zbVerification && N.steps.zbVerification.rebuildVerificationContent) {
            N.steps.zbVerification.rebuildVerificationContent(projectId);
        } else {
            refreshVerificationPanel(projectId);
        }

        // ★ 同步刷新 Installation Summary（如已打开 Step 3）
        if (window.updateInstallationSummary) {
            window.updateInstallationSummary(projectId);
        }

        // 更新切换按钮 UI
        _updateToggleButtons(projectId);
    }

    /**
     * 更新切换按钮的激活状态
     */
    function _updateToggleButtons(projectId) {
        // Measurement 面板的切换按钮
        var mInBtn = document.getElementById('unitBtnInch_meas_' + projectId);
        var mMmBtn = document.getElementById('unitBtnMM_meas_' + projectId);
        if (mInBtn && mMmBtn) {
            _setTogglePair(mInBtn, mMmBtn, _unitMode);
        }

        // Verification 面板的切换按钮
        var vInBtn = document.getElementById('unitBtnInch_verif_' + projectId);
        var vMmBtn = document.getElementById('unitBtnMM_verif_' + projectId);
        if (vInBtn && vMmBtn) {
            _setTogglePair(vInBtn, vMmBtn, _unitMode);
        }
    }

    function _setTogglePair(inchBtn, mmBtn, mode) {
        if (mode === 'inch') {
            inchBtn.classList.add('bg-purple-600', 'text-white', 'shadow-sm');
            inchBtn.classList.remove('text-gray-500', 'hover:text-gray-700');
            mmBtn.classList.remove('bg-purple-600', 'text-white', 'shadow-sm');
            mmBtn.classList.add('text-gray-500', 'hover:text-gray-700');
        } else {
            mmBtn.classList.add('bg-purple-600', 'text-white', 'shadow-sm');
            mmBtn.classList.remove('text-gray-500', 'hover:text-gray-700');
            inchBtn.classList.remove('bg-purple-600', 'text-white', 'shadow-sm');
            inchBtn.classList.add('text-gray-500', 'hover:text-gray-700');
        }
    }

    // ── 命名空间导出 ──────────────────────────────────────────
    N.utils.unitConverter = {
        getUnitMode: getUnitMode,
        setUnitMode: setUnitMode,
        inchToMM: inchToMM,
        mmToInch: mmToInch,
        toDisplay: toDisplay,
        toInch: toInch,
        unitLabel: unitLabel,
        unitShort: unitShort,
        unitPlaceholder: unitPlaceholder,
        refreshMeasurementPanel: refreshMeasurementPanel,
        refreshVerificationPanel: refreshVerificationPanel,
        toggleUnit: toggleUnit,
        INCH_TO_MM: INCH_TO_MM,
        MM_TO_INCH: MM_TO_INCH
    };

    // ── 全局别名 ─────────────────────────────────────────────
    window.unitConverter = N.utils.unitConverter;
    window.toggleZBUnit = function(projectId) { toggleUnit(projectId); };

})();
