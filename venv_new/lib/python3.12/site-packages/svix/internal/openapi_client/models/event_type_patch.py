from typing import TYPE_CHECKING, Any, Dict, List, Type, TypeVar, Union

import attr

from ..types import UNSET, Unset

if TYPE_CHECKING:
    from ..models.event_type_patch_schemas import EventTypePatchSchemas


T = TypeVar("T", bound="EventTypePatch")


@attr.s(auto_attribs=True)
class EventTypePatch:
    """
    Attributes:
        archived (Union[Unset, bool]):
        description (Union[Unset, str]):
        feature_flag (Union[Unset, None, str]):  Example: cool-new-feature.
        schemas (Union[Unset, None, EventTypePatchSchemas]):  Example: {'description': 'An invoice was paid by a user',
            'properties': {'invoiceId': {'description': 'The invoice id', 'type': 'string'}, 'userId': {'description': 'The
            user id', 'type': 'string'}}, 'required': ['invoiceId', 'userId'], 'title': 'Invoice Paid Event', 'type':
            'object'}.
    """

    archived: Union[Unset, bool] = UNSET
    description: Union[Unset, str] = UNSET
    feature_flag: Union[Unset, None, str] = UNSET
    schemas: Union[Unset, None, "EventTypePatchSchemas"] = UNSET
    additional_properties: Dict[str, Any] = attr.ib(init=False, factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        archived = self.archived
        description = self.description
        feature_flag = self.feature_flag
        schemas = self.schemas

        field_dict: Dict[str, Any] = {}
        field_dict.update(self.additional_properties)
        field_dict.update({})
        if archived is not UNSET:
            field_dict["archived"] = archived
        if description is not UNSET:
            field_dict["description"] = description
        if feature_flag is not UNSET:
            field_dict["featureFlag"] = feature_flag
        if schemas is not UNSET:
            field_dict["schemas"] = schemas

        return field_dict

    @classmethod
    def from_dict(cls: Type[T], src_dict: Dict[str, Any]) -> T:
        d = src_dict.copy()
        archived = d.pop("archived", UNSET)

        description = d.pop("description", UNSET)

        feature_flag = d.pop("featureFlag", UNSET)

        schemas = d.pop("schemas", UNSET)

        event_type_patch = cls(
            archived=archived,
            description=description,
            feature_flag=feature_flag,
            schemas=schemas,
        )

        event_type_patch.additional_properties = d
        return event_type_patch

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
