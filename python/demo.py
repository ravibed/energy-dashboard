"""Shows aggregate_hourly() results as a table.  Run:  python demo.py  [YYYY-MM-DD]"""
import math
import random
import sys
from datetime import UTC, date, datetime, time, timedelta

from aggregate import BERLIN, aggregate_hourly
from models import Reading


def make_sample_readings(day: date) -> list[Reading]:
    """Fake solar day: 5-minute readings (interval END timestamps, UTC) with some random gaps."""
    rng = random.Random(42)
    start = datetime.combine(day, time.min, tzinfo=BERLIN).astimezone(UTC)
    end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=BERLIN).astimezone(UTC)
    readings, t = [], start + timedelta(minutes=5)
    while t <= end:
        local_hour = t.astimezone(BERLIN).hour + t.astimezone(BERLIN).minute / 60
        power = 6000 * math.sin(math.pi * (local_hour - 7) / 10) ** 2 if 7 <= local_hour <= 17 else 0
        if rng.random() > 0.08:  # ~8 % of intervals are missing
            readings.append(Reading(timestamp=t, powerW=round(power)))
        t += timedelta(minutes=5)
    return readings


if __name__ == "__main__":
    day = date.fromisoformat(sys.argv[1]) if len(sys.argv) > 1 else date(2026, 11, 3)
    result = aggregate_hourly(day, make_sample_readings(day))

    print(f"Hourly energy for {day} (Europe/Berlin) - {len(result)} hours\n")
    print(f"{'Hour (local)':<14}{'Energy kWh':>11}{'Data':>9}")
    print("-" * 34)
    for h in result:
        print(f"{h.hour_start:%H:%M %Z}".ljust(14) + f"{h.energy_kwh:>11.3f}" + f"{h.intervals_with_data:>5}/{h.intervals_expected}")
    print("-" * 34)
    print(f"{'Total':<14}{sum(h.energy_kwh for h in result):>11.3f}")
