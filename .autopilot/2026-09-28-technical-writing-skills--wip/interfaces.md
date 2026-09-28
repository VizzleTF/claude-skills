# Интерфейсы

## Правила проекта

- Репозиторий публичный: никаких приватных путей (`/home/<user>`, `/mnt/c/Users/...`), внутренних хостов, секретов. Содержимое `~/.claude/.credentials.json` не читать никогда.
- Не изменять `~/.claude/skills/writing-docs` и ничего не ставить в `~/.claude/skills` и `~/.claude/plugins` пользователя.
- Python 3, только стандартная библиотека. Нужна внешняя зависимость — вернуть `BLOCKED`, не устанавливать.
- Тесты: `python3 -m unittest discover -s tests` из корня репозитория. Паритет и структура: `python3 tools/parity.py`. Проверки текста: `python3 plugins/technical-writing/skills/technical-writing/scripts/check.py <path>`.
- Валидация маркетплейса: `claude plugin validate .`.
- Код, комментарии, сообщения скриптов — на английском. Тексты EN-скилла — на английском, RU-скилла — на русском.
- Коммиты делает оркестратор. Исполнитель не коммитит и не пушит.
- Тексты скиллов соблюдают правила самих скиллов: без афоризмов, «не X, а Y» / "not X but Y", правила трёх, частых тире, нагнетания; один термин на одно понятие.

## Границы, решённые в спецификации

### Модули и швы

| Модуль | Владеет | Выставляет | Прячет |
|---|---|---|---|
| `skill-en` — `plugins/technical-writing/skills/technical-writing/` | правила на английском | состав файлов §2, разделы типов, вызов `${CLAUDE_SKILL_DIR}/scripts/check.py` | формулировки |
| `skill-ru` — `plugins/technical-writing-ru/skills/technical-writing-ru/` | правила на русском | тот же состав и те же разделы (русские имена) | формулировки |
| `check` — `scripts/check.py` (две побайтовые копии) | детерминированные проверки | CLI §3; функция `check_text(text: str, lang: str, path: str = "<text>") -> list[Finding]`, где `Finding = (line: int, level: "error"\|"warning", rule: str, message: str)` | разбор Markdown, списки слов |
| `parity` — `tools/parity.py` | структурные требования и паритет | CLI без аргументов из корня, код 0/1, строки `path: message`; функция `check_repo(root: Path) -> list[str]` | сравнение структуры |
| `evals` — `evals/run.py` | прогон, оценка, отчёт | CLI §5; формат сценария §6; раскладка `evals/results/<дата>/{outputs,judgments,pairs}/`, `report.md`; функции `load_scenarios(dir) -> list[Scenario]`, `call_claude(argv, cwd, env) -> CallResult` | изоляцию, перестановки, агрегацию |

Швы для тестов: CLI и `check_text` у `check`; `check_repo` у `parity`; `load_scenarios` и подменяемый `call_claude` у `evals`. Тексты скиллов проверяются через `parity` и `check`.


### Состав скилла (spec §2) Состав скилла (одинаковый в обеих версиях)

```
skills/technical-writing[-ru]/
├── SKILL.md
├── types/  tutorial.md how-to.md runbook.md troubleshooting.md reference.md
│           explanation.md readme.md conventions.md adr.md postmortem.md
│           changelog.md docstring.md cli-help-errors.md
├── style/  english.md (EN) | russian.md (RU), llm-patterns.md
├── process/ doc-set.md review.md
├── scripts/ check.py
└── sources.md
```

Имена файлов в обеих версиях английские и одинаковые. Почему: паритет проверяется по путям. Язык версии задают тексты, а не имена.

Разделы файла типа, в этом порядке. EN: `When to use it and when not`, `Skeleton`, `Voice and verbs`, `Length`, `Differences from the core rules`, `Forbidden`, `Type checklist`. RU: «Когда это он и когда нет», «Каркас», «Голос и глаголы», «Объём», «Отличия от общих правил», «Запрещено», «Чек-лист типа».

Голос для типов, которых нет в таблице брифа, решён по их каркасам. README: изъявительное в описании и повелительное в установке. Troubleshooting: изъявительное в причине и повелительное в действии. `--help` и сообщение об ошибке: изъявительное в «что сломалось» и повелительное в «как исправить».

«Объём» в каждом типе — ориентир с источником или с пометкой «эмпирика». Жёстких порогов нет (дефект 4).

SKILL.md содержит: frontmatter; назначение в двух строках; глоссарий терминов скилла; оси и таблицу выбора типа; таблицу «слово запроса → тип»; маршрут «тип → файл»; ветки «создать / ревью / набор документов»; ядро правил: читатель, ответ первым (кроме исключений типа), один термин — одно понятие, связность «известное → новое» и тема абзаца в первом предложении, примеры запускаются, актуальность, повтор допустим (ARID); правило о визуальном содержимом (дефект 14): картинка только там, где текст хуже — архитектура, поток, интерфейс; диаграмма как код (Mermaid и подобные), чтобы её правили вместе с текстом; у скриншота обрезка до нужной области, выделение действия, alt-текст и текстовый эквивалент шага; таблица вместо картинки для данных; подпись говорит, что читатель должен увидеть; копируемый чек-лист workflow; вызов скрипта; проверку живым читателем (субагент с холодным контекстом или человек); ссылку на `sources.md`.

