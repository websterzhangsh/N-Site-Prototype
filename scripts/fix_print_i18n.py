#!/usr/bin/env python3
"""Fix: Print preview shows bilingual text for English-only tenant.
Replace hardcoded bilingual labels with i18n-aware t() calls in previewQuotation().
"""
import re, sys, os

FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'company-operations.html')

with open(FILE, 'r', encoding='utf-8') as fh:
    content = fh.read()

original_lines = content.count('\n') + 1
print(f"Original: {original_lines} lines")

changes = 0

def rx(pattern, repl, desc, count=0):
    """Regex replace with verification."""
    global content, changes
    result, n = re.subn(pattern, repl, content, count=count)
    if n == 0:
        print(f"  ERROR: '{desc}' - no match!")
        sys.exit(1)
    content = result
    changes += 1
    print(f"  ✓ {changes}. {desc} ({n} hits)")

def sr(old, new, desc, count=1):
    """Simple string replace."""
    global content, changes
    c = content.count(old)
    if c == 0:
        print(f"  ERROR: '{desc}' - not found!")
        sys.exit(1)
    if count == 0:
        content = content.replace(old, new)
    else:
        content = content.replace(old, new, count)
    changes += 1
    print(f"  ✓ {changes}. {desc} ({c} found, replaced {'all' if count==0 else count})")

print("\n--- Making print preview i18n-aware ---\n")

# =====================================================================
# 1. Title calls: 'bilingual' → lang (both occurrences in previewQuotation)
# =====================================================================
sr("getQuotTypeTitle('bilingual')", "getQuotTypeTitle(lang)", "Title calls → lang", count=0)

# =====================================================================
# 2. Date label: >Date / 日期: ' → >' + t('printDate') + ': '
# =====================================================================
rx(r">Date / [^<]+: '", ">' + t('printDate') + ': '", "Date label")

# =====================================================================
# 3-6. Client info labels
# =====================================================================
rx(r'"label">Client / [^<]+</span>', '"label">\' + t(\'printClient\') + \': </span>', "Client label")
rx(r'"label">CS Rep / [^<]+</span>', '"label">\' + t(\'printCSRep\') + \': </span>', "CS Rep label")
rx(r'"label">Contact / [^<]+</span>', '"label">\' + t(\'printContact\') + \': </span>', "Contact label")
rx(r'"label">CS Contact / [^<]+</span>', '"label">\' + t(\'printCSContact\') + \': </span>', "CS Contact label")

# =====================================================================
# 7. Section title: >Product Dimensions / ...< → >' + t('printSectionDims') + '<
# =====================================================================
rx(r'section-title">Product Dimensions / [^<]+</div>', "section-title\">' + t('printSectionDims') + '</div>", "Section title")

# =====================================================================
# 8-15. Table headers (8 cells)
# =====================================================================
rx(r'>No\.<br>[^<]+</th>', ">' + t('printThNo') + '</th>", "TH: No.")
rx(r'>Product / [^<]+</th>', ">' + t('printThProduct') + '</th>", "TH: Product")
rx(r'>Width<br>[^<]+</th>', ">' + t('printThWidth') + '</th>", "TH: Width")
rx(r'>Height<br>[^<]+</th>', ">' + t('printThHeight') + '</th>", "TH: Height")
rx(r'>Area<br>[^<]+</th>', ">' + t('printThArea') + '</th>", "TH: Area")
rx(r'>Unit Price<br>[^<]+</th>', ">' + t('printThUnitPrice') + '</th>", "TH: Unit Price")
rx(r'>Qty<br>[^<]+</th>', ">' + t('printThQty') + '</th>", "TH: Qty")
rx(r'>Amount<br>[^<]+</th>', ">' + t('printThAmount') + '</th>", "TH: Amount")

# =====================================================================
# 16. Product Subtotal
# =====================================================================
rx(r'>Product Subtotal / [^<]+</strong>', ">' + t('printSubtotal') + '</strong>", "Product Subtotal")

# =====================================================================
# 17. Discount note
# =====================================================================
rx(r"Discount / [^:\n]+: '", "' + t('printDiscount') + ': '", "Discount note")

