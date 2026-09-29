```python
# quarrybill/billing.py
from datetime import date

def prorate(amount_cents: int, start: date, end: date, period_days: int = 30) -> int:
    """Returns the share of a per-period charge for a span of days.

    The span runs from `start` up to but not including `end`. It is capped
    at `period_days`, so a span longer than one period costs one full
    period, not more. The result is rounded half up to a whole cent.

    Args:
        amount_cents: Charge for one full period, in cents. Must not be
            negative. Refunds are handled by a separate function.
        start: First day of the span, inclusive.
        end: Last day of the span, exclusive. If it equals `start`, the
            span is empty and the result is 0.
        period_days: Length of the billing period in days.

    Returns:
        The prorated charge in cents.

    Raises:
        ValueError: If `end` is earlier than `start`.
    """
    days = (end - start).days
    if days < 0:
        raise ValueError("end before start")
    days = min(days, period_days)
    # Integer math on purpose: floats made invoice and ledger totals differ
    # by a cent. Adding half the period before the floor division rounds
    # half up.
    return (amount_cents * days + period_days // 2) // period_days
```
