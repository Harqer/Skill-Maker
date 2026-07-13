import os
import requests


AGENT_MEMORY_TOKEN = os.getenv("AGENT_MEMORY_TOKEN")
# Assume a default base URL or get from env. 
# Since we only have the token and REDIS_URI, we'll try to infer or allow override.
AGENT_MEMORY_BASE_URL = os.getenv("AGENT_MEMORY_BASE_URL", "https://api.rediscloud.com")

class RedisAgentMemoryClient:
    def __init__(self, store_id="skill-maker-store"):
        self.store_id = store_id
        self.base_url = f"{AGENT_MEMORY_BASE_URL}/v1/stores/{self.store_id}"
        self.headers = {
            "Authorization": f"Bearer {AGENT_MEMORY_TOKEN}",
            "Content-Type": "application/json"
        }

    def add_session_event(self, session_id: str, role: str, text: str, metadata: dict = None):
        """
        Adds a session event to short-term memory, triggering automatic extraction 
        to long-term memory in the background.
        """
        if not AGENT_MEMORY_TOKEN:
            print("AGENT_MEMORY_TOKEN is not set. Skipping agent memory logging.")
            return

        payload = {
            "sessionId": session_id,
            "actorId": "skill-maker-agent",
            "role": role, # "USER" or "AGENT"
            "content": [{"text": text}],
            "metadata": metadata or {}
        }

        try:
            url = f"{self.base_url}/session-memory/events"
            response = requests.post(url, json=payload, headers=self.headers, timeout=5)
            response.raise_for_status()
            print(f"Successfully added {role} event to Redis Agent Memory for session {session_id}.")
            return response.json()
        except Exception as e:
            print(f"Failed to add session event to Redis Agent Memory: {e}")

    def add_long_term_memory(self, session_id: str, text: str, owner_id: str = "system"):
        """
        Adds a long-term memory entry directly.
        """
        if not AGENT_MEMORY_TOKEN:
            return

        payload = {
            "memories": [
                {
                    "text": text,
                    "memoryType": "episodic",
                    "sessionId": session_id,
                    "ownerId": owner_id
                }
            ]
        }

        try:
            url = f"{self.base_url}/long-term-memory"
            response = requests.post(url, json=payload, headers=self.headers, timeout=5)
            response.raise_for_status()
            print(f"Successfully added long-term memory for session {session_id}.")
            return response.json()
        except Exception as e:
            print(f"Failed to add long-term memory: {e}")
