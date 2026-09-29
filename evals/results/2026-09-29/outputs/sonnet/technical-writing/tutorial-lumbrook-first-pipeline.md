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
