/**
 * Nestopia - Zip Blinds Measurement Verification
 * 命名空间: Nestopia.steps.zbVerification
 *
 * 处理 ZB Step 3 (Verification) 的状态管理：
 * - 加载 Step 1 的初始测量数据（只读快照）
 * - 存储独立的验证测量数据
 * - 计算并显示 initial vs verified 差异 (delta)
 * - 持久化到 Supabase（同一 project_measurements 行）
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.steps = N.steps || {};

    var zbVerificationState = {};
    var _verificationDbLoaded = {};

    // Tolerance thresholds (in inches) — aligned with OMEYA SOP > 3mm flagging
    var TOLERANCE_OK   = 0.12;   // ~3mm — within spec
    var TOLERANCE_WARN = 0.20;   // ~5mm — review recommended

    // ── 状态管理 ────────────────────────────────────────────

    /**
     * 获取 Step 1 的初始测量数据
     */
    function getInitialMeasurement(projectId) {
        var state = N.steps.step3.getStep3State(projectId);
        return state ? state.measurementData : {};
    }

    /**
     * 获取/初始化验证状态
     */
    function getVerificationState(projectId) {
        if (!zbVerificationState[projectId]) {
            var initial = getInitialMeasurement(projectId);
            zbVerificationState[projectId] = {
                initialData: JSON.parse(JSON.stringify(initial)), // 只读快照
                verifiedData: {},
                verificationComplete: false,
                verifierName: '',
                verificationDate: ''
            };
        }
        return zbVerificationState[projectId];
    }

    // ── 面板交互 ────────────────────────────────────────────

    /**
     * 切换验证面板展开/收起
     */
    function toggleVerificationPanel(projectId) {
        var panel = document.getElementById('zbVerifPanel_' + projectId);
        var btn = document.getElementById('zbVerifToggleBtn_' + projectId);
        if (!panel) return;

        // 首次打开 — 从 DB 加载验证数据
        if (!_verificationDbLoaded[projectId]) {
            _verificationDbLoaded[projectId] = true;
            loadVerificationFromDB(projectId);
        }

        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-times text-[10px]"></i> Close';
                btn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                btn.classList.add('bg-gray-600', 'hover:bg-gray-700');
            }
            // ★ 每次展开都从内存重新填充 DOM（修复 step re-render 后 delta 丢失）
            _populateVerificationDOM(projectId);
        } else {
            panel.classList.add('hidden');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-check-double text-[10px]"></i> Open Verification';
                btn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
                btn.classList.add('bg-purple-600', 'hover:bg-purple-700');
            }
        }
    }

    /**
     * 从内存状态重新填充验证面板 DOM
     * 解决 step HTML 被 toggleStepDetail 重新生成后，verified 字段值有但 delta 显示丢失的问题
     */
    function _populateVerificationDOM(projectId) {
        var state = getVerificationState(projectId);
        var uc = window.unitConverter;

        // 刷新 initialData（Step 1 数据可能在本次会话中从 DB 更新过）
        var latestInitial = getInitialMeasurement(projectId);
        state.initialData = JSON.parse(JSON.stringify(latestInitial));

        // 1. 回填 verified 字段值并重新计算每个 delta
        Object.keys(state.verifiedData).forEach(function(k) {
            var el = document.getElementById('zv_' + k + '_' + projectId);
            if (el) {
                // ★ 单位转换：width/height 的 verified 值显示当前单位
                var isDim = (k.indexOf('width_in') >= 0 || k.indexOf('height_in') >= 0);
                el.value = (isDim && uc) ? uc.toDisplay(state.verifiedData[k]) : state.verifiedData[k];
                if (isDim && uc) {
                    el.placeholder = uc.unitPlaceholder(k.indexOf('width') >= 0 ? 'width_in' : 'height_in');
                }
            }
            updateDeltaDisplay(projectId, k);
        });

        // 2. 回填 verifier 信息
        var nameEl = document.getElementById('zv_verifierName_' + projectId);
        if (nameEl && state.verifierName) nameEl.value = state.verifierName;
        var dateEl = document.getElementById('zv_verificationDate_' + projectId);
        if (dateEl && state.verificationDate) dateEl.value = state.verificationDate;

        // 3. ★ 刷新 Initial 列的单位显示
        if (uc) {
            var numOpenings = parseInt(state.initialData.openings || '1') || 1;
            for (var oi = 1; oi <= numOpenings; oi++) {
                ['width_in', 'height_in'].forEach(function(suffix) {
                    var perKey = 'opening_' + oi + '_' + suffix;
                    var initEl = document.getElementById('vinit_' + perKey + '_' + projectId);
                    if (initEl) {
                        var storedInitial = state.initialData[perKey];
                        if (storedInitial !== undefined && storedInitial !== '') {
                            initEl.textContent = uc.toDisplay(storedInitial) + ' ' + uc.unitShort();
                        }
                    }
                });
            }
        }

        // 4. 更新完成度和摘要
        checkVerificationComplete(projectId);
    }

    // ── 字段更新与 Delta 计算 ─────────────────────────────

    /**
     * 更新验证字段值
     */
    function updateVerificationField(projectId, key, value) {
        // 正数校验（width/height）
        if ((key.indexOf('width_in') >= 0 || key.indexOf('height_in') >= 0) && value !== '') {
            var num = parseFloat(value);
            if (isNaN(num) || num <= 0) {
                var inp = document.getElementById('zv_' + key + '_' + projectId);
                if (inp) inp.value = '';
                return;
            }
            // ★ 单位转换：如果当前是 mm 模式，将输入的 mm 转为 inch 存储
            if (window.unitConverter && window.unitConverter.getUnitMode() === 'mm') {
                value = window.unitConverter.toInch(value);
            }
        }

        var state = getVerificationState(projectId);
        if (key === '_verifierName') {
            state.verifierName = value;
        } else if (key === '_verificationDate') {
            state.verificationDate = value;
        } else {
            state.verifiedData[key] = value;
        }

        updateDeltaDisplay(projectId, key);
        checkVerificationComplete(projectId);
    }

    /**
     * 更新单个字段的 delta 显示
     */
    function updateDeltaDisplay(projectId, key) {
        if (key.startsWith('_')) return; // 跳过 meta 字段

        var state = getVerificationState(projectId);
        var deltaEl = document.getElementById('vdelta_' + key + '_' + projectId);
        if (!deltaEl) return;

        var initial = state.initialData[key];
        var verified = state.verifiedData[key];

        if (!verified || verified === '') {
            deltaEl.innerHTML = '<span class="text-gray-300 text-[10px]">\u2014</span>';
            return;
        }

        // 数值比较（width/height）
        if (key.indexOf('width_in') >= 0 || key.indexOf('height_in') >= 0) {
            var iNum = parseFloat(initial) || 0;
            var vNum = parseFloat(verified) || 0;
            var diff = vNum - iNum;
            var absDiff = Math.abs(diff);
            var sign = diff > 0 ? '+' : '';

            if (iNum === 0) {
                deltaEl.innerHTML = '<span class="text-blue-500 text-[10px] font-medium">New</span>';
            } else if (absDiff < 0.005) {
                deltaEl.innerHTML = '<span class="text-green-600 text-[10px] font-medium"><i class="fas fa-check-circle mr-0.5"></i>Match</span>';
            } else if (absDiff <= TOLERANCE_OK) {
                deltaEl.innerHTML = '<span class="text-green-600 text-[10px] font-medium">' + sign + diff.toFixed(2) + '&quot; <i class="fas fa-check-circle"></i></span>';
            } else if (absDiff <= TOLERANCE_WARN) {
                deltaEl.innerHTML = '<span class="text-amber-600 text-[10px] font-medium"><i class="fas fa-exclamation-triangle mr-0.5"></i>' + sign + diff.toFixed(2) + '&quot;</span>';
            } else {
                deltaEl.innerHTML = '<span class="text-red-600 text-[10px] font-medium"><i class="fas fa-times-circle mr-0.5"></i>' + sign + diff.toFixed(2) + '&quot;</span>';
            }
        } else {
            // Select 字段比较
            if (initial === verified) {
                deltaEl.innerHTML = '<span class="text-green-600 text-[10px] font-medium"><i class="fas fa-check-circle mr-0.5"></i>Same</span>';
            } else if (!initial) {
                deltaEl.innerHTML = '<span class="text-blue-500 text-[10px] font-medium">New</span>';
            } else {
                deltaEl.innerHTML = '<span class="text-amber-600 text-[10px] font-medium"><i class="fas fa-exchange-alt mr-0.5"></i>Changed</span>';
            }
        }
    }

    // ── 完成度检查 ──────────────────────────────────────────

    /**
     * 检查验证是否完成（所有 opening 的 width + height 已验证 + verifier info）
     */
    function checkVerificationComplete(projectId) {
        var state = getVerificationState(projectId);
        var vd = state.verifiedData;
        var numOpenings = parseInt(state.initialData.openings || '1') || 1;

        var complete = true;
        for (var i = 1; i <= numOpenings; i++) {
            if (!vd['opening_' + i + '_width_in'] || !vd['opening_' + i + '_height_in']) {
                complete = false;
                break;
            }
        }

        state.verificationComplete = complete && Boolean(state.verifierName && state.verificationDate);

        // 更新 Save 按钮状态
        var btn = document.getElementById('zbVerifySaveBtn_' + projectId);
        if (btn) {
            if (state.verificationComplete) {
                btn.disabled = false;
                btn.classList.remove('opacity-40', 'cursor-not-allowed');
            } else {
                btn.disabled = true;
                btn.classList.add('opacity-40', 'cursor-not-allowed');
            }
        }

        updateVerificationSummary(projectId);
    }

    /**
     * 更新验证摘要面板
     */
    function updateVerificationSummary(projectId) {
        var state = getVerificationState(projectId);
        var numOpenings = parseInt(state.initialData.openings || '1') || 1;
        var verifiedCount = 0;
        var discrepancyCount = 0;

        for (var i = 1; i <= numOpenings; i++) {
            var wKey = 'opening_' + i + '_width_in';
            var hKey = 'opening_' + i + '_height_in';
            var hasW = Boolean(state.verifiedData[wKey]);
            var hasH = Boolean(state.verifiedData[hKey]);
            if (hasW && hasH) verifiedCount++;

            // 检查数值字段差异
            [wKey, hKey].forEach(function(k) {
                if (state.verifiedData[k] && state.initialData[k]) {
                    var diff = Math.abs(parseFloat(state.verifiedData[k]) - parseFloat(state.initialData[k]));
                    if (diff > TOLERANCE_OK) discrepancyCount++;
                }
            });

            // 检查选择字段差异
            ['mounting', 'motor', 'fabric_sku', 'fabric_openness', 'fabric_color', 'frame_color'].forEach(function(f) {
                var sk = 'opening_' + i + '_' + f;
                if (state.verifiedData[sk] && state.initialData[sk] && state.verifiedData[sk] !== state.initialData[sk]) {
                    discrepancyCount++;
                }
            });
        }

        var summaryEl = document.getElementById('zbVerifSummary_' + projectId);
        if (!summaryEl) return;

        var statusCls = discrepancyCount === 0 ? 'text-green-600' : 'text-amber-600';
        var statusIcon = discrepancyCount === 0 ? 'fa-check-circle text-green-500' : 'fa-exclamation-triangle text-amber-500';

        summaryEl.innerHTML =
            '<div class="flex items-center justify-between text-[10px] py-1">' +
                '<span class="text-gray-500">Openings Verified</span>' +
                '<span class="font-medium text-gray-700">' + verifiedCount + ' / ' + numOpenings + '</span>' +
            '</div>' +
            '<div class="flex items-center justify-between text-[10px] py-1">' +
                '<span class="text-gray-500">Discrepancies Found</span>' +
                '<span class="font-medium ' + statusCls + '"><i class="fas ' + statusIcon + ' mr-1"></i>' + discrepancyCount + '</span>' +
            '</div>' +
            '<div class="flex items-center justify-between text-[10px] py-1">' +
                '<span class="text-gray-500">Status</span>' +
                '<span class="font-medium ' + (state.verificationComplete ? 'text-green-600' : 'text-gray-400') + '">' +
                    (state.verificationComplete ? '<i class="fas fa-check-circle mr-1"></i>Complete' : '\u25CB In Progress') +
                '</span>' +
            '</div>';
    }

    // ── Supabase 持久化 ─────────────────────────────────────

    /**
     * 保存验证数据到 Supabase
     * 与初始测量共享同一 project_measurements 行，添加 verifiedData 字段
     */
    function saveVerification(projectId) {
        var state = getVerificationState(projectId);
        var step3State = N.steps.step3.getStep3State(projectId);

        if (typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                project_key: projectId,
                measurement_data: JSON.parse(JSON.stringify({
                    measurementData: step3State.measurementData,
                    obstacles: step3State.obstacles,
                    appointmentScheduled: step3State.appointmentScheduled,
                    appointmentDate: step3State.appointmentDate,
                    appointmentTime: step3State.appointmentTime,
                    measurementComplete: step3State.measurementComplete,
                    verifiedData: state.verifiedData,
                    verificationComplete: state.verificationComplete,
                    verifierName: state.verifierName,
                    verificationDate: state.verificationDate
                })),
                updated_at: new Date().toISOString()
            };

            NestopiaDB.getClient()
                .from('project_measurements')
                .upsert(payload, { onConflict: 'tenant_id,project_key' })
                .then(function(res) {
                    if (res.error) console.warn('[Verification] DB save error:', res.error.message);
                    else console.log('[Verification] Saved to Supabase:', projectId);
                })
                .catch(function(err) { console.warn('[Verification] DB save failed:', err.message); });
        }

        showToast('Verification data saved successfully', 'success');
    }

    /**
     * 从 DB 加载验证数据（首次打开面板时触发）
     */
    function loadVerificationFromDB(projectId) {
        N.steps.step3.loadMeasurementFromDB(projectId).then(function(dbData) {
            if (dbData && dbData.verifiedData) {
                var state = getVerificationState(projectId);
                state.verifiedData = dbData.verifiedData;
                state.verificationComplete = dbData.verificationComplete || false;
                state.verifierName = dbData.verifierName || '';
                state.verificationDate = dbData.verificationDate || '';

                // 回填 DOM 字段
                Object.keys(state.verifiedData).forEach(function(k) {
                    var el = document.getElementById('zv_' + k + '_' + projectId);
                    if (el) el.value = state.verifiedData[k];
                    updateDeltaDisplay(projectId, k);
                });

                var nameEl = document.getElementById('zv_verifierName_' + projectId);
                if (nameEl) nameEl.value = state.verifierName;
                var dateEl = document.getElementById('zv_verificationDate_' + projectId);
                if (dateEl) dateEl.value = state.verificationDate;

                checkVerificationComplete(projectId);
                console.log('[Verification] Loaded from Supabase for', projectId);
            }
        });
    }

    // ── 命名空间导出 ──────────────────────────────────────────
    N.steps.zbVerification = {
        zbVerificationState: zbVerificationState,
        getVerificationState: getVerificationState,
        getInitialMeasurement: getInitialMeasurement,
        toggleVerificationPanel: toggleVerificationPanel,
        updateVerificationField: updateVerificationField,
        updateDeltaDisplay: updateDeltaDisplay,
        checkVerificationComplete: checkVerificationComplete,
        updateVerificationSummary: updateVerificationSummary,
        saveVerification: saveVerification,
        loadVerificationFromDB: loadVerificationFromDB,
        TOLERANCE_OK: TOLERANCE_OK,
        TOLERANCE_WARN: TOLERANCE_WARN
    };

    // ── 全局别名（向后兼容）─────────────────────────────
    window.getZBVerificationState = getVerificationState;
    window.toggleVerificationPanel = toggleVerificationPanel;
    window.updateVerificationField = updateVerificationField;
    window.saveZBVerification = saveVerification;

})();
