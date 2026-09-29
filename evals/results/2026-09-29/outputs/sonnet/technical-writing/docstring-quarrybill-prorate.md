```python
# quarrybill/billing.py
from datetime import date

def prorate(amount_cents: int, start: date, end: date, period_days: int = 30) -> int:
    """Return the part of a billing period's charge that covers start to end.

    Uses integer math only. Float math made invoice and ledger totals differ
    by a cent. Refunds are not handled here, so a negative amount is not
    supported.

    Args:
        amount_cents: Charge for a full period, in cents. Must not be negative.
        start: First day billed.
        end: Day the billing stops. Exclusive, so end == start bills nothing.
        period_days: Days in a full period. Any span longer than this is
            billed as one full period.

    Returns:
        The prorated charge in cents, rounded half up. Never more than
        amount_cents.

    Raises:
        ValueError: If end is before start.
    """
    days = (end - start).days
    if days < 0:
        raise ValueError("end before start")
    days = min(days, period_days)
    # Adding half the period before the floor division rounds half up
    # without floats.
    return (amount_cents * days + period_days // 2) // period_days
```
