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
     * ★ 核心修复：每次打开面板时从最新 step3State 动态重建，解决：
     *   1. Initial 数据丢失（DB 异步加载后模板 HTML 已生成）
     *   2. Delta 全显示 "New"（因 initial 为空）
     *   3. Opening 数量错误（numOpenings 在模板时间 = 1）
     */
    function _populateVerificationDOM(projectId) {
        var state = getVerificationState(projectId);

        // 刷新 initialData 快照（Step 1 数据可能在本次会话中从 DB 更新过）
        var latestInitial = getInitialMeasurement(projectId);
        state.initialData = JSON.parse(JSON.stringify(latestInitial));

        // ★ 动态重建 Initial Summary + Per-Opening 比较表
        rebuildVerificationContent(projectId);

        // 回填 verifier 信息
        var nameEl = document.getElementById('zv_verifierName_' + projectId);
        if (nameEl && state.verifierName) nameEl.value = state.verifierName;
        var dateEl = document.getElementById('zv_verificationDate_' + projectId);
        if (dateEl && state.verificationDate) dateEl.value = state.verificationDate;

        checkVerificationComplete(projectId);
    }

    /**
     * 动态重建 Verification 面板的 Initial Summary 和 Per-Opening 比较表
     * 从最新 step3State 读取，确保 DB 异步加载完成后数据正确
     */
    function rebuildVerificationContent(projectId) {
        var state = getVerificationState(projectId);
        var initialData = state.initialData;
        var numOpenings = parseInt(initialData.openings || '1') || 1;
        var mpConfig = STEP_DETAIL_CONFIG[3].measurementPanel;
        var perFieldDefs = mpConfig.zipBlindsFields.filter(function(mf) {
            return mf.perOpening && mf.type !== 'image_upload';
        });
        var cls = 'w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:ring-2 focus:ring-purple-200 focus:border-purple-400';
        var uc = window.unitConverter;

        // ── 1. 重建 Initial Summary ──────────────────────────
        var summaryEl = document.getElementById('zbVerifInitSummary_' + projectId);
        if (summaryEl) {
            var hasData = Boolean(initialData.opening_1_width_in || initialData.opening_1_height_in);
            var summaryHTML = '';
            if (hasData) {
                for (var si = 1; si <= numOpenings; si++) {
                    var sw = initialData['opening_' + si + '_width_in'] || '\u2014';
                    var sh = initialData['opening_' + si + '_height_in'] || '\u2014';
                    var sm = initialData['opening_' + si + '_mounting'] || '';
                    var smLabel = sm ? sm.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); }) : '\u2014';
                    var dispW = (uc && sw !== '\u2014') ? uc.toDisplay(sw) : sw;
                    var dispH = (uc && sh !== '\u2014') ? uc.toDisplay(sh) : sh;
                    var dimUnit = uc ? uc.unitShort() : '"';
                    summaryHTML += '<div class="flex items-center gap-3 text-[10px]">' +
                        '<span class="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-[9px] font-bold text-purple-600">' + si + '</span>' +
                        '<span class="text-gray-600">' + dispW + dimUnit + ' \u00d7 ' + dispH + dimUnit + '</span>' +
                        '<span class="text-purple-600 font-medium">' + smLabel + '</span></div>';
                }
            } else {
                summaryHTML = '<div class="text-xs text-gray-400 text-center py-2"><i class="fas fa-info-circle mr-1"></i>No initial measurement data from Step 1 yet</div>';
            }
            summaryEl.innerHTML = summaryHTML;

            // 更新 opening 计数徽标
            var countBadge = document.getElementById('zbVerifOpeningCount_' + projectId);
            if (countBadge) countBadge.textContent = numOpenings + ' opening' + (numOpenings > 1 ? 's' : '');
        }

        // ── 2. 重建 Per-Opening Comparison 表 ────────────────
        var openingsEl = document.getElementById('zbVerifOpenings_' + projectId);
        if (!openingsEl) return;

        var html = '';
        for (var oi = 1; oi <= numOpenings; oi++) {
            var rows = '';
            for (var fi = 0; fi < perFieldDefs.length; fi++) {
                var mf = perFieldDefs[fi];
                var perKey = 'opening_' + oi + '_' + mf.key;
                var initialVal = initialData[perKey] || '';
                var verifiedVal = state.verifiedData[perKey] || '';

                // Initial value display
                var initialDisplay = '\u2014';
                if (initialVal) {
                    if (mf.type === 'select') {
                        var opt = null;
                        for (var opi = 0; opi < mf.options.length; opi++) {
                            if (mf.options[opi].value === initialVal) { opt = mf.options[opi]; break; }
                        }
                        initialDisplay = opt ? opt.label : initialVal.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
                    } else if (mf.key === 'width_in' || mf.key === 'height_in') {
                        var dv = uc ? uc.toDisplay(initialVal) : initialVal;
                        var du = uc ? uc.unitShort() : '"';
                        initialDisplay = '<span id="vinit_' + perKey + '_' + projectId + '">' + dv + du + '</span>';
                    } else {
                        initialDisplay = initialVal;
                    }
                }

                // Verified field input
                var verifiedInput;
                if (mf.type === 'select') {
                    var opts = '<option value="">--</option>';
                    for (var soi = 0; soi < mf.options.length; soi++) {
                        var o = mf.options[soi];
                        opts += '<option value="' + o.value + '"' + (verifiedVal === o.value ? ' selected' : '') +
                            (o.disabled ? ' disabled style="color:#aaa"' : '') + '>' + o.label +
                            (o.disabled ? ' (Coming Soon)' : '') + '</option>';
                    }
                    verifiedInput = '<select id="zv_' + perKey + '_' + projectId + '" class="' + cls + ' bg-white" onchange="updateVerificationField(\x27' + projectId + '\x27, \x27' + perKey + '\x27, this.value)">' + opts + '</select>';
                } else {
                    var dispVerif = (uc && (mf.key === 'width_in' || mf.key === 'height_in')) ? uc.toDisplay(verifiedVal) : verifiedVal;
                    var ph = initialVal || mf.placeholder || '';
                    verifiedInput = '<input type="' + mf.type + '" id="zv_' + perKey + '_' + projectId + '" value="' + dispVerif + '" class="' + cls + '" placeholder="' + ph + '"' +
                        (mf.min !== undefined ? ' min="' + mf.min + '"' : '') + (mf.step !== undefined ? ' step="' + mf.step + '"' : '') +
                        ' onchange="updateVerificationField(\x27' + projectId + '\x27, \x27' + perKey + '\x27, this.value)">';
                }

                // Label
                var labelText = mf.label;
                var dataAttr = '';
                if ((mf.key === 'width_in' || mf.key === 'height_in') && uc) {
                    var baseName = mf.key === 'width_in' ? 'Width' : 'Height';
                    labelText = baseName + ' (' + uc.unitLabel() + ')';
                    dataAttr = ' data-unit-label="' + baseName + '"';
                }

                rows += '<tr class="border-t border-gray-100">' +
                    '<td class="py-2 text-[11px] text-gray-600 pr-2"' + dataAttr + '><i class="fas ' + mf.icon + ' text-purple-400 text-[9px] mr-1"></i>' + labelText + '</td>' +
                    '<td class="py-2 text-center text-[11px] text-gray-700 font-medium px-1">' + initialDisplay + '</td>' +
                    '<td class="py-2 text-center px-1" style="min-width:80px">' + verifiedInput + '</td>' +
                    '<td class="py-2 text-center px-1" id="vdelta_' + perKey + '_' + projectId + '"><span class="text-gray-300 text-[10px]">\u2014</span></td>' +
                '</tr>';
            }

            html += '<div class="mt-3 p-3 bg-indigo-50/30 rounded-lg border border-indigo-100">' +
                '<div class="flex items-center gap-2 mb-2">' +
                    '<div class="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center">' +
                        '<span class="text-[10px] font-bold text-indigo-600">' + oi + '</span></div>' +
                    '<span class="text-xs font-semibold text-indigo-700">Opening #' + oi + '</span></div>' +
                '<div class="overflow-x-auto"><table class="w-full">' +
                    '<thead><tr class="text-[9px] text-gray-400 uppercase tracking-wider">' +
                        '<th class="text-left py-1 font-medium w-[28%]">Field</th>' +
                        '<th class="text-center py-1 font-medium w-[22%]">Initial</th>' +
                        '<th class="text-center py-1 font-medium w-[28%]">Verified</th>' +
                        '<th class="text-center py-1 font-medium w-[22%]">Delta</th>' +
                    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
        }

        openingsEl.innerHTML = html;

        // 重新计算已有 verified 数据的 delta
        Object.keys(state.verifiedData).forEach(function(k) {
            updateDeltaDisplay(projectId, k);
        });
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

            // 检查选择字段差异（仅限 per-opening 字段；frame_color 已改为项目级公共字段）
            ['mounting', 'motor', 'fabric_sku', 'fabric_openness', 'fabric_color'].forEach(function(f) {
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

        // ★ 自动推进: 验证完成后尝试推进到 Step 4
        if (state.verificationComplete && typeof checkAndAdvanceZBStep === 'function') {
            setTimeout(function() { checkAndAdvanceZBStep(projectId); }, 500);
        }
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

    // ── Final Quotation 对比 ─────────────────────────────────

    /**
     * 生成 Final Quotation 对比面板
     * 使用验证后尺寸重新计算报价，与初始报价对比
     */
    function generateFinalQuotation(projectId) {
        var state = getVerificationState(projectId);
        if (!state || !state.verificationComplete) {
            if (typeof showToast === 'function') showToast('Please complete verification first', 'warning');
            return;
        }

        var initial = state.initialData;
        var verified = state.verifiedData;
        var numOpenings = parseInt(initial.openings || '1') || 1;

        // 获取 SKU 目录价
        var _pricing = N.data && N.data.pricing ? N.data.pricing : {};
        var catalog = _pricing.zbSKUCatalog || {};
        var DEFAULT_FQ_SKU = Object.keys(catalog)[0] || 'WR110A-78';

        // 辅助：根据高度和电机类型选择 SKU
        function pickSKU(heightMM, motor) {
            var isMotorized = !motor || motor.indexOf('manual') < 0;
            if (isMotorized) return heightMM <= 3800 ? 'WR110B-63' : 'WR110A-78';
            return heightMM <= 3800 ? 'WR85-M38' : 'WR85-M55';
        }
        function fmtRMB(v) { return '\u00a5' + Math.round(v).toLocaleString(); }

        // ── 计算初始报价 ──
        var initialOpenings = [];
        var initialSubtotal = 0;
        for (var i = 1; i <= numOpenings; i++) {
            var iW = Number(initial['opening_' + i + '_width_in']) || 72;
            var iH = Number(initial['opening_' + i + '_height_in']) || 96;
            var iMotor = initial['opening_' + i + '_motor'] || initial.motor || 'motorized_wired';
            var iHeightMM = Math.round(iH * 25.4);
            var iArea = (iW * 0.0254) * (iH * 0.0254);
            var iSKU = pickSKU(iHeightMM, iMotor);
            var iSkuData = catalog[iSKU] || catalog[DEFAULT_FQ_SKU];
            var iAmount = Math.round(iArea * (iSkuData ? iSkuData.price : 680));
            initialOpenings.push({ idx: i, widthIn: iW, heightIn: iH, area: iArea, sku: iSKU, skuName: iSkuData ? iSkuData.nameShort : iSKU, unitPrice: iSkuData ? iSkuData.price : 680, amount: iAmount });
            initialSubtotal += iAmount;
        }

        // ── 计算验证后报价 ──
        var finalOpenings = [];
        var finalSubtotal = 0;
        for (var j = 1; j <= numOpenings; j++) {
            var vW = Number(verified['opening_' + j + '_width_in']) || Number(initial['opening_' + j + '_width_in']) || 72;
            var vH = Number(verified['opening_' + j + '_height_in']) || Number(initial['opening_' + j + '_height_in']) || 96;
            var vMotor = initial['opening_' + j + '_motor'] || initial.motor || 'motorized_wired';
            var vHeightMM = Math.round(vH * 25.4);
            var vArea = (vW * 0.0254) * (vH * 0.0254);
            var vSKU = pickSKU(vHeightMM, vMotor);
            var vSkuData = catalog[vSKU] || catalog[DEFAULT_FQ_SKU];
            var vAmount = Math.round(vArea * (vSkuData ? vSkuData.price : 680));
            finalOpenings.push({ idx: j, widthIn: vW, heightIn: vH, area: vArea, sku: vSKU, skuName: vSkuData ? vSkuData.nameShort : vSKU, unitPrice: vSkuData ? vSkuData.price : 680, amount: vAmount });
            finalSubtotal += vAmount;
        }

        // ── 差额 ──
        var priceDelta = finalSubtotal - initialSubtotal;
        var priceDeltaPct = initialSubtotal > 0 ? ((priceDelta / initialSubtotal) * 100) : 0;

        // Smart Quote (18% recommended margin)
        var initQuote = Math.round(initialSubtotal * 1.18);
        var finalQuote = Math.round(finalSubtotal * 1.18);
        var quoteDelta = finalQuote - initQuote;

        // ── 渲染对比面板 ──
        var container = document.getElementById('zbFinalQuotation_' + projectId);
        if (!container) { console.warn('[FinalQuotation] Container not found:', projectId); return; }

        // Per-opening comparison rows
        var compRows = '';
        for (var k = 0; k < numOpenings; k++) {
            var ini = initialOpenings[k];
            var fin = finalOpenings[k];
            var costD = fin.amount - ini.amount;
            var areaD = fin.area - ini.area;
            var costColor = costD > 0 ? 'text-red-600' : costD < 0 ? 'text-green-600' : 'text-gray-400';
            var costSign = costD > 0 ? '+' : '';

            compRows +=
                '<div class="py-2.5 ' + (k > 0 ? 'border-t border-gray-100' : '') + '">' +
                    '<div class="flex items-start gap-2">' +
                        '<div class="w-5 h-5 bg-purple-100 rounded flex items-center justify-center mt-0.5 flex-shrink-0">' +
                            '<span class="text-[9px] font-bold text-purple-600">' + ini.idx + '</span>' +
                        '</div>' +
                        '<div class="flex-1 grid grid-cols-2 gap-x-3 gap-y-1">' +
                            '<div class="text-[10px]">' +
                                '<div class="text-gray-400 font-medium mb-0.5">Initial</div>' +
                                '<div class="text-gray-600">' + ini.widthIn + '&quot; \u00d7 ' + ini.heightIn + '&quot;</div>' +
                                '<div class="text-gray-500">' + ini.area.toFixed(2) + 'm\u00b2 \u00b7 ' + ini.skuName + '</div>' +
                                '<div class="text-gray-700 font-medium">' + fmtRMB(ini.amount) + '</div>' +
                            '</div>' +
                            '<div class="text-[10px]">' +
                                '<div class="text-purple-500 font-medium mb-0.5">Verified</div>' +
                                '<div class="text-gray-700">' + fin.widthIn + '&quot; \u00d7 ' + fin.heightIn + '&quot;</div>' +
                                '<div class="text-gray-500">' + fin.area.toFixed(2) + 'm\u00b2 \u00b7 ' + fin.skuName + '</div>' +
                                '<div class="text-gray-800 font-semibold">' + fmtRMB(fin.amount) + '</div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="text-right text-[10px] min-w-[55px] flex-shrink-0 mt-3">' +
                            '<div class="' + costColor + ' font-semibold">' + costSign + fmtRMB(costD) + '</div>' +
                            '<div class="text-gray-400 text-[9px]">' + (areaD > 0 ? '+' : '') + areaD.toFixed(2) + 'm\u00b2</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

        // Overall delta badge
        var overallBadgeCls = priceDelta > 0 ? 'bg-red-100 text-red-700' : priceDelta < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600';
        var overallIcon = priceDelta > 0 ? 'fa-arrow-up' : priceDelta < 0 ? 'fa-arrow-down' : 'fa-equals';
        var overallSign = priceDelta > 0 ? '+' : '';
        var cogsDeltaCls = priceDelta > 0 ? 'text-red-600' : priceDelta < 0 ? 'text-green-600' : 'text-gray-500';
        var quoteDeltaCls = quoteDelta > 0 ? 'text-red-500' : quoteDelta < 0 ? 'text-green-500' : 'text-gray-400';

        var html =
            '<div class="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-sm" style="animation: fadeInSlide 0.3s ease">' +
                // Header
                '<div class="flex items-center gap-2 mb-3">' +
                    '<div class="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">' +
                        '<i class="fas fa-balance-scale text-emerald-600 text-sm"></i>' +
                    '</div>' +
                    '<div>' +
                        '<span class="text-sm font-semibold text-gray-700">Final Quotation Comparison</span>' +
                        '<span class="text-[10px] text-emerald-600 ml-2 font-medium">Initial vs Verified</span>' +
                    '</div>' +
                    '<div class="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ' + overallBadgeCls + '">' +
                        '<i class="fas ' + overallIcon + '"></i> ' +
                        overallSign + fmtRMB(priceDelta) + ' (' + (priceDeltaPct > 0 ? '+' : '') + priceDeltaPct.toFixed(1) + '%)' +
                    '</div>' +
                '</div>' +

                // Per-Opening Comparison
                '<div class="bg-white rounded-lg p-3 border border-gray-100 mb-3">' +
                    '<div class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mb-1.5">Per-Opening Breakdown</div>' +
                    compRows +
                '</div>' +

                // Summary
                '<div class="bg-white rounded-lg p-3 border border-gray-100">' +
                    '<div class="space-y-1.5">' +
                        '<div class="flex justify-between text-[10px]">' +
                            '<span class="text-gray-500">Initial COGS</span>' +
                            '<span class="font-medium text-gray-600">' + fmtRMB(initialSubtotal) + '</span>' +
                        '</div>' +
                        '<div class="flex justify-between text-[10px]">' +
                            '<span class="text-gray-500">Final COGS (Verified)</span>' +
                            '<span class="font-semibold text-gray-800">' + fmtRMB(finalSubtotal) + '</span>' +
                        '</div>' +
                        '<div class="border-t border-gray-200 pt-1.5 flex justify-between text-[10px]">' +
                            '<span class="text-gray-500">COGS Difference</span>' +
                            '<span class="font-bold ' + cogsDeltaCls + '">' + overallSign + fmtRMB(priceDelta) + '</span>' +
                        '</div>' +
                        '<div class="border-t border-emerald-200 pt-1.5 mt-1 flex justify-between text-xs">' +
                            '<span class="font-semibold text-gray-700">Recommended Quote (18% margin)</span>' +
                            '<span class="font-bold text-emerald-700">' + fmtRMB(finalQuote) + '</span>' +
                        '</div>' +
                        '<div class="flex justify-between text-[10px]">' +
                            '<span class="text-gray-400">Initial quote was ' + fmtRMB(initQuote) + '</span>' +
                            '<span class="' + quoteDeltaCls + ' font-medium">' + (quoteDelta > 0 ? '+' : '') + fmtRMB(quoteDelta) + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                // Confirm Button
                '<button id="zbConfirmFinalQuoteBtn_' + projectId + '" onclick="confirmFinalQuotation(\x27' + projectId + '\x27)" class="mt-3 w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 transition shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2">' +
                    '<i class="fas fa-check-circle"></i> Confirm Final Quotation' +
                '</button>' +
            '</div>';

        container.innerHTML = html;
        container.classList.remove('hidden');

        // 缓存对比数据用于 confirm 保存
        state._finalQuotationData = {
            initialOpenings: initialOpenings,
            finalOpenings: finalOpenings,
            initialSubtotal: initialSubtotal,
            finalSubtotal: finalSubtotal,
            priceDelta: priceDelta,
            priceDeltaPct: priceDeltaPct,
            initQuote: initQuote,
            finalQuote: finalQuote,
            quoteDelta: quoteDelta,
            generatedAt: new Date().toISOString()
        };

        console.log('[FinalQuotation] Generated comparison:', {
            initialSubtotal: initialSubtotal,
            finalSubtotal: finalSubtotal,
            priceDelta: priceDelta,
            priceDeltaPct: priceDeltaPct.toFixed(1) + '%'
        });
    }

    /**
     * 确认最终报价并保存到 Supabase
     */
    function confirmFinalQuotation(projectId) {
        var state = getVerificationState(projectId);
        if (!state || !state._finalQuotationData) {
            if (typeof showToast === 'function') showToast('Please generate final quotation first', 'warning');
            return;
        }

        var fqData = state._finalQuotationData;

        // 保存到 project_quotations 表（final_quotation 字段）
        if (typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
            var tenantId = NestopiaDB.getTenantId();
            // 先加载现有 quotation 数据，添加 finalQuotation
            NestopiaDB.getClient()
                .from('project_quotations')
                .select('quotation_data')
                .eq('tenant_id', tenantId)
                .eq('project_key', projectId)
                .maybeSingle()
                .then(function(res) {
                    var existing = (res.data && res.data.quotation_data) ? res.data.quotation_data : {};
                    existing.finalQuotation = {
                        basedOn: 'verified_measurement',
                        initialOpenings: fqData.initialOpenings,
                        finalOpenings: fqData.finalOpenings,
                        initialSubtotal: fqData.initialSubtotal,
                        finalSubtotal: fqData.finalSubtotal,
                        priceDelta: fqData.priceDelta,
                        priceDeltaPct: fqData.priceDeltaPct,
                        recommendedQuote: fqData.finalQuote,
                        confirmed: true,
                        confirmedAt: new Date().toISOString()
                    };

                    return NestopiaDB.getClient()
                        .from('project_quotations')
                        .upsert({
                            tenant_id: tenantId,
                            project_key: projectId,
                            quotation_data: JSON.parse(JSON.stringify(existing)),
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'tenant_id,project_key' });
                })
                .then(function(res) {
                    if (res && res.error) {
                        console.warn('[FinalQuotation] DB save error:', res.error.message);
                    } else {
                        console.log('[FinalQuotation] Confirmed and saved to Supabase:', projectId);
                    }
                })
                .catch(function(err) {
                    console.warn('[FinalQuotation] DB save failed:', err.message);
                });
        }

        if (typeof showToast === 'function') showToast('Final quotation confirmed and saved', 'success');

        // 更新 Confirm 按钮状态
        var btn = document.getElementById('zbConfirmFinalQuoteBtn_' + projectId);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Final Quotation Confirmed';
            btn.classList.remove('from-emerald-600', 'to-teal-600', 'hover:from-emerald-700', 'hover:to-teal-700');
            btn.classList.add('from-gray-500', 'to-gray-600', 'opacity-60', 'cursor-not-allowed');
        }

        // ★ 自动推进到 Step 4 (Order & Install)
        if (typeof checkAndAdvanceZBStep === 'function') {
            setTimeout(function() { checkAndAdvanceZBStep(projectId); }, 500);
        }
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
        rebuildVerificationContent: rebuildVerificationContent,
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
