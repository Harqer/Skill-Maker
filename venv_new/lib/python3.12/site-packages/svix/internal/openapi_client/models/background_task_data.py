from typing import Any, Dict, TypeVar

T = TypeVar("T", bound="BackgroundTaskData")

BackgroundTaskData = Dict[str, Any]
