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
ctx ■■■□□□□□□□ 27% 271k/1M ▁▁▃█▁▇▁ ↑3.4k │ cache warm 38m │ 5h 42% ↻ 2h34m │ 7d 63% ↻ 2d7h │ opus 5.5 · high │ main* +12 −3
```

Файл конфига не нужен: пока его нет, действует полоса выше. Чтобы изменить набор виджетов, запустите `/tidemark-config`. Редактор показывает превью; в поле `save to` выберите `global` (`~/.config/tidemark/config.json`) или `project` (`.claude/tidemark.json` в каталоге сессии) и нажмите `Save`. `/tidemark` открывает панель деталей контекста, кеша, квот и сабагентов. Когда контекст займёт 70% окна, под полосой появится кнопка `/compact`; порог задаёт `compact.at`.

## Удаление

```
/plugin uninstall tidemark@vizzletf-skills
```

Файлы конфига остаются; если они не нужны, удалите `~/.config/tidemark/` и `.claude/tidemark.json` вручную.

## Ссылки

- [Справочник](docs/reference.ru.md): виджеты и их опции, конфиг, пресеты, алерты, кнопка компакта, что мод запускает, неполадки
- [Решения](docs/adr/), [Changelog](CHANGELOG.md), [README in English](README.md)
- Inspired by [ccOverhead](https://github.com/shengyy/ccoverhead) and [ccstatusline](https://github.com/sirmalloc/ccstatusline); что заимствовано, сказано в [NOTICE.md](NOTICE.md)
