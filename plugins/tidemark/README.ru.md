# tidemark

[![ci](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml)

Мод для Claude Code рисует над промптом полосу из настраиваемых виджетов: заполнение контекста, кеш промпта, квоты на 5 часов и неделю, модель, git. Ваш `statusLine` и настройки мод не трогает.

Нужен Claude Code 2.1.288 или новее. Полоса видна в терминале и на вкладке Code в desktop-приложении.

## Установка

Выполните в Claude Code:

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install tidemark@vizzletf-skills
```

Полоса появится над промптом сразу после установки; если её нет, выполните `/reload-plugins`:

```
ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63% ↻ 2d7h │ opus 5.5 · high │ main* +12 −3   /compact ⚙
```

Файл конфига не нужен: пока его нет, действует полоса выше. Чтобы изменить набор виджетов, запустите `/tidemark-config`. Редактор показывает превью; в поле `save to` выберите `global` (`~/.config/tidemark/config.json`) или `project` (`.claude/tidemark.json` в каталоге сессии) и нажмите `Save`. `/tidemark` открывает панель деталей контекста, кеша, квот и сабагентов. Когда контекст займёт 70% окна, под полосой появится кнопка `/compact`; порог задаёт `compact.at`.

## Удаление

```
/plugin uninstall tidemark@vizzletf-skills
```

Файлы конфига и заметки проекта остаются; если они не нужны, удалите `~/.config/tidemark/`, `.claude/tidemark.json` и `.claude/tidemark-project.txt` вручную.

## Что он запускает, читает и пишет

У tidemark нет телеметрии, автору он ничего не отправляет. Настройки Claude Code и режим разрешений он не меняет.

Хуки. tidemark следит за событиями сессии, чтобы полоса была актуальной. Это старт сессии, каждый ход и запрос к модели, замеры расхода, компакт, запуск сабагентов, смена модели и отправка промпта. Ещё он следит за изменениями `theme` и `autoCompact` в `/config` и за встроенными командами `/clear`, `/resume`, `/branch`, `/model`, `/autocompact`, `/theme` и `/effort`. Каждый такой хук передаёт событие дальше без изменений и только читает, что произошло. Хук `command.describe` на `/effort` читает подсказку аргументов команды. Хуки `ui.render` рисуют полосу над промптом и панели `/tidemark`, `/tidemark-config`, `/tidemark-goal` и `/tidemark-project`: это четыре команды, которые добавляет мод.

Команды Claude Code. Только по нажатию на виджет полосы tidemark запускает встроенную команду этого виджета: `/context`, `/usage`, `/model`, `/effort` или `/compact`.

Программы, каждая в каталоге сессии:

| Программа | Зачем | Когда |
|---|---|---|
| `git status`, `git diff --numstat HEAD` | ветка, изменения и размер diff для виджета `git` | после каждого хода, не чаще раза в 5 секунд |
| `git fetch --quiet --no-tags` | сколько коммитов впереди и позади; обращается к вашему remote | раз в 5 минут; `git.fetch: 0` выключает |
| `git rev-parse --show-toplevel` | имя проекта для `cwd` со `style: "project"` | не чаще раза в минуту |
| `git remote get-url origin`, затем `gh pr view` или `glab mr view` | pull request ветки для `gitPr`; обращается к GitHub или GitLab с логином самих этих утилит | когда прошёл его `ttl` |
| `sh -c <command>` | виджет `command` запускает команду, которую задали вы, и ничего больше | когда прошёл его `ttl` |

Сеть. Кроме программ выше tidemark делает сам один запрос: HTTPS GET `https://status.claude.com/api/v2/summary.json` для виджета `claudeStatus`, по умолчанию выключенного.

Что читает: свои файлы конфига `~/.config/tidemark/config.json` (под `$XDG_CONFIG_HOME`, если задан) и `.claude/tidemark.json`, а также `.claude/tidemark-project.txt`. Ещё он читает переменные окружения `HOME`, `XDG_CONFIG_HOME`, `CLAUDE_CODE_PROMPT_CACHE_TTL`, `ENABLE_PROMPT_CACHING_1H`, `FORCE_PROMPT_CACHING_5M` и настройку `promptCacheTtl`, чтобы знать время жизни кеша промпта.

Что пишет: файл конфига, только по `Save` в `/tidemark-config`, и `.claude/tidemark-project.txt`, только по `/tidemark-project`. Оба файла принадлежат tidemark и лежат в каталоге `.claude` проекта; это не настройки и не инструкции Claude Code. В хранилище плагина лежат последняя квота, уровни effort, которые приняла каждая модель, и цели недавних сессий.

Подробности: [Privacy](PRIVACY.md) (на английском) и [Внешние запуски](docs/reference.ru.md#внешние-запуски).

## Ссылки

- [Приватность](PRIVACY.md): что мод читает, пишет и отправляет (на английском)
- [Справочник](docs/reference.ru.md): виджеты и их опции, конфиг, пресеты, алерты, кнопка компакта, что мод запускает, неполадки
- [Решения](docs/adr/), [Changelog](CHANGELOG.md), [README in English](README.md)
- Inspired by [ccOverhead](https://github.com/shengyy/ccoverhead) and [ccstatusline](https://github.com/sirmalloc/ccstatusline); что заимствовано, сказано в [NOTICE.md](NOTICE.md)
