window.STATE =
{
  "slug": "technical-writing-skills",
  "dir": "2026-09-28-technical-writing-skills--wip",
  "title": "Скиллы technical-writing и technical-writing-ru",
  "mode": "semi",
  "depth": "deep",
  "polish": {
    "reference": "reference.md",
    "startedAt": "2026-09-28T17:22:30+03:00",
    "baseCommit": "1016e43",
    "rounds": [
      {
        "n": 1,
        "found": 12,
        "accepted": 10,
        "tickets": [
          "P1",
          "P2",
          "P3"
        ],
        "finishedAt": "2026-09-28T17:39:44+03:00"
      },
      {
        "n": 2,
        "found": 12,
        "accepted": 9,
        "tickets": [
          "P4"
        ],
        "finishedAt": "2026-09-28T17:53:06+03:00"
      },
      {
        "n": 3,
        "found": 12,
        "accepted": 7,
        "tickets": [
          "P5"
        ],
        "finishedAt": "2026-09-28T18:00:40+03:00"
      }
    ],
    "stoppedBy": "ceiling"
  },
  "tier": "T2",
  "briefFile": "2026-09-28-brief.md",
  "memoryFile": "CLAUDE.md",
  "skillDir": "/mnt/c/Users/IVAN/.claude/skills/autopilot",
  "startedAt": "2026-09-28T16:21:22+03:00",
  "updatedAt": "2026-09-29T10:57:02+03:00",
  "finishedAt": null,
  "stages": [
    {
      "id": "preflight",
      "status": "done",
      "startedAt": "2026-09-28T16:21:22+03:00",
      "finishedAt": "2026-09-28T16:22:46+03:00"
    },
    {
      "id": "manifest",
      "status": "done",
      "startedAt": "2026-09-28T16:22:46+03:00",
      "finishedAt": "2026-09-28T16:22:46+03:00"
    },
    {
      "id": "briefing",
      "status": "done",
      "startedAt": "2026-09-28T16:22:46+03:00",
      "finishedAt": "2026-09-28T16:25:14+03:00"
    },
    {
      "id": "spec",
      "status": "done",
      "startedAt": "2026-09-28T16:25:14+03:00",
      "finishedAt": "2026-09-28T16:31:17+03:00"
    },
    {
      "id": "plan",
      "status": "done",
      "startedAt": "2026-09-28T16:31:17+03:00",
      "finishedAt": "2026-09-28T16:34:13+03:00"
    },
    {
      "id": "build",
      "status": "done",
      "startedAt": "2026-09-28T16:34:13+03:00",
      "note": "8 из 8 тасков готовы; прогон A/B — после доводки",
      "finishedAt": "2026-09-28T17:18:02+03:00"
    },
    {
      "id": "review",
      "status": "done",
      "startedAt": "2026-09-28T16:43:12+03:00",
      "note": "проверено 8 из 8",
      "finishedAt": "2026-09-28T17:18:02+03:00"
    },
    {
      "id": "final",
      "status": "active",
      "startedAt": "2026-09-28T17:18:02+03:00"
    }
  ],
  "requirements": {
    "total": 69,
    "done": 0,
    "inTicket": 66,
    "inSpec": 0,
    "placeholder": 0,
    "deferred": 1,
    "dropped": 0
  },
  "tickets": [
    {
      "id": "01",
      "title": "Скрипт проверок и паритет",
      "requirements": [
        "R21",
        "R22",
        "R25",
        "R26",
        "R28",
        "R29",
        "R30",
        "R33",
        "R35",
        "R36",
        "R54",
        "R55",
        "R60"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "scripts/",
        "tools/",
        "tests/"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 2,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:43:12+03:00",
      "repairFindings": [
        "Vale spelling error, dated-phrase, ru-dash диапазоны, ru-yo, границы предложений, единый разбор fence, триггеры в description, поиск секретов"
      ],
      "finishedAt": "2026-09-28T17:02:16+03:00",
      "commit": "1498243",
      "tests": {
        "passed": 87,
        "failed": 0
      }
    },
    {
      "id": "02",
      "title": "EN: ядро, стиль, процесс, источники",
      "requirements": [
        "R01",
        "R04",
        "R12",
        "R13",
        "R18",
        "R19",
        "R20",
        "R21",
        "R23",
        "R24",
        "R27",
        "R28",
        "R30",
        "R31",
        "R32",
        "R33",
        "R34",
        "R37",
        "R38",
        "R39",
        "R64"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "plugins/technical-writing/…/ (без types, scripts)"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:34:13+03:00",
      "repairFindings": [
        "согласованность правил, глоссарий, King, кавычки, чек-лист вне документа"
      ],
      "finishedAt": "2026-09-28T16:51:01+03:00",
      "commit": "9ffaf91"
    },
    {
      "id": "03",
      "title": "Сценарии, фикстуры, рубрика",
      "requirements": [
        "R09",
        "R10",
        "R42",
        "R43",
        "R44",
        "R45",
        "R46",
        "R48",
        "R60",
        "R63",
        "R65"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "evals/scenarios/",
        "evals/fixtures/"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 2,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:34:13+03:00",
      "repairFindings": [
        "ключи рубрики, потолок ответа-вопроса, нейтральные якоря, тип не назван в промпте, expect_notes, факты runbook/postmortem",
        "KaC не источник неизменности; troubleshooting в ambiguous-deploy без фактов"
      ],
      "commit": "83d7c22",
      "finishedAt": "2026-09-28T16:56:01+03:00"
    },
    {
      "id": "04",
      "title": "Раннер A/B и слепой вердикт",
      "requirements": [
        "G01",
        "R02",
        "R07",
        "R08",
        "R11",
        "R40",
        "R41",
        "R47",
        "R49",
        "R50",
        "R51",
        "R59",
        "R65",
        "R66i",
        "R67i"
      ],
      "blockedBy": [],
      "wave": 1,
      "zone": [
        "evals/run.py",
        "tests/test_run.py"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 2,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:34:13+03:00",
      "repairFindings": [
        "фикстуры судье (BLOCKING), AUTH_RE, scrub, сохранение прохода 1, TIE_EPS в отчёте, порядок verdict, README, тесты",
        "промпт через stdin (предел argv 128 КиБ); TRACE_LINE только id скиллов"
      ],
      "commit": "8e21775",
      "finishedAt": "2026-09-28T16:58:07+03:00",
      "tests": {
        "passed": 24,
        "failed": 0
      }
    },
    {
      "id": "05",
      "title": "EN: 13 файлов типов",
      "requirements": [
        "R10",
        "R14",
        "R15",
        "R16",
        "R17",
        "R18",
        "R22",
        "R28",
        "R29",
        "R33",
        "R34",
        "R37",
        "R54"
      ],
      "blockedBy": [
        "02"
      ],
      "wave": 2,
      "zone": [
        "plugins/technical-writing/…/types/"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:51:01+03:00",
      "finishedAt": "2026-09-28T17:00:08+03:00",
      "commit": "5d48ddb",
      "repairFindings": [
        "postmortem без дописывания (BLOCKING), changelog ссылка на замену, 11 правок согласованности"
      ]
    },
    {
      "id": "06",
      "title": "RU: ядро, стиль, процесс, источники",
      "requirements": [
        "R04",
        "R23",
        "R24",
        "R27",
        "R30",
        "R32",
        "R34",
        "R36",
        "R37",
        "R38",
        "R39",
        "R55",
        "R64"
      ],
      "blockedBy": [
        "02"
      ],
      "wave": 2,
      "zone": [
        "plugins/technical-writing-ru/…/ (без types, scripts)"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:51:01+03:00",
      "repairFindings": [
        "латиница для типов, «запись» только record, «ревью», мелкие правки стиля"
      ],
      "finishedAt": "2026-09-28T17:03:51+03:00",
      "commit": "19da61b"
    },
    {
      "id": "07",
      "title": "RU: 13 файлов типов и паритет",
      "requirements": [
        "R10",
        "R14",
        "R15",
        "R16",
        "R17",
        "R18",
        "R22",
        "R28",
        "R29",
        "R36",
        "R54",
        "R55",
        "R56"
      ],
      "blockedBy": [
        "05",
        "06"
      ],
      "wave": 3,
      "zone": [
        "plugins/technical-writing-ru/…/types/"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-09-28T17:03:51+03:00",
      "finishedAt": "2026-09-28T17:11:29+03:00",
      "commit": "1098dd2",
      "repairFindings": [
        "правило записи, статусы ADR, docstring, tutorial без «руководства»"
      ]
    },
    {
      "id": "08",
      "title": "README, карта исправлений, прогон A/B",
      "requirements": [
        "G01",
        "R02",
        "R03",
        "R05",
        "R06",
        "R11",
        "R35",
        "R37",
        "R52",
        "R53",
        "R57",
        "R58",
        "R60",
        "R61"
      ],
      "blockedBy": [
        "01",
        "03",
        "04",
        "07"
      ],
      "wave": 4,
      "zone": [
        "README.md",
        "docs/",
        "evals/results/"
      ],
      "status": "done",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-09-28T17:11:56+03:00",
      "finishedAt": "2026-09-28T17:18:02+03:00",
      "commit": "1016e43",
      "repairFindings": [
        "README в один экран, требования, пример с результатом, карта исправлений"
      ]
    },
    {
      "id": "P1",
      "title": "Доводка: шаг «прочитай файл типа», ветки workflow, runbook",
      "requirements": [
        "R03",
        "R20",
        "R14.1"
      ],
      "blockedBy": [],
      "wave": 5,
      "zone": [
        "plugins/*/skills/*/ (без scripts)"
      ],
      "status": "done",
      "startedAt": "2026-09-28T17:28:51+03:00",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "finishedAt": "2026-09-28T17:38:34+03:00",
      "commit": "b8bd729"
    },
    {
      "id": "P2",
      "title": "Доводка: check.py stdin и даты, README",
      "requirements": [
        "R03",
        "R25",
        "R58"
      ],
      "blockedBy": [],
      "wave": 5,
      "zone": [
        "plugins/*/skills/*/scripts/",
        "tests/test_check.py",
        "README.md"
      ],
      "status": "done",
      "startedAt": "2026-09-28T17:28:51+03:00",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "finishedAt": "2026-09-28T17:33:14+03:00",
      "commit": "5269f2a",
      "tests": {
        "passed": 92,
        "failed": 0
      }
    },
    {
      "id": "P3",
      "title": "Доводка: доступ раннера к файлам скиллов",
      "requirements": [
        "R41",
        "R41.1"
      ],
      "blockedBy": [],
      "wave": 5,
      "zone": [
        "evals/run.py"
      ],
      "status": "done",
      "startedAt": "2026-09-28T17:38:34+03:00",
      "finishedAt": "2026-09-28T17:39:44+03:00",
      "commit": "4e57e88",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    },
    {
      "id": "P4",
      "title": "Доводка 2: workflow без остановок, changelog, термины",
      "requirements": [
        "R03",
        "R14",
        "R17",
        "R34"
      ],
      "blockedBy": [],
      "wave": 6,
      "zone": [
        "plugins/*/skills/*/ (без scripts)"
      ],
      "status": "done",
      "startedAt": "2026-09-28T17:48:06+03:00",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "finishedAt": "2026-09-28T17:53:06+03:00",
      "commit": "34c5204"
    },
    {
      "id": "P5",
      "title": "Доводка 3: триггер docstring, шаги 4 и 7, explanation, форма ответа, термин",
      "requirements": [
        "R03",
        "R16",
        "R30",
        "R32"
      ],
      "blockedBy": [],
      "wave": 7,
      "zone": [
        "plugins/*/skills/*/ (без scripts)"
      ],
      "status": "done",
      "startedAt": "2026-09-28T17:57:45+03:00",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "finishedAt": "2026-09-28T18:00:40+03:00",
      "commit": "2d2c53f"
    },
    {
      "id": "AB",
      "title": "Полный прогон A/B (Sonnet все, Haiku/Opus core, судья Opus)",
      "requirements": [
        "R57",
        "R49",
        "R51",
        "G01"
      ],
      "blockedBy": [
        "P5"
      ],
      "wave": 8,
      "zone": [
        "evals/results/"
      ],
      "status": "in-progress",
      "startedAt": "2026-09-28T18:00:57+03:00",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "repairFindings": [
        "квота сессии: 12 генераций Opus и все 41 оценка упали; раннер не распознал «session limit»; tw на Sonnet медиана 667 слов против 384 у writing-docs"
      ]
    },
    {
      "id": "C1",
      "title": "Компактность выхода: короче writing-docs",
      "requirements": [
        "G02"
      ],
      "blockedBy": [],
      "wave": 9,
      "zone": [
        "plugins/*/skills/*/ (без scripts)"
      ],
      "status": "done",
      "startedAt": "2026-09-28T22:13:16+03:00",
      "retries": 0,
      "repairs": 2,
      "handoffs": 0,
      "finishedAt": "2026-09-29T10:14:41+03:00",
      "commit": "88fd3c2"
    },
    {
      "id": "C2",
      "title": "Раннер: квота сессии, повтор упавших, длина против writing-docs",
      "requirements": [
        "R51",
        "G02"
      ],
      "blockedBy": [],
      "wave": 9,
      "zone": [
        "evals/run.py",
        "tests/test_run.py"
      ],
      "status": "done",
      "startedAt": "2026-09-28T22:13:16+03:00",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "finishedAt": "2026-09-28T22:15:11+03:00",
      "commit": "9dba464"
    },
    {
      "id": "C3",
      "title": "Компактность ревью, tutorial, reference",
      "requirements": [
        "G02",
        "G03"
      ],
      "blockedBy": [
        "C1"
      ],
      "wave": 10,
      "zone": [
        "plugins/*/skills/*/ (без scripts)"
      ],
      "status": "done",
      "startedAt": "2026-09-29T10:45:45+03:00",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "finishedAt": "2026-09-29T10:57:02+03:00",
      "commit": "8c66733"
    }
  ],
  "singlePass": null,
  "tests": {
    "passed": 92,
    "failed": 0
  },
  "debt": {
    "placeholders": [],
    "assumptions": [],
    "emptyEnv": []
  },
  "additions": [
    {
      "id": "G01",
      "text": "слепое сравнение с writing-docs, судья — владелец, «почему» обязательно",
      "at": "2026-09-28T16:31:17+03:00"
    },
    {
      "id": "G02",
      "text": "документы заметно короче, чем у writing-docs, без потери качества",
      "at": "2026-09-28T22:13:16+03:00"
    }
  ],
  "coverage": {
    "findings": 13,
    "missing": 2,
    "half": 11,
    "extra": "≈20 пунктов — углубления R##.n при deep, оставлены",
    "action": "все 13 дописаны в spec"
  },
  "concerns": [
    "SKILL.md:135 — «rule of thumb» приписан Кингу, у Кинга формула",
    "process/review.md:30-38 — названия групп DQTI дают 9 предупреждений stop-word «Easy»",
    "parity: description без триггеров и поиск секретов добавлены при ремонте 01",
    "spec §3 и история 28 расходятся по Vale без .vale.ini — код следует истории 28",
    "имена фикстур (adr002-…, troubleshooting-kubeadm.md) подсказывают тип — сохранены как в апстриме",
    "sources.md (EN) — нет строки RFC 2119, на которую ссылается types/conventions.md; зеркалить в RU",
    "check.py: список STARTERS для инициалов — эвристика (ponytail)",
    "EN sources.md: у NN/g нет ограничения «только для навигационного текста», которое есть в RU (история 31) — выровнять в EN",
    "SKILL.md (EN и RU) правило записи «Typos and broken links are the only fixes» не называет отметку статуса и ссылку на замену — выровнять с types/",
    "sources.md (EN и RU): строка SRE всё ещё ссылается на types/runbook.md, атрибуция оттуда убрана"
  ],
  "reviewers": {
    "manifestSpec": "a71af322206b6b523",
    "craft": "a77dd62b95a967f23"
  },
  "blind": {
    "agreed": "13 типов, 7 разделов, голос, 5 исключений, 16 исправлений, требования Anthropic, маркетплейс, сценарии, раннер",
    "drift": [
      "A/B не выполнен (перенесён после доводки)",
      "установка с GitHub даст старую версию до push",
      "Haiku: скилл срабатывает, но файл типа не читается — runbook без отката, даты проверки и плейсхолдеров",
      "check.py в EN содержит ru-* правила; EN sources.md перечисляет русские источники",
      "смысловой паритет машинно не проверяется",
      "собственный чек-лист на текстах скилла не прогонялся",
      "Vale не установлен — путь не проверен вживую"
    ]
  }
}
