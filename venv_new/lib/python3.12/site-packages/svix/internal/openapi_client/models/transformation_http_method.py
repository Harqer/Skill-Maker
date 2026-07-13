from enum import Enum


class TransformationHttpMethod(str, Enum):
    POST = "POST"
    PUT = "PUT"

    def __str__(self) -> str:
        return str(self.value)