Workflow (в чек-листе):
1. Читатель, его задача и состояние.
2. Тип, загрузить файл типа, файл стиля и LLM-паттерны.
3. Каркас.
4. Черновик.
5. Правка в несколько проходов: структура, абзацы и связность, предложения, слова; второй черновик — первый минус около 10% (King), это ориентир.
6. `check.py`.
7. Чек-лист типа.
8. Проверка холодным читателем.


## Что построили таски

(дополняется по мере сдачи тасков)

### Из таска 02 — EN ядро

- Файлы: `SKILL.md` (144 строки), `style/english.md`, `style/llm-patterns.md`, `process/doc-set.md`, `process/review.md`, `sources.md`. Каждый файл начинается с раздела `## Contents`.
- Разделы SKILL.md: Glossary, Choosing the type (подраздел Request words), Routing, Branches, Core rules, Workflow, Sources. Маршрут ведёт на `types/{tutorial,how-to,runbook,troubleshooting,reference,explanation,readme,conventions,adr,postmortem,changelog,docstring,cli-help-errors}.md`.
- Глоссарий (обязателен в `types/` и в RU-версии), 10 строк: reader, type, type file, skeleton, core rules, living document, record, superseded, finding, cold reader. Правило записи: «Typos and broken links are the only fixes made in a record.» Чек-лист workflow и любые упоминания скилла не попадают в итоговый документ. ADR — форма Nygard «We will …».
- Разделы english.md: Characters and actions, Verbs, Nominalizations, Known to new, Classic style and the curse of knowledge, Metadiscourse and hedges, Stop words by category, Concrete language, Sentence and paragraph length, Edit order.
- Разделы llm-patterns.md: How to use this catalog, Content patterns, Sentence patterns, Formatting patterns, Conversation residue. Примеры слов обёрнуты в inline code, чтобы check.py их не ловил.
- Разделы doc-set.md: Audience, Inventory, Friction log, Minimum set, Priority, Publishing, Feedback and metrics, Maintenance and retirement, Plan format. Разделы review.md: Order of review, Quality characteristics, Self-contained page test, Records under review, Report format.
- sources.md: 6 таблиц, 29 строк данных; строки только для русского издания помечены "Russian edition".
- В RU-версии должно совпадать число заголовков по уровням и строк таблиц (паритет).

### Из таска 04 — раннер

- CLI по §5 плюс `--reveal`. Значения по умолчанию: `sonnet`; core-модели `haiku,opus`; судья `opus`; 4 участника; `--jobs 3`; дата — сегодня.
- Коды выхода: 0 — успех; 1 — `--reveal` отказал; 2 — ошибка запуска; 3 — rate limit, в stderr команда продолжения.
- `load_scenarios(dir, pattern="*") -> list[Scenario(id, lang, kind, expect: list, core: bool, fixtures, facts: list, prompt)]`; если `id` не совпадает с именем файла — `ValueError`.
- `call_claude(argv, cwd, env) -> CallResult(returncode, stdout, stderr)`. Константы, которые подменяют тесты: `EVALS_DIR`, `CREDENTIALS`, `sleep`, `RATE_PAUSES`, `CRIT_KEYS`.
- Раскладка результатов:
  - `results/<date>/outputs/<model>/<participant>/<id>.{md,json}`; в `.json`: status, skills, skill_fired, cost_usd, duration_ms, words, error;
  - `judgments/<model>/<id>.json`;
  - `pairs/<id>.md`, `pairs/key.json` = `{"model", "pairs": {id: {"X", "Y"}}}`;
  - `verdict.md`: `## <id>`, `Лучше:`, `Почему:`;
  - `report.md`.
- `--reveal` дописывает раздел `# Раскрытие`. Повторный вызов заменяет раздел, а не дублирует его.
- Тесты: `python3 -m unittest tests.test_run` (17, офлайн).

### Из таска 03 — сценарии

- Сценариев 28: по 14 на `en` и `ru`. По `kind`: create 13, review 7, update 5, ambiguous 3. С `core: true` — 8.
- Заголовок сценария, поля в этом порядке: `id`, `lang`, `kind`, `expect`, `core`, `[fixtures]`, затем `facts:` со строками `- `, пустая строка и текст запроса.
- `expect` — список через запятую без пробелов, несколько значений только у `ambiguous`. `fixtures` — путь `<dir>/` относительно `evals/fixtures/`. Промпты называют фикстуры по имени файла в рабочем каталоге.
- Рубрика: 1–5 по каждому критерию, «n/a» нет. Ответ на `ambiguous`, который состоит только из уточняющего вопроса, получает 3 по skeleton, accuracy и actionability.
- Реальные документы: 9 фикстур `real-*`, источники в `evals/fixtures/SOURCES.md`.
