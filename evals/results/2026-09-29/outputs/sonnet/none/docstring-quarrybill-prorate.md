```python
# quarrybill/billing.py
from datetime import date


def prorate(amount_cents: int, start: date, end: date, period_days: int = 30) -> int:
    """Compute the prorated charge for a partial billing period.

    Amount is scaled by the number of days between `start` and `end`
    (capped at `period_days`) and rounded to the nearest cent. This is
    for charges only; refunds are handled by a separate function and
    must not be routed through here.

    Integer arithmetic is used throughout so results are deterministic
    and match invoice/ledger totals exactly; floating-point math has
    previously caused off-by-a-cent discrepancies between the two.

    Args:
        amount_cents: Full-period charge, in cents. Always non-negative.
        start: First day included in the prorated period.
        end: Day the period ends, exclusive.
        period_days: Number of days in a full billing period.

    Returns:
        The prorated charge in cents, rounded half up.

    Raises:
        ValueError: If `end` is before `start`.
    """
    days = (end - start).days
    if days < 0:
        raise ValueError("end before start")
    days = min(days, period_days)
    # Adding half the denominator before integer division rounds half up,
    # instead of truncating toward zero.
    return (amount_cents * days + period_days // 2) // period_days
```
