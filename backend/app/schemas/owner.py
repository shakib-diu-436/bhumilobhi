
from pydantic import BaseModel, Field, field_validator


class OwnerSearchRequest(BaseModel):
    synthetic_identifier: str = Field(
        min_length=1,
        max_length=40,
        examples=["SYN-NID-0001"],
    )

    @field_validator("synthetic_identifier")
    @classmethod
    def strip_identifier(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Synthetic identifier is required")
        return value


class OwnerPlotResult(BaseModel):
    plot_id: str
    plot_code: str
    mouza: str
    area: float
    area_unit: str
    share_numerator: int
    share_denominator: int
    share_percentage: float


class OwnerSearchResponse(BaseModel):
    owner_id: str
    owner_code: str
    display_name: str
    synthetic_identifier: str
    total_plots: int
    plots: list[OwnerPlotResult]
