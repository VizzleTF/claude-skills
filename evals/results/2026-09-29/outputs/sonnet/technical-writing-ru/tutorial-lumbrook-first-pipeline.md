# Get started with Lumbrook

In this tutorial you install Lumbrook, run a pipeline that turns a CSV file into Parquet, and then change the pipeline. It takes about 15 minutes.

You need Python 3.11 or later and [pipx](https://pipx.pypa.io). You don't need to know Lumbrook. This tutorial covers version 2.3.0.

## Install Lumbrook

Install the `lumb` command:

```
pipx install lumbrook==2.3.0
```

## Create a demo project

Lumbrook describes each pipeline in a file called `pipeline.yaml`. The `init` command creates a project with a ready-made pipeline and sample data:

```
lumb init demo
```

This creates a `demo` folder with two files:

- `demo/pipeline.yaml` is the pipeline description.
- `demo/data/orders.csv` is a sample file with 1,000 order rows.

## Run the pipeline

```
lumb run demo
```

Lumbrook prints the number of rows it processed, followed by the elapsed time:

```
Processed 1000 rows
```

It also writes the result to `demo/out/orders.parquet`. This is the CSV file converted to Parquet, which is Lumbrook's main job.

## Look at the result

Show the first five rows of the Parquet file:

```
lumb preview demo/out/orders.parquet --rows 5
```

The table has four columns: `order_id`, `customer_id`, `total_cents`, and `created_at`. Note that `total_cents` holds the order total in cents. You use it in the next step.

## Change the pipeline

Now keep only the orders above 50 dollars, which is 5,000 cents.

1. Open `demo/pipeline.yaml` in a text editor.
2. Find the `steps:` key.
3. Add this line to the list under `steps:`. Use the same indentation as the entries already there:

   ```yaml
   - filter: "total_cents > 5000"
   ```

4. Save the file and run the pipeline again:

   ```
   lumb run demo
   ```

This time the output reports how many rows passed the filter:

```
Processed 1000 rows, kept 212
```

Lumbrook read all 1,000 rows, and 212 of them have a `total_cents` above 5000.

## What you did

You installed Lumbrook, ran a CSV-to-Parquet pipeline, checked the result with `lumb preview`, and changed the pipeline by adding a `filter` step.

## Next steps

- To run a pipeline automatically on a timetable, read the how-to "Schedule a pipeline".
- To see what else you can put in `pipeline.yaml`, read the reference "pipeline.yaml keys".

---

Three notes on what I left out:

- **Existing `steps:` contents:** I don't know what the generated `pipeline.yaml` contains, so I didn't show the file. If you paste it, I can add a before-and-after snippet, which is the most useful thing missing for a first-time reader.
- **Re-run output:** I don't know whether the second run overwrites `demo/out/orders.parquet`. So the tutorial doesn't ask readers to preview the filtered file. If it does overwrite, add a preview step after the change. That is a satisfying way to end the tutorial.
- **Assumed dollar amounts:** I assumed `total_cents` means cents, which its name suggests, so the tutorial explains 5,000 as 50 dollars. Please confirm.
