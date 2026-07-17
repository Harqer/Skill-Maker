#!/bin/bash
# start_all.sh — Launch the full Skill Maker stack.
#
# All secrets are injected via `infisical run` from the project vault.
# Ensure you are logged in: `infisical login`
# Set the environment: export INFISICAL_ENV=dev  (or staging / prod)
#
# Processes:
#   1. FastAPI backend       — port 8000
#   2. RQ worker             — background job processor
#   3. SkillOpt WebUI        — port 7860  (skipped if not installed)
#   4. Vite frontend         — port 3000  (foreground)

set -e

INFISICAL_ENV="${INFISICAL_ENV:-dev}"
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &>/dev/null && pwd )"

echo "==> Skill Maker — environment: $INFISICAL_ENV"

# ── 1. FastAPI backend ────────────────────────────────────────────────────────
echo "[1/4] Starting FastAPI backend on port 8000..."
cd "$DIR/agent"
infisical run --env="$INFISICAL_ENV" -- uvicorn api:app --reload --port 8000 &
PID_API=$!

# ── 2. RQ worker ──────────────────────────────────────────────────────────────
echo "[2/4] Starting RQ worker..."
cd "$DIR/agent"
infisical run --env="$INFISICAL_ENV" -- rq worker &
PID_RQ=$!

# ── 3. SkillOpt WebUI ─────────────────────────────────────────────────────────
echo "[3/4] Starting SkillOpt WebUI on port 7860..."
SKILLOPT_WEBUI_DIR="${SKILLOPT_DIR:-$(python3 -c "import skillopt_webui, os; print(os.path.dirname(skillopt_webui.__file__))" 2>/dev/null || echo "")}"
if [ -n "$SKILLOPT_WEBUI_DIR" ]; then
    infisical run --env="$INFISICAL_ENV" -- python -m skillopt_webui.app --port 7860 &
    PID_SKILLOPT=$!
else
    echo "  [skip] skillopt_webui not found on PYTHONPATH — set SKILLOPT_DIR or install skillopt[webui]"
    PID_SKILLOPT=""
fi

# ── 4. Vite frontend (foreground) ─────────────────────────────────────────────
echo "[4/4] Starting Vite frontend on port 3000..."
cd "$DIR"
npm run dev

# Cleanup on exit
trap "kill $PID_API $PID_RQ ${PID_SKILLOPT:-} 2>/dev/null" EXIT
