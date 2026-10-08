# tidemark

[![ci](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml)

Мод для Claude Code рисует над промптом полосу из настраиваемых виджетов: заполнение контекста, кеш промпта, квоты на 5 часов и неделю, модель, git. Ваш `statusLine` и настройки мод не трогает.

Нужен Claude Code 2.1.288 или новее. Полоса видна в терминале и на вкладке Code в desktop-приложении.

![Полоса tidemark: контекст 4% из 1M, 5-часовая квота 28%, недельная 86%, ветка git и модель](docs/images/tidemark-band.png)

## Содержание

- [Установка](#установка)
- [Команды](#команды)
- [Виджеты](#виджеты)
- [Настройка](#настройка)
- [Удаление](#удаление)
- [Что он запускает, читает и пишет](#что-он-запускает-читает-и-пишет)
- [Ссылки](#ссылки)

## Установка

Выполните в Claude Code:

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install tidemark@vizzletf-skills
```

Полоса появится над промптом сразу после установки. Если её нет, выполните `/reload-plugins`.

## Команды

| Команда | Открывает |
|---|---|
| `/tidemark` | Панель деталей: контекст по источникам, кеш и квоты с прогнозом до сброса, сессия и её сабагенты |
| `/tidemark-config` | Редактор конфига с живым превью |
| `/tidemark-goal [текст]` | Задаёт цель сессии для виджета `goal` |
| `/tidemark-project [текст]` | Задаёт имя проекта для виджета `project` |

<img src="docs/images/tidemark-pane.png" width="420" alt="Панель /tidemark: контекст по источникам, 5-часовая и недельная квоты с прогнозом до сброса">

## Виджеты

Колонка **По умолчанию** отмечает виджеты полосы, которая действует без файла конфига.

| Виджет | Показывает | По умолчанию |
|---|---|---|
| `context` | бар `ctx`, процент, `used/window`, спарклайн роста | ✓ |
| `cache` | `warm 38m`, `cold`, `rewrote 45k` | ✓ |
| `quota5h` | `5h 42% ↻ 2h34m` | ✓ |
| `quota7d` | `7d 63% ↻ 2d7h` | ✓ |
| `model` | `opus 5.5 · high`; нажатие переключает модель или effort | ✓ |
| `git` | ветка, `*` при незакоммиченных правках, синхронизация с upstream, `+12 −3` | ✓ |
| `goal` | текст из `/tidemark-goal`; скрыт, пока не задан | ✓ |
| `project` | текст из `/tidemark-project`; скрыт, пока не задан | ✓ |
| `compact` | кнопка `/compact` | ✓ |
| `actions` | кнопка `⚙`, открывает `/tidemark-config` | ✓ |
| `flex` | ничего; прижимает виджеты после себя к правому краю | ✓ |
| `cost` | `≈$1.84 (+$0.12)`: сессия и текущий ход | |
| `agents` | спиннер на каждого работающего сабагента | |
| `cwd` | имя проекта, имя каталога или путь | |
| `sessionTime` | `⏱ 1h12m` с начала разговора | |
| `compactions` | `⇣2` | |
| `tokenSpeed` | `42 t/s` за последний ход | |
| `command` | первая строка вывода вашей команды | |
| `claudeStatus` | от `● ok` до `● critical` со status.claude.com | |
| `gitPr` | `#123 ✓` для PR или MR ветки; нужен `gh` или `glab` | |

Цифры окрашены от синего к красному по израсходованной доле. Опции каждого виджета описаны в [справочнике](docs/reference.ru.md#виджеты).

## Настройка

Файл конфига не нужен. Чтобы изменить виджеты, запустите `/tidemark-config`, поправьте полосу в превью, выберите файл в поле `save to` и нажмите `Save`:

| `save to` | Файл |
|---|---|
| `global` | `~/.config/tidemark/config.json` |
| `project` | `.claude/tidemark.json` в каталоге сессии; перекрывает `global` |

В редакторе есть и пресеты: `minimal`, `classic`, `default`, `full` (две строки) и `powerline`. Когда контекст займёт 70% окна, под полосой появится кнопка `/compact`; порог задаёт `compact.at`.

## Удаление

```
/plugin uninstall tidemark@vizzletf-skills
```

Файлы конфига и заметки проекта остаются. Чтобы убрать и их, удалите `~/.config/tidemark/`, `.claude/tidemark.json` и `.claude/tidemark-project.txt`.

## Что он запускает, читает и пишет

У tidemark нет телеметрии, автору он ничего не отправляет. Настройки Claude Code и режим разрешений он не меняет.

### Хуки

| Хук | Что делает |
|---|---|
| События сессии: старт, каждый ход и запрос к модели, замеры расхода, компакт, запуск сабагентов, смена модели, отправка промпта | Читает, что произошло, чтобы полоса была актуальной, и передаёт событие дальше без изменений |
| Изменения `theme` и `autoCompact` в `/config` | То же |
| Встроенные команды `/clear`, `/resume`, `/branch`, `/model`, `/autocompact`, `/theme`, `/effort` | То же |
| `command.describe` на `/effort` | Читает подсказку аргументов команды |
| `command.run` на `/tidemark`, `/tidemark-config`, `/tidemark-goal`, `/tidemark-project` | Отвечает на четыре команды, которые добавляет мод |
| `ui.render` | Рисует полосу и четыре панели |

Только по нажатию на виджет полосы tidemark запускает встроенную команду этого виджета: `/context`, `/usage`, `/model`, `/effort` или `/compact`.

### Программы

Каждая запускается в каталоге сессии.

| Программа | Зачем | Когда |
|---|---|---|
| `git status`, `git diff --numstat HEAD` | ветка, изменения и размер diff для виджета `git` | после каждого хода, не чаще раза в 5 секунд |
| `git fetch --quiet --no-tags` | сколько коммитов впереди и позади; обращается к вашему remote | раз в 5 минут; `git.fetch: 0` выключает |
| `git rev-parse --show-toplevel` | имя проекта для `cwd` со `style: "project"` | не чаще раза в минуту |
| `git remote get-url origin`, затем `gh pr view` или `glab mr view` | pull request ветки для `gitPr`; обращается к GitHub или GitLab с логином самих этих утилит | когда прошёл его `ttl` |
| `sh -c <command>` | виджет `command` запускает команду, которую задали вы, и ничего больше | когда прошёл его `ttl` |

### Сеть

Кроме программ выше tidemark делает сам один запрос: HTTPS GET `https://status.claude.com/api/v2/summary.json` для виджета `claudeStatus`, по умолчанию выключенного.

### Файлы и настройки

| Что | Хранит | Читает | Пишет |
|---|---|---|---|
| `~/.config/tidemark/config.json`, под `$XDG_CONFIG_HOME`, если задан | глобальный конфиг | ✓ | по `Save` в `/tidemark-config` |
| `.claude/tidemark.json` | конфиг проекта | ✓ | по `Save` в `/tidemark-config` |
| `.claude/tidemark-project.txt` | имя проекта | ✓ | по `/tidemark-project` |
| Хранилище плагина | последняя квота, уровни effort, которые приняла каждая модель, цели недавних сессий | ✓ | по ходу сессии |
| `HOME`, `XDG_CONFIG_HOME` | где лежит глобальный конфиг | ✓ | |
| `CLAUDE_CODE_PROMPT_CACHE_TTL`, `ENABLE_PROMPT_CACHING_1H`, `FORCE_PROMPT_CACHING_5M`, настройка `promptCacheTtl` | время жизни кеша промпта | ✓ | |

Файлы в `.claude` принадлежат tidemark; это не настройки и не инструкции Claude Code. Подробности: [Privacy](PRIVACY.md) (на английском) и [Внешние запуски](docs/reference.ru.md#внешние-запуски).

## Ссылки

- [Приватность](PRIVACY.md): что мод читает, пишет и отправляет (на английском)
- [Справочник](docs/reference.ru.md): опции виджетов, ключи конфига, пресеты, алерты, кнопка компакта, неполадки
- [Решения](docs/adr/), [Changelog](CHANGELOG.md), [README in English](README.md)
- Inspired by [ccOverhead](https://github.com/shengyy/ccoverhead) and [ccstatusline](https://github.com/sirmalloc/ccstatusline); что заимствовано, сказано в [NOTICE.md](NOTICE.md)
