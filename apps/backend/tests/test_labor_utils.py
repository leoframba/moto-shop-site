from labor_utils import line_labor_hours


def test_hourly_line_uses_quantity():
    assert line_labor_hours("hourly", 2.35, 95.0, 100.0) == 2.35


def test_fixed_line_converts_cost_to_hours():
    assert line_labor_hours("fixed", 1.0, 150.0, 100.0) == 1.5


def test_fixed_line_rounds_up_to_nearest_tenth():
    assert line_labor_hours("fixed", 1.0, 151.0, 100.0) == 1.6
    assert line_labor_hours("fixed", 2.0, 50.5, 100.0) == 1.1


def test_fixed_line_with_zero_hourly_rate_returns_zero():
    assert line_labor_hours("fixed", 1.0, 200.0, 0.0) == 0.0
