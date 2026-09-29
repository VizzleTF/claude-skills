# Соглашения по Terraform-коду платформы Brannock

Страница для тех, кто пишет или ревьюит Terraform в репозиториях Brannock. Здесь список правил, причина каждого и пример «плохо → хорошо».

| # | Правило | Уровень |
|---|---|---|
| 1 | Версии провайдеров закреплены через `~>` | Обязательно |
| 2 | Имена ресурсов в snake_case | Обязательно |
| 3 | State не коммитим, только удалённый бэкенд | Обязательно |
| 4 | У каждого ресурса теги `owner` и `cost_center` | Обязательно |
| 5 | Один модуль на каталог, README в каждом модуле | Желательно |
| 6 | Общие теги выносим в `locals` | Можно |

**Обязательно** соблюдаем всегда. **Желательно** делаем по умолчанию. **Можно** оставлено на усмотрение автора.

---

## 1. Версии провайдеров закрепляем через `~>` (обязательно)

Указывайте `version = "~> X.Y"` для каждого провайдера в `required_providers`.

**Почему.** Без ограничения (или с `>=`) новая версия провайдера, в том числе мажорная с ломающими изменениями, приезжает молча с очередным `init`. Ограничение `~>` не даёт версии выйти за допустимый диапазон, пока кто-то не изменит код. Обновление становится отдельной правкой, которую видно в ревью.

`~> 5.60` разрешает `>= 5.60` и `< 6.0`. `~> 5.60.0` разрешает только патч-версии `5.60.x`.

Плохо:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0" # или без version вовсе
    }
  }
}
```

Хорошо:

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
  }
}
```

---

## 2. Имена ресурсов в snake_case (обязательно)

Второй лейбл в `resource` пишем строчными буквами с подчёркиваниями: `logs_archive`.

**Почему.** Имя из кода попадает в план как адрес: `aws_s3_bucket.logs_archive`. При единой записи поиск по коду и по выводу плана находит одно и то же. При смеси `LogsArchive`, `logs-archive` и `logsArchive` каждый поиск что-нибудь пропускает.

Плохо:

```hcl
resource "aws_s3_bucket" "LogsArchive" {}
resource "aws_s3_bucket" "logs-archive" {}
```

Хорошо:

```hcl
resource "aws_s3_bucket" "logs_archive" {}
```

---

## 3. State не коммитим, используем удалённый бэкенд (обязательно)

Файлы `*.tfstate` и `*.tfstate.*` не попадают в git. State живёт только в удалённом бэкенде.

**Почему.**
- В state бывают секреты: пароли баз, токены, ключи. Всё, что попало в git, остаётся в истории.
- Две копии state расходятся. Terraform по устаревшей копии может пересоздать или удалить живые ресурсы.

Плохо:

```text
network/
├── main.tf
└── terraform.tfstate    # закоммичен
```

Хорошо:

```hcl
terraform {
  backend "s3" {
    bucket = "brannock-tfstate"
    key    = "network/terraform.tfstate"
    region = "eu-central-1"
  }
}
```

```gitignore
# .gitignore
*.tfstate
*.tfstate.*
```

---

## 4. Теги `owner` и `cost_center` у каждого ресурса (обязательно)

Каждый ресурс, который поддерживает теги, получает `owner` и `cost_center`.

**Почему.** По `cost_center` считают расходы, по `owner` находят, кого спросить о ресурсе. Ресурс без тегов выпадает из отчётов, и никто не отвечает за его стоимость.

Плохо:

```hcl
resource "aws_s3_bucket" "logs_archive" {
  bucket = "brannock-logs-archive"
}
```

Хорошо:

```hcl
resource "aws_s3_bucket" "logs_archive" {
  bucket = "brannock-logs-archive"

  tags = {
    owner       = "platform-team"
    cost_center = "cc-1042"
  }
}
```

---

## 5. Один модуль на каталог, README в каждом модуле (желательно)

В каталоге лежит один модуль, рядом с ним `README.md`. В README напишите, что модуль создаёт, какие у него входные переменные и что он отдаёт на выходе.

**Почему.** Каталог с несколькими модулями невозможно ни импортировать по частям, ни понять целиком. README позволяет решить, подходит ли модуль, не читая его код.

Плохо:

```text
modules/
└── messaging/          # сеть и очереди вперемешку, README нет
    ├── main.tf
    └── variables.tf
```

Хорошо:

```text
modules/
├── network/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── README.md
└── queue/
    ├── main.tf
    ├── variables.tf
    ├── outputs.tf
    └── README.md
```

---

## 6. Общие теги выносим в `locals` (можно)

Если одни и те же теги повторяются у многих ресурсов, определите их один раз в `locals` и подставляйте через `local.common_tags`. Теги, специфичные для ресурса, добавляйте через `merge`.

**Почему.** Так `owner` и `cost_center` (правило 4) меняются в одном месте. Повторяя теги вручную, легко забыть их у нового ресурса или оставить старое значение.

Плохо:

```hcl
resource "aws_s3_bucket" "logs_archive" {
  bucket = "brannock-logs-archive"
  tags   = { owner = "platform-team", cost_center = "cc-1042" }
}

resource "aws_sqs_queue" "events" {
  name = "brannock-events"
  tags = { owner = "platform-team", cost_center = "cc-1042" }
}
```

Хорошо:

```hcl
locals {
  common_tags = {
    owner       = "platform-team"
    cost_center = "cc-1042"
  }
}

resource "aws_s3_bucket" "logs_archive" {
  bucket = "brannock-logs-archive"
  tags   = local.common_tags
}

resource "aws_sqs_queue" "events" {
  name = "brannock-events"
  tags = merge(local.common_tags, { component = "events" })
}
```

---

Замечания по документу:
- В примерах я взял AWS и S3-бэкенд. Названия бакетов, регион и значения тегов (`platform-team`, `cc-1042`) придуманы, замените их реальными.
- Вы не уточнили, какую форму закреплять: `~> 5.60` (обновление в пределах мажорной версии) или `~> 5.60.0` (только патчи). В документе показаны обе, но правило форму не выбирает.