# =====================================================================
# 18. RMB Total row - replace bilingual label with t() call
# =====================================================================
rx(
    r">Preferential Total Price \(RMB\) / [^']+' \+ discountNote",
    ">' + t('printTotalRMB') + discountNote",
    "RMB total label"
)

# =====================================================================
# 19. Foreign currency total row
# The original builds: 'Preferential Total Price (' + currency + ') / ...'
# Replace entire <td> content with t() call
# =====================================================================
# Match: "7">Preferential Total Price (' + currency + ') / " ... "</td>"
rx(
    r'"7">Preferential Total Price \(\' \+ currency \+ \'\) / [^"]+</td>',
    "\"7\">' + t(currency === 'SGD' ? 'printTotalSGD' : 'printTotalUSD') + '</td>",
    "Foreign total label"
)

# =====================================================================
# 20. Exchange rate note - replace bilingual text with t() call
# Match: currency + ' to RMB exchange rate / ' + (ternary) + '兑人民币汇率: '
# =====================================================================
# The original line is complex with ternary. Replace the whole rateNote assignment.
# Find the rateNote line and replace it
old_rate = content[content.find("rateNote = '<div"):content.find("noteIdx++;", content.find("rateNote = '<div"))]
# Build new version
new_rate = """rateNote = '<div style="margin-bottom:4px;font-size:12px;color:#374151;line-height:1.6;">' + noteIdx + (lang === 'en' ? '. ' : '\\u3001') + currency + ' ' + t('printExchangeRate') + ': ' + rate + ' (' + dateStr + ')</div>';
                """
if old_rate:
    content = content.replace(old_rate, new_rate, 1)
    changes += 1
    print(f"  ✓ {changes}. Exchange rate note")
else:
    print("  ERROR: Exchange rate note not found!")
    sys.exit(1)

# =====================================================================
# 21. Material spec note - use dynamic labels based on product type
# =====================================================================
# Replace the specNote line with one that reads labels from the modal
old_spec_marker = "var specNote = '<div"
spec_start = content.find(old_spec_marker)
spec_end = content.find(";\n", spec_start)
old_spec = content[spec_start:spec_end + 1]

new_spec = """var matLabel1 = document.getElementById('quotLabelProfileColor').textContent;
            var matLabel2 = document.getElementById('quotLabelFabric').textContent;
            var specNote = '<div style="margin-bottom:4px;font-size:12px;color:#374151;line-height:1.6;">' + noteIdx + (lang === 'en' ? '. ' : '\\u3001') + matLabel1 + ': ' + profileColor + '; ' + matLabel2 + ': ' + (fabricColor ? fabricColor + ' ' : '') + fabric + '</div>';"""

content = content.replace(old_spec, new_spec, 1)
changes += 1
print(f"  ✓ {changes}. Material spec note (dynamic labels)")

# =====================================================================
# 22. Special Remarks title
# =====================================================================
rx(r'remarks-title">Special Remarks / [^<]+</div>', "remarks-title\">' + t('printRemarks') + '</div>", "Remarks title")

# =====================================================================
# 23-24. Seller / Buyer
# =====================================================================
rx(r'>Seller / [^<]+</strong>', ">' + t('printSeller') + ':</strong>", "Seller label")
rx(r'>Buyer / [^<]+</strong>', ">' + t('printBuyer') + ':</strong>", "Buyer label")

# =====================================================================
# 25-26. Signature & Date (2 occurrences)
# =====================================================================
rx(r'sig-line">Signature / [^<]+</div>', "sig-line\">' + t('printSignDate') + '</div>", "Signature labels")

# =====================================================================
# 27. Print button
# =====================================================================
rx(r'>Print / [^<]+</button>', ">' + t('printBtn') + '</button>", "Print button")

# =====================================================================
# Validation
# =====================================================================
final_lines = content.count('\n') + 1
print(f"\nFinal: {final_lines} lines (delta: {final_lines - original_lines})")

assert '</html>' in content, "FATAL: </html> missing!"
assert 'function previewQuotation' in content, "FATAL: previewQuotation missing!"
assert "t('printDate')" in content, "FATAL: printDate reference missing!"
assert "t('printClient')" in content, "FATAL: printClient reference missing!"

with open(FILE, 'w', encoding='utf-8') as fh:
    fh.write(content)

print(f"\n✅ All {changes} changes applied successfully!")
