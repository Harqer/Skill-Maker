import datetime
from typing import TYPE_CHECKING, Any, Dict, List, Type, TypeVar, Union

import attr
from dateutil.parser import isoparse

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.event_type_in import EventTypeIn
    from ..models.settings_in import SettingsIn


T = TypeVar("T", bound="EnvironmentIn")


@attr.s(auto_attribs=True)
class EnvironmentIn:
    """
    Attributes:
        created_at (datetime.datetime):
        version (int):
        event_types (Union[Unset, None, List['EventTypeIn']]):
        settings (Union[Unset, SettingsIn]):
    """

    created_at: datetime.datetime
    version: int
    event_types: Union[Unset, None, List["EventTypeIn"]] = UNSET
    settings: Union[Unset, "SettingsIn"] = UNSET
    additional_properties: Dict[str, Any] = attr.ib(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        created_at = self.created_at.isoformat()

        version = self.version
        event_types: Union[Unset, None, List[Dict[str, Any]]] = UNSET
        if not isinstance(self.event_types, Unset):
            if self.event_types is None:
                event_types = None
            else:
                event_types = []
                for event_types_item_data in self.event_types:
                    event_types_item = event_types_item_data.to_dict()

                    event_types.append(event_types_item)

        settings: Union[Unset, Dict[str, Any]] = UNSET
        if not isinstance(self.settings, Unset):
            settings = self.settings.to_dict()

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "createdAt": created_at,
                "version": version,
            }
        )
        if event_types is not UNSET:
            field_dict["eventTypes"] = event_types
        if settings is not UNSET:
            field_dict["settings"] = settings

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        from ..models.event_type_in import EventTypeIn
        from ..models.settings_in import SettingsIn

        d = src_dict.copy()
        created_at = isoparse(d.pop("createdAt"))

        version = d.pop("version")

        event_types = []
        _event_types = d.pop("eventTypes", UNSET)
        for event_types_item_data in _event_types or []:
            event_types_item = EventTypeIn.from_dict(event_types_item_data)

            event_types.append(event_types_item)

        _settings = d.pop("settings", UNSET)
        settings: Union[Unset, SettingsIn]
        if isinstance(_settings, Unset):
            settings = UNSET
        else:
            settings = SettingsIn.from_dict(_settings)

        environment_in = cls(
            created_at=created_at,
            version=version,
            event_types=event_types,
            settings=settings,
        )

        environment_in.additional_properties = d
        return environment_in

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
