#!/usr/bin/env python3
"""
Patch company-operations.html:
1. Add "Display" tab in System Settings
2. Add Display tab content with toggle for "Show Inherited Measurement Data"
3. Conditionally render "Inherited from Steps 1-2" section based on tenant setting
"""

FILE = 'company-operations.html'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ── Change 1: Add "Display" tab button after "Company" tab ──────────
old1 = '                    <button class="settings-tab px-4 py-2 text-sm font-medium border-b-2 border-gray-900 text-gray-900" data-tab="company">Company</button>'

new1 = '                    <button class="settings-tab px-4 py-2 text-sm font-medium border-b-2 border-gray-900 text-gray-900" data-tab="company">Company</button>\n                    <button class="settings-tab px-4 py-2 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700" data-tab="display">Display</button>'

assert content.count(old1) == 1, f"Change 1: Expected 1, found {content.count(old1)}"
content = content.replace(old1, new1)
print("OK Change 1: Added Display tab button")


# ── Change 2: Add Display tab content section ──
old2 = '''                <!-- Integrations (hidden by default) -->
                <div class="settings-content bg-white rounded-xl border border-gray-200 p-6 hidden" id="content-integrations">'''

display_section = '''                <!-- Display Preferences (hidden by default) -->
                <div class="settings-content bg-white rounded-xl border border-gray-200 p-6 hidden" id="content-display">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">Display Preferences</h3>
                    <p class="text-sm text-gray-500 mb-6">Control which UI sections are visible in the project workflow.</p>

                    <div class="space-y-4">
                        <!-- Toggle: Show Inherited Measurement Data -->
                        <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-arrow-right text-purple-600"></i>
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">Show Inherited Data in Measurement</div>
                                    <div class="text-sm text-gray-500">Display the &ldquo;Inherited from Steps 1&ndash;2&rdquo; section in Step 3 (Zip Blinds)</div>
                                </div>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="toggleInheritedMeasurement" class="sr-only peer" onchange="setDisplaySetting('showInheritedMeasurementData', this.checked); showToast(this.checked ? 'Inherited section enabled' : 'Inherited section hidden', 'success')">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>
                    </div>

                    <p class="text-xs text-gray-400 mt-6"><i class="fas fa-info-circle mr-1"></i>These preferences are saved per tenant and take effect immediately.</p>
                </div>

                <!-- Integrations (hidden by default) -->
                <div class="settings-content bg-white rounded-xl border border-gray-200 p-6 hidden" id="content-integrations">'''

assert content.count(old2) == 1, f"Change 2: Expected 1, found {content.count(old2)}"
content = content.replace(old2, display_section)
print("OK Change 2: Added Display tab content with toggle")


# ── Change 3: Conditionally render "Inherited from Steps 1-2" section ──
old3 = '                    <!-- Inherited Data from Steps 1-2 -->\n                    <div class="mb-4 p-3 bg-purple-50/50 rounded-lg border border-purple-100">\n                        <div class="flex items-center gap-2 mb-2">\n                            <i class="fas fa-arrow-right text-purple-500 text-[10px]"></i>\n                            <span class="text-xs font-semibold text-purple-700">Inherited from Steps 1\u20132</span>\n                            <span class="text-[9px] text-purple-400 ml-auto">Auto-populated from intake & design</span>\n                        </div>\n                        ${inheritedRows}\n                    </div>'

new3 = "                    <!-- Inherited Data from Steps 1-2 (tenant-configurable) -->\n                    ${(typeof getDisplaySetting === 'function' && getDisplaySetting('showInheritedMeasurementData')) ? `\n                    <div class=\"mb-4 p-3 bg-purple-50/50 rounded-lg border border-purple-100\">\n                        <div class=\"flex items-center gap-2 mb-2\">\n                            <i class=\"fas fa-arrow-right text-purple-500 text-[10px]\"></i>\n                            <span class=\"text-xs font-semibold text-purple-700\">Inherited from Steps 1\u20132</span>\n                            <span class=\"text-[9px] text-purple-400 ml-auto\">Auto-populated from intake & design</span>\n                        </div>\n                        ${inheritedRows}\n                    </div>` : ''}"

assert content.count(old3) == 1, f"Change 3: Expected 1, found {content.count(old3)}"
content = content.replace(old3, new3)
print("OK Change 3: Wrapped Inherited section in tenant-level conditional")


# ── Change 4: Initialize toggle state when Settings page loads ──
old4 = 'function initSettingsPage() {\n            // Settings tab switching'

new4 = "function initSettingsPage() {\n            // Initialize Display Preferences toggles from saved state\n            var inheritToggle = document.getElementById('toggleInheritedMeasurement');\n            if (inheritToggle && typeof getDisplaySetting === 'function') {\n                inheritToggle.checked = getDisplaySetting('showInheritedMeasurementData');\n            }\n\n            // Settings tab switching"

assert content.count(old4) == 1, f"Change 4: Expected 1, found {content.count(old4)}"
content = content.replace(old4, new4)
print("OK Change 4: Added toggle initialization in initSettingsPage()")


# ── Verify ──
assert content != original, "No changes were made!"
print(f"\nAll 4 changes applied successfully.")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"OK File saved: {FILE}")
