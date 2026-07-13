from typing import Any, Dict, TypeVar

T = TypeVar("T", bound="MessageBroadcastInPayload")

MessageBroadcastInPayload = Dict[str, Any]
