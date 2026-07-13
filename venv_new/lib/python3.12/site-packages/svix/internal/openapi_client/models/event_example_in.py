from typing import Any, Dict, List, Type, TypeVar

import attr

T = TypeVar("T", bound="EventExampleIn")


@attr.s(auto_attribs=True)
class EventExampleIn:
    """
    Attributes:
        event_type (str): The event type's name Example: user.signup.
    """

    event_type: str
    additional_properties: Dict[str, Any] = attr.ib(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        event_type = self.event_type

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update(
            {
                "eventType": event_type,
            }
        )

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        event_type = d.pop("eventType")

        event_example_in = cls(
            event_type=event_type,
        )

        event_example_in.additional_properties = d
        return event_example_in

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
