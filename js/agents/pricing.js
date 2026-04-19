/**
 * Nestopia - Pricing Agent (Zip Blinds 6-Strategy Engine)
 * 命名空间: Nestopia.agents.pricing
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.agents = N.agents || {};

    // Reference pricing data from data layer
    var zbProductTiers = Nestopia.data.pricing.zbProductTiers;
    var zbDriveSystems = Nestopia.data.pricing.zbDriveSystems;
    var zbFabricUpgrades = Nestopia.data.pricing.zbFabricUpgrades;
    var zbHeightSurcharges = Nestopia.data.pricing.zbHeightSurcharges;
    var zbHardwareCostPerUnit = Nestopia.data.pricing.zbHardwareCostPerUnit;

    // ===== Pricing Agent State =====
    var pricingAgentState = {
        selectedProject: 'proj-004',
        productTier: 'better',       // good / better / best
        fabric: 'np4000',            // np4000 / np6000 / np8000
        width: 2.4,                  // meters
        dropHeight: 2.0,             // meters
        quantity: 4,
        driveSystem: 'electric-std',
        pricingMode: 'retail',       // retail / wholesale (Strategy 6: Dual Price List)
        discount: 5,
        installation: 45,            // per unit
        selectedQuote: 'recommended'
    };

    // ===== Pricing Engine Helper Functions =====

    // Strategy 2: Get the applicable area tier for a product line
    function getAreaTier(productTier, unitArea) {
        var tiers = zbProductTiers[productTier].tiers;
        for (var i = 0; i < tiers.length; i++) {
            if (unitArea <= tiers[i].maxArea) return tiers[i];
        }
        return tiers[tiers.length - 1];
    }

    // Strategy 4: Get height surcharge based on drop height
    function getHeightSurcharge(dropHeight) {
        for (var i = 0; i < zbHeightSurcharges.length; i++) {
            if (dropHeight <= zbHeightSurcharges[i].maxHeight) return zbHeightSurcharges[i];
        }
        return zbHeightSurcharges[zbHeightSurcharges.length - 1];
    }

    // Strategy 3: Minimum charge floor — area < 1 sqm billed as 1 sqm
    function getEffectiveArea(rawArea) {
        return Math.max(1, rawArea);
    }

    // Strategy 5: Product tier selector
    function selectProductTier(tier) {
        pricingAgentState.productTier = tier;
        document.querySelectorAll('.product-tier-card > div').forEach(function(card) {
            card.classList.remove('border-emerald-500', 'bg-emerald-50');
            card.classList.add('border-gray-200');
            var badge = card.querySelector('.absolute');
            if (badge) badge.style.display = 'none';
        });
        var selectedCard = document.querySelector('.product-tier-card[data-tier="' + tier + '"] > div');
        if (selectedCard) {
            selectedCard.classList.remove('border-gray-200');
            selectedCard.classList.add('border-emerald-500', 'bg-emerald-50');
            var badge = selectedCard.querySelector('.absolute');
            if (badge) badge.style.display = '';
        }
        updateZbArea();
    }

    // Strategy 6: Dual pricing mode toggle
    function setPricingMode(mode) {
        pricingAgentState.pricingMode = mode;
        var retailBtn = document.getElementById('priceModeRetail');
        var wholesaleBtn = document.getElementById('priceModeWholesale');
        if (mode === 'retail') {
            retailBtn.classList.add('bg-white', 'shadow', 'text-gray-900');
            retailBtn.classList.remove('text-gray-500');
            wholesaleBtn.classList.remove('bg-white', 'shadow', 'text-gray-900');
            wholesaleBtn.classList.add('text-gray-500');
        } else {
            wholesaleBtn.classList.add('bg-white', 'shadow', 'text-gray-900');
            wholesaleBtn.classList.remove('text-gray-500');
            retailBtn.classList.remove('bg-white', 'shadow', 'text-gray-900');
            retailBtn.classList.add('text-gray-500');
        }
        updateZbArea();
    }

    // Quantity stepper
    function adjustZbQty(delta) {
        var input = document.getElementById('zbQuantity');
        if (!input) return;
        var newVal = Math.max(1, Math.min(20, parseInt(input.value) + delta));
        input.value = newVal;
        pricingAgentState.quantity = newVal;
        updateZbArea();
    }

    // Live area & tier update
    function updateZbArea() {
        var w = parseFloat(document.getElementById('zbWidth').value) || 0;
        var h = parseFloat(document.getElementById('zbDropHeight').value) || 0;
        var qty = parseInt(document.getElementById('zbQuantity').value) || 1;
        pricingAgentState.width = w;
        pricingAgentState.dropHeight = h;
        pricingAgentState.quantity = qty;

        var unitArea = w * h;
        var effectiveUnit = getEffectiveArea(unitArea);
        var totalArea = effectiveUnit * qty;

        var unitAreaEl = document.getElementById('zbUnitArea');
        var totalAreaEl = document.getElementById('zbTotalArea');
        if (unitAreaEl) unitAreaEl.textContent = effectiveUnit.toFixed(2) + ' sqm';
        if (totalAreaEl) totalAreaEl.textContent = totalArea.toFixed(2) + ' sqm';

        // Update tier badge (Strategy 2)
        var tier = getAreaTier(pricingAgentState.productTier, effectiveUnit);
        var mode = pricingAgentState.pricingMode;
        var tierBadge = document.getElementById('zbTierBadge');
        var firstTier = zbProductTiers[pricingAgentState.productTier].tiers[0];
        var savings = firstTier[mode] > tier[mode] ? Math.round((1 - tier[mode] / firstTier[mode]) * 100) : 0;
        if (tierBadge) {
            tierBadge.innerHTML = '<span class="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">' +
                '<i class="fas fa-tag mr-1"></i>Tier: ' + tier.label + ' rate applied</span>' +
                (savings > 0 ? '<span class="text-xs text-emerald-600 font-medium">-' + savings + '% vs smallest-area rate</span>' : '');
        }

        // Min charge warning (Strategy 3)
        var minWarning = document.getElementById('zbMinChargeWarning');
        if (minWarning) {
            if (unitArea < 1 && unitArea > 0) {
                minWarning.classList.remove('hidden');
            } else {
                minWarning.classList.add('hidden');
            }
        }

        // Update height surcharge display (Strategy 4)
        updateHeightSurchargeDisplay();
    }

    // Height surcharge visual feedback
    function updateHeightSurchargeDisplay() {
        var h = pricingAgentState.dropHeight;
        var surcharge = getHeightSurcharge(h);
        var box = document.getElementById('zbHeightSurchargeBox');
        var label = document.getElementById('zbHeightSurchargeLabel');
        var detail = document.getElementById('zbHeightSurchargeDetail');

        if (!box || !label || !detail) return;

        if (surcharge.surcharge > 0) {
            box.style.background = '#fef3c7';
            box.style.borderColor = '#fde68a';
            label.textContent = '+$' + surcharge.surcharge + '/sqm';
            label.className = 'text-sm font-bold text-amber-800';
            detail.textContent = 'Drop height ' + h.toFixed(1) + 'm is below 1.5m baseline \u2014 surcharge of $' + surcharge.surcharge + '/sqm applies to offset cutting waste.';
            detail.className = 'mt-2 text-xs text-amber-700';
        } else {
            box.style.background = '#f0fdf4';
            box.style.borderColor = '#bbf7d0';
            label.textContent = 'None \u2014 standard height';
            label.className = 'text-sm font-bold text-emerald-800';
            detail.textContent = 'Drop height ' + h.toFixed(1) + 'm meets or exceeds 1.5m baseline \u2014 no surcharge applies.';
            detail.className = 'mt-2 text-xs text-emerald-700';
        }
    }

    // Initialize Pricing Agent page
    function initPricingAgentPage() {
        // Project selector
        var projectSelect = document.getElementById('pricingProjectSelect');
        if (projectSelect) {
            projectSelect.addEventListener('change', function() {
                pricingAgentState.selectedProject = this.value;
            });
        }

        // Fabric selector
        var fabricSelect = document.getElementById('zbFabricSelect');
        if (fabricSelect) {
            fabricSelect.addEventListener('change', function() {
                pricingAgentState.fabric = this.value;
            });
        }

        // Drive system radio buttons
        document.querySelectorAll('input[name="driveSystem"]').forEach(function(radio) {
            radio.addEventListener('change', function() {
                pricingAgentState.driveSystem = this.value;
            });
        });

        // Installation selector
        var installSelect = document.getElementById('zbInstallation');
        if (installSelect) {
            installSelect.addEventListener('change', function() {
                pricingAgentState.installation = parseInt(this.value) || 0;
            });
        }

        // Discount slider
        var discountSlider = document.getElementById('discountSlider');
        if (discountSlider) {
            discountSlider.addEventListener('input', function() {
                pricingAgentState.discount = parseInt(this.value);
            });
        }

        // Quote options
        document.querySelectorAll('.quote-option').forEach(function(option) {
            option.addEventListener('click', function() {
                document.querySelectorAll('.quote-option').forEach(function(o) {
                    o.classList.remove('border-emerald-500', 'bg-emerald-50');
                    o.classList.add('border-gray-200');
                });
                this.classList.remove('border-gray-200');
                this.classList.add('border-emerald-500', 'bg-emerald-50');
                pricingAgentState.selectedQuote = this.dataset.quote;
            });
        });

        // Calculate button
        var calcBtn = document.getElementById('calculatePricingBtn');
        if (calcBtn) {
            calcBtn.addEventListener('click', handleCalculatePricing);
        }

        // (Generate Contract button removed — lightweight workflow)

        // Initial area calculation
        updateZbArea();
    }

    // ===== Main Pricing Calculation Engine =====
    function handleCalculatePricing() {
        var btn = document.getElementById('calculatePricingBtn');
        if (!btn) return;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Calculating...';

        setTimeout(function() {
            var state = pricingAgentState;
            var mode = state.pricingMode;
            var qty = state.quantity;

            // 1. Calculate unit area (Strategy 3: min charge floor)
            var rawUnitArea = state.width * state.dropHeight;
            var unitArea = getEffectiveArea(rawUnitArea);
            var minChargeAdj = (rawUnitArea < 1 && rawUnitArea > 0) ? (1 - rawUnitArea) : 0;

            // 2. Get fabric rate (Strategy 2: volume tiers + Strategy 5: product line tiers)
            var tier = getAreaTier(state.productTier, unitArea);
            var fabricRate = tier[mode];
            var productInfo = zbProductTiers[state.productTier];

            // 3. Fabric upgrade surcharge
            var fabricUpgrade = zbFabricUpgrades[state.fabric];
            var fabricUpgradeCost = fabricUpgrade.surcharge * unitArea * qty;

            // 4. Calculate fabric cost
            var fabricCost = fabricRate * unitArea * qty;

            // 5. Drive system cost (Strategy 1: modular pricing)
            var drive = zbDriveSystems[state.driveSystem];
            var driveCost = drive[mode] * qty;

            // 6. Height surcharge (Strategy 4: dimensional surcharges)
            var heightSurcharge = getHeightSurcharge(state.dropHeight);
            var heightCost = heightSurcharge.surcharge * unitArea * qty;

            // 7. Min charge adjustment cost
            var firstTier = productInfo.tiers[0];
            var minChargeCost = minChargeAdj > 0 ? Math.round(minChargeAdj * firstTier[mode] * qty) : 0;

            // 8. Installation
            var installCost = state.installation * qty;

            // 9. Hardware & accessories
            var hardwareCost = zbHardwareCostPerUnit * qty;

            // 10. Total cost
            var totalCost = fabricCost + driveCost + fabricUpgradeCost + heightCost + minChargeCost + installCost + hardwareCost;

            // 11. Apply dealer discount
            var discountAmount = totalCost * (state.discount / 100);
            var finalCost = Math.round(totalCost - discountAmount);

            // 12. Quote suggestions (3 margin levels)
            var conservative = Math.round(finalCost * 1.10);
            var recommended = Math.round(finalCost * 1.18);
            var premium = Math.round(finalCost * 1.35);

            // === Update UI ===

            // Cost breakdown details
            var el;
            el = document.getElementById('costFabricDetail');
            if (el) el.textContent = '(' + productInfo.name + ' \u00b7 $' + fabricRate + '/sqm \u00d7 ' + unitArea.toFixed(2) + ' sqm \u00d7 ' + qty + ' units)';
            el = document.getElementById('costFabricValue');
            if (el) el.textContent = '$' + Math.round(fabricCost).toLocaleString();

            el = document.getElementById('costDriveDetail');
            if (el) el.textContent = '(' + drive.name + ' \u00b7 $' + drive[mode] + ' \u00d7 ' + qty + ' units)';
            el = document.getElementById('costDriveValue');
            if (el) el.textContent = '$' + Math.round(driveCost).toLocaleString();

            el = document.getElementById('costFabricUpgradeValue');
            if (el) el.textContent = fabricUpgradeCost > 0 ? '+$' + Math.round(fabricUpgradeCost).toLocaleString() : '$0';
            el = document.getElementById('costFabricUpgradeRow');
            if (el) el.style.display = fabricUpgradeCost > 0 ? 'flex' : 'none';

            el = document.getElementById('costHeightValue');
            if (el) el.textContent = heightCost > 0 ? '+$' + Math.round(heightCost).toLocaleString() : '$0';
            el = document.getElementById('costHeightRow');
            if (el) el.style.display = heightCost > 0 ? 'flex' : 'none';

            var minChargeRow = document.getElementById('costMinChargeRow');
            if (minChargeRow) {
                if (minChargeCost > 0) {
                    minChargeRow.classList.remove('hidden');
                    var mcv = document.getElementById('costMinChargeValue');
                    if (mcv) mcv.textContent = '+$' + minChargeCost;
                } else {
                    minChargeRow.classList.add('hidden');
                }
            }

            el = document.getElementById('costInstallValue');
            if (el) el.textContent = '$' + installCost.toLocaleString();
            el = document.getElementById('costHardwareValue');
            if (el) el.textContent = '$' + hardwareCost.toLocaleString();
            el = document.getElementById('costTotalValue');
            if (el) el.textContent = '$' + finalCost.toLocaleString();

            // Active strategies panel
            zbUpdateActiveStrategies(state, unitArea, tier, heightSurcharge, minChargeAdj, fabricCost, driveCost);

            // Profit analysis
            var profit = recommended - finalCost;
            var margin = ((profit / recommended) * 100).toFixed(1);

            el = document.getElementById('profitPrice');
            if (el) el.textContent = recommended >= 1000 ? '$' + (recommended / 1000).toFixed(1) + 'K' : '$' + recommended;
            el = document.getElementById('profitAmount');
            if (el) el.textContent = '$' + profit.toLocaleString();
            el = document.getElementById('profitMargin');
            if (el) el.textContent = margin + '%';

            var indicator = document.getElementById('marginIndicator');
            if (indicator) {
                var position = Math.min(100, Math.max(0, parseFloat(margin) * 3));
                indicator.style.left = position + '%';
            }

            // Quote suggestions
            el = document.getElementById('quoteConservativePrice');
            if (el) el.textContent = '$' + conservative.toLocaleString();
            el = document.getElementById('quoteConservativeProfit');
            if (el) el.textContent = '$' + (conservative - finalCost).toLocaleString() + ' profit';
            el = document.getElementById('quoteRecommendedPrice');
            if (el) el.textContent = '$' + recommended.toLocaleString();
            el = document.getElementById('quoteRecommendedProfit');
            if (el) el.textContent = '$' + (recommended - finalCost).toLocaleString() + ' profit';
            el = document.getElementById('quotePremiumPrice');
            if (el) el.textContent = '$' + premium.toLocaleString();
            el = document.getElementById('quotePremiumProfit');
            if (el) el.textContent = '$' + (premium - finalCost).toLocaleString() + ' profit';

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-calculator mr-2"></i>Calculate Pricing';

            showToast('Zip Blinds pricing calculated \u2014 6 strategies applied!', 'success');
        }, 1200);
    }

    // Update the Active Strategies panel based on current calculation
    function zbUpdateActiveStrategies(state, unitArea, tier, heightSurcharge, minChargeAdj, fabricCost, driveCost) {
        var container = document.getElementById('activeStrategies');
        if (!container) return;

        var mode = state.pricingMode;
        var productInfo = zbProductTiers[state.productTier];
        var drive = zbDriveSystems[state.driveSystem];
        var firstTier = productInfo.tiers[0];
        var savings = firstTier[mode] > tier[mode] ? Math.round((1 - tier[mode] / firstTier[mode]) * 100) : 0;

        var strategies = [
            {
                active: true, bg: '#ecfdf5', icon: '#10b981', text: '#065f46',
                label: 'Modular Split',
                desc: 'Fabric $' + Math.round(fabricCost) + ' + Drive $' + Math.round(driveCost) + ' quoted separately'
            },
            {
                active: savings > 0, bg: '#eff6ff', icon: '#3b82f6', text: '#1e3a5f',
                label: 'Volume Tier',
                desc: savings > 0
                    ? tier.label + ' rate applied, saving ' + savings + '% vs smallest-area rate'
                    : 'Smallest area tier \u2014 no volume discount yet'
            },
            {
                active: true, bg: '#faf5ff', icon: '#8b5cf6', text: '#4c1d95',
                label: 'Product Tier',
                desc: '"' + state.productTier.charAt(0).toUpperCase() + state.productTier.slice(1) + '" (' + productInfo.name + ') selected'
            },
            {
                active: heightSurcharge.surcharge > 0, bg: '#fffbeb', icon: '#f59e0b', text: '#78350f',
                label: 'Height Surcharge',
                desc: heightSurcharge.surcharge > 0
                    ? 'Drop ' + state.dropHeight.toFixed(1) + 'm triggers +$' + heightSurcharge.surcharge + '/sqm surcharge'
                    : 'Not triggered (drop \u2265 1.5m)'
            },
            {
                active: minChargeAdj > 0, bg: '#fef2f2', icon: '#ef4444', text: '#7f1d1d',
                label: 'Min. Charge',
                desc: minChargeAdj > 0
                    ? 'Area < 1 sqm \u2014 billed as 1 sqm (cost recovery floor)'
                    : 'Not triggered (area \u2265 1 sqm)'
            },
            {
                active: true, bg: '#fff7ed', icon: '#f97316', text: '#7c2d12',
                label: 'Dual Price List',
                desc: mode === 'retail'
                    ? 'Retail mode active (Wholesale saves ~' + Math.round((1 - drive.wholesale / drive.retail) * 100) + '% on drive)'
                    : 'Wholesale mode active (Retail is ~' + Math.round((drive.retail / drive.wholesale - 1) * 100) + '% higher)'
            }
        ];

        var html = '';
        for (var i = 0; i < strategies.length; i++) {
            var s = strategies[i];
            if (s.active) {
                html += '<div class="flex items-center gap-2 p-2 rounded-lg text-xs" style="background:' + s.bg + '">' +
                    '<i class="fas fa-check-circle" style="color:' + s.icon + '"></i>' +
                    '<span style="color:' + s.text + '"><strong>' + s.label + '</strong> \u2014 ' + s.desc + '</span></div>';
            } else {
                html += '<div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-400">' +
                    '<i class="fas fa-minus-circle"></i>' +
                    '<span><strong>' + s.label + '</strong> \u2014 ' + s.desc + '</span></div>';
            }
        }
        container.innerHTML = html;
    }

    // Backward compatibility stubs (old code paths may reference these)
    function updateTotalSqft() { updateZbArea(); }
    function updateCostBreakdown() {}
    function updateQuoteSuggestions() {}
    function updateProfitAnalysis() {}
    function populatePricingProductSelect() {}
    function updatePricingProjectInfo() {}

    // ===== Namespace Export =====
    N.agents.pricing = {
        pricingAgentState: pricingAgentState,
        getAreaTier: getAreaTier,
        getHeightSurcharge: getHeightSurcharge,
        getEffectiveArea: getEffectiveArea,
        selectProductTier: selectProductTier,
        setPricingMode: setPricingMode,
        adjustZbQty: adjustZbQty,
        updateZbArea: updateZbArea,
        updateHeightSurchargeDisplay: updateHeightSurchargeDisplay,
        initPricingAgentPage: initPricingAgentPage,
        handleCalculatePricing: handleCalculatePricing,
        zbUpdateActiveStrategies: zbUpdateActiveStrategies,
        updateTotalSqft: updateTotalSqft,
        updateCostBreakdown: updateCostBreakdown,
        updateQuoteSuggestions: updateQuoteSuggestions,
        updateProfitAnalysis: updateProfitAnalysis,
        populatePricingProductSelect: populatePricingProductSelect,
        updatePricingProjectInfo: updatePricingProjectInfo
    };

    // ===== Global Aliases (backward compatibility) =====
    window.pricingAgentState = pricingAgentState;
    window.getAreaTier = getAreaTier;
    window.getHeightSurcharge = getHeightSurcharge;
    window.getEffectiveArea = getEffectiveArea;
    window.selectProductTier = selectProductTier;
    window.setPricingMode = setPricingMode;
    window.adjustZbQty = adjustZbQty;
    window.updateZbArea = updateZbArea;
    window.updateHeightSurchargeDisplay = updateHeightSurchargeDisplay;
    window.initPricingAgentPage = initPricingAgentPage;
    window.handleCalculatePricing = handleCalculatePricing;
    window.zbUpdateActiveStrategies = zbUpdateActiveStrategies;
    window.updateTotalSqft = updateTotalSqft;
    window.updateCostBreakdown = updateCostBreakdown;
    window.updateQuoteSuggestions = updateQuoteSuggestions;
    window.updateProfitAnalysis = updateProfitAnalysis;
    window.populatePricingProductSelect = populatePricingProductSelect;
    window.updatePricingProjectInfo = updatePricingProjectInfo;
})();
