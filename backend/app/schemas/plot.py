from pydantic import BaseModel


class PlotOwner(BaseModel):
    owner_id: str
    owner_code: str
    display_name: str
    share_numerator: int
    share_denominator: int
    share_percentage: float


class PlotDetailsResponse(BaseModel):
    plot_id: str
    plot_code: str
    mouza: str
    jl_number: str | None
    area: float
    area_unit: str
    is_synthetic_boundary: bool
    owners: list[PlotOwner]
    owner_count: int