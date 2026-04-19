/**
 * Nestopia - B2B Chatbot
 * 命名空间: Nestopia.utils.chatbot
 */
(function() {
    'use strict';

    var N = window.Nestopia = window.Nestopia || {};
    N.utils = N.utils || {};

    // ===== B2B Chatbot Module =====
    const b2bChat = {
        sessions: [],
        currentSessionId: null,
        isFloatingOpen: false,
        _dbLoaded: false,

        // ── Supabase Chat 持久化 ──────────────────────────
        loadFromDB: function() {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(null);
            return NestopiaDB.getClient()
                .from('chat_sessions')
                .select('chat_data')
                .eq('tenant_id', NestopiaDB.getTenantId())
                .eq('session_key', 'default')
                .maybeSingle()
                .then(function(res) {
                    if (res.error) { console.warn('[Chat] DB load error:', res.error.message); return null; }
                    return (res.data && res.data.chat_data) ? res.data.chat_data : null;
                })
                .catch(function(err) { console.warn('[Chat] DB load failed:', err.message); return null; });
        },

        saveToDB: function() {
            if (typeof NestopiaDB === 'undefined' || !NestopiaDB.isConnected()) return Promise.resolve(false);
            var self = this;
            var payload = {
                tenant_id: NestopiaDB.getTenantId(),
                session_key: 'default',
                chat_data: JSON.parse(JSON.stringify({
                    sessions: self.sessions,
                    currentSessionId: self.currentSessionId
                })),
                updated_at: new Date().toISOString()
            };
            return NestopiaDB.getClient()
                .from('chat_sessions')
                .upsert(payload, { onConflict: 'tenant_id,session_key' })
                .then(function(res) {
                    if (res.error) { console.warn('[Chat] DB save error:', res.error.message); return false; }
                    console.log('[Chat] Saved to Supabase');
                    return true;
                })
                .catch(function(err) { console.warn('[Chat] DB save failed:', err.message); return false; });
        },

        agents: {
            'designer':         { name: 'AI Designer',        icon: 'fa-palette',    css: 'designer' },
            'pricing':          { name: 'Pricing Agent',      icon: 'fa-chart-line', css: 'pricing' },
            'compliance':       { name: 'Compliance Mgr',     icon: 'fa-shield-alt', css: 'compliance' },
            'customer-service': { name: 'CS Executive',       icon: 'fa-headset',    css: 'customer-service' },
            'knowledge-base':   { name: 'Knowledge Base',     icon: 'fa-brain',      css: 'knowledge-base' }
        },

        init() {
            var self = this;
            // 先尝试从 Supabase 加载会话
            if (!self._dbLoaded && typeof NestopiaDB !== 'undefined' && NestopiaDB.isConnected()) {
                self._dbLoaded = true;
                self.loadFromDB().then(function(dbData) {
                    if (dbData && dbData.sessions && Array.isArray(dbData.sessions) && dbData.sessions.length > 0) {
                        self.sessions = dbData.sessions;
                        self.currentSessionId = dbData.currentSessionId || dbData.sessions[0].id;
                        console.log('[Chat] Loaded', dbData.sessions.length, 'sessions from Supabase');
                        self.renderSessionsList();
                        self.renderMessages('full');
                        self.addWelcomeMessage('float');
                        return;
                    }
                    // DB 为空，使用默认 demo 数据
                    self._initDefaultSessions();
                });
                // 先用默认数据渲染，DB 加载完成后会覆盖
                self._initDefaultSessions();
                return;
            }
            self._initDefaultSessions();
        },

        _initDefaultSessions() {
            this.sessions = [
                {
                    id: 'sess-001',
                    title: 'Sunshine Villa — Design & Quote',
                    lastMessage: 'Here are 3 pricing tiers for the sunroom project...',
                    time: '2 hours ago',
                    agentUsed: 'pricing',
                    messages: [
                        { role: 'assistant', content: 'Welcome! I\'m your Nestopia AI Assistant. I can help with design, pricing, compliance, customer management, and product information.\n\nHow can I help you today?', agent: null },
                        { role: 'user', content: 'I need a quote for Mr. Johnson\'s sunroom project at 123 Sunshine Ave, LA. About 400 sq ft.' },
                        { role: 'assistant', content: 'I\'ve prepared 3 pricing tiers for the Sunshine Villa sunroom project (400 sq ft):\n\n**Tier 1 — Standard ($38,000)**\nAluminum frame, single-layer glass roof, basic motorized system\n\n**Tier 2 — Premium ($52,000)** ✨ Recommended\nThermal-break aluminum, double-glazed roof, smart shade integration\n\n**Tier 3 — Luxury ($68,000)**\nStructural steel + aluminum hybrid, triple-glazed low-E, full home automation\n\nAll tiers include installation and 5-year structural warranty. Margin analysis shows Tier 2 yields the best balance at 32% gross margin.\n\nWould you like me to generate a formal quotation PDF?', agent: 'pricing' }
                    ]
                },
                {
                    id: 'sess-002',
                    title: 'CA Sunroom Compliance Check',
                    lastMessage: 'Here\'s the compliance checklist for Irvine, CA...',
                    time: '1 day ago',
                    agentUsed: 'compliance',
                    messages: [
                        { role: 'assistant', content: 'Welcome! How can I help you today?', agent: null },
                        { role: 'user', content: 'What permits do I need for a sunroom in Irvine, CA?' },
                        { role: 'assistant', content: '📋 **Irvine, CA — Sunroom Compliance Checklist**\n\n**Required Permits:**\n1. Building Permit (City of Irvine, Community Development)\n2. Electrical Permit (if motorized/smart features)\n3. HOA Architectural Review (most Irvine communities)\n\n**Key Setback Requirements:**\n• Rear: 10ft minimum\n• Side: 5ft minimum\n• Height: Max 15ft (single story addition)\n\n**HOA Considerations (Orange County):**\n• Color must match existing structure\n• Material approval required\n• Submit plans 30 days before construction\n\n**Estimated Timeline:**\n• HOA Review: 2-4 weeks\n• City Permit: 4-6 weeks\n• Total lead time: 6-10 weeks before construction\n\nWould you like me to generate the full permit application package?', agent: 'compliance' }
                    ]
                },
                {
                    id: 'sess-003',
                    title: 'Pergola Product Specs',
                    lastMessage: 'Our pergola models support spans up to 20ft...',
                    time: '3 days ago',
                    agentUsed: 'knowledge-base',
                    messages: [
                        { role: 'assistant', content: 'Welcome! How can I help you today?', agent: null },
                        { role: 'user', content: 'What\'s the maximum span for our pergola models?' },
                        { role: 'assistant', content: '📐 **Pergola Maximum Span Specifications**\n\nBased on our current product catalog:\n\n• **PG-100 Standard** — Max 12 ft, 6063-T5 Aluminum, 30 psf load\n• **PG-200 Pro** — Max 16 ft, 6061-T6 Aluminum, 40 psf load\n• **PG-300 Commercial** — Max 20 ft, Steel + Aluminum, 55 psf load\n\n**Notes:**\n• Spans over 14ft require intermediate support posts\n• Wind load calculations may reduce effective span in coastal areas\n• Custom spans available through engineering review (add 2 weeks)\n\nFor specific project requirements, I can connect you with the Pricing Agent for a detailed quote.', agent: 'knowledge-base' }
                    ]
                }
            ];
            this.currentSessionId = 'sess-001';
            this.renderSessionsList();
            this.renderMessages('full');
            this.addWelcomeMessage('float');
        },

        // ---- Floating widget ----
        toggleFloating() {
            const fab = document.getElementById('b2bChatFab');
            const panel = document.getElementById('b2bFloatingPanel');
            this.isFloatingOpen = !this.isFloatingOpen;
            if (this.isFloatingOpen) {
                panel.classList.add('open');
                fab.classList.add('active');
                if (!document.getElementById('floatChatMessages').children.length) {
                    this.addWelcomeMessage('float');
                }
                setTimeout(() => document.getElementById('floatChatInput')?.focus(), 300);
            } else {
                panel.classList.remove('open');
                fab.classList.remove('active');
            }
        },

        expandToFullPage() {
            this.isFloatingOpen = false;
            document.getElementById('b2bFloatingPanel')?.classList.remove('open');
            document.getElementById('b2bChatFab')?.classList.remove('active');
            navigateToPage('chatbot');
            // Close mobile sidebar too
            document.getElementById('sidebar')?.classList.remove('open');
        },

        // ---- Session management ----
        createSession() {
            const id = 'sess-' + Date.now();
            const session = {
                id,
                title: 'New Chat',
                lastMessage: '',
                time: 'Just now',
                agentUsed: null,
                messages: [
                    { role: 'assistant', content: 'Welcome! I\'m your Nestopia AI Assistant. I can route your questions to the right specialist:\n\n🎨 **AI Designer** — Scene rendering & design proposals\n💰 **Pricing Agent** — Quotes, cost analysis & margins\n📋 **Compliance** — Permits, HOA rules & regulations\n👥 **Customer Service** — Client history & follow-ups\n📚 **Knowledge Base** — Product specs & technical info\n\nHow can I help you today?', agent: null }
                ]
            };
            this.sessions.unshift(session);
            this.currentSessionId = id;
            this.renderSessionsList();
            this.renderMessages('full');
            document.getElementById('fullChatInput')?.focus();
            // Re-show quick actions
            const qa = document.getElementById('fullQuickActions');
            if (qa) qa.style.display = '';
            // 自动保存到 Supabase
            this.saveToDB();
        },

        switchSession(sessionId) {
            this.currentSessionId = sessionId;
            this.renderSessionsList();
            this.renderMessages('full');
            const session = this.sessions.find(s => s.id === sessionId);
            if (session) {
                document.getElementById('fullChatTitle').textContent = session.title;
            }
            // Show quick actions only for fresh sessions
            const qa = document.getElementById('fullQuickActions');
            if (qa) qa.style.display = (session && session.messages.length <= 1) ? '' : 'none';
        },

        clearCurrentSession() {
            if (!confirm('Clear all messages in this chat?')) return;
            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (session) {
                session.messages = [{ role: 'assistant', content: 'Chat cleared. How can I help you?', agent: null }];
                session.lastMessage = 'Chat cleared';
                this.renderMessages('full');
                this.renderSessionsList();
                const qa = document.getElementById('fullQuickActions');
                if (qa) qa.style.display = '';
                // 自动保存到 Supabase
                this.saveToDB();
            }
        },

        // ---- Rendering ----
        renderSessionsList() {
            const el = document.getElementById('chatSessionsList');
            if (!el) return;
            el.innerHTML = this.sessions.map(s => {
                const a = s.agentUsed ? this.agents[s.agentUsed] : null;
                const active = s.id === this.currentSessionId;
                return `<div class="chat-session-item ${active ? 'active' : ''}" onclick="Nestopia.utils.chatbot.b2bChat.switchSession('${s.id}')">
                    <div class="si-title">${this.esc(s.title)}</div>
                    <div class="si-meta">
                        ${a ? '<span><i class="fas ' + a.icon + '" style="font-size:10px"></i> ' + a.name + '</span>' : ''}
                        <span>${s.time}</span>
                    </div>
                    ${s.lastMessage ? '<div class="si-preview">' + this.esc(s.lastMessage) + '</div>' : ''}
                </div>`;
            }).join('');
        },

        renderMessages(mode) {
            const cid = mode === 'full' ? 'fullChatMessages' : 'floatChatMessages';
            const container = document.getElementById(cid);
            if (!container) return;
            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (!session) return;
            container.innerHTML = session.messages.map(m => this.msgHTML(m)).join('');
            container.scrollTop = container.scrollHeight;
            if (mode === 'full') {
                const t = document.getElementById('fullChatTitle');
                if (t) t.textContent = session.title;
            }
        },

        addWelcomeMessage(mode) {
            const cid = mode === 'full' ? 'fullChatMessages' : 'floatChatMessages';
            const container = document.getElementById(cid);
            if (!container) return;
            container.innerHTML = this.msgHTML({
                role: 'assistant',
                content: 'Hi there! 👋 I\'m your **Nestopia AI Assistant**.\n\nI can help with design, pricing, compliance, customer management, and product info. What do you need?',
                agent: null
            });
        },

        msgHTML(msg) {
            if (msg.role === 'user') {
                return '<div class="b2b-msg user"><div class="msg-avatar"><i class="fas fa-user"></i></div><div class="msg-body"><div class="msg-bubble">' + this.fmt(msg.content) + '</div></div></div>';
            }
            const a = msg.agent && this.agents[msg.agent];
            const badge = a ? '<div class="b2b-agent-badge ' + a.css + '"><i class="fas ' + a.icon + '" style="font-size:10px"></i> Via ' + a.name + '</div>' : '';
            return '<div class="b2b-msg bot"><div class="msg-avatar"><i class="fas fa-robot"></i></div><div class="msg-body">' + badge + '<div class="msg-bubble">' + this.fmt(msg.content) + '</div></div></div>';
        },

        fmt(text) {
            return text
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');
        },

        esc(text) {
            const d = document.createElement('div');
            d.textContent = text;
            return d.innerHTML;
        },

        // ---- Sending messages ----
        send(mode) {
            const inputId = mode === 'full' ? 'fullChatInput' : 'floatChatInput';
            const input = document.getElementById(inputId);
            const message = input.value.trim();
            if (!message) return;
            input.value = '';

            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (session) session.messages.push({ role: 'user', content: message });

            const cid = mode === 'full' ? 'fullChatMessages' : 'floatChatMessages';
            const container = document.getElementById(cid);
            container.innerHTML += this.msgHTML({ role: 'user', content: message });

            // Typing indicator
            container.innerHTML += '<div class="b2b-typing" id="b2bTyping"><div class="msg-avatar" style="width:32px;height:32px;border-radius:8px;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0"><i class="fas fa-robot"></i></div><div class="dots"><span></span><span></span><span></span></div></div>';
            container.scrollTop = container.scrollHeight;

            // Hide quick actions
            const qaId = mode === 'full' ? 'fullQuickActions' : 'floatQuickActions';
            const qa = document.getElementById(qaId);
            if (qa) qa.style.display = 'none';

            const detectedAgent = this.detectIntent(message);

            // Build history for LLM
            const history = session ? session.messages.filter(m => m.role !== 'system').slice(-8).map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            })) : [];

            fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, history, mode: '2b' })
            })
            .then(res => res.json())
            .then(data => {
                this.removeTyping();
                const reply = (data.success && data.reply) ? data.reply : this.fallback(message, detectedAgent);
                this.appendBotReply(session, container, reply, detectedAgent, message);
            })
            .catch(() => {
                this.removeTyping();
                const reply = this.fallback(message, detectedAgent);
                this.appendBotReply(session, container, reply, detectedAgent, message);
            });
        },

        appendBotReply(session, container, reply, agent, userMsg) {
            const botMsg = { role: 'assistant', content: reply, agent };
            if (session) {
                session.messages.push(botMsg);
                session.lastMessage = reply.substring(0, 60) + (reply.length > 60 ? '...' : '');
                session.time = 'Just now';
                if (session.title === 'New Chat' && session.messages.length <= 4) {
                    session.title = userMsg.substring(0, 40) + (userMsg.length > 40 ? '...' : '');
                }
                if (agent && !session.agentUsed) session.agentUsed = agent;
            }
            container.innerHTML += this.msgHTML(botMsg);
            container.scrollTop = container.scrollHeight;
            this.renderSessionsList();
            // 自动保存到 Supabase
            this.saveToDB();
        },

        removeTyping() {
            const t = document.getElementById('b2bTyping');
            if (t) t.remove();
        },

        // ---- Intent detection ----
        detectIntent(msg) {
            const m = msg.toLowerCase();
            if (/design|render|photo|yard|backyard|layout|效果图|设计|照片|渲染/.test(m)) return 'designer';
            if (/price|cost|quote|budget|margin|报价|价格|成本|利润|how much/.test(m)) return 'pricing';
            if (/permit|compliance|hoa|setback|regulation|code|zoning|合规|许可|法规/.test(m)) return 'compliance';
            if (/customer|client|follow.?up|appointment|schedule|客户|跟进|预约/.test(m)) return 'customer-service';
            if (/spec|specification|material|install|warranty|product|manual|规格|材料|安装|保修|产品/.test(m)) return 'knowledge-base';
            return null;
        },

        // ---- Fallback responses ----
        fallback(msg, agent) {
            const map = {
                'designer': 'I\'d love to help with your design! To generate a scene-rendered proposal, I\'ll need:\n\n1. 📸 A photo of the yard/site\n2. 🏠 Product type (Sunroom / Pergola / ADU / Zip Blinds)\n3. 🎨 Style preference (Modern / Traditional / Mediterranean)\n\nPlease upload a site photo and I\'ll have the **AI Designer** create a rendering for you.',
                'pricing': 'Let me help you with pricing! To generate an accurate quote, I need:\n\n1. 📐 Approximate dimensions (width × depth)\n2. 🏷️ Product type and tier\n3. 📍 Installation location (for logistics)\n\nOnce I have these, the **Pricing Agent** will prepare a 3-tier quote with margin analysis.',
                'compliance': 'I\'ll check compliance requirements for you! Please provide:\n\n1. 📍 Full installation address (street, city, state)\n2. 🏠 Product type being installed\n3. 📋 HOA name (if applicable)\n\nThe **Compliance Manager** will scan local building codes, setback requirements, and HOA restrictions.',
                'customer-service': 'I can help with customer management! The **CS Executive** can:\n\n• 📋 Look up customer interaction history\n• 📅 Schedule follow-up appointments\n• 📊 Analyze customer sentiment\n• 🔔 Set automated follow-up reminders\n\nWhich customer would you like to look up?',
                'knowledge-base': 'Let me search our **Knowledge Base** for that. Our database covers:\n\n• 📐 Product specifications & dimensions\n• 🔧 Installation guides & best practices\n• 📋 Material certifications & test reports\n• 🛡️ Warranty terms & conditions\n\nCould you be more specific about what product or topic you\'re asking about?'
            };
            if (agent && map[agent]) return map[agent];
            return 'Thank you for your question! Here\'s how I can help:\n\n🎨 **Design** — "Show me a sunroom design for this yard"\n💰 **Pricing** — "How much for a 300 sqft pergola?"\n📋 **Compliance** — "What permits for a sunroom in Irvine, CA?"\n👥 **Customers** — "Show me Mr. Johnson\'s project history"\n📚 **Products** — "What\'s the max span for our pergola?"\n\nTry asking something specific and I\'ll route it to the right agent!';
        },

        // ---- Quick actions ----
        quickAction(type) {
            const prompts = {
                'design': 'I need help designing a project — can you generate a scene rendering?',
                'quote': 'I need a quote for a customer project. Can you help with pricing?',
                'compliance': 'What permits and compliance requirements do I need to check?',
                'customer': 'Can you look up a customer\'s project history and suggest next steps?',
                'product': 'I need technical specifications for one of our products.'
            };
            const isFullPage = document.getElementById('page-chatbot')?.classList.contains('active');
            const mode = isFullPage ? 'full' : 'float';
            const inputId = mode === 'full' ? 'fullChatInput' : 'floatChatInput';
            const input = document.getElementById(inputId);
            if (input) {
                input.value = prompts[type] || '';
                input.focus();
            }
        },

        // ---- Image upload ----
        handleImageUpload(input, mode) {
            const file = input.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const cid = mode === 'full' ? 'fullChatMessages' : 'floatChatMessages';
                const container = document.getElementById(cid);
                container.innerHTML += '<div class="b2b-msg user"><div class="msg-avatar"><i class="fas fa-user"></i></div><div class="msg-body"><div class="msg-bubble" style="padding:8px"><img src="' + e.target.result + '" style="max-width:200px;border-radius:8px;" alt="Uploaded"><div style="margin-top:8px;font-size:12px;opacity:0.8">📸 Uploaded site photo</div></div></div></div>';
                container.scrollTop = container.scrollHeight;
                setTimeout(() => {
                    const resp = { role: 'assistant', content: '📸 Great photo! I can see the site clearly. To generate an AI design rendering, please tell me:\n\n1. **Product type**: Sunroom, Pergola, ADU, or Zip Blinds?\n2. **Style**: Modern, Traditional, or Mediterranean?\n3. **Size preference**: Small, Medium, or Large?\n\nThe **AI Designer** will create a scene-fused rendering in about 30 seconds.', agent: 'designer' };
                    container.innerHTML += this.msgHTML(resp);
                    container.scrollTop = container.scrollHeight;
                    const session = this.sessions.find(s => s.id === this.currentSessionId);
                    if (session) {
                        session.messages.push({ role: 'user', content: '[Uploaded site photo]' });
                        session.messages.push(resp);
                        session.lastMessage = 'Great photo! To generate an AI design...';
                        session.time = 'Just now';
                        if (!session.agentUsed) session.agentUsed = 'designer';
                        this.renderSessionsList();
                    }
                }, 800);
            };
            reader.readAsDataURL(file);
            input.value = '';
        }
    };

    function initB2BChatbot() {
        b2bChat.init();
    }

    N.utils.chatbot = {
        b2bChat: b2bChat,
        initB2BChatbot: initB2BChatbot
    };

    // Global aliases
    window.b2bChat = b2bChat;
    window.initB2BChatbot = initB2BChatbot;
})();
