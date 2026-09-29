# Getting Started with Lumbrook

This tutorial walks you through installing Lumbrook, running your first pipeline, and making a small change to it. By the end, you'll have turned a CSV file into Parquet and filtered it with one extra line of config.

**Time required:** about 15 minutes

**Who this is for:** data analysts who have never used Lumbrook before. No prior experience with the tool is assumed.

## Prerequisites

- Python 3.11 or later
- [pipx](https://pypa.github.io/pipx/) installed

## Step 1: Install Lumbrook

This tutorial documents Lumbrook 2.3.0. Install that exact version with pipx:

```
pipx install lumbrook==2.3.0
```

Once it finishes, the `lumb` command will be available in your terminal.

## Step 2: Create a demo project

Lumbrook can scaffold a working example for you, complete with sample data. Run:

```
lumb init demo
```

This creates a `demo` folder containing:

- `demo/pipeline.yaml` — the pipeline definition
- `demo/data/orders.csv` — a sample dataset with 1,000 rows

Take a quick look at `demo/pipeline.yaml` if you're curious, but you don't need to edit anything yet — the next step will run it as-is.

## Step 3: Run the pipeline

Every Lumbrook pipeline runs with the `lumb run` command, pointed at the project folder:

```
lumb run demo
```

You should see output like:

```
Processed 1000 rows
```

along with the elapsed time. This tells you the pipeline read all 1,000 rows from `orders.csv` and converted them. The result is written to `demo/out/orders.parquet`.

## Step 4: Preview the output

Lumbrook's main job is turning CSV into Parquet, so let's confirm that happened. Use `lumb preview` to peek at the first few rows of the output file:

```
lumb preview demo/out/orders.parquet --rows 5
```

You'll see the first 5 rows, with these columns:

- `order_id`
- `customer_id`
- `total_cents`
- `created_at`

This is the same data as the CSV, now in Parquet format.

## Step 5: Change the pipeline

Now let's modify the pipeline so it only keeps larger orders. Open `demo/pipeline.yaml` and add a `filter` step under `steps:`:

```yaml
steps:
  - filter: "total_cents > 5000"
```

Save the file, then run the pipeline again:

```
lumb run demo
```

This time the output will look like:

```
Processed 1000 rows, kept 212
```

Lumbrook still read all 1,000 input rows, but the filter step dropped everything with `total_cents` of 5000 or less, leaving 212 rows in `demo/out/orders.parquet`. If you like, run `lumb preview demo/out/orders.parquet --rows 5` again to see the filtered data.

## What you've done

In this tutorial you:

- Installed Lumbrook
- Generated a sample pipeline and dataset with `lumb init`
- Ran a pipeline with `lumb run` to produce a Parquet file
- Inspected the output with `lumb preview`
- Changed the pipeline's behavior by adding a `filter` step

## Next steps

- How-to guide: **Schedule a pipeline** — run your pipeline automatically instead of by hand
- Reference: **pipeline.yaml keys** — the full list of keys you can use in a pipeline definition
