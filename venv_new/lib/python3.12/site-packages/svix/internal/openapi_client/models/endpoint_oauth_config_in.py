from typing import TYPE_CHECKING, Any, Dict, List, Type, TypeVar, Union

import attr

from ..models.oauth_2_auth_method_in import Oauth2AuthMethodIn
from ..models.oauth_2_grant_type import Oauth2GrantType
from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.client_secret_jwt_params_in import ClientSecretJwtParamsIn


T = TypeVar("T", bound="EndpointOauthConfigIn")


@attr.s(auto_attribs=True)
class EndpointOauthConfigIn:
    """
    Attributes:
        auth_method (Oauth2AuthMethodIn):
        client_id (str):
        grant_type (Oauth2GrantType):
        token_url (str):
        client_secret (Union[Unset, None, str]):
        jwt_params (Union[Unset, ClientSecretJwtParamsIn]):
    """

    auth_method: Oauth2AuthMethodIn
    client_id: str
    grant_type: Oauth2GrantType
    token_url: str
    client_secret: Union[Unset, None, str] = UNSET
    jwt_params: Union[Unset, "ClientSecretJwtParamsIn"] = UNSET
    additional_properties: Dict[str, Any] = attr.ib(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        auth_method = self.auth_method.value

        client_id = self.client_id
        grant_type = self.grant_type.value

        token_url = self.token_url
        client_secret = self.client_secret
        jwt_params: Union[Unset, Dict[str, Any]] = UNSET
        if not isinstance(self.jwt_params, Unset):
            jwt_params = self.jwt_params.to_dict()

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "authMethod": auth_method,
                "clientId": client_id,
                "grantType": grant_type,
                "tokenUrl": token_url,
            }
        )
        if client_secret is not UNSET:
            field_dict["clientSecret"] = client_secret
        if jwt_params is not UNSET:
            field_dict["jwtParams"] = jwt_params

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        from ..models.client_secret_jwt_params_in import ClientSecretJwtParamsIn

        d = src_dict.copy()
        auth_method = Oauth2AuthMethodIn(d.pop("authMethod"))

        client_id = d.pop("clientId")

        grant_type = Oauth2GrantType(d.pop("grantType"))

        token_url = d.pop("tokenUrl")

        client_secret = d.pop("clientSecret", UNSET)

        _jwt_params = d.pop("jwtParams", UNSET)
        jwt_params: Union[Unset, ClientSecretJwtParamsIn]
        if isinstance(_jwt_params, Unset):
            jwt_params = UNSET
        else:
            jwt_params = ClientSecretJwtParamsIn.from_dict(_jwt_params)

        endpoint_oauth_config_in = cls(
            auth_method=auth_method,
            client_id=client_id,
            grant_type=grant_type,
            token_url=token_url,
            client_secret=client_secret,
            jwt_params=jwt_params,
        )

        endpoint_oauth_config_in.additional_properties = d
        return endpoint_oauth_config_in

    @property
    def additional_keys(self) -> List[str]:
        return list(self.additional_properties.keys())

    def __getitem__(self, key: str) -> Any:
        return self.additional_properties[key]

    def __setitem__(self, key: str, value: Any) -> None:
        self.additional_properties[key] = value

    def __delitem__(self, key: str) -> None:
        del self.additional_properties[key]

    def __contains__(self, key: str) -> bool:
        return key in self.additional_properties
