# claude-skills

Плагин для Claude Code пишет техническую документацию по типам документа и проводит её ревью. Типы: tutorial, how-to, runbook, troubleshooting, reference, explanation, README, conventions, ADR, postmortem, changelog, docstring, справка CLI. На 28 тестовых сценариях его документы вышли на 20–30% короче, чем с прежним скиллом `writing-docs`. Оценка судьи при этом та же или выше.

## Установка

Нужны Claude Code с поддержкой `/plugin` и Python 3 для скрипта проверки текста.

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing-ru@vizzletf-skills
```

Версия с инструкциями и правилами стиля на английском — `technical-writing@vizzletf-skills`. Ставьте только одну: обе срабатывают на одни и те же запросы.

## Пример

Попросите Claude: `Напиши ранбук для алерта QueueWorkerDown` или запустите `/technical-writing-ru:runbook алерт QueueWorkerDown`. Основная команда — `/technical-writing-ru:write`, у каждого из 13 типов есть своя. Получится runbook: влияние, диагностика, действия с командой проверки у каждого, эскалация.

Проверьте Markdown-файл встроенным скриптом из корня репозитория:

```sh
python3 plugins/technical-writing-ru/skills/write/scripts/check.py --lang ru README.ru.md
```

```
0 error(s), 0 warning(s) in 1 file(s)
```

## Ссылки

- [README in English](README.md)
- [Команды, структура и соглашения репозитория](CLAUDE.md)
- [A/B-сравнение с writing-docs](evals/README.md) и [где исправлен каждый дефект writing-docs](docs/writing-docs-fixes.md)
- [Changelog](plugins/technical-writing-ru/CHANGELOG.md), лицензия [MIT](LICENSE)
