id: tutorial-lumbrook-first-pipeline
lang: en
kind: create
expect: tutorial
core: false
facts:
- Lumbrook is a command-line tool, invoked as lumb, that runs data pipelines described in pipeline.yaml and turns CSV into Parquet
- The tutorial targets Lumbrook 2.3.0; install it with pipx install lumbrook==2.3.0; it needs Python 3.11 or newer
- lumb init demo creates demo/pipeline.yaml and a sample file demo/data/orders.csv with 1,000 rows
- lumb run demo prints "Processed 1000 rows" followed by the elapsed time and writes demo/out/orders.parquet
- lumb preview demo/out/orders.parquet --rows 5 prints the first 5 rows with columns order_id, customer_id, total_cents, created_at
- Adding the step - filter: "total_cents > 5000" under steps in pipeline.yaml and running lumb run demo again prints "Processed 1000 rows, kept 212"
- The whole tutorial takes about 15 minutes
- Suggested next pages are the how-to "Schedule a pipeline" and the reference "pipeline.yaml keys"

Write a getting-started tutorial for Lumbrook. The readers are data analysts who have never used it. By the end they should have run a pipeline and changed it once.

Here is everything I have:

- Lumbrook is a CLI (`lumb`) that runs data pipelines described in `pipeline.yaml`. Its main job is turning CSV into Parquet.
- We document version 2.3.0. Install: `pipx install lumbrook==2.3.0`. Needs Python 3.11+.
- `lumb init demo` creates `demo/pipeline.yaml` and a sample `demo/data/orders.csv` with 1,000 rows.
- `lumb run demo` prints `Processed 1000 rows` plus the elapsed time, and writes `demo/out/orders.parquet`.
- `lumb preview demo/out/orders.parquet --rows 5` shows the first 5 rows. Columns: `order_id`, `customer_id`, `total_cents`, `created_at`.
- To change the pipeline, add this under `steps:` in `pipeline.yaml`: `- filter: "total_cents > 5000"`. Then `lumb run demo` prints `Processed 1000 rows, kept 212`.
- It takes about 15 minutes end to end.
- After this they should read the how-to "Schedule a pipeline" and the reference "pipeline.yaml keys".
