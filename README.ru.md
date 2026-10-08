# claude-skills

[![ci](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml)

Маркетплейс плагинов Claude Code `vizzletf-skills`. В нём два плагина:

| Плагин | Что делает | Что нужно |
|---|---|---|
| [technical-writing](#technical-writing) | Пишет документацию по типу документа и проводит её ревью: README, runbook, ADR, changelog и ещё 9 типов. Две версии: `technical-writing-ru` с инструкциями на русском, `technical-writing` на английском | Python 3 для скрипта проверки текста |
| [tidemark](#tidemark) | Рисует над промптом полосу: заполнение контекста, кеш промпта, квоты, модель, git | Claude Code 2.1.288 или новее |

## Установка

Добавьте маркетплейс один раз, затем поставьте нужные плагины:

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing-ru@vizzletf-skills
/plugin install tidemark@vizzletf-skills
```

## technical-writing

Скилл сначала определяет читателя, выбирает один из 13 типов документа и пишет по каркасу и бюджету объёма этого типа. На 28 тестовых сценариях его документы вышли на 20–30% короче, чем с прежним скиллом `writing-docs`. Оценка судьи при этом та же или выше.

Ставьте только одну версию, `technical-writing-ru` или `technical-writing`: обе срабатывают на одни и те же запросы.

Попросите Claude: `Напиши ранбук для алерта QueueWorkerDown` или запустите `/technical-writing-ru:runbook алерт QueueWorkerDown`. Получится runbook: влияние, диагностика, действия с командой проверки у каждого, эскалация.

Встроенный скрипт находит в любом Markdown-файле длинные предложения, стоп-слова, маркеры LLM и битые ссылки:

```sh
python3 plugins/technical-writing-ru/skills/write/scripts/check.py deploy.md
```

![check.py находит в deploy.md одну битую ссылку и семь предупреждений](docs/images/technical-writing-check.png)

<details>
<summary>Все 13 команд</summary>

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

</details>

Changelog: [technical-writing-ru](plugins/technical-writing-ru/CHANGELOG.md), [technical-writing](plugins/technical-writing/CHANGELOG.md).

## tidemark

Мод рисует над промптом Claude Code полосу виджетов, в терминале и во вкладке Code десктопного приложения. Ваш `statusLine` и настройки он не трогает. Полоса появляется сразу после установки; если её нет, запустите `/reload-plugins`.

![Полоса tidemark: контекст 4% из 1M, 5-часовая квота 28%, недельная 86%, ветка git и модель](docs/images/tidemark-band.png)

`/tidemark` открывает панель с разбивкой контекста, прогнозом квот и субагентами. `/tidemark-config` настраивает виджеты с живым превью.

<img src="docs/images/tidemark-pane.png" width="420" alt="Панель /tidemark: контекст по источникам, 5-часовая и недельная квоты с прогнозом до сброса">

Виджеты, конфиг, приватность и удаление описаны в [README tidemark](plugins/tidemark/README.ru.md).

## Ссылки

- [README in English](README.md)
- [Как внести вклад](CONTRIBUTING.md)
- Лицензия: [MIT](LICENSE)
