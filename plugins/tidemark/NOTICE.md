# Notice

tidemark is written from scratch. It takes these ideas and formulas from [ccOverhead](https://github.com/shengyy/ccoverhead) (MIT):

- The ten-step colour scale with its dark and light palettes, the growth tiers that double from 0.1% of the window and the percentage tiers.
- The prompt cache rules. Only the main conversation counts, and a rewrite is a read under half of the previous request. The first request after a compaction is not a rewrite; a model change makes the cache cold.
- Context growth: the sparkline of per-turn gains and its reset on compaction, `/clear`, resume, branch and an unannounced drop.
- Quota handling: the 5-hour and weekly windows, the model's own week, and the last known figure kept between sessions.

The quota forecast follows the window-average formula of [WeekToken](https://github.com/3dnow/claude-mods/blob/main/weektoken/hooks/pace.ts), as ccOverhead uses it: time to exhaustion = time elapsed × (1 − share used) / share used.

## ccOverhead license

```
MIT License

Copyright (c) 2026 ccOverhead contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
