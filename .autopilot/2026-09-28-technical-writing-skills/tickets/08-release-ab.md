# 08 — README, карта исправлений, валидация и прогон A/B

**Требования:** R02, R03, R05, R06, R11, R35, R37, R52, R53, R57, R58, R60, R61, G01
**Blocked by:** 01, 03, 04, 07
**Зона:** `README.md` · `docs/` · `plugins/*/.claude-plugin/plugin.json` · `.claude-plugin/marketplace.json` · `evals/results/`
**Волна:** 4
**Status:** ready

## Что должно заработать

README репозитория объясняет, что это, как выбрать и установить версию, как запустить проверки и сравнение. `docs/writing-docs-fixes.md` показывает, где закрыт каждый из 16 дефектов. `claude plugin validate .` проходит, оба плагина ставятся с локального маркетплейса. Полный A/B-прогон выполнен, его результаты лежат в `evals/results/<дата>/`. Пары для слепого вердикта владельца готовы, раскрытия нет.

## Из брифа, дословно

> «`README.md` репозитория: что это, как установить, как запустить сравнение.»
> «Каждый из 16 пунктов «Что новый скилл обязан исправить» закрыт; видно, где именно.»
> «Оба скилла устанавливаются через `/plugin marketplace add VizzleTF/claude-skills` и `/plugin install <имя>@vizzletf-skills`.»
> «A/B-прогон выполнен по всем сценариям и всем четырём участникам, отчёт готов к вердикту владельца.»
> Дополнение: «с /writing-docs сравнивай слепое - я буду выступай судьей что лучше и почему обязательно буду писать»

## Разделы спецификации

Истории 40, 57–72; Решения §8.

## Критерии приёмки

- [ ] `docs/writing-docs-fixes.md`: 16 строк «дефект → файл и раздел в EN и RU → как закрыт»; каждая ссылка ведёт на существующий раздел
- [ ] README: что это, две версии и как выбрать одну, установка обеих (`/plugin marketplace add VizzleTF/claude-skills`, `/plugin install technical-writing@vizzletf-skills` / `technical-writing-ru@vizzletf-skills`), запуск проверок (`python3 -m unittest discover -s tests`, `python3 tools/parity.py`), запуск сравнения и вердикт, ссылка на последний отчёт, лицензия MIT; README проходит `check.py` и чек-лист типа README из скилла
- [ ] `plugin.json` обеих версий: `version` 0.1.0, `license` MIT; `claude plugin validate .` — без ошибок
- [ ] Установка проверена локально во временном `CLAUDE_CONFIG_DIR`: `claude plugin marketplace add <путь к репо>` и `claude plugin install` каждой версии; результат — строка в отчёте таска
- [ ] Прогон `python3 evals/run.py` по всем сценариям на Sonnet, core на Haiku и Opus, судья Opus; `report.md`, `pairs/`, `verdict.md` в `evals/results/<дата>/`; упавшие вызовы перечислены; ключ пар не раскрыт
- [ ] В результатах нет временных путей с именем пользователя, секретов, `.credentials.json`; `tools/parity.py` и тесты зелёные
