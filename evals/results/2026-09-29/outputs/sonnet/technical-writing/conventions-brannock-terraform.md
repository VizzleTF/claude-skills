# Соглашения по Terraform-коду платформы Brannock

Страница для тех, кто пишет или ревьюит Terraform-код платформы Brannock. Каждое правило можно проверить на ревью.

Слова MUST, MUST NOT, SHOULD и MAY в правилах означают следующее:

| Слово | Значение |
|---|---|
| MUST, MUST NOT | Обязательно. Ревьюер блокирует изменение. |
| SHOULD | Рекомендуется. Исключение требует названной причины. |
| MAY | Разрешено. Любой вариант подходит. |

## Провайдеры

### P-1. Версия провайдера MUST быть закреплена через `~>` в `required_providers`

**Почему:** без закрепления новая версия провайдера приезжает молча с очередным `terraform init`.

Плохо:

```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
```

Плохо: версия задана нижней границей, и обновление всё равно приедет само.

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.40"
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
      version = "~> 5.40"
    }
  }
}
```

## Именование

### N-1. Имена ресурсов MUST быть в snake_case

**Почему:** тогда поиск по коду и по плану работает одинаково: имя в коде совпадает с адресом в плане.

Плохо:

```hcl
resource "aws_s3_bucket" "Audit-Logs" {
  bucket = "brannock-audit-logs"
}
```

Хорошо:

```hcl
resource "aws_s3_bucket" "audit_logs" {
  bucket = "brannock-audit-logs"
}
```

Адрес `aws_s3_bucket.audit_logs` одинаково ищется в коде и в выводе `terraform plan`.

## State

### S-1. State MUST NOT попадать в репозиторий. State MUST храниться в удалённом бэкенде

**Почему:** в state бывают секреты, а две копии state расходятся.

Плохо: файл `terraform.tfstate` лежит в репозитории, бэкенд не настроен.

```text
network/
├── main.tf
└── terraform.tfstate
```

Хорошо: бэкенд настроен, а state-файлы исключены из git.

```hcl
terraform {
  backend "s3" {
    bucket = "<STATE_BUCKET>"
    key    = "network/terraform.tfstate"
    region = "<REGION>"
  }
}
```

```text
# .gitignore
*.tfstate
*.tfstate.*
```

## Теги

### T-1. У каждого ресурса MUST быть теги `owner` и `cost_center`

**Почему:** по `cost_center` считают расходы, по `owner` ищут владельца ресурса.

Плохо:

```hcl
resource "aws_sqs_queue" "events" {
  name = "brannock-events"
}
```

Хорошо:

```hcl
resource "aws_sqs_queue" "events" {
  name = "brannock-events"

  tags = {
    owner       = "<TEAM_NAME>"
    cost_center = "<COST_CENTER_ID>"
  }
}
```

### T-2. Общие теги MAY выноситься в `locals`

**Почему:** так теги не повторяются в каждом ресурсе.

Плохо: одни и те же теги скопированы в каждый ресурс.

```hcl
resource "aws_sqs_queue" "events" {
  name = "brannock-events"

  tags = {
    owner       = "<TEAM_NAME>"
    cost_center = "<COST_CENTER_ID>"
  }
}

resource "aws_sns_topic" "alerts" {
  name = "brannock-alerts"

  tags = {
    owner       = "<TEAM_NAME>"
    cost_center = "<COST_CENTER_ID>"
  }
}
```

Хорошо:

```hcl
locals {
  common_tags = {
    owner       = "<TEAM_NAME>"
    cost_center = "<COST_CENTER_ID>"
  }
}

resource "aws_sqs_queue" "events" {
  name = "brannock-events"
  tags = local.common_tags
}

resource "aws_sns_topic" "alerts" {
  name = "brannock-alerts"
  tags = local.common_tags
}
```

## Модули

### M-1. Каждый модуль SHOULD лежать в отдельном каталоге: один модуль на каталог

**Почему:** граница модуля совпадает с границей каталога, и модуль легко найти.

Плохо: два модуля в одном каталоге.

```text
modules/
├── main.tf        # ресурсы очереди и сети вперемешку
└── variables.tf
```

Хорошо:

```text
modules/
├── queue/
│   ├── main.tf
│   └── variables.tf
└── network/
    ├── main.tf
    └── variables.tf
```

### M-2. В каждом модуле SHOULD быть README

**Почему:** модуль должен быть понятен без чтения кода.

Плохо:

```text
modules/queue/
├── main.tf
└── variables.tf
```

Хорошо:

```text
modules/queue/
├── README.md
├── main.tf
└── variables.tf
```

---

Вопрос по плейсхолдеру:

- `<STATE_BUCKET>`, `<REGION>`: какой бэкенд использует платформа? В S-1 я взял `s3` как пример.
