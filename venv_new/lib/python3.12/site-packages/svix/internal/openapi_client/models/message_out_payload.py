from typing import Any, Dict, TypeVar

T = TypeVar("T", bound="MessageOutPayload")

MessageOutPayload = Dict[str, Any]
