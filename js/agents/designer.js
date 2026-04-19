/**
 * Nestopia - AI Designer Agent
 * 命名空间: Nestopia.agents.designer
 */
(function() {
    'use strict';

    // 确保命名空间存在
    var N = window.Nestopia = window.Nestopia || {};
    N.agents = N.agents || {};

    // ── 模块私有变量 ──

    // ===================================================================
    // AI DESIGNER — Product Catalog Integration (Sunroom Focus)
    // ===================================================================
    var designerState = {
        selectedProjectId: null,
        selectedProductId: null,
        selectedSpan: null,
        selectedColor: 'black',
        generated: false
    };

    // Map project types to productCatalog filter keys
    var designerCategoryMap = {
        'Sunroom': 'sunroom',
        'Pergola': 'pergola',
        'Zip Blinds': 'blinds',
        'ADU': 'adu'
    };

    // Populate project dropdown from allProjectsData (visible projects only)
    function initDesignerProjects() {
        var sel = document.getElementById('designerProjectSelect');
        if (!sel) return;
        var opts = '<option value="">-- Select a project --</option>';
        allProjectsData.filter(function(p) { return !p.hidden; }).forEach(function(p) {
            opts += '<option value="' + p.id + '">' + p.name + ' — ' + p.customer + ' (' + p.type + ')</option>';
        });
        sel.innerHTML = opts;
    }

    // Called when user changes the project dropdown
    function onDesignerProjectChange() {
        var sel = document.getElementById('designerProjectSelect');
        var projId = sel.value;
        designerState.selectedProjectId = projId;
        designerState.selectedProductId = null;
        designerState.selectedSpan = null;
        designerState.generated = false;

        // Hide config & spec sections
        var configSection = document.getElementById('designerConfigSection');
        var specCard = document.getElementById('designerSpecCard');
        var selectedSummary = document.getElementById('designerSelectedSummary');
        if (configSection) configSection.classList.add('hidden');
        if (specCard) specCard.classList.add('hidden');
        if (selectedSummary) selectedSummary.classList.add('hidden');

        // Reset output
        resetDesignerOutput();

        if (!projId) {
            document.getElementById('designerProjectInfo').classList.add('hidden');
            document.getElementById('designerProductGrid').innerHTML = '<div class="col-span-full text-center py-8 text-gray-400"><i class="fas fa-arrow-up text-2xl mb-2"></i><p class="text-sm">Select a project above to see available products</p></div>';
            document.getElementById('designerProductBadge').classList.add('hidden');
            updateGenerateBtn();
            return;
        }

        var proj = allProjectsData.find(function(p) { return p.id === projId; });
        if (!proj) return;

        // Show project info
        var infoEl = document.getElementById('designerProjectInfo');
        infoEl.classList.remove('hidden');
        document.getElementById('designerClientName').textContent = proj.customer;
        document.getElementById('designerProjectType').textContent = proj.type;
        document.getElementById('designerProjectAddr').textContent = proj.customerAddress;
        document.getElementById('designerProjectBudget').textContent = '$' + (proj.budget / 1000).toFixed(0) + 'K';

        // Show product type badge
        var badge = document.getElementById('designerProductBadge');
        badge.textContent = proj.type;
        badge.classList.remove('hidden');

        // Render product cards based on project type
        var filterKey = designerCategoryMap[proj.type] || '';
        renderDesignerProductCards(filterKey, proj.type);

        updateGenerateBtn();
    }

    // Render product cards from productCatalog filtered by category
    function renderDesignerProductCards(filterKey, projectType) {
        var grid = document.getElementById('designerProductGrid');
        if (!grid) return;

        // For Sunroom: show all 6 products from catalog
        // For other types: show a "coming soon" placeholder
        if (filterKey !== 'sunroom') {
            grid.innerHTML = '<div class="col-span-full text-center py-8"><div class="text-gray-400 mb-2"><i class="fas fa-cube text-3xl"></i></div><p class="text-sm text-gray-500 font-medium">' + projectType + ' Product Selection</p><p class="text-xs text-gray-400 mt-1">Detailed product catalog integration coming soon.</p><p class="text-xs text-gray-400">For now, use generic configuration below.</p></div>';
            return;
        }

        var html = '';
        var catalogKeys = Object.keys(productCatalog);
        var sunroomProducts = catalogKeys.filter(function(key) {
            return productCatalog[key].category === filterKey;
        });

        sunroomProducts.forEach(function(key) {
            var p = productCatalog[key];
            var shapeLabel = p.shape ? p.shape : '';
            var seriesShort = p.series.replace(' Series', '').replace(' Type', '');
            var priceMin = p.cost.tiers[0].priceRange[0];
            var priceMax = p.cost.tiers[p.cost.tiers.length - 1].priceRange[1];
            var controlIcon = p.control === 'Manual' ? 'fa-hand-paper' : p.control === 'Motorized' ? 'fa-cog' : 'fa-solar-panel';
            var controlColor = p.control === 'Manual' ? 'text-gray-500' : p.control === 'Motorized' ? 'text-blue-500' : 'text-amber-500';

            html += '<div class="designer-product-card cursor-pointer" data-catalog-id="' + key + '" onclick="selectDesignerProduct(\'' + key + '\')">';
            html += '<div class="p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">';
            html += '<div class="flex items-start justify-between mb-2">';
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="font-semibold text-gray-900 text-sm leading-tight">' + p.name + '</div>';
            html += '<div class="text-xs text-gray-400 mt-0.5">' + (shapeLabel ? shapeLabel + ' · ' : '') + seriesShort + '</div>';
            html += '</div>';
            html += '<span class="' + controlColor + ' text-xs ml-2 flex-shrink-0"><i class="fas ' + controlIcon + '"></i></span>';
            html += '</div>';
            html += '<div class="flex items-center justify-between mt-3">';
            html += '<span class="text-xs text-gray-500"><i class="fas ' + controlIcon + ' mr-1"></i>' + p.control + '</span>';
            html += '<span class="text-xs font-medium text-indigo-600">$' + priceMin + '-' + priceMax + '/sqft</span>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
        });

        grid.innerHTML = html;
    }

    // Handle product card selection
    function selectDesignerProduct(catalogId) {
        designerState.selectedProductId = catalogId;
        var product = productCatalog[catalogId];
        if (!product) return;

        // Update card visual states
        document.querySelectorAll('.designer-product-card').forEach(function(card) {
            var inner = card.querySelector('div');
            if (card.dataset.catalogId === catalogId) {
                inner.className = 'p-4 border-2 border-indigo-500 bg-indigo-50 rounded-xl transition-all';
            } else {
                inner.className = 'p-4 border-2 border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all';
            }
        });

        // Show selected summary
        var summary = document.getElementById('designerSelectedSummary');
        summary.classList.remove('hidden');
        document.getElementById('designerSelectedName').textContent = product.name;
        var shapeMeta = product.shape ? product.shape + ' · ' : '';
        document.getElementById('designerSelectedMeta').textContent = shapeMeta + product.series + ' · ' + product.control;
        var priceMin = product.cost.tiers[0].priceRange[0];
        var priceMax = product.cost.tiers[product.cost.tiers.length - 1].priceRange[1];
        document.getElementById('designerSelectedPrice').innerHTML = '<div class="text-sm font-bold text-indigo-700">$' + priceMin + '-' + priceMax + '</div><div class="text-xs text-gray-400">per sqft</div>';

        // Show and populate config section
        var configSection = document.getElementById('designerConfigSection');
        configSection.classList.remove('hidden');

        // Control display
        var controlDisplay = document.getElementById('designerControlDisplay');
        var controlIcon = product.control === 'Manual' ? 'fa-hand-paper' : product.control === 'Motorized' ? 'fa-cog' : 'fa-solar-panel';
        controlDisplay.innerHTML = '<i class="fas ' + controlIcon + ' text-gray-400"></i><span class="text-sm font-medium text-gray-700">' + product.control + '</span><span class="ml-auto px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Auto-detected</span>';

        // Span selection buttons
        var spanGrid = document.getElementById('designerSpanGrid');
        var spanHTML = '';
        var colCount = product.spans.length;
        spanGrid.className = 'grid grid-cols-' + (colCount <= 3 ? '3' : '5') + ' gap-2';
        product.spans.forEach(function(span, idx) {
            var tier = product.cost.tiers[idx];
            var priceLabel = tier ? '$' + tier.priceRange[0] + '-' + tier.priceRange[1] : '';
            var isSelected = designerState.selectedSpan === span;
            var cls = isSelected
                ? 'px-2 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium cursor-pointer text-center'
                : 'px-2 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer text-center hover:bg-gray-50';
            spanHTML += '<button onclick="selectDesignerSpan(\'' + span + '\')" class="' + cls + '">' + span + '<br><span class="' + (isSelected ? 'text-indigo-200' : 'text-gray-400') + ' text-[10px]">' + priceLabel + '</span></button>';
        });
        spanGrid.innerHTML = spanHTML;
        // Auto-select first span
        if (!designerState.selectedSpan) {
            selectDesignerSpan(product.spans[0]);
        }

        // Components list
        var compEl = document.getElementById('designerComponents');
        compEl.innerHTML = product.components.map(function(c) {
            return '<div class="flex items-center gap-2 text-sm text-gray-600"><i class="fas fa-check text-green-500 text-xs"></i><span>' + c + '</span></div>';
        }).join('');

        // Extras section
        var extrasSection = document.getElementById('designerExtrasSection');
        var extrasEl = document.getElementById('designerExtras');
        if (product.extras && product.extras.length > 0) {
            extrasSection.classList.remove('hidden');
            extrasEl.innerHTML = product.extras.map(function(e) {
                return '<div class="flex items-center gap-2 text-sm"><i class="fas fa-star text-amber-500 text-xs"></i><span class="text-gray-700 font-medium">' + e + '</span></div>';
            }).join('');
        } else {
            extrasSection.classList.add('hidden');
        }

        // Update output Quick Stats
        updateDesignerStats(product);

        // Show Product Spec Card
        updateDesignerSpecCard(product);

        updateGenerateBtn();
    }

    // Select span
    function selectDesignerSpan(span) {
        designerState.selectedSpan = span;
        // Re-render span buttons to update selection state
        if (designerState.selectedProductId) {
            var product = productCatalog[designerState.selectedProductId];
            var spanGrid = document.getElementById('designerSpanGrid');
            var spanHTML = '';
            product.spans.forEach(function(s, idx) {
                var tier = product.cost.tiers[idx];
                var priceLabel = tier ? '$' + tier.priceRange[0] + '-' + tier.priceRange[1] : '';
                var isSelected = designerState.selectedSpan === s;
                var cls = isSelected
                    ? 'px-2 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium cursor-pointer text-center'
                    : 'px-2 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-medium cursor-pointer text-center hover:bg-gray-50';
                spanHTML += '<button onclick="selectDesignerSpan(\'' + s + '\')" class="' + cls + '">' + s + '<br><span class="' + (isSelected ? 'text-indigo-200' : 'text-gray-400') + ' text-[10px]">' + priceLabel + '</span></button>';
            });
            spanGrid.innerHTML = spanHTML;

            // Update price in stats for this span
            var spanIdx = product.spans.indexOf(span);
            if (spanIdx >= 0 && product.cost.tiers[spanIdx]) {
                var tier = product.cost.tiers[spanIdx];
                document.getElementById('statPriceRange').textContent = '$' + tier.priceRange[0] + '-' + tier.priceRange[1];
            }
        }
    }

    // Select color
    function selectDesignerColor(color) {
        designerState.selectedColor = color;
        document.querySelectorAll('.designer-color-btn').forEach(function(btn) {
            if (btn.dataset.color === color) {
                btn.classList.add('ring-2', 'ring-offset-2', 'ring-indigo-500');
            } else {
                btn.classList.remove('ring-2', 'ring-offset-2', 'ring-indigo-500');
            }
        });
    }

    // Update Quick Stats from product data
    function updateDesignerStats(product) {
        document.getElementById('statControl').textContent = product.control;
        var priceMin = product.cost.tiers[0].priceRange[0];
        var priceMax = product.cost.tiers[0].priceRange[1];
        document.getElementById('statPriceRange').textContent = '$' + priceMin + '-' + priceMax;
        document.getElementById('statLeadTime').textContent = product.leadTime;
        document.getElementById('statSeries').textContent = product.series.replace(' Series', '').replace(' Type', '');
    }

    // Update Product Spec Card
    function updateDesignerSpecCard(product) {
        var card = document.getElementById('designerSpecCard');
        card.classList.remove('hidden');
        document.getElementById('specProductName').textContent = product.name;

        var html = '';
        html += '<div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-500">Category</span><span class="font-medium text-gray-900">' + product.catLabel + '</span></div>';
        if (product.shape) {
            html += '<div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-500">Shape</span><span class="font-medium text-gray-900">' + product.shape + '</span></div>';
        }
        html += '<div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-500">Series</span><span class="font-medium text-gray-900">' + product.series + '</span></div>';
        html += '<div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-500">Control</span><span class="font-medium text-gray-900">' + product.control + '</span></div>';
        html += '<div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-500">Lead Time</span><span class="font-medium text-gray-900">' + product.leadTime + '</span></div>';
        html += '<div class="flex items-center justify-between py-2 border-b border-gray-100"><span class="text-gray-500">Colors</span><span class="font-medium text-gray-900">' + product.colors + '</span></div>';
        html += '<div class="flex items-center justify-between py-2"><span class="text-gray-500">Available Spans</span><span class="font-medium text-gray-900">' + product.spans.join(', ') + '</span></div>';

        document.getElementById('specContent').innerHTML = html;
        document.getElementById('specPricingNote').querySelector('span').textContent = product.cost.note;
    }

    // Reset output section
    function resetDesignerOutput() {
        var placeholder = document.getElementById('designPlaceholder');
        var afterContainer = document.getElementById('afterImageContainer');
        var beforeContainer = document.getElementById('beforeImageContainer');
        var variantsSection = document.getElementById('designVariantsSection');
        var statusBadge = document.getElementById('designPreviewStatus');

        if (placeholder) placeholder.classList.remove('hidden');
        if (afterContainer) afterContainer.classList.add('hidden');
        if (beforeContainer) beforeContainer.classList.add('hidden');
        if (variantsSection) variantsSection.classList.add('hidden');
        if (statusBadge) statusBadge.innerHTML = '<i class="fas fa-clock mr-1"></i>Waiting';
        statusBadge.className = 'px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full';

        // Reset stats
        document.getElementById('statControl').textContent = '—';
        document.getElementById('statPriceRange').textContent = '—';
        document.getElementById('statLeadTime').textContent = '—';
        document.getElementById('statSeries').textContent = '—';
    }

    // Enable/disable generate button
    function updateGenerateBtn() {
        var btn = document.getElementById('generateDesignBtn');
        if (!btn) return;
        var canGenerate = designerState.selectedProjectId && designerState.selectedProductId;
        btn.disabled = !canGenerate;
    }

    // Handle Generate Design click — calls real /api/design-generate backend
    function handleGenerateDesign() {
        if (!designerState.selectedProjectId || !designerState.selectedProductId) return;

        var product = productCatalog[designerState.selectedProductId];
        if (!product) return;

        // Get yard photo (base64 from upload)
        var yardPhotoImg = document.getElementById('yardPhotoImg');
        var yardPhotoSrc = yardPhotoImg ? yardPhotoImg.src : '';
        if (!yardPhotoSrc || yardPhotoSrc === '' || yardPhotoSrc === window.location.href) {
            showToast('Please upload a yard photo first', 'error');
            return;
        }

        // Show loading overlay
        var overlay = document.getElementById('loadingOverlay');
        var placeholder = document.getElementById('designPlaceholder');
        var statusText = document.getElementById('loadingStatusText');
        var elapsedText = document.getElementById('loadingElapsedText');
        var progressBar = document.getElementById('loadingProgressBar');
        overlay.classList.remove('hidden');
        if (placeholder) placeholder.classList.add('hidden');
        statusText.textContent = 'Generating AI design...';
        elapsedText.textContent = 'Connecting to AI model...';
        progressBar.style.width = '5%';

        // Disable generate button during processing
        var btn = document.getElementById('generateDesignBtn');
        if (btn) btn.disabled = true;

        // Fetch product image as base64, then call the API
        var productImageUrl = product.image;
        fetchImageAsBase64(productImageUrl, function(productBase64) {
            if (!productBase64) {
                showToast('Failed to load product image', 'error');
                overlay.classList.add('hidden');
                if (btn) btn.disabled = false;
                return;
            }

            // Call real backend API via SSE
            var requestBody = {
                background_image: yardPhotoSrc,
                foreground_image: productBase64,
                is_iteration: false
            };

            streamDesignGenerate(requestBody, {
                onProgress: function(elapsed) {
                    var pct = Math.min(90, 5 + elapsed * 1.5);
                    progressBar.style.width = pct + '%';
                    elapsedText.textContent = 'Processing... ' + elapsed + 's elapsed';
                    if (elapsed > 20) {
                        statusText.textContent = 'AI is blending the design...';
                    }
                },
                onFallback: function(message) {
                    statusText.textContent = 'Switching model...';
                    elapsedText.textContent = message;
                },
                onResult: function(data) {
                    overlay.classList.add('hidden');
                    progressBar.style.width = '100%';
                    if (btn) btn.disabled = false;

                    // Show AI-generated result
                    var afterContainer = document.getElementById('afterImageContainer');
                    var outputImg = document.getElementById('designOutputImg');
                    outputImg.src = data.result_image;
                    afterContainer.classList.remove('hidden');

                    // Update status badge
                    var statusBadge = document.getElementById('designPreviewStatus');
                    statusBadge.innerHTML = '<i class="fas fa-check-circle mr-1"></i>Ready';
                    statusBadge.className = 'px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full';

                    // Show variants section with the generated result
                    var variantsSection = document.getElementById('designVariantsSection');
                    variantsSection.classList.remove('hidden');
                    var thumbsHtml = '';
                    thumbsHtml += '<div class="variant-thumb w-20 h-20 rounded-lg overflow-hidden ring-2 ring-indigo-500 cursor-pointer"><img src="' + data.result_image + '" alt="Generated" class="w-full h-full object-cover"></div>';
                    thumbsHtml += '<div class="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 cursor-pointer hover:border-gray-400 hover:text-gray-500" title="Generate another variant"><i class="fas fa-plus"></i></div>';
                    document.getElementById('designVariantThumbs').innerHTML = thumbsHtml;

                    // Store result for potential iteration
                    designerState.lastResultImage = data.result_image;
                    designerState.generated = true;

                    var modelInfo = data.fallback_used ? ' (fallback: ' + data.model_used + ')' : '';
                    showToast('Design generated successfully' + modelInfo, 'success');
                },
                onError: function(message) {
                    overlay.classList.add('hidden');
                    if (btn) btn.disabled = false;
                    showToast('Generation failed: ' + message, 'error');
                }
            });
        });
    }

    // Fetch an image URL and convert to base64 data URL
    function fetchImageAsBase64(imageUrl, callback) {
        // If already a data URL, return as-is
        if (imageUrl && imageUrl.startsWith('data:')) {
            callback(imageUrl);
            return;
        }

        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            var canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
                var dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                callback(dataUrl);
            } catch (e) {
                console.error('Canvas toDataURL failed:', e);
                callback(null);
            }
        };
        img.onerror = function() {
            console.error('Failed to load image:', imageUrl);
            callback(null);
        };
        img.src = imageUrl;
    }

    // SSE streaming request to /api/design-generate
    function streamDesignGenerate(body, callbacks) {
        fetch('/api/design-generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        }).then(function(response) {
            if (!response.ok) {
                return response.json().then(function(errData) {
                    callbacks.onError(errData.error || 'Request failed');
                });
            }

            var reader = response.body.getReader();
            var decoder = new TextDecoder();
            var buffer = '';

            function readStream() {
                reader.read().then(function(result) {
                    if (result.done) return;

                    buffer += decoder.decode(result.value, { stream: true });
                    var events = buffer.split('\n\n');
                    buffer = events.pop();

                    for (var i = 0; i < events.length; i++) {
                        var line = events[i].trim();
                        if (!line.startsWith('data: ')) continue;
                        try {
                            var data = JSON.parse(line.substring(6));
                            switch (data.type) {
                                case 'processing':
                                case 'heartbeat':
                                    if (callbacks.onProgress) callbacks.onProgress(data.elapsed || 0);
                                    break;
                                case 'fallback':
                                    if (callbacks.onFallback) callbacks.onFallback(data.message);
                                    break;
                                case 'result':
                                    if (callbacks.onResult) callbacks.onResult(data);
                                    return;
                                case 'error':
                                    if (callbacks.onError) callbacks.onError(data.message);
                                    return;
                            }
                        } catch (e) {
                            console.warn('SSE parse error:', e);
                        }
                    }

                    readStream();
                }).catch(function(err) {
                    callbacks.onError('Stream read error: ' + err.message);
                });
            }

            readStream();
        }).catch(function(err) {
            callbacks.onError('Network error: ' + err.message);
        });
    }

    // Initialize designer when navigating to AI Designer page (deferred)
    // initDesignerProjects() is called from navigateToPage()

    // ===== AI Design Tool Toggle =====
    var aiToolVisible = false;

    function toggleAIDesignTool() {
        var section = document.getElementById('aiDesignToolSection');
        var icon = document.getElementById('aiToolToggleIcon');
        var card = document.getElementById('step4Card');

        aiToolVisible = !aiToolVisible;

        if (aiToolVisible) {
            section.classList.remove('hidden');
            section.style.animation = 'fadeInSlide 0.4s ease';
            icon.style.transform = 'rotate(180deg)';
            card.style.borderColor = 'var(--primary)';
            card.style.background = '#f9fafb';
        } else {
            section.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
            card.style.borderColor = '';
            card.style.background = '';
        }
    }

    // ===== AI Design Tool Functions (stubs) =====
    function handleImageUpload(input, type) {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(type + 'Preview').classList.remove('hidden');
            document.getElementById(type + 'Placeholder').classList.add('hidden');
            document.getElementById(type + 'PreviewImg').src = e.target.result;
            checkGenerateReady();
        };
        reader.readAsDataURL(file);
    }

    function clearImage(type) {
        document.getElementById(type + 'Preview').classList.add('hidden');
        document.getElementById(type + 'Placeholder').classList.remove('hidden');
        document.getElementById(type + 'PreviewImg').src = '';
        document.getElementById(type + 'Input').value = '';
        checkGenerateReady();
    }

    function checkGenerateReady() {
        var bgReady = document.getElementById('bgPreviewImg').src !== '';
        var btn = document.getElementById('generateBtn');
        if (bgReady) {
            btn.disabled = false;
            btn.classList.remove('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
            btn.classList.add('bg-[--primary]', 'text-white', 'hover:bg-gray-700');
        } else {
            btn.disabled = true;
            btn.classList.add('bg-gray-300', 'text-gray-500', 'cursor-not-allowed');
            btn.classList.remove('bg-[--primary]', 'text-white', 'hover:bg-gray-700');
        }
    }

    function generateDesign() {
        var indicator = document.getElementById('generatingIndicator');
        var btn = document.getElementById('generateBtn');
        indicator.classList.remove('hidden');
        btn.disabled = true;

        // Simulate AI generation
        setTimeout(function() {
            indicator.classList.add('hidden');
            btn.disabled = false;
            alert('AI Design generation will be connected to the backend API.');
        }, 2000);
    }

    function resetDesignTool() {
        clearImage('bg');
        clearImage('ref');
        document.getElementById('customPromptInput').value = '';
        document.getElementById('charCount').textContent = '0/800';
        document.getElementById('resultArea').classList.add('hidden');
    }

    function updateCharCount() {
        var input = document.getElementById('customPromptInput');
        document.getElementById('charCount').textContent = input.value.length + '/800';
    }

    function continueEdit() {
        alert('Continue edit will be connected to the backend API.');
    }

    function downloadResult() {
        alert('Download will be available once the AI generation is connected.');
    }

    function resetToInitial() {
        resetDesignTool();
    }

    // ===== AI Designer Page — Legacy Helpers =====
    // (Old dummy data and init removed — replaced by Product Catalog integration above)

    // Dummy project data (kept for Compliance Agent backward compatibility)
    var dummyProjects = {
        'proj-001': { name: 'Sunshine Villa', client: 'Mr. Johnson', address: '123 Sunshine Ave, Los Angeles, CA', yardSize: '~400 sq ft', budget: '$15,000 - $25,000', type: 'sunroom' },
        'proj-002': { name: 'Riverside Estate', client: 'Ms. Chen', address: '456 River Rd, San Jose, CA', yardSize: '~600 sq ft', budget: '$80,000 - $120,000', type: 'adu' },
        'proj-003': { name: 'Oak Garden', client: 'Mr. Williams', address: '789 Oak St, San Diego, CA', yardSize: '~300 sq ft', budget: '$8,000 - $15,000', type: 'pergola' },
        'proj-004': { name: 'Lakeside Retreat', client: 'Mrs. Davis', address: '321 Lake Dr, Sacramento, CA', yardSize: '~200 sq ft', budget: '$5,000 - $10,000', type: 'blinds' }
    };

    // Yard photo upload (reused by new designer)
    function initDesignerPhotoUpload() {
        var uploadArea = document.getElementById('yardPhotoUpload');
        var photoInput = document.getElementById('yardPhotoInput');
        if (uploadArea && photoInput) {
            uploadArea.addEventListener('click', function() { photoInput.click(); });
            photoInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(event) {
                    document.getElementById('yardPhotoPlaceholder').classList.add('hidden');
                    document.getElementById('yardPhotoPreview').classList.remove('hidden');
                    document.getElementById('yardPhotoImg').src = event.target.result;
                };
                reader.readAsDataURL(file);
            });
            uploadArea.addEventListener('dragover', function(e) { e.preventDefault(); uploadArea.classList.add('border-indigo-400', 'bg-indigo-50'); });
            uploadArea.addEventListener('dragleave', function() { uploadArea.classList.remove('border-indigo-400', 'bg-indigo-50'); });
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.classList.remove('border-indigo-400', 'bg-indigo-50');
                if (e.dataTransfer.files.length) {
                    photoInput.files = e.dataTransfer.files;
                    photoInput.dispatchEvent(new Event('change'));
                }
            });
        }
        var removeBtn = document.getElementById('yardPhotoRemove');
        if (removeBtn) {
            removeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                document.getElementById('yardPhotoInput').value = '';
                document.getElementById('yardPhotoPlaceholder').classList.remove('hidden');
                document.getElementById('yardPhotoPreview').classList.add('hidden');
            });
        }
    }

    function initAIDesignerPage() { /* placeholder – AI Designer module pending */ }

    // Initialize photo upload handlers
    initDesignerPhotoUpload();

    // ── 公开 API ──
    N.agents.designer = {
        designerState: designerState,
        designerCategoryMap: designerCategoryMap,
        aiToolVisible: aiToolVisible,
        dummyProjects: dummyProjects,
        initDesignerProjects: initDesignerProjects,
        onDesignerProjectChange: onDesignerProjectChange,
        renderDesignerProductCards: renderDesignerProductCards,
        selectDesignerProduct: selectDesignerProduct,
        selectDesignerSpan: selectDesignerSpan,
        selectDesignerColor: selectDesignerColor,
        updateDesignerStats: updateDesignerStats,
        updateDesignerSpecCard: updateDesignerSpecCard,
        resetDesignerOutput: resetDesignerOutput,
        updateGenerateBtn: updateGenerateBtn,
        handleGenerateDesign: handleGenerateDesign,
        fetchImageAsBase64: fetchImageAsBase64,
        streamDesignGenerate: streamDesignGenerate,
        toggleAIDesignTool: toggleAIDesignTool,
        handleImageUpload: handleImageUpload,
        clearImage: clearImage,
        checkGenerateReady: checkGenerateReady,
        generateDesign: generateDesign,
        resetDesignTool: resetDesignTool,
        updateCharCount: updateCharCount,
        continueEdit: continueEdit,
        downloadResult: downloadResult,
        resetToInitial: resetToInitial,
        initDesignerPhotoUpload: initDesignerPhotoUpload,
        initAIDesignerPage: initAIDesignerPage
    };

    // ── 全局别名桥接（Phase A — onclick 兼容） ──
    window.designerState = designerState;
    window.designerCategoryMap = designerCategoryMap;
    window.aiToolVisible = aiToolVisible;
    window.dummyProjects = dummyProjects;
    window.initDesignerProjects = initDesignerProjects;
    window.onDesignerProjectChange = onDesignerProjectChange;
    window.renderDesignerProductCards = renderDesignerProductCards;
    window.selectDesignerProduct = selectDesignerProduct;
    window.selectDesignerSpan = selectDesignerSpan;
    window.selectDesignerColor = selectDesignerColor;
    window.updateDesignerStats = updateDesignerStats;
    window.updateDesignerSpecCard = updateDesignerSpecCard;
    window.resetDesignerOutput = resetDesignerOutput;
    window.updateGenerateBtn = updateGenerateBtn;
    window.handleGenerateDesign = handleGenerateDesign;
    window.fetchImageAsBase64 = fetchImageAsBase64;
    window.streamDesignGenerate = streamDesignGenerate;
    window.toggleAIDesignTool = toggleAIDesignTool;
    window.handleImageUpload = handleImageUpload;
    window.clearImage = clearImage;
    window.checkGenerateReady = checkGenerateReady;
    window.generateDesign = generateDesign;
    window.resetDesignTool = resetDesignTool;
    window.updateCharCount = updateCharCount;
    window.continueEdit = continueEdit;
    window.downloadResult = downloadResult;
    window.resetToInitial = resetToInitial;
    window.initDesignerPhotoUpload = initDesignerPhotoUpload;
    window.initAIDesignerPage = initAIDesignerPage;
})();
