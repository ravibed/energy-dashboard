from datetime import UTC, date, datetime, time, timedelta

import pytest

from aggregate import BERLIN, aggregate_hourly
from models import Reading


def full_day(day: date, power_w: float) -> list[Reading]:
    start = datetime.combine(day, time.min, tzinfo=BERLIN).astimezone(UTC)
    end = datetime.combine(day + timedelta(days=1), time.min, tzinfo=BERLIN).astimezone(UTC)
    out, t = [], start + timedelta(minutes=5)
    while t <= end:
        out.append(Reading(timestamp=t, powerW=power_w))
        t += timedelta(minutes=5)
    return out


def test_normal_day_24_hours_1kwh_each():
    result = aggregate_hourly(date(2026, 11, 3), full_day(date(2026, 11, 3), 1000))
    assert len(result) == 24
    assert all(h.energy_kwh == pytest.approx(1.0) for h in result)
    assert all(h.intervals_with_data == 12 and h.intervals_expected == 12 for h in result)
    assert result[0].hour_start.hour == 0 and result[0].hour_start.utcoffset() == timedelta(hours=1)


def test_spring_dst_day_has_23_hours():
    day = date(2026, 3, 29)
    result = aggregate_hourly(day, full_day(day, 1000))
    assert len(result) == 23
    assert sum(h.energy_kwh for h in result) == pytest.approx(23.0)
    # local 02:00 does not exist on this day
    assert [h.hour_start.hour for h in result][:4] == [0, 1, 3, 4]


def test_autumn_dst_day_has_25_hours():
    day = date(2026, 10, 25)
    result = aggregate_hourly(day, full_day(day, 1000))
    assert len(result) == 25
    assert sum(h.energy_kwh for h in result) == pytest.approx(25.0)
    # local 02:00 happens twice (summer time, then winter time)
    assert [h.hour_start.hour for h in result][:4] == [0, 1, 2, 2]


def test_missing_intervals_are_counted_and_add_no_energy():
    day = date(2026, 11, 3)
    readings = full_day(day, 1000)
    del readings[0:6]  # first 6 intervals of hour 0 missing
    result = aggregate_hourly(day, readings)
    assert result[0].intervals_with_data == 6
    assert result[0].energy_kwh == pytest.approx(0.5)
    assert result[1].intervals_with_data == 12


def test_interval_boundaries_belong_to_the_hour_in_which_they_end():
    day = date(2026, 11, 3)
    result = aggregate_hourly(day, full_day(day, 1000))
    # 01:00 local ends hour 0, 01:05 local starts hour 1 -> every hour has exactly 12
    assert result[0].intervals_with_data == 12 and result[1].intervals_with_data == 12


def test_readings_from_other_days_and_duplicates_are_ignored():
    day = date(2026, 11, 3)
    readings = full_day(day, 1000) + full_day(date(2026, 11, 4), 5000) + full_day(day, 1000)[:3]
    result = aggregate_hourly(day, readings)
    assert sum(h.energy_kwh for h in result) == pytest.approx(24.0)


def test_parses_api_shape_with_alias():
    r = Reading.model_validate({"timestamp": "2026-11-02T23:05:00Z", "powerW": 0})
    assert r.power_w == 0
