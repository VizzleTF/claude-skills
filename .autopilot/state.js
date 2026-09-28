window.STATE =
{
  "slug": "technical-writing-skills",
  "dir": "2026-09-28-technical-writing-skills--wip",
  "title": "Скиллы technical-writing и technical-writing-ru",
  "mode": "semi",
  "depth": "deep",
  "polish": null,
  "tier": "T2",
  "briefFile": "2026-09-28-brief.md",
  "memoryFile": "CLAUDE.md",
  "skillDir": "/mnt/c/Users/IVAN/.claude/skills/autopilot",
  "startedAt": "2026-09-28T16:21:22+03:00",
  "updatedAt": "2026-09-28T16:48:35+03:00",
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
      "status": "active",
      "startedAt": "2026-09-28T16:34:13+03:00",
      "note": "0 из 8 тасков готовы"
    },
    {
      "id": "review",
      "status": "active",
      "startedAt": "2026-09-28T16:43:12+03:00"
    },
    {
      "id": "final",
      "status": "pending"
    }
  ],
  "requirements": {
    "total": 68,
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
      "status": "in-progress",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:43:12+03:00"
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
      "status": "repair",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:34:13+03:00",
      "repairFindings": [
        "согласованность правил, глоссарий, King, кавычки, чек-лист вне документа"
      ]
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
      "status": "repair",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:34:13+03:00",
      "repairFindings": [
        "ключи рубрики, потолок ответа-вопроса, нейтральные якоря, тип не назван в промпте, expect_notes, факты runbook/postmortem"
      ]
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
      "status": "repair",
      "retries": 0,
      "repairs": 1,
      "handoffs": 0,
      "startedAt": "2026-09-28T16:34:13+03:00",
      "repairFindings": [
        "фикстуры судье (BLOCKING), AUTH_RE, scrub, сохранение прохода 1, TIE_EPS в отчёте, порядок verdict, README, тесты"
      ]
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
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
      "status": "pending",
      "retries": 0,
      "repairs": 0,
      "handoffs": 0
    }
  ],
  "singlePass": null,
  "tests": null,
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
    }
  ],
  "coverage": {
    "findings": 13,
    "missing": 2,
    "half": 11,
    "extra": "≈20 пунктов — углубления R##.n при deep, оставлены",
    "action": "все 13 дописаны в spec"
  },
  "concerns": [],
  "reviewers": {
    "manifestSpec": "a775bd7b07474e07a",
    "craft": "a8bb903c4d9542684"
  },
  "blind": null
}
