#!/usr/bin/env python3
"""Simulate verify-assets.sh locally to find missing image refs."""
import re, os

files = ['index.html', 'company-operations.html', 'login.html', 'partners.html', 'team-management.html']

all_refs = set()
for f in files:
    if not os.path.exists(f):
        continue
    content = open(f).read()
    # Pattern 1: src= or url( with quoted path
    p1 = re.findall(r'''(?:src|url)\s*[=(]\s*['"]([^'"]+\.(?:jpg|jpeg|png|webp|gif|svg|ico))['"]''', content)
    for ref in p1:
        if not re.match(r'https?://|data:|//', ref):
            all_refs.add(ref)
    # Pattern 2: src: '...' in JS objects
    p2 = re.findall(r'''src:\s*['"]([^'"]+\.(?:jpg|jpeg|png|webp|gif|svg|ico))['"]''', content)
    for ref in p2:
        if not re.match(r'https?://|data:|//', ref):
            all_refs.add(ref)

# Check which ones exist in public/
missing = []
for ref in sorted(all_refs):
    clean = re.sub(r'[?#].*', '', ref)
    if clean.startswith('/'):
        path = 'public' + clean
    else:
        path = 'public/' + clean
    if not os.path.exists(path):
        missing.append((clean, path))

print(f'Total refs found: {len(all_refs)}')
print(f'Missing: {len(missing)}')
for clean, path in missing:
    print(f'  MISSING: {clean}')
    print(f'    Expected: {path}')
