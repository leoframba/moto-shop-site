# schemas.py
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class RateUpdate(BaseModel):
    hourly_rate: float


class ServiceUpdate(BaseModel):
    name: str
    description: str | None = None
    category_id: str
    pricing_type: str
    estimated_hours: float | None = None
    fixed_price: float | None = None


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: str | None = None
    estimated_hours: float = Field(..., gt=0)
    category_id: str
    pricing_type: str = Field("hourly", pattern="^(hourly|fixed|contact)$")
    estimated_hours: float | None = None
    fixed_price: float | None = None

    @field_validator("name")
    @classmethod
    def capitalize_name(cls, v: str) -> str:
        if not v:
            return v
        return v.strip().title()

    @field_validator("estimated_hours")
    @classmethod
    def check_positive_hours(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Estimated hours must be greater than zero")
        return v


class ServiceVisibilityUpdate(BaseModel):
    is_hidden: bool


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2)

    @field_validator("name")
    @classmethod
    def format_name(cls, v: str) -> str:
        return v.strip()


class BikeBase(BaseModel):
    owner_id: str | None = None
    year: int = Field(..., ge=1900, le=2100)
    make: str = Field(..., min_length=1)
    model: str = Field(..., min_length=1)
    vin: str | None = None
    license_plate: str | None = None
    color: str | None = None
    admin_notes: str | None = None

    @field_validator("make", "model")
    @classmethod
    def normalize_required_text(cls, v: str) -> str:
        return v.strip()

    @field_validator("vin", "license_plate", "color", "admin_notes", mode="before")
    @classmethod
    def blank_string_to_none(cls, v):
        if isinstance(v, str):
            value = v.strip()
            return value or None
        return v


class BikeCreate(BikeBase):
    pass


class BikeUpdate(BikeBase):
    pass


class PartBase(BaseModel):
    part_number: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    base_price: float = Field(..., ge=0)

    @field_validator("part_number")
    @classmethod
    def normalize_part_number(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("description")
    @classmethod
    def normalize_part_description(cls, v: str) -> str:
        return v.strip()


class PartCreate(PartBase):
    pass


class PartUpdate(PartBase):
    pass


class InvoiceLineItemCreate(BaseModel):
    item_type: Literal["service", "part"]
    service_id: str | None = None
    part_id: str | None = None
    snapshot_name: str = Field(..., min_length=1)
    pricing_type: Literal["hourly", "fixed"] | None = None
    unit_price: float = Field(..., ge=0)
    quantity: float = Field(..., gt=0)

    @field_validator("snapshot_name")
    @classmethod
    def normalize_snapshot_name(cls, v: str) -> str:
        return v.strip()

    @field_validator("service_id", "part_id", mode="before")
    @classmethod
    def blank_reference_to_none(cls, v):
        if isinstance(v, str):
            value = v.strip()
            return value or None
        return v

    @model_validator(mode="after")
    def validate_reference(self):
        if self.item_type == "service":
            self.part_id = None
        if self.item_type == "part":
            self.service_id = None
            self.pricing_type = None
        return self


class InvoiceCreate(BaseModel):
    owner_id: str | None = None
    bike_id: str | None = None
    status: Literal["draft", "estimate", "in_progress", "completed", "paid", "void"] = (
        "draft"
    )
    odometer_in: int | None = None
    odometer_out: int | None = None
    mechanic_notes: str | None = None
    line_items: list[InvoiceLineItemCreate] = Field(default_factory=list, min_length=1)

    @field_validator("owner_id", "bike_id", "mechanic_notes", mode="before")
    @classmethod
    def blank_to_none(cls, v):
        if isinstance(v, str):
            value = v.strip()
            return value or None
        return v


class InvoiceUpdate(InvoiceCreate):
    pass


class InvoiceStatusUpdate(BaseModel):
    status: Literal["draft", "estimate", "in_progress", "completed", "paid", "void"]


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None

    @field_validator("first_name", "last_name", "phone_number", mode="before")
    @classmethod
    def blank_to_none(cls, v):
        if isinstance(v, str):
            value = v.strip()
            return value or None
        return v


class UserInvite(BaseModel):
    email: str = Field(..., min_length=3)
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    redirect_base_url: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("A valid email address is required.")
        return v

    @field_validator("first_name", "last_name", "phone_number", mode="before")
    @classmethod
    def blank_to_none(cls, v):
        if isinstance(v, str):
            value = v.strip()
            return value or None
        return v


class ShopSettingsUpdate(BaseModel):
    shop_name: str | None = None
    shop_address: str | None = None
    shop_phone: str | None = None
    shop_email: str | None = None
    hourly_rate: float | None = Field(default=None, ge=0)
    tax_rate: float | None = Field(default=None, ge=0, le=100)

    @field_validator(
        "shop_name", "shop_address", "shop_phone", "shop_email", mode="before"
    )
    @classmethod
    def normalize_text(cls, v):
        if isinstance(v, str):
            value = v.strip()
            return value or None
        return v
