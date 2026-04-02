#!/bin/bash
# verify-assets.sh
# Post-build verification: Ensures all image assets referenced in HTML/JS
# actually exist in the build output directory (dist/).
#
# This script prevents the "works locally, broken in production" problem
# by catching missing assets BEFORE deployment.
#
# Usage: ./scripts/verify-assets.sh
# Exit code: 0 = all assets found, 1 = missing assets detected

set -e

BUILD_DIR="dist"
ERRORS=0
CHECKED=0
MISSING_FILES=()

echo "============================================"
echo "  Asset Verification - Post Build Check"
echo "============================================"
echo ""

# Check build directory exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "ERROR: Build directory '$BUILD_DIR' not found."
    echo "       Run 'npm run build' first."
    exit 1
fi

# Extract all image references from HTML and JS files in dist/
# Matches: src='...', src="...", url('...'), url("...")
echo "Scanning $BUILD_DIR/ for image references..."
echo ""

# Find all HTML and JS files in dist
IMAGE_REFS=$(grep -rhoE "(src|url)\s*[=(]\s*['\"]([^'\"]+\.(jpg|jpeg|png|webp|gif|svg|ico))['\"]" "$BUILD_DIR" \
    --include="*.html" --include="*.js" 2>/dev/null \
    | grep -oE "['\"][^'\"]+\.(jpg|jpeg|png|webp|gif|svg|ico)['\"]" \
    | tr -d "'\""  \
    | sort -u || true)

# Also extract from JS template literals: src: 'images/...'
JS_REFS=$(grep -rhoE "src:\s*['\"][^'\"]+\.(jpg|jpeg|png|webp|gif|svg|ico)['\"]" "$BUILD_DIR" \
    --include="*.html" --include="*.js" 2>/dev/null \
    | grep -oE "['\"][^'\"]+\.(jpg|jpeg|png|webp|gif|svg|ico)['\"]" \
    | tr -d "'\""  \
    | sort -u || true)

ALL_REFS=$(echo -e "$IMAGE_REFS\n$JS_REFS" | sort -u | grep -v '^$' || true)

for ref in $ALL_REFS; do
    # Skip external URLs (http://, https://, data:, //)
    if echo "$ref" | grep -qE "^(https?://|data:|//)"; then
        continue
    fi

    # Skip CDN references
    if echo "$ref" | grep -qE "(cdn\.|googleapis|cloudflare|jsdelivr|unpkg|raw\.githubusercontent)"; then
        continue
    fi

    # Remove query strings and fragments (?v=123, #hash)
    clean_ref=$(echo "$ref" | sed 's/[?#].*//')

    # Resolve the path relative to build dir
    # Handle both relative paths and absolute paths
    if echo "$clean_ref" | grep -q "^/"; then
        asset_path="$BUILD_DIR$clean_ref"
    else
        asset_path="$BUILD_DIR/$clean_ref"
    fi

    CHECKED=$((CHECKED + 1))

    if [ ! -f "$asset_path" ]; then
        ERRORS=$((ERRORS + 1))
        MISSING_FILES+=("$clean_ref")
        echo "  MISSING  $clean_ref"
        echo "           Expected at: $asset_path"
    fi
done

echo ""
echo "--------------------------------------------"
echo "  Results: $CHECKED assets checked"
echo "--------------------------------------------"

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "  ERROR: $ERRORS missing asset(s) detected!"
    echo ""
    echo "  These files are referenced in your code but"
    echo "  do NOT exist in the build output ($BUILD_DIR/)."
    echo ""
    echo "  To fix: Move the source files to public/"
    echo "  Example:"
    for f in "${MISSING_FILES[@]}"; do
        echo "    cp $f public/$f"
    done
    echo ""
    echo "  Then rebuild: npm run build"
    echo ""
    exit 1
else
    echo "  All referenced assets found in $BUILD_DIR/ "
    echo ""
    exit 0
fi
