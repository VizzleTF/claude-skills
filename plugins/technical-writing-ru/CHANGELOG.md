# Changelog

Заметные изменения плагина `technical-writing-ru`. Формат по [Keep a Changelog 1.1.0](https://keepachangelog.com/ru/1.1.0/), версии по [Semantic Versioning](https://semver.org/lang/ru/).

## [1.0.2] - 2026-09-29

### Changed

- Описания помещаются в одну строку меню: `write` говорит, что делает, команда типа называет своего читателя и документ.

## [1.0.1] - 2026-09-29

### Changed

- Основная команда теперь `/technical-writing-ru:write`; команды `/technical-writing-ru:technical-writing-ru` больше нет.

### Added

- Отдельная команда для каждого из 13 типов документа, например `/technical-writing-ru:runbook` или `/technical-writing-ru:adr`. Она запускает `write` с уже выбранным типом; сам Claude эти команды не вызывает.

## [1.0.0] - 2026-09-29

### Added

- Маршрутизатор типов: выбирает один из 13 типов документа, от tutorial и how-to до ADR, postmortem и changelog. У каждого типа свой каркас, голос, объём и чек-лист.
- Правила русской типографики и стиля, каталог примет текста от LLM, которые нужно убрать.
- Планирование набора документов для проекта, которому нужно несколько страниц, и процесс ревью: каждая находка описана как «где, что, как исправить».
- `scripts/check.py` проверяет битые ссылки, длинные предложения, стоп-слова, кавычки, тире и приметы LLM; читает файлы, каталоги или stdin.
- Сжатый вывод по умолчанию, с бюджетом слов для каждого типа.

[1.0.2]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing-ru--v1.0.2
[1.0.1]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing-ru--v1.0.1
[1.0.0]: https://github.com/VizzleTF/claude-skills/releases/tag/technical-writing-ru--v1.0.0
