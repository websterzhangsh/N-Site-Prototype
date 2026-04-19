/**
 * Nestopia - Step 2: AI Design 实现
 * 命名空间: Nestopia.steps.step2
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.steps = N.steps || {};

    // ===== Step 2: AI Designer Helper Functions =====
    let designerSelectedStyles = {};  // keyed by project_id
    let designerUploadedPhotos = {};  // keyed by project_id

    function toggleDesignStyle(el, styleValue) {
        const projectId = currentDetailProject?.id;
        if (!projectId) return;
        if (!designerSelectedStyles[projectId]) designerSelectedStyles[projectId] = [];
        const styles = designerSelectedStyles[projectId];
        const idx = styles.indexOf(styleValue);
        if (idx > -1) {
            styles.splice(idx, 1);
            el.classList.remove('border-indigo-400', 'bg-indigo-50/60', 'ring-1', 'ring-indigo-200');
            el.classList.add('border-gray-100');
            el.querySelector('div').classList.remove('bg-indigo-100', 'text-indigo-600');
            el.querySelector('div').classList.add('bg-gray-100', 'text-gray-400');
            const check = el.querySelector('.fa-check-circle');
            if (check) check.remove();
        } else {
            if (styles.length >= 3) {
                showToast('Maximum 3 styles can be selected', 'error');
                return;
            }
            styles.push(styleValue);
            el.classList.add('border-indigo-400', 'bg-indigo-50/60', 'ring-1', 'ring-indigo-200');
            el.classList.remove('border-gray-100');
            el.querySelector('div').classList.add('bg-indigo-100', 'text-indigo-600');
            el.querySelector('div').classList.remove('bg-gray-100', 'text-gray-400');
            if (!el.querySelector('.fa-check-circle')) {
                el.insertAdjacentHTML('beforeend', '<i class="fas fa-check-circle text-indigo-500 text-[10px]"></i>');
            }
        }
        // 自动同步到 Supabase
        if (projectId) saveDesignerToDB(projectId);
    }

    function triggerPhotoUpload(projectId) {
        triggerStep2PhotoUpload(projectId, 0);
    }

    // ===== Step 2 Inline AI Designer Functions =====
    // State: { photos: [base64|null x3], selectedProduct, generated, lastResultImage, currentIteration, maxIterations }
    var step2DesignerState = {};
    var _designerDbLoaded = {};  // 标记已从 DB 加载的项目

    // ── Supabase Designer 持久化 ──────────────────────────
    function loadDesignerFromDB(projectId) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
        return NestopiaDB.getClient()
            .from('project_designer_state')
            .select('designer_data')
            .eq('tenant_id', NestopiaDB.getTenantId())
            .eq('project_key', projectId)
            .maybeSingle()
            .then(function(res) {
                if (res.error) { console.warn('[Designer] DB load error:', res.error.message); return null; }
                return (res.data && res.data.designer_data) ? res.data.designer_data : null;
            })
            .catch(function(err) { console.warn('[Designer] DB load failed:', err.message); return null; });
    }

    function saveDesignerToDB(projectId) {
        if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
        var state = getStep2State(projectId);
        var styles = designerSelectedStyles[projectId] || [];
        var payload = {
            tenant_id: NestopiaDB.getTenantId(),
            project_key: projectId,
            designer_data: JSON.parse(JSON.stringify({
                photos: state.photos,
                selectedProduct: state.selectedProduct,
                generated: state.generated,
                lastResultImage: state.lastResultImage,
                currentIteration: state.currentIteration,
                maxIterations: state.maxIterations,
                selectedStyles: styles
            })),
            updated_at: new Date().toISOString()
        };
        return NestopiaDB.getClient()
            .from('project_designer_state')
            .upsert(payload, { onConflict: 'tenant_id,project_key' })
            .then(function(res) {
                if (res.error) { console.warn('[Designer] DB save error:', res.error.message); return false; }
                console.log('[Designer] Saved to Supabase:', projectId);
                return true;
            })
            .catch(function(err) { console.warn('[Designer] DB save failed:', err.message); return false; });
    }

    function getStep2State(projectId) {
        if (!step2DesignerState[projectId]) {
            step2DesignerState[projectId] = {
                photos: [null, null, null],
                selectedProduct: null,
                generated: false,
                lastResultImage: null,
                currentIteration: 0,
                maxIterations: 2
            };
        }
        return step2DesignerState[projectId];
    }

    function toggleStep2Designer(projectId) {
        var panel = document.getElementById('step2DesignerPanel_' + projectId);
        var btn = document.getElementById('step2LaunchBtn_' + projectId);
        if (!panel) return;
        if (panel.classList.contains('hidden')) {
            // Warn if project is past Step 2 — additional fees may apply
            var project = allProjectsData.find(p => p.id === projectId);
            var stepNames = { 3: 'Measurement & Design', 4: 'Quotation', 5: 'Production', 6: 'Installation' };
            if (project && project.workflowStep > 2) {
                if (!confirm('⚠️ This project is currently at Step ' + project.workflowStep + ' (' + (stepNames[project.workflowStep] || '') + ').\n\nRe-launching the AI Designer at this stage may incur additional design fees.\n\nDo you want to proceed?')) {
                    return;
                }
            }
            // 打开前先从 Supabase 加载最新设计师数据（仅首次）
            if (!_designerDbLoaded[projectId] && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                _designerDbLoaded[projectId] = true;
                loadDesignerFromDB(projectId).then(function(dbData) {
                    if (dbData && typeof dbData === 'object') {
                        var state = getStep2State(projectId);
                        if (dbData.photos && Array.isArray(dbData.photos)) state.photos = dbData.photos;
                        if (dbData.selectedProduct) state.selectedProduct = dbData.selectedProduct;
                        if (dbData.generated !== undefined) state.generated = dbData.generated;
                        if (dbData.lastResultImage) state.lastResultImage = dbData.lastResultImage;
                        if (dbData.currentIteration !== undefined) state.currentIteration = dbData.currentIteration;
                        if (dbData.selectedStyles && Array.isArray(dbData.selectedStyles)) {
                            designerSelectedStyles[projectId] = dbData.selectedStyles;
                        }
                        console.log('[Designer] Loaded from Supabase for', projectId);
                        // 重新渲染面板以反映加载的数据
                        if (expandedStep === 2 && currentDetailProject) {
                            toggleStepDetail(expandedStep, currentDetailProject);
                            toggleStepDetail(expandedStep, currentDetailProject);
                        }
                    }
                });
            }
            panel.classList.remove('hidden');
            btn.innerHTML = '<i class="fas fa-chevron-up text-[10px]"></i> Collapse';
            btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
            btn.classList.add('bg-gray-500', 'hover:bg-gray-600');
        } else {
            panel.classList.add('hidden');
            btn.innerHTML = '<i class="fas fa-rocket text-[10px]"></i> Launch Designer';
            btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
            btn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
        }
    }

    // --- Multi-Photo Upload (up to 3 slots) ---
    function triggerStep2PhotoUpload(projectId, slotIndex) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) { input.remove(); return; }
            var reader = new FileReader();
            reader.onload = function(ev) {
                var state = getStep2State(projectId);
                state.photos[slotIndex] = ev.target.result;
                // Update slot UI
                var slot = document.getElementById('step2PhotoSlot' + slotIndex + '_' + projectId);
                if (slot) {
                    var placeholder = slot.querySelector('.step2-photo-placeholder');
                    var img = slot.querySelector('.step2-photo-img');
                    var removeBtn = slot.querySelector('.step2-photo-remove');
                    if (placeholder) placeholder.classList.add('hidden');
                    if (img) { img.src = ev.target.result; img.classList.remove('hidden'); }
                    if (removeBtn) removeBtn.classList.remove('hidden');
                }
                updateStep2PhotoCount(projectId);
                updateStep2GenerateBtn(projectId);
                // 自动同步到 Supabase
                saveDesignerToDB(projectId);
            };
            reader.readAsDataURL(file);
            input.remove();
        };
        document.body.appendChild(input);
        input.click();
    }

    function clearStep2Photo(projectId, slotIndex) {
        var state = getStep2State(projectId);
        state.photos[slotIndex] = null;
        var slot = document.getElementById('step2PhotoSlot' + slotIndex + '_' + projectId);
        if (slot) {
            var placeholder = slot.querySelector('.step2-photo-placeholder');
            var img = slot.querySelector('.step2-photo-img');
            var removeBtn = slot.querySelector('.step2-photo-remove');
            if (placeholder) placeholder.classList.remove('hidden');
            if (img) { img.classList.add('hidden'); img.src = ''; }
            if (removeBtn) removeBtn.classList.add('hidden');
        }
        updateStep2PhotoCount(projectId);
        updateStep2GenerateBtn(projectId);
        // 自动同步到 Supabase
        saveDesignerToDB(projectId);
    }

    function updateStep2PhotoCount(projectId) {
        var state = getStep2State(projectId);
        var count = state.photos.filter(function(p) { return !!p; }).length;
        var el = document.getElementById('step2PhotoCount_' + projectId);
        if (el) el.textContent = count + '/3 uploaded';
    }

    // --- Character Count (Design Prompt & Iteration Prompt, 800 char limit) ---
    function updateStep2CharCount(projectId) {
        var input = document.getElementById('step2PromptInput_' + projectId);
        var counter = document.getElementById('step2CharCount_' + projectId);
        if (input && counter) counter.textContent = input.value.length + '/800';
    }

    function updateStep2IterCharCount(projectId) {
        var input = document.getElementById('step2IterPromptInput_' + projectId);
        var counter = document.getElementById('step2IterCharCount_' + projectId);
        if (input && counter) counter.textContent = input.value.length + '/800';
    }

    // --- Product Selection ---
    function selectStep2Product(projectId, catalogId, el) {
        var state = getStep2State(projectId);
        state.selectedProduct = catalogId;
        // Update card visuals
        var container = el.closest('.grid');
        container.querySelectorAll('.step2-product-card').forEach(function(card) {
            card.classList.remove('border-indigo-400', 'bg-indigo-50/60', 'ring-1', 'ring-indigo-200');
            card.classList.add('border-gray-100');
            card.querySelectorAll('div')[0].classList.remove('bg-indigo-100', 'text-indigo-600');
            card.querySelectorAll('div')[0].classList.add('bg-gray-100', 'text-gray-400');
        });
        el.classList.add('border-indigo-400', 'bg-indigo-50/60', 'ring-1', 'ring-indigo-200');
        el.classList.remove('border-gray-100');
        el.querySelectorAll('div')[0].classList.add('bg-indigo-100', 'text-indigo-600');
        el.querySelectorAll('div')[0].classList.remove('bg-gray-100', 'text-gray-400');
        // Update label
        var product = productCatalog[catalogId];
        var label = document.getElementById('step2ProductLabel_' + projectId);
        if (label && product) label.textContent = product.name;
        // Update stats
        if (product) {
            var tier0 = product.cost.tiers[0].priceRange;
            document.getElementById('step2StatControl_' + projectId).textContent = product.control;
            document.getElementById('step2StatPrice_' + projectId).textContent = '$' + tier0[0] + '-' + tier0[1];
            document.getElementById('step2StatLead_' + projectId).textContent = product.leadTime;
            document.getElementById('step2StatSeries_' + projectId).textContent = product.series.replace(' Series', '');
        }
        updateStep2GenerateBtn(projectId);
        // 自动同步到 Supabase
        saveDesignerToDB(projectId);
    }

    // --- Generate Button Enable/Disable ---
    function updateStep2GenerateBtn(projectId) {
        var btn = document.getElementById('step2GenerateBtn_' + projectId);
        if (!btn) return;
        var state = getStep2State(projectId);
        // Require at least main photo (slot 0) and a product selected
        var hasMainPhoto = !!state.photos[0];
        btn.disabled = !(hasMainPhoto && state.selectedProduct);
    }

    // --- Download / Save Generated Design ---
    function downloadStep2Design(projectId) {
        var state = getStep2State(projectId);
        if (state && state.lastResultImage) {
            var link = document.createElement('a');
            link.href = state.lastResultImage;
            link.download = 'design-' + projectId + '-' + Date.now() + '.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast('Design image saved!', 'success');
        }
    }

    // --- Iteration / Refinement (max 2 additional rounds) ---
    function openStep2IterateDialog(projectId) {
        var state = getStep2State(projectId);
        if (state.currentIteration >= state.maxIterations) {
            showToast('Maximum refinements reached (' + state.maxIterations + '/' + state.maxIterations + ')', 'warning');
            return;
        }
        var panel = document.getElementById('step2IteratePanel_' + projectId);
        if (panel) panel.classList.toggle('hidden');
    }

    function executeStep2Iterate(projectId) {
        var state = getStep2State(projectId);
        if (!state || !state.lastResultImage) return;
        if (state.currentIteration >= state.maxIterations) {
            showToast('Maximum refinements reached', 'warning');
            return;
        }

        var promptInput = document.getElementById('step2IterPromptInput_' + projectId);
        var editPrompt = promptInput ? promptInput.value.trim() : '';
        if (!editPrompt) {
            showToast('Please enter refinement instructions', 'error');
            return;
        }

        // Show iteration loading
        var iterLoading = document.getElementById('step2IterLoading_' + projectId);
        var iterLoadingText = document.getElementById('step2IterLoadingText_' + projectId);
        if (iterLoading) iterLoading.classList.remove('hidden');

        // Also show main render loading overlay
        var renderLoading = document.getElementById('step2RenderLoading_' + projectId);
        var loadingText = document.getElementById('step2LoadingText_' + projectId);
        var loadingElapsed = document.getElementById('step2LoadingElapsed_' + projectId);
        if (renderLoading) renderLoading.classList.remove('hidden');
        if (loadingText) loadingText.textContent = 'Refining design...';
        if (loadingElapsed) loadingElapsed.textContent = 'Applying your modifications...';

        var body = {
            background_image: state.lastResultImage,
            prompt: editPrompt,
            is_iteration: true
        };

        streamDesignGenerate(body, {
            onProgress: function(elapsed) {
                if (iterLoadingText) iterLoadingText.textContent = 'Refining... ' + elapsed + 's';
                if (loadingElapsed) loadingElapsed.textContent = 'Processing... ' + elapsed + 's elapsed';
            },
            onFallback: function(msg) {
                if (loadingText) loadingText.textContent = 'Switching model...';
                if (loadingElapsed) loadingElapsed.textContent = msg;
            },
            onResult: function(data) {
                if (iterLoading) iterLoading.classList.add('hidden');
                if (renderLoading) renderLoading.classList.add('hidden');

                state.currentIteration++;
                state.lastResultImage = data.result_image;

                // Update rendered image (cache-bust for forced refresh)
                var img = document.getElementById('step2RenderImg_' + projectId);
                if (img) {
                    img.src = '';
                    var cacheBust = data.result_image + (data.result_image.includes('?') ? '&' : '?') + '_t=' + Date.now();
                    img.src = cacheBust;
                }

                // Clear iteration prompt
                if (promptInput) promptInput.value = '';
                updateStep2IterCharCount(projectId);

                // Update remaining refinement count
                var remaining = state.maxIterations - state.currentIteration;
                var remainingEl = document.getElementById('step2IterRemaining_' + projectId);
                if (remainingEl) remainingEl.textContent = remaining;

                // Disable refine button if no iterations left
                if (remaining <= 0) {
                    var iterBtn = document.getElementById('step2IterateBtn_' + projectId);
                    if (iterBtn) {
                        iterBtn.disabled = true;
                        iterBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    }
                    var iterPanel = document.getElementById('step2IteratePanel_' + projectId);
                    if (iterPanel) iterPanel.classList.add('hidden');
                }

                showToast('Refinement round ' + state.currentIteration + '/' + state.maxIterations + ' complete!', 'success');
            },
            onError: function(msg) {
                if (iterLoading) iterLoading.classList.add('hidden');
                if (renderLoading) renderLoading.classList.add('hidden');
                showToast('Refinement failed: ' + msg, 'error');
            }
        });
    }

    // --- Main Generate Function (with prompt support) ---
    function generateStep2Design(projectId) {
        var state = getStep2State(projectId);
        if (!state || !state.photos[0] || !state.selectedProduct) return;
        var product = productCatalog[state.selectedProduct];
        if (!product) return;

        // Get optional design prompt
        var promptInput = document.getElementById('step2PromptInput_' + projectId);
        var promptText = promptInput ? promptInput.value.trim() : '';

        // Reset iteration state for fresh generation
        state.currentIteration = 0;
        state.generated = false;
        state.lastResultImage = null;

        // Show loading
        var loading = document.getElementById('step2RenderLoading_' + projectId);
        var placeholder = document.getElementById('step2RenderPlaceholder_' + projectId);
        var statusEl = document.getElementById('step2RenderStatus_' + projectId);
        var loadingText = document.getElementById('step2LoadingText_' + projectId);
        var loadingElapsed = document.getElementById('step2LoadingElapsed_' + projectId);
        loading.classList.remove('hidden');
        if (placeholder) placeholder.classList.add('hidden');
        statusEl.textContent = 'Generating...';
        statusEl.className = 'px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded-full';
        var btn = document.getElementById('step2GenerateBtn_' + projectId);
        if (btn) btn.disabled = true;

        // Hide post-gen actions from any previous generation
        var postGenActions = document.getElementById('step2PostGenActions_' + projectId);
        if (postGenActions) postGenActions.classList.add('hidden');
        var iterPanel = document.getElementById('step2IteratePanel_' + projectId);
        if (iterPanel) iterPanel.classList.add('hidden');

        // Fetch product image as base64, then call SSE API
        fetchImageAsBase64(product.image, function(productBase64) {
            if (!productBase64) {
                showToast('Failed to load product image', 'error');
                loading.classList.add('hidden');
                if (btn) btn.disabled = false;
                return;
            }
            var body = {
                background_image: state.photos[0],
                foreground_image: productBase64,
                is_iteration: false
            };
            if (promptText) body.prompt = promptText;

            streamDesignGenerate(body, {
                onProgress: function(elapsed) {
                    loadingElapsed.textContent = 'Processing... ' + elapsed + 's elapsed';
                    if (elapsed > 20) loadingText.textContent = 'AI is blending the design...';
                },
                onFallback: function(msg) {
                    loadingText.textContent = 'Switching model...';
                    loadingElapsed.textContent = msg;
                },
                onResult: function(data) {
                    loading.classList.add('hidden');
                    if (btn) btn.disabled = false;
                    // Show result
                    var result = document.getElementById('step2RenderResult_' + projectId);
                    var img = document.getElementById('step2RenderImg_' + projectId);
                    img.src = data.result_image;
                    result.classList.remove('hidden');
                    statusEl.innerHTML = '<i class="fas fa-check-circle mr-1"></i>Ready';
                    statusEl.className = 'px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-medium rounded-full';
                    state.generated = true;
                    state.lastResultImage = data.result_image;

                    // Show post-generation actions (Save + Refine)
                    if (postGenActions) postGenActions.classList.remove('hidden');
                    // Reset iteration UI for fresh generation
                    var remainingEl = document.getElementById('step2IterRemaining_' + projectId);
                    if (remainingEl) remainingEl.textContent = '2';
                    var iterBtn = document.getElementById('step2IterateBtn_' + projectId);
                    if (iterBtn) {
                        iterBtn.disabled = false;
                        iterBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    }

                    var modelInfo = data.fallback_used ? ' (fallback: ' + data.model_used + ')' : '';
                    showToast('Design generated successfully' + modelInfo, 'success');
                },
                onError: function(msg) {
                    loading.classList.add('hidden');
                    if (btn) btn.disabled = false;
                    statusEl.textContent = 'Error';
                    statusEl.className = 'px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-medium rounded-full';
                    showToast('Generation failed: ' + msg, 'error');
                }
            });
        });
    }

    // ===== 命名空间导出 =====
    N.steps.step2 = {
        designerSelectedStyles: designerSelectedStyles,
        designerUploadedPhotos: designerUploadedPhotos,
        step2DesignerState: step2DesignerState,
        _designerDbLoaded: _designerDbLoaded,
        toggleDesignStyle: toggleDesignStyle,
        triggerPhotoUpload: triggerPhotoUpload,
        loadDesignerFromDB: loadDesignerFromDB,
        saveDesignerToDB: saveDesignerToDB,
        getStep2State: getStep2State,
        toggleStep2Designer: toggleStep2Designer,
        triggerStep2PhotoUpload: triggerStep2PhotoUpload,
        clearStep2Photo: clearStep2Photo,
        updateStep2PhotoCount: updateStep2PhotoCount,
        updateStep2CharCount: updateStep2CharCount,
        updateStep2IterCharCount: updateStep2IterCharCount,
        selectStep2Product: selectStep2Product,
        updateStep2GenerateBtn: updateStep2GenerateBtn,
        downloadStep2Design: downloadStep2Design,
        openStep2IterateDialog: openStep2IterateDialog,
        executeStep2Iterate: executeStep2Iterate,
        generateStep2Design: generateStep2Design
    };

    // ===== 全局别名（保持向后兼容） =====
    window.designerSelectedStyles = designerSelectedStyles;
    window.designerUploadedPhotos = designerUploadedPhotos;
    window.step2DesignerState = step2DesignerState;
    window._designerDbLoaded = _designerDbLoaded;
    window.toggleDesignStyle = toggleDesignStyle;
    window.triggerPhotoUpload = triggerPhotoUpload;
    window.loadDesignerFromDB = loadDesignerFromDB;
    window.saveDesignerToDB = saveDesignerToDB;
    window.getStep2State = getStep2State;
    window.toggleStep2Designer = toggleStep2Designer;
    window.triggerStep2PhotoUpload = triggerStep2PhotoUpload;
    window.clearStep2Photo = clearStep2Photo;
    window.updateStep2PhotoCount = updateStep2PhotoCount;
    window.updateStep2CharCount = updateStep2CharCount;
    window.updateStep2IterCharCount = updateStep2IterCharCount;
    window.selectStep2Product = selectStep2Product;
    window.updateStep2GenerateBtn = updateStep2GenerateBtn;
    window.downloadStep2Design = downloadStep2Design;
    window.openStep2IterateDialog = openStep2IterateDialog;
    window.executeStep2Iterate = executeStep2Iterate;
    window.generateStep2Design = generateStep2Design;
})();
