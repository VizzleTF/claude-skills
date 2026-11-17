# technical-writing

Claude Code пишет и проверяет документацию по типу документа, под того, кто будет её читать.

- 13 типов: README, ранбук, ADR, changelog, how-to, постмортем и ещё 7
- тип выбирается по читателю: новичок, который учится, инженер посреди задачи, дежурный
- пишет обязательные разделы типа в пределах его бюджета слов
- правила стиля для русского и английского; другие языки получают общие правила
- на 28 сценариях на 20–30% короче прежнего скилла `writing-docs`; Opus, не зная, где чей текст, оценил их так же или выше
- `check.py` находит длинные предложения, стоп-слова, маркеры LLM и битые ссылки

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
```

Попробуйте `/technical-writing:runbook алерт QueueWorkerDown`. В ранбуке будут влияние, диагностика, шаги с командой проверки и эскалация.

## Подробнее

- Скрипту проверки нужен Python 3: `python3 skills/write/scripts/check.py --lang auto deploy.md`
- `/technical-writing:write` сам выбирает тип. У каждого типа есть и своя команда `/technical-writing:<тип>`: `adr`, `changelog`, `cli-help-errors`, `conventions`, `docstring`, `explanation`, `how-to`, `postmortem`, `readme`, `reference`, `runbook`, `troubleshooting`, `tutorial`.
- Если у вас стоял `technical-writing-ru`, выполните `/plugin marketplace update vizzletf-skills`, затем установку выше; `/technical-writing-ru:<тип>` становится `/technical-writing:<тип>`.
- Удаление: `/plugin uninstall technical-writing@vizzletf-skills`

[README in English](README.md) · [Все плагины](../../README.ru.md) · [Changelog](CHANGELOG.md) и [источники правил](skills/write/sources.md) (на английском) · [Issues](https://github.com/VizzleTF/claude-skills/issues) · Лицензия: [MIT](LICENSE)
