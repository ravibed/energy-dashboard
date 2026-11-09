from datetime import datetime

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field


class Reading(BaseModel):
    """Average power over the interval that ENDS at `timestamp` (UTC)."""

    model_config = ConfigDict(populate_by_name=True)

    timestamp: AwareDatetime
    power_w: float = Field(alias="powerW")


class HourlyEnergy(BaseModel):
    hour_start: datetime  # start of the hour, Europe/Berlin, timezone-aware
    energy_kwh: float
    intervals_with_data: int
    intervals_expected: int
