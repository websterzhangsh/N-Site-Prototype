/**
 * Nestopia - Customer Service Agent
 * 命名空间: Nestopia.agents.cs
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.agents = N.agents || {};

    // ===== Customer Service Executive Page Functions =====
    var csState = {
        selectedConversation: 'conv-001',
        replyChannel: 'email',
        filter: 'all'
    };

    // Dummy conversation data
    var dummyConversations = {
        'conv-001': {
            customer: 'Mr. Johnson',
            initials: 'J',
            color: 'bg-blue-500',
            project: 'Sunshine Villa - Sunroom',
            email: 'johnson@email.com',
            phone: '(310) 555-0101',
            satisfaction: 92,
            responseTime: '1.2h',
            interactions: 8,
            status: 'open',
            messages: [
                { from: 'customer', text: 'Hi, when will the sunroom installation be scheduled? I\'d like to prepare the backyard area beforehand. Also, do I need to clear any furniture near the installation zone?', time: 'Today, 2:30 PM' },
                { from: 'agent', text: 'Hello Mr. Johnson! Your sunroom installation is tentatively scheduled for next week (March 18-20). We\'ll confirm the exact date by Friday. Yes, please clear a 10-foot perimeter around the installation area. Our team will handle the rest!', time: 'Today, 2:35 PM - via Email' },
                { from: 'customer', text: 'Perfect, thank you! One more thing - will the electrician come on the same day? I need to arrange for someone to be home.', time: 'Today, 3:10 PM' }
            ]
        },
        'conv-002': {
            customer: 'Ms. Chen',
            initials: 'C',
            color: 'bg-green-500',
            project: 'Riverside Estate - ADU',
            email: 'chen@email.com',
            phone: '(408) 555-0202',
            satisfaction: 85,
            responseTime: '2.1h',
            interactions: 12,
            status: 'open',
            messages: [
                { from: 'customer', text: 'Can we discuss the ADU permit status? I noticed the application was submitted 2 weeks ago but haven\'t heard anything from the county.', time: 'Today, 1:15 PM' },
                { from: 'agent', text: 'Hi Ms. Chen! I checked with the county office today - your ADU permit is currently in the plan review stage. Santa Clara County typically takes 3-4 weeks. We\'re right on track!', time: 'Today, 1:45 PM - via Email' }
            ]
        },
        'conv-003': {
            customer: 'Mr. Williams',
            initials: 'W',
            color: 'bg-purple-500',
            project: 'Oak Garden - Pergola',
            email: 'williams@email.com',
            phone: '(619) 555-0303',
            satisfaction: 95,
            responseTime: '0.8h',
            interactions: 5,
            status: 'open',
            messages: [
                { from: 'customer', text: 'I love the pergola design! Quick question about the warranty - does it cover weather damage?', time: 'Today, 11:00 AM' },
                { from: 'agent', text: 'Thank you Mr. Williams! Yes, our standard warranty covers structural defects for 10 years and includes weather damage from normal conditions. Extreme events (hurricanes, earthquakes) are covered under extended warranty.', time: 'Today, 11:30 AM - via Email' },
                { from: 'customer', text: 'That sounds great. What\'s the cost for the extended warranty?', time: 'Today, 12:15 PM' }
            ]
        },
        'conv-004': {
            customer: 'Mrs. Davis',
            initials: 'D',
            color: 'bg-amber-500',
            project: 'Lakeside Retreat - Zip Blinds',
            email: 'davis@email.com',
            phone: '(916) 555-0404',
            satisfaction: 98,
            responseTime: '0.5h',
            interactions: 6,
            status: 'resolved',
            messages: [
                { from: 'customer', text: 'Thank you for the zip blinds installation. Everything looks great!', time: 'Yesterday, 4:00 PM' },
                { from: 'agent', text: 'Wonderful to hear, Mrs. Davis! We\'re glad you\'re happy with the zip blinds. Don\'t hesitate to reach out if you need anything. We\'ll send a follow-up satisfaction survey in a few days.', time: 'Yesterday, 4:15 PM - via Email' }
            ]
        },
        'conv-005': {
            customer: 'Mr. Martinez',
            initials: 'M',
            color: 'bg-red-500',
            project: 'Desert View - Sunroom',
            email: 'martinez@email.com',
            phone: '(213) 555-0505',
            satisfaction: 65,
            responseTime: '3.5h',
            interactions: 10,
            status: 'open',
            messages: [
                { from: 'customer', text: 'I\'m having an issue with the door alignment on the sunroom. It doesn\'t close properly and there\'s a gap letting in cold air.', time: 'Yesterday, 10:00 AM' },
                { from: 'agent', text: 'I\'m sorry to hear about the door alignment issue, Mr. Martinez. This is covered under warranty. I\'ve scheduled a service technician for this Thursday (March 14) between 9 AM - 12 PM. Does that work for you?', time: 'Yesterday, 11:30 AM - via Phone' },
                { from: 'customer', text: 'Thursday works. Please make sure they bring the right parts this time. Last service visit they had to come back.', time: 'Yesterday, 12:00 PM' }
            ]
        }
    };

    function initCSAgentPage() {
        // Conversation selection
        document.querySelectorAll('.cs-conversation').forEach(function(conv) {
            conv.addEventListener('click', function() {
                var convId = this.dataset.conv;
                csState.selectedConversation = convId;

                // Update active state
                document.querySelectorAll('.cs-conversation').forEach(function(c) {
                    c.classList.remove('bg-blue-50/50', 'border-l-4', 'border-blue-500');
                });
                this.classList.add('bg-blue-50/50', 'border-l-4', 'border-blue-500');

                updateCSDetail(convId);
            });
        });

        // Filter buttons
        document.querySelectorAll('.cs-filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.cs-filter-btn').forEach(function(b) {
                    b.classList.remove('bg-gray-900', 'text-white');
                    b.classList.add('bg-white', 'border', 'text-gray-600');
                });
                this.classList.remove('bg-white', 'border', 'text-gray-600');
                this.classList.add('bg-gray-900', 'text-white');

                csState.filter = this.dataset.filter;
                filterConversations(this.dataset.filter);
            });
        });

        // Channel selection
        document.querySelectorAll('.cs-channel-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.cs-channel-btn').forEach(function(b) {
                    b.classList.remove('bg-blue-100', 'text-blue-700', 'font-medium');
                    b.classList.add('bg-white', 'border', 'text-gray-600');
                });
                this.classList.remove('bg-white', 'border', 'text-gray-600');
                this.classList.add('bg-blue-100', 'text-blue-700', 'font-medium');
                csState.replyChannel = this.dataset.channel;
            });
        });

        // AI Suggestion click to fill reply
        document.querySelectorAll('.cs-suggestion').forEach(function(suggestion) {
            suggestion.addEventListener('click', function() {
                var text = this.querySelector('p').textContent;
                document.getElementById('csReplyInput').value = text;

                document.querySelectorAll('.cs-suggestion').forEach(function(s) {
                    s.classList.remove('border-orange-400', 'shadow-sm');
                });
                this.classList.add('border-orange-400', 'shadow-sm');

                showToast('AI suggestion loaded into reply', 'info');
            });
        });

        // Send reply button
        var sendBtn = document.getElementById('sendReplyBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', handleSendReply);
        }

        // Refresh suggestions
        var refreshBtn = document.getElementById('refreshSuggestionsBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Loading...';
                setTimeout(function() {
                    refreshBtn.innerHTML = '<i class="fas fa-sync-alt mr-1"></i>Refresh';
                    showToast('AI suggestions refreshed', 'success');
                }, 1000);
            });
        }

        // Quick action buttons
        document.querySelectorAll('.cs-action-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var action = this.querySelector('span').textContent;
                showToast(action + ' - feature coming soon', 'info');
            });
        });

        // Escalate button
        var escalateBtn = document.getElementById('escalateTicketBtn');
        if (escalateBtn) {
            escalateBtn.addEventListener('click', function() {
                showToast('Ticket escalated to manager. They will be notified immediately.', 'info');
            });
        }
    }

    function updateCSDetail(convId) {
        var conv = dummyConversations[convId];
        if (!conv) return;

        // Update customer profile
        var avatar = document.getElementById('csCustomerAvatar');
        if (avatar) {
            avatar.textContent = conv.initials;
            avatar.className = 'w-14 h-14 ' + conv.color + ' rounded-full flex items-center justify-center text-white text-xl font-semibold flex-shrink-0';
        }
        document.getElementById('csCustomerName').textContent = conv.customer;
        document.getElementById('csCustomerProject').textContent = conv.project;
        document.getElementById('csCustomerEmail').textContent = conv.email;
        document.getElementById('csCustomerPhone').textContent = conv.phone;

        // Update satisfaction
        document.getElementById('csSatScore').textContent = conv.satisfaction + '/100';
        document.getElementById('csSatBar').style.width = conv.satisfaction + '%';

        var satScore = document.getElementById('csSatScore');
        if (conv.satisfaction >= 80) {
            satScore.className = 'text-sm font-bold text-green-600';
            document.getElementById('csSatBar').className = 'h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full';
        } else if (conv.satisfaction >= 60) {
            satScore.className = 'text-sm font-bold text-amber-600';
            document.getElementById('csSatBar').className = 'h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full';
        } else {
            satScore.className = 'text-sm font-bold text-red-600';
            document.getElementById('csSatBar').className = 'h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full';
        }

        // Update conversation status
        var statusEl = document.getElementById('csConvStatus');
        if (conv.status === 'resolved') {
            statusEl.className = 'px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full';
            statusEl.innerHTML = '<i class="fas fa-check-circle text-xs mr-1"></i>Resolved';
        } else {
            statusEl.className = 'px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full';
            statusEl.innerHTML = '<i class="fas fa-circle text-xs mr-1"></i>Open';
        }

        // Update conversation thread
        var thread = document.getElementById('csConversationThread');
        thread.innerHTML = conv.messages.map(function(msg) {
            if (msg.from === 'customer') {
                return '<div class="flex gap-3">' +
                    '<div class="w-8 h-8 ' + conv.color + ' rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">' + conv.initials + '</div>' +
                    '<div class="flex-1">' +
                        '<div class="bg-gray-100 rounded-lg rounded-tl-none p-3">' +
                            '<p class="text-sm text-gray-700">' + msg.text + '</p>' +
                        '</div>' +
                        '<span class="text-xs text-gray-400 mt-1 block">' + msg.time + '</span>' +
                    '</div>' +
                '</div>';
            } else {
                return '<div class="flex gap-3 justify-end">' +
                    '<div class="flex-1">' +
                        '<div class="bg-blue-600 rounded-lg rounded-tr-none p-3 ml-8">' +
                            '<p class="text-sm text-white">' + msg.text + '</p>' +
                        '</div>' +
                        '<span class="text-xs text-gray-400 mt-1 block text-right">' + msg.time + '</span>' +
                    '</div>' +
                    '<div class="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">A</div>' +
                '</div>';
            }
        }).join('');

        // Scroll to bottom
        thread.scrollTop = thread.scrollHeight;
    }

    function filterConversations(filter) {
        document.querySelectorAll('.cs-conversation').forEach(function(conv) {
            var convId = conv.dataset.conv;
            var data = dummyConversations[convId];
            if (!data) return;

            if (filter === 'all') {
                conv.style.display = '';
            } else if (filter === 'open' && data.status === 'open') {
                conv.style.display = '';
            } else if (filter === 'resolved' && data.status === 'resolved') {
                conv.style.display = '';
            } else {
                conv.style.display = 'none';
            }
        });
    }

    function handleSendReply() {
        var replyInput = document.getElementById('csReplyInput');
        var text = replyInput.value.trim();

        if (!text) {
            showToast('Please type a reply or select an AI suggestion', 'error');
            return;
        }

        var btn = document.getElementById('sendReplyBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Sending...';

        setTimeout(function() {
            // Add message to thread
            var conv = dummyConversations[csState.selectedConversation];
            var channelName = csState.replyChannel.charAt(0).toUpperCase() + csState.replyChannel.slice(1);
            var timeStr = 'Just now - via ' + channelName;

            conv.messages.push({ from: 'agent', text: text, time: timeStr });
            updateCSDetail(csState.selectedConversation);

            // Clear input
            replyInput.value = '';

            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane mr-1"></i>Send Reply';

            showToast('Reply sent via ' + channelName + '!', 'success');
        }, 1000);
    }

    // 命名空间导出
    N.agents.cs = {
        csState: csState,
        dummyConversations: dummyConversations,
        initCSAgentPage: initCSAgentPage,
        updateCSDetail: updateCSDetail,
        filterConversations: filterConversations,
        handleSendReply: handleSendReply
    };

    // 全局别名（保持向后兼容）
    window.csState = csState;
    window.dummyConversations = dummyConversations;
    window.initCSAgentPage = initCSAgentPage;
    window.updateCSDetail = updateCSDetail;
    window.filterConversations = filterConversations;
    window.handleSendReply = handleSendReply;

})();
