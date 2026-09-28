id: docstring-quarrybill-prorate
lang: en
kind: create
expect: docstring
core: false
facts:
- The function is quarrybill.billing.prorate(amount_cents, start, end, period_days=30) and returns an int
- amount_cents is an amount in cents (minor units) and is never negative; refunds use a separate function
- end is exclusive: the number of days is (end - start).days
- The number of charged days is capped at period_days
- The result is rounded half up to the nearest cent
- It raises ValueError when end is before start
- Integer arithmetic is used because floating point caused 1-cent differences between invoices and ledger totals
- The project uses Google-style docstrings

Write the docstring for this function, and a comment in the body if something there needs one. The project uses Google-style docstrings.

```python
# quarrybill/billing.py
from datetime import date

def prorate(amount_cents: int, start: date, end: date, period_days: int = 30) -> int:
    days = (end - start).days
    if days < 0:
        raise ValueError("end before start")
    days = min(days, period_days)
    return (amount_cents * days + period_days // 2) // period_days
```

Context you can't see in the code: `amount_cents` is never negative, refunds go through a different function. `end` is exclusive. We use integer math on purpose: with floats, invoices and ledger totals used to differ by a cent. The last line rounds half up to the nearest cent.
