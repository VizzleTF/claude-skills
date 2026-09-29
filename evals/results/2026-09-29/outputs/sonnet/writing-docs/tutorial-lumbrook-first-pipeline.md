# Getting started with Lumbrook

This tutorial gets you from a fresh install to a working pipeline that filters data, in about 15 minutes. You'll run `lumb`, the Lumbrook CLI, to turn a CSV file into Parquet, then change the pipeline and re-run it.

You need Python 3.11 or later. No prior Lumbrook experience required.

## 1. Install Lumbrook

```sh
pipx install lumbrook==2.3.0
```

This tutorial documents version 2.3.0.

## 2. Create a sample project

```sh
lumb init demo
```

This creates a `demo/` folder with two things:

- `demo/pipeline.yaml` — the pipeline definition
- `demo/data/orders.csv` — 1,000 rows of sample order data

## 3. Run the pipeline

```sh
lumb run demo
```

You'll see:

```
Processed 1000 rows
```

along with the elapsed time. Lumbrook has read `orders.csv`, applied the pipeline, and written `demo/out/orders.parquet`.

## 4. Preview the result

```sh
lumb preview demo/out/orders.parquet --rows 5
```

This prints the first 5 rows, with columns `order_id`, `customer_id`, `total_cents`, `created_at`.

## 5. Change the pipeline

Open `demo/pipeline.yaml` and add a filter step under `steps:`:

```yaml
steps:
  - filter: "total_cents > 5000"
```

Save the file, then run the pipeline again:

```sh
lumb run demo
```

You'll now see:

```
Processed 1000 rows, kept 212
```

Lumbrook read all 1,000 rows but kept only the 212 where `total_cents` is greater than 5000. Run `lumb preview demo/out/orders.parquet --rows 5` again if you want to confirm the output changed.

## What you've done

You installed Lumbrook, ran a pipeline that converts CSV to Parquet, previewed the output, and added a filter step to change what data comes through.

## Next steps

- How-to: [Schedule a pipeline](#) — run this pipeline automatically instead of by hand.
- Reference: [pipeline.yaml keys](#) — every key you can use in `pipeline.yaml`, including `filter` and the other step types.
