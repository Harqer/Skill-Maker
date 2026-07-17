"""
memory_client.py — Redis Agent Memory client for Skill Maker.

Uses the official `redis-agent-memory` Python SDK against the managed
Redis Agent Memory service (memory.redis.io).

All credentials are sourced from config.py (Infisical-injected):
  AGENT_MEMORY_BASE_URL  — https://gcp-us-east4.memory.redis.io
  AGENT_MEMORY_STORE_ID  — store UUID from the dashboard
  AGENT_MEMORY_TOKEN     — mem1_... API key from the dashboard

If any credential is missing the client degrades gracefully (logs a
warning, returns None/empty) so skill generation is never blocked by
a memory service outage.
"""
from __future__ import annotations

import time
from typing import Optional

from config import AGENT_MEMORY_BASE_URL, AGENT_MEMORY_STORE_ID, AGENT_MEMORY_TOKEN

# ── Role constants (resolved lazily to avoid import-time SDK errors) ──────────

def _role(role_str: str):
    """Map a string role name to the SDK's MessageRole enum value."""
    from redis_agent_memory import models  # noqa: PLC0415
    _map = {
        "USER":              models.MessageRole.USER,
        "AGENT":             models.MessageRole.ASSISTANT,
        "ASSISTANT":         models.MessageRole.ASSISTANT,
        "SYSTEM":            models.MessageRole.SYSTEM,
        "SYSTEM_REFLECTION": models.MessageRole.SYSTEM,
    }
    return _map.get(role_str.upper(), models.MessageRole.USER)


# ── Client wrapper ────────────────────────────────────────────────────────────

class RedisAgentMemoryClient:
    """
    Thin wrapper around the official `redis-agent-memory` SDK.

    Holds a single persistent SDK client for the lifetime of the process.
    All public methods are non-fatal — exceptions are caught and logged so
    that the LangGraph pipeline continues even if the memory service is down.

    Usage (mirrors the SDK exactly):
        client = RedisAgentMemoryClient()
        client.add_session_event(session_id="abc", role="USER", text="hello")
        session  = client.get_session_memory("abc")
        client.add_long_term_memory(session_id="abc", text="important fact")
        results  = client.search_long_term_memory("important fact")
    """

    def __init__(self) -> None:
        self._client = None  # lazily initialised on first use

    # ── Internal ──────────────────────────────────────────────────────────────

    def _is_configured(self) -> bool:
        return bool(AGENT_MEMORY_BASE_URL and AGENT_MEMORY_STORE_ID and AGENT_MEMORY_TOKEN)

    def _get_client(self):
        """Return the persistent SDK client, creating it on first call."""
        if self._client is not None:
            return self._client

        if not self._is_configured():
            print(
                "[memory_client] Redis Agent Memory is not configured "
                "(AGENT_MEMORY_BASE_URL / AGENT_MEMORY_STORE_ID / AGENT_MEMORY_TOKEN "
                "missing from Infisical). Memory logging disabled."
            )
            return None

        try:
            from redis_agent_memory import AgentMemory  # noqa: PLC0415

            client = AgentMemory(
                AGENT_MEMORY_BASE_URL,
                store_id=AGENT_MEMORY_STORE_ID,
                api_key=AGENT_MEMORY_TOKEN,
            )
            # Enter the context manager once; the client stays open for the
            # lifetime of this process (mirrors `with AgentMemory(...) as c:`).
            self._client = client.__enter__()
            print(
                f"[memory_client] Connected to Redis Agent Memory "
                f"(store={AGENT_MEMORY_STORE_ID}, "
                f"url={AGENT_MEMORY_BASE_URL})"
            )
            return self._client
        except Exception as exc:
            print(f"[memory_client] Failed to create AgentMemory client: {exc}")
            return None

    # ── Session memory ────────────────────────────────────────────────────────

    def add_session_event(
        self,
        session_id: str,
        role: str,
        text: str,
        actor_id: str = "skill-maker-agent",
        metadata: Optional[dict] = None,
    ) -> None:
        """
        Append one turn to a session's short-term memory.

        The service automatically extracts long-term memories from sessions
        in the background (working memory → long-term memory pipeline).
        """
        client = self._get_client()
        if client is None:
            return

        try:
            client.add_session_event(
                session_id=session_id,
                actor_id=actor_id,
                role=_role(role),
                content=[{"text": text}],
                created_at=int(time.time() * 1000),  # milliseconds
            )
            print(
                f"[memory_client] Session event added "
                f"(session={session_id}, role={role})"
            )
        except Exception as exc:
            print(f"[memory_client] add_session_event failed: {exc}")

    def get_session_memory(self, session_id: str) -> Optional[object]:
        """Return the full session memory object for the given session_id."""
        client = self._get_client()
        if client is None:
            return None

        try:
            return client.get_session_memory(session_id=session_id)
        except Exception as exc:
            print(f"[memory_client] get_session_memory failed: {exc}")
            return None

    # ── Long-term memory ──────────────────────────────────────────────────────

    def add_long_term_memory(
        self,
        session_id: str,
        text: str,
        owner_id: str = "system",
    ) -> None:
        """
        Store a single fact directly in long-term memory.

        Uses bulk_create_long_term_memories under the hood (the SDK's
        single-item create path).
        """
        client = self._get_client()
        if client is None:
            return

        memory_id = f"{session_id}_{int(time.time() * 1000)}"
        try:
            client.bulk_create_long_term_memories(
                memories=[{"id": memory_id, "text": text}]
            )
            print(
                f"[memory_client] Long-term memory stored "
                f"(id={memory_id}, session={session_id})"
            )
        except Exception as exc:
            print(f"[memory_client] add_long_term_memory failed: {exc}")

    def search_long_term_memory(self, query: str, limit: int = 5) -> list:
        """
        Semantic search over long-term memories.

        Returns a list of matching memory objects, or [] on failure.
        """
        client = self._get_client()
        if client is None:
            return []

        try:
            results = client.search_long_term_memory(
                request={"text": query, "limit": limit}
            )
            return results if results is not None else []
        except Exception as exc:
            print(f"[memory_client] search_long_term_memory failed: {exc}")
            return []
