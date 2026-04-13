#!/usr/bin/env python3
"""Fix A.1 Customer Basics -> Customer Info Card sync issues"""
import sys, os

HTML_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'company-operations.html')

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    original_len = len(content)

    # === Mod 1: Fix intakeFormData key mismatch ===
    for old, new in [
        ("intakeFormData['CHN-WF-001']", "intakeFormData['CHN-001']"),
        ("intakeFormData['CHN-WF-002']", "intakeFormData['CHN-002']"),
        ("intakeFormData['CHN-WF-003']", "intakeFormData['CHN-003']"),
        ("intakeFormData['OMY-WF-001']", "intakeFormData['OMY-001']"),
    ]:
        if old not in content:
            print(f"[FATAL] Mod 1: Key not found: {old}"); sys.exit(1)
        content = content.replace(old, new)
        print(f"[Mod 1] {old} -> {new}")

    # === Mod 2: Fix "Larrr" typo ===
    for old, new in [("'Larrr Zhang'", "'Larry Zhang'"), ("'larrr.zhang@email.com'", "'larry.zhang@email.com'")]:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            print(f"[Mod 2] {old} -> {new} ({count}x)")

    # === Mod 3: Add syncAllA1OnLoad() function ===
    anchor3 = '        // ===== Knowledge Base Functions ====='
    if anchor3 not in content:
        print("[FATAL] Mod 3: Anchor not found"); sys.exit(1)

    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '_sync_a1_onload.txt'), 'r', encoding='utf-8') as f:
        sync_func = f.read()

    content = content.replace(anchor3, sync_func + '\n' + anchor3)
    print("[Mod 3] Added syncAllA1OnLoad() function")

    # === Mod 4: Call syncAllA1OnLoad() after initProjectsPage() ===
    old4 = """                initProjectsPage();
                initTeamPage();"""
    new4 = """                initProjectsPage();
                syncAllA1OnLoad();
                initTeamPage();"""
    if old4 not in content:
        print("[FATAL] Mod 4: Anchor not found"); sys.exit(1)
    content = content.replace(old4, new4)
    print("[Mod 4] Added syncAllA1OnLoad() call")

    # === Mod 5: Update syncA1ToProject to refresh header meta ===
    old5 = """                if (currentDetailProject && currentDetailProject.id === projectId) {
                    renderProjectCustomer(project);
                }
                renderSidebarProjects();"""
    new5 = """                if (currentDetailProject && currentDetailProject.id === projectId) {
                    renderProjectCustomer(project);
                    var metaEl = document.getElementById('projDetailMeta');
                    if (metaEl) metaEl.textContent = name + ' \\u00b7 ' + project.type + ' \\u00b7 Started ' + project.startDate + ' \\u00b7 Budget $' + project.budget.toLocaleString();
                }
                renderSidebarProjects();"""
    if old5 not in content:
        print("[WARN] Mod 5: Could not find syncA1ToProject render block")
    else:
        content = content.replace(old5, new5, 1)
        print("[Mod 5] Updated syncA1ToProject header meta")

    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    delta = len(content) - original_len
    print(f"\nAll mods applied. Delta: {delta:+d} chars ({len(content):,} total)")

if __name__ == '__main__':
    main()
