# Пара tutorial-lumbrook-first-pipeline

Язык: en. Вид: create.

Запрос:

> Write a getting-started tutorial for Lumbrook. The readers are data analysts who have never used it. By the end they should have run a pipeline and changed it once.
> 
> Here is everything I have:
> 
> - Lumbrook is a CLI (`lumb`) that runs data pipelines described in `pipeline.yaml`. Its main job is turning CSV into Parquet.
> - We document version 2.3.0. Install: `pipx install lumbrook==2.3.0`. Needs Python 3.11+.
> - `lumb init demo` creates `demo/pipeline.yaml` and a sample `demo/data/orders.csv` with 1,000 rows.
> - `lumb run demo` prints `Processed 1000 rows` plus the elapsed time, and writes `demo/out/orders.parquet`.
> - `lumb preview demo/out/orders.parquet --rows 5` shows the first 5 rows. Columns: `order_id`, `customer_id`, `total_cents`, `created_at`.
> - To change the pipeline, add this under `steps:` in `pipeline.yaml`: `- filter: "total_cents > 5000"`. Then `lumb run demo` prints `Processed 1000 rows, kept 212`.
> - It takes about 15 minutes end to end.
> - After this they should read the how-to "Schedule a pipeline" and the reference "pipeline.yaml keys".

Факты:

- Lumbrook is a command-line tool, invoked as lumb, that runs data pipelines described in pipeline.yaml and turns CSV into Parquet
- The tutorial targets Lumbrook 2.3.0; install it with pipx install lumbrook==2.3.0; it needs Python 3.11 or newer
- lumb init demo creates demo/pipeline.yaml and a sample file demo/data/orders.csv with 1,000 rows
- lumb run demo prints "Processed 1000 rows" followed by the elapsed time and writes demo/out/orders.parquet
- lumb preview demo/out/orders.parquet --rows 5 prints the first 5 rows with columns order_id, customer_id, total_cents, created_at
- Adding the step - filter: "total_cents > 5000" under steps in pipeline.yaml and running lumb run demo again prints "Processed 1000 rows, kept 212"
- The whole tutorial takes about 15 minutes
- Suggested next pages are the how-to "Schedule a pipeline" and the reference "pipeline.yaml keys"

---

## X

# Get started with Lumbrook

In this tutorial, we will run a Lumbrook pipeline that turns a CSV file into Parquet, then change the pipeline to filter rows. It takes about 15 minutes.

## Before you start

- Python 3.11 or later
- `pipx`
- A terminal

This tutorial covers Lumbrook 2.3.0.

## Steps

1. Install Lumbrook.

   ```bash
   pipx install lumbrook==2.3.0
   ```

   This gives you the `lumb` command.

2. Create a demo project.

   ```bash
   lumb init demo
   ```

   The command creates two files:

   - `demo/pipeline.yaml`: the pipeline definition.
   - `demo/data/orders.csv`: sample data with 1,000 rows.

3. Run the pipeline.

   ```bash
   lumb run demo
   ```

   The output should look something like this:

   ```
   Processed 1000 rows
   ```

   The line is followed by the elapsed time. Notice that the count matches the 1,000 rows in `orders.csv`. Lumbrook wrote the result to `demo/out/orders.parquet`.

4. Look at the Parquet file.

   ```bash
   lumb preview demo/out/orders.parquet --rows 5
   ```

   The command shows the first five rows. The columns are `order_id`, `customer_id`, `total_cents` and `created_at`.

5. Add a filter. Open `demo/pipeline.yaml` and add this item under `steps:`, indented like the items already there:

   ```yaml
   - filter: "total_cents > 5000"
   ```

   The filter keeps only orders above 5,000 cents.

6. Run the pipeline again.

   ```bash
   lumb run demo
   ```

   The output should look something like this:

   ```
   Processed 1000 rows, kept 212
   ```

   Notice that Lumbrook still reads all 1,000 rows and keeps 212 of them.

## Result

The second run reports `kept 212`. This shows that the change you made in `pipeline.yaml` altered what the pipeline produces.

## What next

- How-to: Schedule a pipeline
- Reference: pipeline.yaml keys

---

## Y

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
