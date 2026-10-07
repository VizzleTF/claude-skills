# 0004. Fixed color scale without themes

## Context

ccOverhead has a ten-tier scale with dark and light palettes that colors both growth and usage percentages. In the briefing the user did not pick "colors and themes" from the list of features.

## Decision

tidemark uses the ccOverhead ten-tier scale as is, in dark and light variants chosen by the host theme. Powerline backgrounds use the tier color for metrics and four fixed neutral colors for model, git, cwd and time widgets. The config has no color key.

## Why

Rejected: themes and per-widget color overrides like ccstatusline. They add a schema section, an editor section and a contrast check for every combination, for a feature the user did not ask for.

Rejected: plain terminal ANSI colors that follow the user's terminal palette. On the desktop surface there is no ANSI palette, and the tier scale depends on a monotonic hue order that a random terminal palette breaks.

## Consequences

- Users with a terminal palette that clashes with the scale cannot fix it from the config.
- Adding themes later means a new optional key in schema v1 or a v2, plus editor and test work; the scale constants are the single place to start.
- In `left` mode the tier still comes from the used share, so a bar reading "73% left" is colored as 27% used.
- The scale is borrowed and attributed in `NOTICE.md`; changing its values breaks parity with ccOverhead for users who know both.
