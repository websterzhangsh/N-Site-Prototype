#!/usr/bin/env python3
"""
cache_bust.py — 为 company-operations.html 中所有 JS script 标签添加/更新 ?v= 版本号
用法: python3 scripts/cache_bust.py [version]
      version 默认使用 git short hash
"""
import re, sys, subprocess, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_FILE = os.path.join(ROOT, 'company-operations.html')

# 获取版本号
if len(sys.argv) > 1:
    version = sys.argv[1]
else:
    version = subprocess.check_output(
        ['git', 'rev-parse', '--short', 'HEAD'],
        cwd=ROOT
    ).decode().strip()

print(f'[cache_bust] 版本号: {version}')

with open(HTML_FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# 匹配 <script src="js/..."> 或 <script src="js/...?v=xxx">
# 替换为 <script src="js/...?v={version}">
pattern = r'(<script\s+src="js/[^"?]+)(?:\?v=[^"]*)?(">)'
replacement = rf'\1?v={version}\2'

new_content, count = re.subn(pattern, replacement, content)

if count == 0:
    print('[cache_bust] 未找到匹配的 script 标签！')
    sys.exit(1)

with open(HTML_FILE, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'[cache_bust] 已更新 {count} 个 script 标签，版本号: ?v={version}')
