#!/usr/bin/env python3
"""Fix: Add click-to-preview for non-image uploaded files in Intake form.

Problem: Non-image files (PDF, doc) only show an icon with no onclick handler.
         Images have previewProjectFile() but other file types don't.

Fix: Add onclick="previewProjectFile(...)" to the non-image file icon too.
"""
import sys, os

HTML_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'company-operations.html')

def main():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = len(content)

    # Fix 1: Non-image files in intake upload list — add click handler
    old = """                                        ${isImg && thumbSrc
                                            ? '<img src="' + thumbSrc + '" class="w-8 h-8 rounded object-cover flex-shrink-0 cursor-pointer" onclick="previewProjectFile(\\'' + encodeURIComponent(thumbSrc) + '\\', \\'' + encodeURIComponent(ef.name) + '\\', \\'' + ef.type + '\\', \\'' + (ef.storagePath || '') + '\\')">'
                                            : '<i class="fas fa-file-check flex-shrink-0"></i>'}"""

    new = """                                        ${isImg && thumbSrc
                                            ? '<img src="' + thumbSrc + '" class="w-8 h-8 rounded object-cover flex-shrink-0 cursor-pointer" onclick="previewProjectFile(\\'' + encodeURIComponent(thumbSrc) + '\\', \\'' + encodeURIComponent(ef.name) + '\\', \\'' + ef.type + '\\', \\'' + (ef.storagePath || '') + '\\')">'
                                            : '<i class="fas fa-file-check flex-shrink-0 cursor-pointer hover:text-blue-600 transition" onclick="previewProjectFile(\\'' + encodeURIComponent(ef.url || '') + '\\', \\'' + encodeURIComponent(ef.name) + '\\', \\'' + (ef.type || '') + '\\', \\'' + (ef.storagePath || '') + '\\')"></i>'}"""

    if old not in content:
        print("[FATAL] Could not find non-image file icon block")
        sys.exit(1)
    content = content.replace(old, new)
    print("[Mod 1] Added previewProjectFile onclick to non-image intake files")

    # Fix 2: Also make the filename text clickable (entire row)
    old2 = """                                    return `<div class="flex items-center gap-2 py-1.5 px-2 bg-green-50/80 rounded-lg text-xs text-green-700 group">"""
    new2 = """                                    return `<div class="flex items-center gap-2 py-1.5 px-2 bg-green-50/80 rounded-lg text-xs text-green-700 group cursor-pointer hover:bg-green-100/80 transition" onclick="previewProjectFile('${encodeURIComponent(ef.url || '')}', '${encodeURIComponent(ef.name)}', '${ef.type || ''}', '${ef.storagePath || ''}')">"""

    if old2 not in content:
        print("[WARN] Could not find row div for clickable row")
    else:
        content = content.replace(old2, new2)
        print("[Mod 2] Made entire file row clickable for preview")

    with open(HTML_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
    delta = len(content) - orig
    print(f"\nDone. Delta: {delta:+d} chars ({len(content):,} total)")

if __name__ == '__main__':
    main()
