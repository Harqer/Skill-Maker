from enum import Enum


class Oauth2GrantType(str, Enum):
    CLIENTCREDENTIALS = "clientCredentials"

    def __str__(self) -> str:
        return str(self.value)
