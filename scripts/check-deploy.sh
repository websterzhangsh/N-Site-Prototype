#!/bin/bash
# check-deploy.sh
# Check Cloudflare Pages deployment status from the command line.
# Reads credentials from .env file in the project root.
#
# Usage:
#   ./scripts/check-deploy.sh              # Check both projects
#   ./scripts/check-deploy.sh staging      # Check staging only
#   ./scripts/check-deploy.sh production   # Check production only

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env"

# ── Load .env ──────────────────────────────────────────────
if [ ! -f "$ENV_FILE" ]; then
    echo "ERROR: .env file not found at $ENV_FILE"
    echo "Create it with CF_API_TOKEN, CF_ACCOUNT_ID, CF_PROJECT_STAGING, CF_PROJECT_PRODUCTION"
    exit 1
fi

source "$ENV_FILE"

: "${CF_API_TOKEN:?Missing CF_API_TOKEN in .env}"
: "${CF_ACCOUNT_ID:?Missing CF_ACCOUNT_ID in .env}"
: "${CF_PROJECT_STAGING:?Missing CF_PROJECT_STAGING in .env}"
: "${CF_PROJECT_PRODUCTION:?Missing CF_PROJECT_PRODUCTION in .env}"

API_BASE="https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/pages/projects"

# ── Helper: fetch latest deployment for a project ──────────
check_project() {
    local project_name="$1"
    local label="$2"

    local response
    response=$(curl -sf "$API_BASE/$project_name/deployments?per_page=5" \
        -H "Authorization: Bearer $CF_API_TOKEN" 2>/dev/null)

    if [ $? -ne 0 ] || [ -z "$response" ]; then
        echo "  $label: API request failed"
        return 1
    fi

    # Parse with python3 for reliable JSON handling
    python3 - "$response" "$label" <<'PYEOF'
import json, sys
from datetime import datetime, timezone

data = json.loads(sys.argv[1])
label = sys.argv[2]

if not data.get("success"):
    print(f"  {label}: API error - {data.get('errors', 'unknown')}")
    sys.exit(1)

deployments = data.get("result", [])
if not deployments:
    print(f"  {label}: No deployments found")
    sys.exit(0)

# Show latest 3 deployments
print(f"\n  {'='*56}")
print(f"  {label}")
print(f"  {'='*56}")

for i, dep in enumerate(deployments[:3]):
    env = dep.get("environment", "?")
    trigger = dep.get("deployment_trigger", {})
    meta = trigger.get("metadata", {})
    branch = meta.get("branch", "?")
    commit = meta.get("commit_hash", "?")[:7]
    msg = meta.get("commit_message", "").split("\n")[0][:50]

    latest_stage = dep.get("latest_stage", {})
    status = latest_stage.get("status", "unknown")
    stage_name = latest_stage.get("name", "?")

    # Status emoji
    if status == "success":
        icon = "\033[32m✓ SUCCESS\033[0m"
    elif status == "failure":
        icon = "\033[31m✗ FAILED\033[0m"
    elif status in ("active", "idle"):
        icon = "\033[33m⟳ BUILDING\033[0m"
    else:
        icon = f"? {status}"

    created = dep.get("created_on", "")
    if created:
        try:
            dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            delta = now - dt
            if delta.total_seconds() < 60:
                ago = f"{int(delta.total_seconds())}s ago"
            elif delta.total_seconds() < 3600:
                ago = f"{int(delta.total_seconds()/60)}m ago"
            elif delta.total_seconds() < 86400:
                ago = f"{int(delta.total_seconds()/3600)}h ago"
            else:
                ago = f"{int(delta.total_seconds()/86400)}d ago"
        except:
            ago = created[:16]
    else:
        ago = "?"

    url = dep.get("url", "")
    marker = " (latest)" if i == 0 else ""

    print(f"\n  [{env}] {commit} on {branch}{marker}")
    print(f"  Status: {icon}  (stage: {stage_name})")
    print(f"  Time:   {ago}")
    print(f"  Commit: {msg}")
    if i == 0 and url:
        print(f"  URL:    {url}")

    # If failed, show which stage failed
    if status == "failure":
        stages = dep.get("stages", [])
        for s in stages:
            if s.get("status") == "failure":
                print(f"  \033[31m  └─ Failed at: {s['name']}\033[0m")

print()
PYEOF
}

# ── Main ───────────────────────────────────────────────────
TARGET="${1:-all}"

echo ""
echo "  Cloudflare Pages - Deployment Status"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"

case "$TARGET" in
    staging|stage|s)
        check_project "$CF_PROJECT_STAGING" "STAGING ($CF_PROJECT_STAGING.pages.dev)"
        ;;
    production|prod|p)
        check_project "$CF_PROJECT_PRODUCTION" "PRODUCTION (ai-nestopia.com)"
        ;;
    all|*)
        check_project "$CF_PROJECT_STAGING" "STAGING ($CF_PROJECT_STAGING.pages.dev)"
        check_project "$CF_PROJECT_PRODUCTION" "PRODUCTION (ai-nestopia.com)"
        ;;
esac
