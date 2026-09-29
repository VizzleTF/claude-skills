# Terraform-конвенции платформы Brannock

Страница для тех, кто пишет и ревьюит Terraform-код платформы Brannock. Правила ниже обязательны для каждого участника команды.

Слова обязательности несут постоянные значения:

| Слово | Значение |
|---|---|
| обязательно, запрещено | Требование. Ревьюер блокирует изменение. |
| рекомендуется, не рекомендуется | Совет. Для исключения нужна названная причина. |
| можно | Разрешено. Подходит любой выбор. |

У каждого правила есть номер. В ревью ссылайтесь на него: «См. NAM-1».

## Провайдеры

### PRV-1. Версию провайдера обязательно закреплять через `~>` в `required_providers`

Зачем: без ограничения новая версия провайдера приезжает молча с очередным `terraform init`, и поведение кода меняется без изменения самого кода.

Плохо: версии нет, подойдёт любая.

```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
```

Хорошо: `~> 5.40` допускает версии от 5.40 до 5.x, но не 6.0.

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

### NAM-1. Имена ресурсов обязательно писать в snake_case

Зачем: поиск по коду и по выводу `terraform plan` работает одинаково, потому что адрес ресурса в плане совпадает с именем в коде. Если стили смешаны, одну сущность приходится искать несколькими запросами.

Плохо:

```hcl
resource "aws_s3_bucket" "artifactsBucket" {}
resource "aws_s3_bucket" "logs-bucket" {}
```

Хорошо:

```hcl
resource "aws_s3_bucket" "artifacts_bucket" {}
resource "aws_s3_bucket" "logs_bucket" {}
```

В плане адрес выглядит так же, как в коде: `aws_s3_bucket.artifacts_bucket`. Одна команда `grep artifacts_bucket` находит и код, и план.

## State

### STA-1. State запрещено коммитить в репозиторий, обязателен удалённый бэкенд

Зачем: в state бывают секреты, и они попадут в историю репозитория. Две копии state, локальная и в репозитории, расходятся, и `apply` с устаревшей копией портит инфраструктуру.

Плохо: файл state лежит в репозитории.

```text
$ git ls-files
main.tf
terraform.tfstate
terraform.tfstate.backup
```

Хорошо: state хранится в удалённом бэкенде, а файлы state исключены из git.

```hcl
terraform {
  backend "s3" {
    bucket = "<STATE_BUCKET>"
    key    = "<STATE_KEY>"
    region = "<STATE_REGION>"
  }
}
```

```text
# .gitignore
*.tfstate
*.tfstate.*
```

## Теги

### TAG-1. У каждого ресурса обязательны теги `owner` и `cost_center`

Зачем: по `cost_center` считают расходы, по `owner` находят владельца ресурса. Ресурс без этих тегов выпадает из отчёта о затратах, и никто не знает, кого спросить о нём.

Плохо: тегов нет.

```hcl
resource "aws_s3_bucket" "artifacts_bucket" {
  bucket = "brannock-artifacts"
}
```

Хорошо:

```hcl
resource "aws_s3_bucket" "artifacts_bucket" {
  bucket = "brannock-artifacts"

  tags = {
    owner       = "<OWNER_TEAM>"
    cost_center = "<COST_CENTER_ID>"
  }
}
```

### TAG-2. Общие теги можно выносить в `locals`

Зачем: одни и те же теги не приходится повторять у каждого ресурса, и правка в одном месте меняет их везде.

Плохо: одни и те же теги скопированы в каждый ресурс.

```hcl
resource "aws_s3_bucket" "artifacts_bucket" {
  tags = { owner = "<OWNER_TEAM>", cost_center = "<COST_CENTER_ID>" }
}

resource "aws_s3_bucket" "logs_bucket" {
  tags = { owner = "<OWNER_TEAM>", cost_center = "<COST_CENTER_ID>" }
}
```

Хорошо:

```hcl
locals {
  common_tags = {
    owner       = "<OWNER_TEAM>"
    cost_center = "<COST_CENTER_ID>"
  }
}

resource "aws_s3_bucket" "artifacts_bucket" {
  tags = local.common_tags
}

resource "aws_s3_bucket" "logs_bucket" {
  tags = merge(local.common_tags, { purpose = "logs" })
}
```

## Модули

### MOD-1. Рекомендуется держать один модуль в одном каталоге

Зачем: границы модуля совпадают с границами каталога, и по структуре репозитория видно, где что находится. Два модуля в одном каталоге делят файлы и переменные, и их трудно разделить позже.

Плохо: в одном каталоге два модуля, смешанные в общих файлах.

```text
modules/
└── network_and_storage/
    ├── main.tf        # VPC и бакеты вперемешку
    └── variables.tf
```

Хорошо:

```text
modules/
├── network/
│   ├── main.tf
│   └── variables.tf
└── storage/
    ├── main.tf
    └── variables.tf
```

### MOD-2. Рекомендуется класть README в каждый модуль

Зачем: модуль понятен без чтения кода. Новый участник команды из README узнаёт, что модуль создаёт и как его подключать.

Плохо: в каталоге модуля только код.

```text
modules/storage/
├── main.tf
└── variables.tf
```

Хорошо:

```text
modules/storage/
├── README.md
├── main.tf
└── variables.tf
```

## Вопросы к документу

1. Какой удалённый бэкенд использует команда? В STA-1 стоит `s3` с плейсхолдерами `<STATE_BUCKET>`, `<STATE_KEY>`, `<STATE_REGION>`.
2. Как называются команда-владелец и код центра затрат в примерах TAG-1 и TAG-2 (`<OWNER_TEAM>`, `<COST_CENTER_ID>`)?
3. Какой провайдер и какую версию брать в примере PRV-1? Сейчас стоит `hashicorp/aws` `~> 5.40`.
