# claude-skills

Claude Code skills, distributed as a plugin marketplace.

| Plugin | What it does | Status |
|---|---|---|
| `technical-writing` | Writes and reviews documentation by document type. Instructions in English. | in progress |
| `technical-writing-ru` | The same skill with instructions in Russian. | in progress |

## Install

```sh
claude plugin marketplace add VizzleTF/claude-skills
claude plugin install technical-writing@vizzletf-skills
```

Install one of the two language versions, not both: they trigger on the same requests.

## Status

The skills are being built from [briefs/technical-writing.md](briefs/technical-writing.md).

## License

[MIT](LICENSE)
