#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# bootstrap.sh — Import starter workflows into n8n and register them with
#                wbb-service.
#
# Usage:
#   ./infra/n8n/bootstrap.sh
#
# Env vars (all have sensible defaults for local dev):
#   N8N_URL          n8n base URL           (default: http://localhost:5678)
#   N8N_API_KEY      n8n API key            (required)
#   WBB_URL          wbb-service base URL   (default: http://localhost:3003)
#   WORKFLOWS_DIR    path to workflow JSONs  (default: dir of this script)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

N8N_URL="${N8N_URL:-http://localhost:5678}"
WBB_URL="${WBB_URL:-http://localhost:3003}"
WORKFLOWS_DIR="${WORKFLOWS_DIR:-$(dirname "$0")/workflows}"

if [[ -z "${N8N_API_KEY:-}" ]]; then
  echo "ERROR: N8N_API_KEY is not set."
  echo "  Get it from n8n → Settings → API → Create an API key."
  exit 1
fi

# ── Helpers ───────────────────────────────────────────────────────────────────

wait_for_n8n() {
  echo "⏳  Waiting for n8n at $N8N_URL ..."
  for i in $(seq 1 30); do
    if curl -sf "$N8N_URL/healthz" > /dev/null 2>&1; then
      echo "✅  n8n is up."
      return
    fi
    sleep 2
  done
  echo "ERROR: n8n did not become ready in time." >&2
  exit 1
}

wait_for_wbb() {
  echo "⏳  Waiting for wbb-service at $WBB_URL ..."
  for i in $(seq 1 30); do
    if curl -sf "$WBB_URL/health" > /dev/null 2>&1; then
      echo "✅  wbb-service is up."
      return
    fi
    sleep 2
  done
  echo "⚠️   wbb-service not reachable — skipping workflow registration."
}

n8n_api() {
  curl -sf \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    "$@"
}

# ── Import workflow ───────────────────────────────────────────────────────────

import_workflow() {
  local file="$1"
  local name
  name=$(basename "$file" .json)

  echo ""
  echo "📥  Importing workflow: $name"

  # Check if a workflow with this name already exists
  local existing_id
  existing_id=$(n8n_api "${N8N_URL}/api/v1/workflows?limit=250" \
    | grep -o "\"id\":\"[^\"]*\"" | head -1 \
    | sed 's/"id":"//;s/"//' || true)

  # Use jq if available for cleaner parsing, otherwise fallback
  if command -v jq &>/dev/null; then
    existing_id=$(n8n_api "${N8N_URL}/api/v1/workflows?limit=250" \
      | jq -r --arg name "$name" \
        '.data[] | select(.name == $name) | .id' | head -1 || true)
  fi

  local workflow_id

  if [[ -n "$existing_id" ]]; then
    echo "   ↩️  Workflow '$name' already exists (id: $existing_id) — skipping import."
    workflow_id="$existing_id"
  else
    local response
    response=$(n8n_api -X POST "${N8N_URL}/api/v1/workflows" \
      -d @"$file")

    if command -v jq &>/dev/null; then
      workflow_id=$(echo "$response" | jq -r '.id')
    else
      workflow_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"//;s/"//')
    fi

    echo "   ✅  Created workflow id: $workflow_id"
  fi

  # Activate the workflow
  n8n_api -X PATCH "${N8N_URL}/api/v1/workflows/${workflow_id}" \
    -d '{"active": true}' > /dev/null
  echo "   ▶️  Workflow activated."

  echo "$workflow_id"
}

# ── Register with wbb-service ─────────────────────────────────────────────────

register_with_wbb() {
  local pattern="$1"
  local webhook_path="$2"
  local workflow_name="$3"
  local workflow_id="$4"

  echo ""
  echo "🔗  Registering with wbb-service:"
  echo "     pattern      = $pattern"
  echo "     webhookPath  = $webhook_path"

  local response
  response=$(curl -sf -X POST "${WBB_URL}/v1/workflow/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"serviceIdPattern\": \"$pattern\",
      \"webhookPath\": \"$webhook_path\",
      \"workflowName\": \"$workflow_name\",
      \"n8nWorkflowId\": \"$workflow_id\"
    }" || echo '{"error":"wbb-service unreachable"}')

  echo "   ✅  Response: $response"
}

# ── Main ──────────────────────────────────────────────────────────────────────

wait_for_n8n
wait_for_wbb

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Processing workflows in: $WORKFLOWS_DIR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Import case-submitted-default and register as catch-all
if [[ -f "$WORKFLOWS_DIR/case-submitted-default.json" ]]; then
  wf_id=$(import_workflow "$WORKFLOWS_DIR/case-submitted-default.json")
  register_with_wbb "*" "case-submitted" "Case Submitted — Default Handler" "$wf_id"
fi

# ── Add more workflows here as they are created ───────────────────────────────
# if [[ -f "$WORKFLOWS_DIR/mam-passport.json" ]]; then
#   wf_id=$(import_workflow "$WORKFLOWS_DIR/mam-passport.json")
#   register_with_wbb "MAM-*" "mam-case-submitted" "MAM Passport Handler" "$wf_id"
# fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Bootstrap complete."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
