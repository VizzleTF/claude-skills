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
- `load_scenarios(dir, pattern="*") -> list[Scenario(id, lang, kind, expect: list, core: bool, fixtures, facts: list, prompt, expect_notes: list = [])]`; `CRIT_KEYS` = type, skeleton, accuracy, answer_first, scannable, voice, no_llm_patterns, concise, actionable; судья видит facts, expect_notes («Expectations for the answer») и тексты фикстур; если `id` не совпадает с именем файла — `ValueError`.
- `call_claude(argv, cwd, env, input=None) -> CallResult(returncode, stdout, stderr)`; промпт идёт через stdin, не через argv. Константы, которые подменяют тесты: `EVALS_DIR`, `CREDENTIALS`, `sleep`, `RATE_PAUSES`, `CRIT_KEYS`.
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
- Заголовок сценария, поля в этом порядке: `id`, `lang`, `kind`, `expect`, `core`, `[fixtures]`, `[expect_notes:` со строками `- ]`, затем `facts:` со строками `- `, пустая строка и текст запроса.
- `expect` — список через запятую без пробелов, несколько значений только у `ambiguous`. `fixtures` — путь `<dir>/` относительно `evals/fixtures/`. Промпты называют фикстуры по имени файла в рабочем каталоге.
- Рубрика: 1–5 по каждому критерию, «n/a» нет. Ответ на `ambiguous`, который состоит только из уточняющего вопроса, получает 3 по skeleton, accuracy и actionability.
- Реальные документы: 9 фикстур `real-*`, источники в `evals/fixtures/SOURCES.md`.

### Из таска 01 — check.py и parity

- Запуск: `check.py [--lang en|ru|auto] [--max-words N] [--format text|json] [--check-urls] [--strict] [--verbose] PATH...`. Коды выхода 0/1/2.
- Вывод: строка `path:line: level rule: message`, в конце сводка `N error(s), M warning(s) in K file(s)`. JSON: `{findings:[{path,line,level,rule,message}], errors, warnings, files, no_prose}`.
- `check_text(text, lang, path="<text>", *, max_words=None, check_urls=False) -> list[Finding]`, где `Finding = (line, level, rule, message)`.
- Правила уровня error: `broken-link`, `ru-quotes`, `ru-dash`. Уровня warning: `sentence-length`, `stop-word`, `llm-marker`, `dash-density`, `dated-phrase`, `ru-yo`, `ru-nbsp`. Правило `vale` берёт уровень из Vale.
- `tools/parity.py`: запуск без аргументов из корня, строки `path: message`, в конце `parity: ok` или `parity: N problem(s)`; функция `check_repo(root) -> list[str]`.
- Эвристики:
  - `dash-density`: не больше `max(1, слов/40)` тире на абзац.
  - `ru-yo` ловит «еще», «ее», «нее», «все равно».
  - Голое имя файла скилла в `types/`, `style/`, `process/` считается ссылкой.
  - Примеры внутри inline code не срабатывают.
- Тесты: `python3 -m unittest discover -s tests` (77).

### Из таска 05 — EN types

- 13 файлов, в каждом 49–60 строк. Структура: 1 H1, 7 H2 в заданном порядке, H3 нет.
- Строки таблиц: conventions 5, reference 7, troubleshooting 4, в остальных файлах 0.
- Пункты `- [ ]`: adr 7, changelog 6, cli-help-errors 6, conventions 5, docstring 6, explanation 5, how-to 7, postmortem 6, readme 6, reference 6, runbook 7, troubleshooting 5, tutorial 8.
- Где стоят исключения из ядра:
  - правка записи — adr, postmortem (новая запись, у старой `superseded by`), changelog ([YANKED], исправление идёт в следующую версию);
  - полные предложения вместо списков — adr, explanation;
  - «мы», третье лицо, прошедшее время — tutorial, reference, postmortem;
  - цель первой строкой — tutorial;
  - повтор допустим — readme, tutorial, runbook.
- ADR: форма Nygard плюс «Alternatives considered» (практика design doc). `Supersedes:` в новой записи, у старой меняется только статус `superseded by ADR-MMMM`.
- Changelog: «BREAKING первыми» — надстройка скилла над Keep a Changelog. Дата `YYYY-MM-DD` в code.
- Каждый раздел Length кончается «rule of thumb» или ссылкой на источник. conventions.md ссылается на RFC 2119.
- После ремонта таска 05 (RU повторяет формулировки):
  - ADR: решение — абзац, который начинается с «We will».
  - conventions: у каждого правила слово из шкалы RFC 2119, голого повелительного нет.
  - changelog: BREAKING-пункт стоит первым внутри своей группы с префиксом `BREAKING:` и ссылкой на гайд миграции; у `[YANKED]` ссылка на версию-замену.
  - postmortem: не дописывается; новые факты — новая запись, у старой `superseded by` со ссылкой.
  - `--help`: у каждой строки одна форма на выбор — повелительное, изъявительное или именная группа.

### Из таска 06 — RU ядро

- Глоссарий EN → RU:

  | EN | RU |
  |---|---|
  | reader | читатель |
  | type | тип |
  | type file | файл типа |
  | skeleton | каркас |
  | core rules | общие правила |
  | living document | живой документ |
  | record | запись |
  | superseded | замещена |
  | finding | замечание |
  | cold reader | холодный читатель |

- Разделы типа: «Когда это он и когда нет», «Каркас», «Голос и глаголы», «Объём», «Отличия от общих правил», «Запрещено», «Чек-лист типа».
- Разделы SKILL.md: Содержание, Глоссарий, Выбор типа (### Слова запроса), Маршрут, Ветки, Общие правила, Порядок работы, Источники. Ветки: «Создать», «Ревью», «Набор документов».
- Имена типов в теле всех RU-файлов пишутся латиницей, как имена файлов (reference, runbook…). Русские слова типов — только в `when_to_use` и в таблице «Слова запроса». «Запись» значит только record; элемент справочника — «пункт», строка лога — «строка». Ревью — «ревью».
- Цитаты из англоязычных источников остаются на языке оригинала, в «ёлочках»; вложенные кавычки — „лапки“.
