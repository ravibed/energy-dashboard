from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from models import HourlyEnergy, Reading

BERLIN = ZoneInfo("Europe/Berlin")


def aggregate_hourly(
    day: date, readings: list[Reading], interval_seconds: int = 300
) -> list[HourlyEnergy]:
    """Turn one Berlin day of readings into hourly kWh.

    * The day is 23, 24 or 25 hours long (DST) - we count real elapsed hours in UTC.
    * A reading belongs to the hour in which its interval ENDS (00:05 -> first hour,
      01:00 -> first hour, 01:05 -> second hour).
    * Missing readings add no energy; `intervals_with_data` shows how complete the hour is.
    """
    start = datetime.combine(day, time.min, tzinfo=BERLIN).astimezone(UTC)
    end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=BERLIN).astimezone(UTC)
    hours = int((end - start).total_seconds() // 3600)
    expected_per_hour = 3600 // interval_seconds

    wh = [0.0] * hours
    counts = [0] * hours
    seen: set[datetime] = set()

    for reading in readings:
        ts = reading.timestamp.astimezone(UTC)
        if ts <= start or ts > end or ts in seen:
            continue  # other day, or a duplicate
        seen.add(ts)
        index = int((ts - start).total_seconds() - 1) // 3600  # interval end 01:00 -> hour 0
        wh[index] += reading.power_w * interval_seconds / 3600
        counts[index] += 1

    return [
        HourlyEnergy(
            hour_start=(start + timedelta(hours=i)).astimezone(BERLIN),
            energy_kwh=wh[i] / 1000,
            intervals_with_data=counts[i],
            intervals_expected=expected_per_hour,
        )
        for i in range(hours)
    ]
