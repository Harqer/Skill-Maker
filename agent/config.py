"""
config.py — Central secrets loader for Skill Maker agent.

Primary path: Infisical Machine Identity SDK (infisicalsdk).
  Set INFISICAL_CLIENT_ID, INFISICAL_CLIENT_SECRET, and INFISICAL_PROJECT_ID
  in the process environment (e.g. via Docker/K8s secrets). The SDK will
  fetch all project secrets and inject them into os.environ before the rest
  of this module reads them.

Fallback path: `infisical run -- <command>` CLI wrapper.
  Works for local dev. Ensure you are logged in: `infisical login`

All other modules MUST import secrets from this module — never call
os.getenv() directly in application code.
"""
import os


# ── Infisical Python SDK bootstrap ────────────────────────────────────────────
# If Machine Identity credentials are present, use the SDK to populate
# os.environ before reading any secrets below. This makes the service
# portable without the `infisical run --` CLI wrapper (e.g. in containers).
def _bootstrap_infisical() -> None:
    client_id     = os.environ.get("INFISICAL_CLIENT_ID")
    client_secret = os.environ.get("INFISICAL_CLIENT_SECRET")
    project_id    = os.environ.get("INFISICAL_PROJECT_ID")
    environment   = os.environ.get("INFISICAL_ENV", "dev")

    if not (client_id and client_secret and project_id):
        # No Machine Identity configured — rely on infisical CLI injection.
        return

    try:
        from infisical_client import (
            InfisicalClient,
            ClientSettings,
            AuthenticationOptions,
            UniversalAuthMethod,
        )

        client = InfisicalClient(
            ClientSettings(
                auth=AuthenticationOptions(
                    universal_auth=UniversalAuthMethod(
                        client_id=client_id,
                        client_secret=client_secret,
                    )
                )
            )
        )
        secrets = client.listSecrets(
            project_id=project_id,
            environment_slug=environment,
            secret_path="/",
        )
        for s in secrets:
            # Only set if not already present so CLI-injected values take precedence.
            os.environ.setdefault(s.secretKey, s.secretValue)
        print(f"[config] Infisical SDK: loaded {len(secrets)} secrets "
              f"(project={project_id}, env={environment})")
    except Exception as exc:  # noqa: BLE001
        # Non-fatal: fall back to CLI-injected env vars.
        print(f"[config] Infisical SDK bootstrap failed (falling back to CLI env): {exc}")


_bootstrap_infisical()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _require(key: str) -> str:
    """Read a required env var. Raises clearly if missing."""
    val = os.environ.get(key)
    if not val:
        raise EnvironmentError(
            f"[config] Required secret '{key}' is not set. "
            "Ensure the process is started via `infisical run -- <cmd>` "
            "or INFISICAL_CLIENT_ID / INFISICAL_CLIENT_SECRET / INFISICAL_PROJECT_ID "
            "are set for Machine Identity auth."
        )
    return val


def _optional(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


# ── Database ─────────────────────────────────────────────────────────────────
DATABASE_URL: str = _require("DATABASE_URL")

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URI: str = _require("REDIS_URI")

# ── LLM / AI ─────────────────────────────────────────────────────────────────
GEMINI_API_KEY: str    = _require("GEMINI_API_KEY")
LANGSMITH_API_KEY: str = _require("LANGSMITH_API_KEY")
LANGSERVE_API_KEY: str = _optional("LANGSERVE_API_KEY")
LANGCACHE_TOKEN: str   = _optional("LANGCACHE_TOKEN")

# ── Auth ──────────────────────────────────────────────────────────────────────
CLERK_SECRET_KEY: str      = _require("CLERK_SECRET_KEY")
CLERK_WEBHOOK_SECRET: str  = _optional("CLERK_WEBHOOK_SECRET")

# ── External scraping APIs ────────────────────────────────────────────────────
FIRECRAWL_API_KEY: str     = _optional("FIRECRAWL_API_KEY")
SIMPLESCRAPER_API_KEY: str = _optional("SIMPLESCRAPER_API_KEY")

# ── Redis Agent Memory (managed service: memory.redis.io) ────────────────────
# Uses the official `redis-agent-memory` Python SDK.
#   AGENT_MEMORY_BASE_URL  — e.g. https://gcp-us-east4.memory.redis.io
#   AGENT_MEMORY_STORE_ID  — the store UUID from the Redis Agent Memory dashboard
#   AGENT_MEMORY_TOKEN     — the mem1_... API key from the dashboard
# Leave all empty to disable agent memory gracefully (non-fatal).
AGENT_MEMORY_BASE_URL: str  = _optional("AGENT_MEMORY_BASE_URL", "")
AGENT_MEMORY_STORE_ID: str  = _optional("AGENT_MEMORY_STORE_ID", "")
AGENT_MEMORY_TOKEN: str     = _optional("AGENT_MEMORY_TOKEN")

# ── Context Retriever ─────────────────────────────────────────────────────────
# Required when context_retriever.py is used. Set in Infisical.
CTX_AGENT_KEY: str = _optional("CTX_AGENT_KEY", "")

# ── SkillOpt ─────────────────────────────────────────────────────────────────
# Path to the checked-out SkillOpt repo root, OR derived from the installed
# package location as a fallback (see skillopt_integration.py).
SKILLOPT_ROOT: str = _optional("SKILLOPT_ROOT", "")

# ── Databricks ────────────────────────────────────────────────────────────────
# Used for lakehouse storage, Delta Lake pipelines, and long-term skill data.
#   DATABRICKS_HOST  — workspace hostname, e.g. adb-<id>.4.azuredatabricks.net
#   DATABRICKS_TOKEN — Personal Access Token (PAT) with cluster/SQL warehouse access
# Both are optional so the service starts without Databricks if not configured.
DATABRICKS_HOST: str  = _optional("DATABRICKS_HOST", "")
DATABRICKS_TOKEN: str = _optional("DATABRICKS_TOKEN", "")


# ── LangSmith tracing toggle (NVIDIA LangSmith / Deep Agent) ───────────────
# Set both env var names: LANGSMITH_TRACING is the 2026 canonical name;
# LANGCHAIN_TRACING_V2 is still read by older LangChain internals. Both must
# be set to "true" to ensure every LangChain/LangGraph call is traced.
os.environ.setdefault("LANGSMITH_TRACING",      "true")
os.environ.setdefault("LANGCHAIN_TRACING_V2",   "true")
os.environ.setdefault("LANGCHAIN_API_KEY",       LANGSMITH_API_KEY)
os.environ.setdefault("LANGSMITH_API_KEY",       LANGSMITH_API_KEY)
os.environ.setdefault("GOOGLE_API_KEY",          GEMINI_API_KEY)

# Ensure NVIDIA LangSmith (Deep Agent) integration by pointing to the right project/endpoint if provided
os.environ.setdefault("LANGCHAIN_PROJECT",       _optional("LANGCHAIN_PROJECT", "deep-agent"))
if _optional("NVIDIA_LANGSMITH_ENDPOINT"):
    os.environ.setdefault("LANGCHAIN_ENDPOINT",  _optional("NVIDIA_LANGSMITH_ENDPOINT"))
