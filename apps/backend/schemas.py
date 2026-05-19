# schemas.py
from pydantic import BaseModel, Field, field_validator


class ServiceUpdate(BaseModel):
    name: str
    description: str
    estimated_hours: float


class RateUpdate(BaseModel):
    hourly_rate: float


class ServiceCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: str | None = None
    estimated_hours: float = Field(..., gt=0)

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
