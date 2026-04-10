#!/usr/bin/env python3
"""
将 B2B Chat 会话 (b2bChat.sessions) 对接到 Supabase chat_sessions 表。
3 处修改：
1. 在 b2bChat 对象内添加 Supabase 辅助方法
2. 修改 init: 先从 Supabase 加载会话再渲染
3. 修改 appendBotReply: 收到回复后保存会话
4. 修改 createSession: 新建会话后保存
5. 修改 clearCurrentSession: 清除后保存
"""
import sys

FILE = 'company-operations.html'
with open(FILE, 'r') as f:
    content = f.read()

changes = []

# ═══════════════════════════════════════════════════════
# 1. 在 b2bChat 对象开头添加 Supabase 辅助属性和方法
# ═══════════════════════════════════════════════════════
anchor1 = """        const b2bChat = {
            sessions: [],
            currentSessionId: null,
            isFloatingOpen: false,

            agents: {"""

insert1 = """        const b2bChat = {
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

            agents: {"""

if anchor1 in content:
    content = content.replace(anchor1, insert1, 1)
    changes.append("1. 添加 b2bChat.loadFromDB / b2bChat.saveToDB 辅助方法")
else:
    print("ERROR: 找不到 b2bChat 声明锚点")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 2. 修改 init: 先从 Supabase 加载再渲染
# ═══════════════════════════════════════════════════════
old_init = """            init() {
                this.sessions = ["""

new_init = """            init() {
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
                this.sessions = ["""

if old_init in content:
    content = content.replace(old_init, new_init, 1)
    changes.append("2. init: 先从 Supabase 加载会话再渲染（降级到 demo 数据）")
else:
    print("ERROR: 找不到 b2bChat.init 开头")
    sys.exit(1)

# 修改 init 结尾：原来的 init 结尾闭合改为 _initDefaultSessions 的结尾
old_init_end = """                this.currentSessionId = 'sess-001';
                this.renderSessionsList();
                this.renderMessages('full');
                this.addWelcomeMessage('float');
            },"""

new_init_end = """                this.currentSessionId = 'sess-001';
                this.renderSessionsList();
                this.renderMessages('full');
                this.addWelcomeMessage('float');
            },

            /* _initDefaultSessions end — see above */"""

# Actually, the _initDefaultSessions function should end properly
# The original init() body after the sessions array ends with the four lines above
# Since we renamed it to _initDefaultSessions, these lines will naturally close it

if old_init_end in content:
    # This is now inside _initDefaultSessions, no change needed, it's already correct
    pass

# ═══════════════════════════════════════════════════════
# 3. 修改 appendBotReply: 收到回复后保存到 Supabase
# ═══════════════════════════════════════════════════════
old_append = """                container.innerHTML += this.msgHTML(botMsg);
                container.scrollTop = container.scrollHeight;
                this.renderSessionsList();
            },

            removeTyping() {"""

new_append = """                container.innerHTML += this.msgHTML(botMsg);
                container.scrollTop = container.scrollHeight;
                this.renderSessionsList();
                // 自动保存到 Supabase
                this.saveToDB();
            },

            removeTyping() {"""

if old_append in content:
    content = content.replace(old_append, new_append, 1)
    changes.append("3. appendBotReply: 收到回复后自动保存到 Supabase")
else:
    print("ERROR: 找不到 appendBotReply 尾部")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 4. 修改 createSession: 新建会话后保存
# ═══════════════════════════════════════════════════════
old_create = """                this.renderSessionsList();
                this.renderMessages('full');
                document.getElementById('fullChatInput')?.focus();
                // Re-show quick actions
                const qa = document.getElementById('fullQuickActions');
                if (qa) qa.style.display = '';
            },

            switchSession(sessionId) {"""

new_create = """                this.renderSessionsList();
                this.renderMessages('full');
                document.getElementById('fullChatInput')?.focus();
                // Re-show quick actions
                const qa = document.getElementById('fullQuickActions');
                if (qa) qa.style.display = '';
                // 自动保存到 Supabase
                this.saveToDB();
            },

            switchSession(sessionId) {"""

if old_create in content:
    content = content.replace(old_create, new_create, 1)
    changes.append("4. createSession: 新建会话后自动保存到 Supabase")
else:
    print("ERROR: 找不到 createSession 尾部")
    sys.exit(1)

# ═══════════════════════════════════════════════════════
# 5. 修改 clearCurrentSession: 清除后保存
# ═══════════════════════════════════════════════════════
old_clear = """                    session.messages = [{ role: 'assistant', content: 'Chat cleared. How can I help you?', agent: null }];
                    session.lastMessage = 'Chat cleared';
                    this.renderMessages('full');
                    this.renderSessionsList();
                    const qa = document.getElementById('fullQuickActions');
                    if (qa) qa.style.display = '';
                }
            },"""

new_clear = """                    session.messages = [{ role: 'assistant', content: 'Chat cleared. How can I help you?', agent: null }];
                    session.lastMessage = 'Chat cleared';
                    this.renderMessages('full');
                    this.renderSessionsList();
                    const qa = document.getElementById('fullQuickActions');
                    if (qa) qa.style.display = '';
                    // 自动保存到 Supabase
                    this.saveToDB();
                }
            },"""

if old_clear in content:
    content = content.replace(old_clear, new_clear, 1)
    changes.append("5. clearCurrentSession: 清除会话后自动保存到 Supabase")
else:
    print("ERROR: 找不到 clearCurrentSession 结尾")
    sys.exit(1)

with open(FILE, 'w') as f:
    f.write(content)

print(f"✅ 成功修改 {len(changes)} 处:")
for c in changes:
    print(f"   {c}")
