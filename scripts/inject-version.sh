#!/usr/bin/env bash
# ============================================================
# inject-version.sh — 将 git short hash 注入 HTML 中的 JS 引用
#
# 用法: bash scripts/inject-version.sh [file]
#   默认处理 company-operations.html
#
# 替换规则:
#   js/core/namespace.js?v=__HASH__  →  js/core/namespace.js?v=aaf1cc0
#   js/data/pricing-data.js?v=__HASH__  →  js/data/pricing-data.js?v=aaf1cc0
#
# 在 build 流程中调用，确保部署版本与 git commit 对应
# ============================================================

set -euo pipefail

FILE="${1:-company-operations.html}"
HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "dev")

if [ ! -f "$FILE" ]; then
    echo "[inject-version] File not found: $FILE"
    exit 1
fi

# 统计替换次数
COUNT=$(grep -c '__HASH__' "$FILE" 2>/dev/null || echo "0")

if [ "$COUNT" = "0" ]; then
    echo "[inject-version] No __HASH__ placeholders found in $FILE"
    exit 0
fi

# 执行替换（macOS sed 兼容写法）
sed -i '' "s/__HASH__/${HASH}/g" "$FILE"

echo "[inject-version] Replaced ${COUNT} __HASH__ → ${HASH} in ${FILE}"
