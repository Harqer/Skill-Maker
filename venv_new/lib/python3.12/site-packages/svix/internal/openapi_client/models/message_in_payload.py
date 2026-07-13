from typing import Any, Dict, TypeVar

T = TypeVar("T", bound="MessageInPayload")

MessageInPayload = Dict[str, Any]
