# claude-skills

Плагин для Claude Code пишет техническую документацию по типам документа и проводит её ревью. На 28 тестовых сценариях его документы вышли на 20–30% короче, чем с прежним скиллом `writing-docs`. Оценка судьи при этом та же или выше.

## Установка

Нужны Claude Code с поддержкой `/plugin` и Python 3 для скрипта проверки текста.

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing-ru@vizzletf-skills
```

Версия с инструкциями и правилами стиля на английском — `technical-writing@vizzletf-skills`. Ставьте только одну: обе срабатывают на одни и те же запросы.

## Команды

`/technical-writing-ru:write` выбирает тип по запросу. У каждого типа есть и своя команда:

| Команда | Документ |
|---|---|
| `/technical-writing-ru:adr` | Запись о решении и его компромиссах |
| `/technical-writing-ru:changelog` | Что изменилось между версиями |
| `/technical-writing-ru:cli-help-errors` | Текст --help и сообщения об ошибках |
| `/technical-writing-ru:conventions` | Правила, которым следует команда |
| `/technical-writing-ru:docstring` | Docstring или комментарий в коде |
| `/technical-writing-ru:explanation` | Почему система устроена именно так |
| `/technical-writing-ru:how-to` | Шаги к одной цели для того, кто в работе |
| `/technical-writing-ru:postmortem` | Запись об инциденте и мерах после него |
| `/technical-writing-ru:readme` | Первая страница проекта |
| `/technical-writing-ru:reference` | Факты для поиска: параметры, поля, лимиты |
| `/technical-writing-ru:runbook` | Шаги дежурному по сработавшему алерту |
| `/technical-writing-ru:troubleshooting` | Симптом или ошибка, причина и исправление |
| `/technical-writing-ru:tutorial` | Урок для новичка по одному пути |

## Пример

Попросите Claude: `Напиши ранбук для алерта QueueWorkerDown` или запустите `/technical-writing-ru:runbook алерт QueueWorkerDown`. Получится runbook: влияние, диагностика, действия с командой проверки у каждого, эскалация.

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
