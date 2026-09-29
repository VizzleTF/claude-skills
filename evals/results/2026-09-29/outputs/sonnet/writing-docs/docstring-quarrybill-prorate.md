```python
# quarrybill/billing.py
from datetime import date

def prorate(amount_cents: int, start: date, end: date, period_days: int = 30) -> int:
    """Returns the part of a period charge that covers the days from start to end.

    The span is capped at one full period, so the result never exceeds
    `amount_cents`. If `start` equals `end`, the result is 0. This function is
    for charges only. Refunds go through a different function.

    Args:
        amount_cents: Charge for a full period, in cents. Must not be negative.
        start: First day of the span, inclusive.
        end: Last day of the span, exclusive.
        period_days: Number of days in a full period.

    Returns:
        The prorated amount in cents, rounded half up to the nearest cent.

    Raises:
        ValueError: If `end` is before `start`.
    """
    days = (end - start).days
    if days < 0:
        raise ValueError("end before start")
    days = min(days, period_days)
    # Integer math on purpose: floats made invoice and ledger totals differ by
    # a cent. Adding half the divisor before flooring rounds half up.
    return (amount_cents * days + period_days // 2) // period_days
```
