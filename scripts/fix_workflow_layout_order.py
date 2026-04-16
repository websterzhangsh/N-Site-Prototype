#!/usr/bin/env python3
"""
布局调整：将 Service Workflow section 移到 Agent Toolbar 下方
当前顺序：Workflow → Agents → Risk List
目标顺序：Agents → Workflow → Risk List
"""

HTML_PATH = 'company-operations.html'

with open(HTML_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# The current block order (lines 4120-4165):
#   1. Service Workflow (4120-4134)
#   2. Agent Toolbar (4136-4153)
#   3. Agent Panel Container (4155-4165)
#   4. Risk List (4167-...)
#
# We want:
#   1. Agent Toolbar
#   2. Agent Panel Container
#   3. Service Workflow   <-- moved here
#   4. Risk List

# Strategy: Replace the entire block (Workflow + Agents) with (Agents + Workflow)

workflow_block = """                            <div class="bg-white rounded-xl border border-gray-200 mb-5 overflow-hidden">
                                <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-100 bg-gray-50/70">
                                    <i class="fas fa-project-diagram text-blue-600 text-sm"></i>
                                    <h3 class="text-sm font-semibold text-gray-700">Service Workflow</h3>
                                    <span class="text-xs text-gray-400 ml-auto" id="projWorkflowHint">Click a step to view details</span>
                                </div>
                                <div class="p-5">
                                    <div class="flex items-center justify-between gap-2" id="projWorkflowSteps">
                                        <!-- 6-step pipeline rendered by JS -->
                                    </div>
                                </div>
                                <!-- Step Detail Expansion -->
                                <div id="projStepDetail" class="hidden border-t border-gray-100">
                                </div>
                            </div>"""

agent_toolbar_block = """                            <!-- v1.2.0: Agent Toolbar (horizontal) -->
                            <div class="agent-toolbar" id="agentToolbar">
                                <div class="agent-toolbar-card" data-agent="compliance-agent" onclick="toggleAgentPanel('compliance-agent')"
                                     style="--agent-icon:#2563eb;--agent-bg:#eff6ff;--agent-border:#bfdbfe;">
                                    <i class="fas fa-shield-alt"></i>
                                    <div class="agent-label">Compliance</div>
                                </div>
                                <div class="agent-toolbar-card" data-agent="customer-service-agent" onclick="toggleAgentPanel('customer-service-agent')"
                                     style="--agent-icon:#ca8a04;--agent-bg:#fefce8;--agent-border:#fde68a;">
                                    <i class="fas fa-headset"></i>
                                    <div class="agent-label">CS Exec</div>
                                </div>
                                <div class="agent-toolbar-card" data-agent="knowledge-base" onclick="toggleAgentPanel('knowledge-base')"
                                     style="--agent-icon:#4b5563;--agent-bg:#f3f4f6;--agent-border:#d1d5db;">
                                    <i class="fas fa-brain"></i>
                                    <div class="agent-label">Knowledge</div>
                                </div>
                            </div>"""

agent_panel_block = """                            <!-- Agent Panel Container (expands below toolbar) -->
                            <div class="agent-panel-container" id="agentPanelContainer">
                                <div class="agent-panel-inner">
                                    <button class="agent-panel-close" onclick="closeAgentPanel()">
                                        <i class="fas fa-times text-xs"></i>
                                    </button>
                                    <div id="agentPanelContent">
                                        <!-- Agent content loaded dynamically -->
                                    </div>
                                </div>
                            </div>"""

# Current order in HTML
old_order = workflow_block + "\n\n" + agent_toolbar_block + "\n\n" + agent_panel_block

# New order: Agents first, then Workflow
new_order = agent_toolbar_block + "\n\n" + agent_panel_block + "\n\n" + workflow_block

assert content.count(old_order) == 1, f"Expected 1 match, found {content.count(old_order)}"
content = content.replace(old_order, new_order, 1)
print("OK: Swapped Workflow and Agents sections")

assert content != original, "No changes made!"
with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("DONE: Layout updated — Agents now above Workflow")
