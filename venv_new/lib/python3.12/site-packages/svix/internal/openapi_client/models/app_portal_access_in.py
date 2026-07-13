from typing import Any, Dict, List, Type, TypeVar, Union, cast

import attr

from ..types import UNSET, Unset

T = TypeVar("T", bound="AppPortalAccessIn")


@attr.s(auto_attribs=True)
class AppPortalAccessIn:
    """
    Attributes:
        expiry (Union[Unset, None, int]): How long the token will be valid for, in seconds.

            Valid values are between 1 hour and 7 days. The default is 7 days. Default: 604800.
        feature_flags (Union[Unset, List[str]]): The set of feature flags the created token will have access to.
        read_only (Union[Unset, None, bool]): Whether the app portal should be in read-only mode.
    """

    expiry: Union[Unset, None, int] = 604800
    feature_flags: Union[Unset, List[str]] = UNSET
    read_only: Union[Unset, None, bool] = UNSET
    additional_properties: Dict[str, Any] = attr.ib(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        expiry = self.expiry
        feature_flags: Union[Unset, List[str]] = UNSET
        if not isinstance(self.feature_flags, Unset):
            feature_flags = self.feature_flags

        read_only = self.read_only

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if expiry is not UNSET:
            field_dict["expiry"] = expiry
        if feature_flags is not UNSET:
            field_dict["featureFlags"] = feature_flags
        if read_only is not UNSET:
            field_dict["readOnly"] = read_only

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        expiry = d.pop("expiry", UNSET)

        feature_flags = cast(List[str], d.pop("featureFlags", UNSET))

        read_only = d.pop("readOnly", UNSET)

        app_portal_access_in = cls(
            expiry=expiry,
            feature_flags=feature_flags,
            read_only=read_only,
        )

        app_portal_access_in.additional_properties = d
        return app_portal_access_in

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
