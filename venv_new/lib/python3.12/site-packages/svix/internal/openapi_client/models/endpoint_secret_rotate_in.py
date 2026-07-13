from typing import Any, Dict, List, Type, TypeVar, Union

import attr

from ..types import UNSET, Unset

T = TypeVar("T", bound="EndpointSecretRotateIn")


@attr.s(auto_attribs=True)
class EndpointSecretRotateIn:
    """
    Attributes:
        key (Union[Unset, None, str]): The endpoint's verification secret. If `null` is passed, a secret is
            automatically generated. Format: `base64` encoded random bytes optionally prefixed with `whsec_`. Recommended
            size: 24. Example: whsec_C2FVsBQIhrscChlQIMV+b5sSYspob7oD.
    """

    key: Union[Unset, None, str] = UNSET
    additional_properties: Dict[str, Any] = attr.ib(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        key = self.key

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if key is not UNSET:
            field_dict["key"] = key

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        key = d.pop("key", UNSET)

        endpoint_secret_rotate_in = cls(
            key=key,
        )

        endpoint_secret_rotate_in.additional_properties = d
        return endpoint_secret_rotate_in

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
