/**
 * orders.js — 订单页面功能
 * Phase 3.2: Orders Page Functions
 * 依赖: helpers.js (showToast)
 */
(function() {
    'use strict';
    var N = window.Nestopia = window.Nestopia || {};
    N.modules = N.modules || {};

    // ===== Orders Page Functions =====
    function initOrdersPage() {
        // Search functionality
        var searchInput = document.getElementById('orderSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                filterOrders(this.value);
            });
        }

        // Status filter
        var statusFilter = document.getElementById('orderStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', function() {
                filterOrdersByStatus(this.value);
            });
        }

        // Create order button
        var createBtn = document.getElementById('createOrderBtn');
        if (createBtn) {
            createBtn.addEventListener('click', function() {
                showToast('Create Order modal will be implemented. This will open a form to create new orders.', 'info');
            });
        }
    }

    function filterOrders(query) {
        var rows = document.querySelectorAll('#ordersTableBody tr');
        rows.forEach(function(row) {
            var text = row.textContent.toLowerCase();
            row.style.display = text.includes(query.toLowerCase()) ? '' : 'none';
        });
    }

    function filterOrdersByStatus(status) {
        var rows = document.querySelectorAll('#ordersTableBody tr');
        rows.forEach(function(row) {
            if (!status) {
                row.style.display = '';
            } else {
                var statusCell = row.querySelector('td:nth-child(6) span');
                if (statusCell) {
                    var rowStatus = statusCell.textContent.toLowerCase().replace(' ', '_');
                    row.style.display = rowStatus.includes(status) ? '' : 'none';
                }
            }
        });
    }

    function showOrderDetail(orderId) {
        showToast('Order detail modal will be implemented for order: ' + orderId, 'info');
    }

    // ===== Register on namespace =====
    N.modules.orders = {
        initOrdersPage: initOrdersPage,
        filterOrders: filterOrders,
        filterOrdersByStatus: filterOrdersByStatus,
        showOrderDetail: showOrderDetail
    };

    // ===== Global aliases (backward compat) =====
    window.initOrdersPage = initOrdersPage;
    window.filterOrders = filterOrders;
    window.filterOrdersByStatus = filterOrdersByStatus;
    window.showOrderDetail = showOrderDetail;
})();
