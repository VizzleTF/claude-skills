# claude-skills

[![ci](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml/badge.svg)](https://github.com/VizzleTF/claude-skills/actions/workflows/ci.yml)

Четыре плагина Claude Code: документы под читателя, полоса статуса над промптом, короткие ответы, небольшие и полные правки кода.

```
/plugin marketplace add VizzleTF/claude-skills
/plugin install technical-writing@vizzletf-skills
/plugin install tidemark@vizzletf-skills
/plugin install vi-voice@vizzletf-skills
/plugin install vi-code@vizzletf-skills
```

## technical-writing

Claude пишет и проверяет документацию по типу документа.

- 13 типов: README, ранбук, ADR, changelog, how-to, постмортем и ещё 7
- каждый документ под своего читателя: новичка, инженера посреди задачи, дежурного
- правила стиля для русских и английских документов
- на 20–30% короче прежнего скилла `writing-docs`; Opus, не зная, где чей текст, оценил их так же или выше
- `check.py` ловит длинные предложения, слова-паразиты, приметы текста LLM и битые ссылки до ревью

Попробуйте `/technical-writing:runbook алерт QueueWorkerDown`.

[Полный README](plugins/technical-writing/README.ru.md)

## tidemark

Полоса виджетов над промптом, в терминале и в десктопном приложении.

- насколько заполнен контекст и когда истечёт кеш промпта
- квоты на 5 часов и неделю со временем до сброса
- модель, уровень рассуждений (effort) и ветка git
- нажатие на виджет переключает модель или effort, запускает `/compact`
- `/tidemark` показывает, чем занят контекст и когда кончится квота
- `/tidemark-config` правит полосу с живым превью и пресетами
- работает рядом с вашим `statusLine`; телеметрии нет

![Полоса tidemark: контекст 4% из 1M, 5-часовая квота 28%, недельная 86%, ветка git и модель](plugins/tidemark/docs/images/tidemark-band.png)

Нужен Claude Code 2.1.288 или новее. [Полный README](plugins/tidemark/README.ru.md)

## vi-voice

Ответы Claude в чате становятся короткими.

- первая фраза даёт вывод или результат
- тело ответа укладывается в 5 строк; отчёт может быть длиннее
- без приветствий, пересказа и предложений в конце
- код, ошибки и числа дословно
- в конце ответа: что не проверено и что осталось за вами

[Полный README](plugins/vi-voice/README.ru.md)

## vi-code

Claude делает небольшие правки кода и не забывает места вызова.

- ничего не ломает: до правки перечисляет места вызова, тесты и конфиг
- сначала переиспользует код проекта, новый пишет последним
- не добавляет опций и абстракций, о которых не просили
- не убирает проверку внешних данных
- доказывает причину бага до исправления
- сабагенты следуют тем же правилам

[Полный README](plugins/vi-code/README.ru.md)

## Ссылки

[README in English](README.md) · [Как внести вклад](CONTRIBUTING.md) (на английском) · Лицензия: [MIT](LICENSE)
