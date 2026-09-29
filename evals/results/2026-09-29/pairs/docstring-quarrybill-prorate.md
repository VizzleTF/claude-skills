# Пара docstring-quarrybill-prorate

Язык: en. Вид: create.

Запрос:

> Write the docstring for this function, and a comment in the body if something there needs one. The project uses Google-style docstrings.
> 
> ```python
> # quarrybill/billing.py
> from datetime import date
> 
> def prorate(amount_cents: int, start: date, end: date, period_days: int = 30) -> int:
>     days = (end - start).days
>     if days < 0:
>         raise ValueError("end before start")
>     days = min(days, period_days)
>     return (amount_cents * days + period_days // 2) // period_days
> ```
> 
> Context you can't see in the code: `amount_cents` is never negative, refunds go through a different function. `end` is exclusive. We use integer math on purpose: with floats, invoices and ledger totals used to differ by a cent. The last line rounds half up to the nearest cent.

Факты:

- The function is quarrybill.billing.prorate(amount_cents, start, end, period_days=30) and returns an int
- amount_cents is an amount in cents (minor units) and is never negative; refunds use a separate function
- end is exclusive: the number of days is (end - start).days
- The number of charged days is capped at period_days
- The result is rounded half up to the nearest cent
- It raises ValueError when end is before start
- Integer arithmetic is used because floating point caused 1-cent differences between invoices and ledger totals
- The project uses Google-style docstrings

---

## X

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

---

## Y

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
