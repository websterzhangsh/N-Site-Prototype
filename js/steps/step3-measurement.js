/**
 * Nestopia - Step 3: Measurement & Design
 * 命名空间: Nestopia.steps.step3
 *
 * 从 company-operations.html 提取（行 9311-9803）
 * 包含: step3MeasurementState, _measurementDbLoaded,
 *       Supabase measurement 持久化函数,
 *       以及所有 Step 3 面板交互函数
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.steps = N.steps || {};

    // ===== Step 3: Measurement & Design Panel Functions =====
    // State: { measurementData, obstacles, complianceChecks, designMatrix, structuralAssessment, appointmentScheduled, appointmentDate, appointmentTime, measurementComplete }
    var step3MeasurementState = {};
    var _measurementDbLoaded = {};  // 标记已从 DB 加载的项目

    // ── Supabase Measurement 持久化 ──────────────────────────
    function loadMeasurementFromDB(projectId) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
        return NestopiaDB.getClient()
            .from('project_measurements')
            .select('measurement_data')
            .eq('tenant_id', NestopiaDB.getTenantId())
            .eq('project_key', projectId)
            .maybeSingle()
            .then(function(res) {
                if (res.error) { console.warn('[Measurement] DB load error:', res.error.message); return null; }
                return (res.data && res.data.measurement_data) ? res.data.measurement_data : null;
            })
            .catch(function(err) { console.warn('[Measurement] DB load failed:', err.message); return null; });
    }

    function saveMeasurementToDB(projectId, stateObj) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
        var payload = {
            tenant_id: NestopiaDB.getTenantId(),
            project_key: projectId,
            measurement_data: JSON.parse(JSON.stringify({
                measurementData: stateObj.measurementData,
                obstacles: stateObj.obstacles,
                appointmentScheduled: stateObj.appointmentScheduled,
                appointmentDate: stateObj.appointmentDate,
                appointmentTime: stateObj.appointmentTime,
                measurementComplete: stateObj.measurementComplete
            })),
            updated_at: new Date().toISOString()
        };
        return NestopiaDB.getClient()
            .from('project_measurements')
            .upsert(payload, { onConflict: 'tenant_id,project_key' })
            .then(function(res) {
                if (res.error) { console.warn('[Measurement] DB save error:', res.error.message); return false; }
                console.log('[Measurement] Saved to Supabase:', projectId);
                return true;
            })
            .catch(function(err) { console.warn('[Measurement] DB save failed:', err.message); return false; });
    }

    function getStep3State(projectId) {
        if (!step3MeasurementState[projectId]) {
            var project = allProjectsData.find(p => p.id === projectId);
            var mData = project && project.measurement ? project.measurement : {};
            var isZB = project && project.type === 'Zip Blinds';

            // Pre-populate from existing project measurement data
            var measurementData = {};
            if (mData.method) measurementData.method = mData.method === 'Manual precision' ? 'manual_precision' : (mData.method === 'Hybrid' ? 'hybrid' : mData.method);
            if (mData.surveyor) measurementData.surveyor = mData.surveyor;
            if (mData.date) measurementData.date = mData.date;

            if (isZB) {
                // Zip Blinds — direct field mapping (no dims parsing needed)
                if (mData.openings) measurementData.openings = String(mData.openings);
                if (mData.opening_width_in) measurementData.opening_width_in = String(mData.opening_width_in);
                if (mData.opening_height_in) measurementData.opening_height_in = String(mData.opening_height_in);
                if (mData.mounting) measurementData.mounting = mData.mounting;
                if (mData.guide) measurementData.guide = mData.guide;
                if (mData.motor) measurementData.motor = mData.motor;
                if (mData.fabric) measurementData.fabric = mData.fabric;
            } else {
                // Sunroom / Pergola — structural measurements
                if (mData.dims) {
                    var dimParts = mData.dims.replace(/'/g, '').split(/\s*x\s*/i);
                    if (dimParts.length >= 3) {
                        measurementData.length_ft = dimParts[0].trim();
                        measurementData.width_ft = dimParts[1].trim();
                        measurementData.height_ft = dimParts[2].trim();
                    }
                }
                if (mData.foundation) {
                    var foundLower = mData.foundation.toLowerCase();
                    if (foundLower.includes('concrete slab')) measurementData.foundation = 'concrete_slab';
                    else if (foundLower.includes('pier')) measurementData.foundation = 'pier_beam';
                    else measurementData.foundation_detail = mData.foundation;
                }
                if (mData.wallBearing) {
                    var wbLower = mData.wallBearing.toLowerCase();
                    if (wbLower.includes('adequate') && wbLower.includes('wood')) measurementData.wall_bearing = 'adequate_wood';
                    else if (wbLower.includes('adequate') && wbLower.includes('masonry')) measurementData.wall_bearing = 'adequate_masonry';
                    else if (wbLower.includes('adequate') && wbLower.includes('steel')) measurementData.wall_bearing = 'adequate_steel';
                    else if (wbLower.includes('reinforce')) measurementData.wall_bearing = 'needs_reinforcement';
                    else if (wbLower.includes('freestanding')) measurementData.wall_bearing = 'na_freestanding';
                }
                if (mData.setback) measurementData.setback_distance = mData.setback;
                if (mData.drainage) measurementData.drainage_slope = mData.drainage;
            }

            // Build obstacles from project data
            var obstacles = [];
            if (mData.obstacles && Array.isArray(mData.obstacles)) {
                obstacles = mData.obstacles.map(function(obs) {
                    if (typeof obs === 'string') {
                        var lower = obs.toLowerCase();
                        var type = 'other';
                        if (lower.includes('downspout')) type = 'downspout';
                        else if (lower.includes('gas meter')) type = 'gas_meter';
                        else if (lower.includes('gas line')) type = 'gas_line';
                        else if (lower.includes('tree') || lower.includes('oak')) type = 'tree';
                        else if (lower.includes('sprinkler')) type = 'sprinkler';
                        else if (lower.includes('vent') || lower.includes('chimney')) type = 'vent';
                        else if (lower.includes('electric')) type = 'electrical';
                        else if (lower.includes('water')) type = 'water_line';
                        else if (lower.includes('hvac')) type = 'hvac_unit';
                        return { type: type, location: obs, notes: '' };
                    }
                    return obs;
                });
            }

            // Determine if measurement is sufficiently populated
            var hasData = Boolean(mData.method || measurementData.method);
            var isCurrentOrPast = project && project.workflowStep >= 3;

            // Compliance checks — product-type-aware
            var complianceChecks = isZB ? [
                { key: 'opening_clearance', label: 'Opening Clearance', status: hasData ? 'pass' : 'pending', detail: hasData ? 'Adequate' : '' },
                { key: 'electrical_access', label: 'Electrical Access (Motor)', status: hasData && measurementData.motor && measurementData.motor.includes('motorized') ? 'pass' : hasData ? 'warn' : 'pending', detail: hasData && measurementData.motor ? (measurementData.motor.includes('solar') ? 'Solar — no wiring' : 'Wiring needed') : '' },
                { key: 'wind_rating', label: 'Wind Rating', status: hasData ? 'pass' : 'pending', detail: hasData ? 'Rated 65 mph' : '' },
                { key: 'mounting_surface', label: 'Mounting Surface', status: hasData ? 'pass' : 'pending', detail: hasData ? 'Solid — OK' : '' }
            ] : [
                { key: 'setback', label: 'Setback Requirements', status: mData.setback && mData.setback.includes('OK') ? 'pass' : hasData ? 'warn' : 'pending', detail: mData.setback || '' },
                { key: 'drainage', label: 'Drainage Slope', status: mData.drainage && mData.drainage.includes('OK') ? 'pass' : hasData ? 'warn' : 'pending', detail: mData.drainage || '' },
                { key: 'height', label: 'Height Limit', status: hasData ? 'pass' : 'pending', detail: hasData ? 'Within limit' : '' },
                { key: 'lot_coverage', label: 'Lot Coverage', status: hasData ? 'pass' : 'pending', detail: hasData ? 'Within 40% max' : '' },
                { key: 'hoa', label: 'HOA Design Review', status: project && project.hoa && project.hoa.toLowerCase().startsWith('yes') ? 'warn' : hasData ? 'pass' : 'pending', detail: project && project.hoa ? project.hoa : '' },
                { key: 'fire_safety', label: 'Fire Separation', status: hasData ? 'pass' : 'pending', detail: hasData ? 'Meets IRC R302' : '' }
            ];

            // Design matrix states based on workflow progress
            var matrixState = {};
            if (project && project.workflowStep > 3) {
                matrixState = { renderings: 'done', sitePlan: 'done', interiorLayout: 'done', elevations: 'done', animation: 'done', structural: 'done', foundation: 'done', compliance: 'done' };
            } else if (hasData) {
                matrixState = { renderings: 'in_progress', sitePlan: 'in_progress', interiorLayout: 'pending', elevations: 'pending', animation: 'pending', structural: 'in_progress', foundation: 'in_progress', compliance: 'pending' };
            } else {
                matrixState = { renderings: 'pending', sitePlan: 'pending', interiorLayout: 'pending', elevations: 'pending', animation: 'pending', structural: 'pending', foundation: 'pending', compliance: 'pending' };
            }

            // Structural assessment (structural products only, but stored for all)
            var structuralAssessment = {
                status: hasData ? (isZB ? 'adequate' : (measurementData.wall_bearing && !measurementData.wall_bearing.includes('reinforce') ? 'adequate' : 'needs_review')) : 'pending',
                foundation: isZB ? 'N/A' : (measurementData.foundation_detail || (mData.foundation || '—')),
                wallBearing: isZB ? 'N/A' : (mData.wallBearing || '—'),
                connectionPoints: hasData ? (project && project.type === 'Sunroom' ? 'Rear wall, 2 anchor points' : project && project.type === 'Pergola' ? '4 post footings' : '2 header mounts') : '—',
                loadCapacity: hasData ? (isZB ? 'Wind: 65 mph rated' : 'Wind: 110 mph · Snow: 20 psf') : '—'
            };

            step3MeasurementState[projectId] = {
                measurementData: measurementData,
                obstacles: obstacles,
                complianceChecks: complianceChecks,
                designMatrix: matrixState,
                structuralAssessment: structuralAssessment,
                appointmentScheduled: hasData,
                appointmentDate: mData.date || '',
                appointmentTime: hasData ? 'morning' : '',
                measurementComplete: hasData && isCurrentOrPast
            };
        }
        return step3MeasurementState[projectId];
    }

    function toggleStep3Panel(projectId) {
        var panel = document.getElementById('step3MeasurementPanel_' + projectId);
        var btn = document.getElementById('step3LaunchBtn_' + projectId);
        if (!panel) return;

        if (panel.classList.contains('hidden')) {
            // 打开前先从 Supabase 加载最新数据（仅首次）
            if (!_measurementDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                _measurementDbLoaded[projectId] = true;
                loadMeasurementFromDB(projectId).then(function(dbData) {
                    if (dbData && typeof dbData === 'object') {
                        var state = getStep3State(projectId);
                        if (dbData.measurementData) {
                            Object.keys(dbData.measurementData).forEach(function(k) {
                                state.measurementData[k] = dbData.measurementData[k];
                            });
                        }
                        if (dbData.obstacles && Array.isArray(dbData.obstacles)) state.obstacles = dbData.obstacles;
                        if (dbData.appointmentScheduled !== undefined) state.appointmentScheduled = dbData.appointmentScheduled;
                        if (dbData.appointmentDate) state.appointmentDate = dbData.appointmentDate;
                        if (dbData.appointmentTime) state.appointmentTime = dbData.appointmentTime;
                        if (dbData.measurementComplete !== undefined) state.measurementComplete = dbData.measurementComplete;
                        console.log('[Measurement] Loaded from Supabase for', projectId);
                        // 直接更新 DOM 字段值（避免 toggle-toggle 导致面板收起）
                        _populateStep3FieldsFromState(projectId, state);
                    }
                });
            }
            panel.classList.remove('hidden');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-times text-[10px]"></i> Close Panel';
                btn.classList.remove('bg-purple-600', 'hover:bg-purple-700');
                btn.classList.add('bg-gray-600', 'hover:bg-gray-700');
            }
        } else {
            panel.classList.add('hidden');
            if (btn) {
                btn.innerHTML = '<i class="fas fa-clipboard-check text-[10px]"></i> Open Measurement';
                btn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
                btn.classList.add('bg-purple-600', 'hover:bg-purple-700');
            }
        }
    }

    function updateStep3Field(projectId, key, value) {
        // Validate positive real number for width/height fields
        if ((key.indexOf('width_in') >= 0 || key.indexOf('height_in') >= 0) && value !== '') {
            var num = parseFloat(value);
            if (isNaN(num) || num <= 0) {
                var inp = document.getElementById('step3_' + key + '_' + projectId);
                if (inp) { inp.value = ''; }
                return;
            }
            // ★ 单位转换：如果当前是 mm 模式，将输入的 mm 转为 inch 存储
            if (window.unitConverter && window.unitConverter.getUnitMode() === 'mm') {
                value = window.unitConverter.toInch(value);
            }
        }
        var state = getStep3State(projectId);
        if (key.startsWith('_appt')) {
            if (key === '_apptDate') state.appointmentDate = value;
            if (key === '_apptTime') state.appointmentTime = value;
        } else {
            state.measurementData[key] = value;
        }
        // Product-type-aware required fields check
        var project = allProjectsData.find(p => p.id === projectId);
        var md = state.measurementData;
        if (project && project.type === 'Zip Blinds') {
            state.measurementComplete = Boolean(md.method && md.surveyor && md.date && md.openings && md.opening_1_width_in && md.opening_1_height_in);
        } else {
            state.measurementComplete = Boolean(md.method && md.surveyor && md.date && md.length_ft && md.width_ft && md.height_ft);
        }
        var genBtn = document.getElementById('step3GenerateDesignBtn_' + projectId);
        if (genBtn) {
            if (state.measurementComplete) {
                genBtn.disabled = false;
                genBtn.classList.remove('opacity-40', 'cursor-not-allowed');
            } else {
                genBtn.disabled = true;
                genBtn.classList.add('opacity-40', 'cursor-not-allowed');
            }
        }
    }

    function rebuildZBOpeningSections(projectId) {
        var container = document.getElementById('zbOpeningSections_' + projectId);
        if (!container) return;
        var state = getStep3State(projectId);
        var openingsInput = document.getElementById('step3_openings_' + projectId);
        var numOpenings = parseInt(openingsInput ? openingsInput.value : '1') || 1;
        if (numOpenings < 1) numOpenings = 1;
        if (numOpenings > 20) numOpenings = 20;
        state.measurementData['openings'] = String(numOpenings);

        var config = STEP_DETAIL_CONFIG[3];
        if (!config || !config.measurementPanel || !config.measurementPanel.zipBlindsFields) return;
        var perFields = config.measurementPanel.zipBlindsFields.filter(function(f) { return f.perOpening; });
        if (perFields.length === 0) return;

        var cls = 'w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-200 focus:border-purple-400';
        var uc = window.unitConverter;
        var html = '';
        for (var oi = 1; oi <= numOpenings; oi++) {
            var rows = perFields.map(function(mf) {
                var perKey = 'opening_' + oi + '_' + mf.key;
                var savedVal = state.measurementData[perKey] || '';
                var inp;
                if (mf.type === 'select') {
                    var effectiveVal = savedVal || mf.defaultValue || '';
                    inp = '<select id="step3_' + perKey + '_' + projectId + '" class="' + cls + ' bg-white" onchange="updateStep3Field(\x27' + projectId + '\x27, \x27' + perKey + '\x27, this.value)"><option value="">-- Select --</option>' +
                        mf.options.map(function(o) { return '<option value="' + o.value + '"' + (effectiveVal === o.value ? ' selected' : '') + (o.disabled ? ' disabled style="color:#aaa"' : '') + '>' + o.label + (o.disabled ? ' (Coming Soon)' : '') + '</option>'; }).join('') + '</select>';
                } else {
                    // ★ 单位转换：width/height 字段 — 显示当前单位的值和标签
                    var isDim = (mf.key === 'width_in' || mf.key === 'height_in');
                    var displayVal = (isDim && uc) ? uc.toDisplay(savedVal) : savedVal;
                    var placeholder = (isDim && uc) ? uc.unitPlaceholder(mf.key) : (mf.placeholder || '');
                    inp = '<input type="' + mf.type + '" id="step3_' + perKey + '_' + projectId + '" value="' + displayVal + '" class="' + cls + '" placeholder="' + placeholder + '"' +
                        (mf.min !== undefined ? ' min="' + mf.min + '"' : '') + (mf.step !== undefined ? ' step="' + mf.step + '"' : '') +
                        ' onchange="updateStep3Field(\x27' + projectId + '\x27, \x27' + perKey + '\x27, this.value)">';
                }
                // ★ 动态标签：dimension 字段显示当前单位
                var labelText = mf.label;
                var dataUnitAttr = '';
                if ((mf.key === 'width_in' || mf.key === 'height_in') && uc) {
                    var baseName = mf.key === 'width_in' ? 'Width' : 'Height';
                    labelText = baseName + ' (' + uc.unitLabel() + ')';
                    dataUnitAttr = ' data-unit-label="' + baseName + '"';
                }
                return '<div class="space-y-1"><label class="text-[10px] font-medium text-gray-500 flex items-center gap-1.5"' + dataUnitAttr + '><i class="fas ' + mf.icon + ' text-purple-400"></i>' + labelText + '</label>' + inp + '</div>';
            }).join('');
            html += '<div class="mt-3 p-3 bg-indigo-50/30 rounded-lg border border-indigo-100">' +
                '<div class="flex items-center gap-2 mb-2"><div class="w-5 h-5 bg-indigo-100 rounded flex items-center justify-center"><span class="text-[10px] font-bold text-indigo-600">' + oi + '</span></div>' +
                '<span class="text-xs font-semibold text-indigo-700">Opening #' + oi + '</span></div>' +
                '<div class="grid grid-cols-2 gap-2.5">' + rows + '</div></div>';
        }
        container.innerHTML = html;
    }

    function saveStep3Measurement(projectId) {
        var state = getStep3State(projectId);
        var project = allProjectsData.find(p => p.id === projectId);
        var isZB = project && project.type === 'Zip Blinds';
        // Read all field values from DOM into state (product-type-aware)
        var config = STEP_DETAIL_CONFIG[3];
        if (config && config.measurementPanel) {
            var fields = isZB && config.measurementPanel.zipBlindsFields ? config.measurementPanel.zipBlindsFields : config.measurementPanel.measurementFields;
            var commonFields = fields.filter(function(f) { return !f.perOpening; });
            commonFields.forEach(function(mf) {
                var el = document.getElementById('step3_' + mf.key + '_' + projectId);
                if (el) state.measurementData[mf.key] = el.value;
            });
            // Collect per-opening fields (ZB)
            if (isZB) {
                var perFields = fields.filter(function(f) { return f.perOpening; });
                var numO = parseInt(state.measurementData['openings'] || '1') || 1;
                var uc = window.unitConverter;
                for (var oi = 1; oi <= numO; oi++) {
                    perFields.forEach(function(mf) {
                        var perKey = 'opening_' + oi + '_' + mf.key;
                        var el = document.getElementById('step3_' + perKey + '_' + projectId);
                        if (el) {
                            var val = el.value;
                            // ★ 保存时确保 width/height 以 inch 存储
                            if ((mf.key === 'width_in' || mf.key === 'height_in') && uc && uc.getUnitMode() === 'mm' && val !== '') {
                                val = uc.toInch(val);
                            }
                            state.measurementData[perKey] = val;
                        }
                    });
                }
            }
        }
        // Update measurement completeness (product-type-aware)
        var md = state.measurementData;
        if (isZB) {
            state.measurementComplete = Boolean(md.method && md.surveyor && md.date && md.openings && md.opening_1_width_in && md.opening_1_height_in);
        } else {
            state.measurementComplete = Boolean(md.method && md.surveyor && md.date && md.length_ft && md.width_ft && md.height_ft);
        }

        showToast('Measurement data saved successfully', 'success');

        // 同步到 Supabase
        saveMeasurementToDB(projectId, state);

        // Invalidate Step 4 quotation cache so it re-reads fresh measurement data
        if (typeof step4QuotationState !== 'undefined') {
            delete step4QuotationState[projectId];
        }

        // Update generate button
        var genBtn = document.getElementById('step3GenerateDesignBtn_' + projectId);
        if (genBtn) {
            if (state.measurementComplete) {
                genBtn.disabled = false;
                genBtn.classList.remove('opacity-40', 'cursor-not-allowed');
            } else {
                genBtn.disabled = true;
                genBtn.classList.add('opacity-40', 'cursor-not-allowed');
            }
        }
    }

    function scheduleStep3Appointment(projectId) {
        var state = getStep3State(projectId);
        if (!state.appointmentDate || !state.appointmentTime) {
            showToast('Please select both date and time slot', 'error');
            return;
        }
        state.appointmentScheduled = true;

        // Update UI
        var statusEl = document.getElementById('step3ApptStatus_' + projectId);
        if (statusEl) {
            statusEl.textContent = '\u2713 Scheduled';
            statusEl.classList.remove('text-amber-600');
            statusEl.classList.add('text-green-600');
        }
        var timeLabels = { morning: 'Morning (8\u201312)', afternoon: 'Afternoon (12\u20135)', evening: 'Evening (5\u20137)' };
        showToast('Measurement appointment scheduled: ' + state.appointmentDate + ' \u00b7 ' + (timeLabels[state.appointmentTime] || state.appointmentTime), 'success');
    }

    function addStep3Obstacle(projectId) {
        var state = getStep3State(projectId);
        var typeEl = document.getElementById('step3ObstacleType_' + projectId);
        var locEl = document.getElementById('step3ObstacleLocation_' + projectId);
        if (!typeEl || !locEl) return;

        var type = typeEl.value;
        var location = locEl.value.trim();
        if (!type && !location) {
            showToast('Please select obstacle type or enter location', 'error');
            return;
        }

        var config = STEP_DETAIL_CONFIG[3];
        var typeInfo = config.measurementPanel.obstacleTypes.find(function(t) { return t.value === type; }) || { icon: 'fa-exclamation-circle', label: type || 'Unknown' };

        state.obstacles.push({ type: type || 'other', location: location || typeInfo.label, notes: '' });

        // Re-render obstacle list
        var listEl = document.getElementById('step3ObstacleList_' + projectId);
        if (listEl) {
            var itemHTML = state.obstacles.map(function(obs, i) {
                var ti = config.measurementPanel.obstacleTypes.find(function(t) { return t.value === obs.type; }) || { icon: 'fa-exclamation-circle', label: obs.type || 'Unknown' };
                return '<div class="flex items-center gap-2 py-1.5 px-2 bg-amber-50/50 rounded-lg border border-amber-100">' +
                    '<i class="fas ' + ti.icon + ' text-amber-500 text-xs"></i>' +
                    '<span class="text-xs text-gray-700 flex-1">' + (obs.location || ti.label) + (obs.notes ? ' \u2014 ' + obs.notes : '') + '</span>' +
                    '<button onclick="Nestopia.steps.step3.removeStep3Obstacle(\'' + projectId + '\', ' + i + ')" class="text-red-400 hover:text-red-600 text-xs"><i class="fas fa-times"></i></button>' +
                '</div>';
            }).join('');
            listEl.innerHTML = itemHTML;
        }

        // Clear inputs
        typeEl.value = '';
        locEl.value = '';
        showToast('Obstacle added: ' + (location || typeInfo.label), 'success');
    }

    function removeStep3Obstacle(projectId, index) {
        var state = getStep3State(projectId);
        state.obstacles.splice(index, 1);

        // Re-render
        var listEl = document.getElementById('step3ObstacleList_' + projectId);
        if (listEl) {
            if (state.obstacles.length === 0) {
                listEl.innerHTML = '<div class="text-xs text-gray-400 text-center py-3">No obstacles recorded yet</div>';
            } else {
                var config = STEP_DETAIL_CONFIG[3];
                var itemHTML = state.obstacles.map(function(obs, i) {
                    var ti = config.measurementPanel.obstacleTypes.find(function(t) { return t.value === obs.type; }) || { icon: 'fa-exclamation-circle', label: obs.type || 'Unknown' };
                    return '<div class="flex items-center gap-2 py-1.5 px-2 bg-amber-50/50 rounded-lg border border-amber-100">' +
                        '<i class="fas ' + ti.icon + ' text-amber-500 text-xs"></i>' +
                        '<span class="text-xs text-gray-700 flex-1">' + (obs.location || ti.label) + (obs.notes ? ' \u2014 ' + obs.notes : '') + '</span>' +
                        '<button onclick="Nestopia.steps.step3.removeStep3Obstacle(\'' + projectId + '\', ' + i + ')" class="text-red-400 hover:text-red-600 text-xs"><i class="fas fa-times"></i></button>' +
                    '</div>';
                }).join('');
                listEl.innerHTML = itemHTML;
            }
        }
        showToast('Obstacle removed', 'info');
    }

    function generateStep3DetailedDesign(projectId) {
        var state = getStep3State(projectId);
        if (!state.measurementComplete) {
            showToast('Please complete measurement data first', 'error');
            return;
        }

        // Warn if project is already past Step 3
        var project = allProjectsData.find(p => p.id === projectId);
        if (project && project.workflowStep > 3) {
            var stepNames = ['', 'Intent', 'Design', 'Measurement', 'Quotation', 'Production', 'Installation'];
            if (!confirm('This project is already at Step ' + project.workflowStep + ' (' + (stepNames[project.workflowStep] || '') + '). The design package was previously completed.\n\nAre you sure you want to re-generate the detailed design package?')) {
                return;
            }
        }

        var btn = document.getElementById('step3GenerateDesignBtn_' + projectId);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Generating Design Package...';
        }

        // Simulate generation progress (in real app, this would call AI Designer API)
        var deliverables = ['renderings', 'sitePlan', 'interiorLayout', 'elevations', 'structural', 'foundation', 'compliance', 'animation'];
        var currentIndex = 0;

        function processNext() {
            if (currentIndex >= deliverables.length) {
                // All done
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Design Package Complete';
                    btn.classList.remove('from-purple-600', 'to-violet-600', 'hover:from-purple-700', 'hover:to-violet-700');
                    btn.classList.add('from-green-600', 'to-emerald-600');
                }
                showToast('Full design enablement package generated! 8/8 deliverables complete.', 'success');
                return;
            }

            var key = deliverables[currentIndex];
            state.designMatrix[key] = 'in_progress';

            // Update the UI for this item
            setTimeout(function() {
                state.designMatrix[key] = 'done';
                // Re-render the step detail to reflect progress
                if (expandedStep && currentDetailProject) {
                    toggleStepDetail(expandedStep, currentDetailProject);
                    toggleStepDetail(expandedStep, currentDetailProject);
                }
                currentIndex++;
                processNext();
            }, 600 + Math.random() * 400);
        }

        // Start processing with initial delay
        setTimeout(processNext, 500);
    }

    /**
     * DB 加载后直接填充 DOM 字段（不需要重新渲染面板）
     * 支持 ZB（per-opening）和 Sunroom/Pergola
     */
    function _populateStep3FieldsFromState(projectId, state) {
        var project = allProjectsData.find(function(p) { return p.id === projectId; });
        var isZB = project && project.type === 'Zip Blinds';
        var config = STEP_DETAIL_CONFIG[3];
        if (!config || !config.measurementPanel) return;

        var fields = isZB && config.measurementPanel.zipBlindsFields
            ? config.measurementPanel.zipBlindsFields
            : config.measurementPanel.measurementFields;

        // 1. 通用字段（method, surveyor, date, openings...）
        fields.filter(function(f) { return !f.perOpening; }).forEach(function(mf) {
            var el = document.getElementById('step3_' + mf.key + '_' + projectId);
            if (el && state.measurementData[mf.key] !== undefined) {
                el.value = state.measurementData[mf.key];
            }
        });

        // 2. ZB per-opening 字段 — 先重建 opening sections，再填值
        if (isZB) {
            var numO = parseInt(state.measurementData['openings'] || '1') || 1;
            var openingsEl = document.getElementById('step3_openings_' + projectId);
            if (openingsEl) openingsEl.value = String(numO);
            rebuildZBOpeningSections(projectId);
        }

        // 3. 预约字段
        var apptDateEl = document.getElementById('step3ApptDate_' + projectId);
        if (apptDateEl && state.appointmentDate) apptDateEl.value = state.appointmentDate;
        var apptTimeEl = document.getElementById('step3ApptTime_' + projectId);
        if (apptTimeEl && state.appointmentTime) apptTimeEl.value = state.appointmentTime;

        // 4. 预约状态
        var statusEl = document.getElementById('step3ApptStatus_' + projectId);
        if (statusEl && state.appointmentScheduled) {
            statusEl.textContent = '\u2713 Scheduled';
            statusEl.classList.remove('text-amber-600');
            statusEl.classList.add('text-green-600');
        }

        // 5. Generate 按钮状态
        var genBtn = document.getElementById('step3GenerateDesignBtn_' + projectId);
        if (genBtn) {
            if (state.measurementComplete) {
                genBtn.disabled = false;
                genBtn.classList.remove('opacity-40', 'cursor-not-allowed');
            } else {
                genBtn.disabled = true;
                genBtn.classList.add('opacity-40', 'cursor-not-allowed');
            }
        }
    }

    // ── 命名空间导出 ──────────────────────────────────────────
    N.steps.step3 = {
        step3MeasurementState: step3MeasurementState,
        _measurementDbLoaded: _measurementDbLoaded,
        loadMeasurementFromDB: loadMeasurementFromDB,
        saveMeasurementToDB: saveMeasurementToDB,
        getStep3State: getStep3State,
        toggleStep3Panel: toggleStep3Panel,
        updateStep3Field: updateStep3Field,
        rebuildZBOpeningSections: rebuildZBOpeningSections,
        saveStep3Measurement: saveStep3Measurement,
        scheduleStep3Appointment: scheduleStep3Appointment,
        addStep3Obstacle: addStep3Obstacle,
        removeStep3Obstacle: removeStep3Obstacle,
        generateStep3DetailedDesign: generateStep3DetailedDesign
    };

    // ── 全局别名（保持向后兼容） ─────────────────────────────
    window.step3MeasurementState = step3MeasurementState;
    window._measurementDbLoaded = _measurementDbLoaded;
    window.loadMeasurementFromDB = loadMeasurementFromDB;
    window.saveMeasurementToDB = saveMeasurementToDB;
    window.getStep3State = getStep3State;
    window.toggleStep3Panel = toggleStep3Panel;
    window.updateStep3Field = updateStep3Field;
    window.rebuildZBOpeningSections = rebuildZBOpeningSections;
    window.saveStep3Measurement = saveStep3Measurement;
    window.scheduleStep3Appointment = scheduleStep3Appointment;
    window.addStep3Obstacle = addStep3Obstacle;
    window.removeStep3Obstacle = removeStep3Obstacle;
    window.generateStep3DetailedDesign = generateStep3DetailedDesign;

})();
