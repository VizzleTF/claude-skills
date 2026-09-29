Напишу практический гайд для разработчиков. Документ готов:

---

# Включение фича-флага в Varnholt

Быстрый гайд для включения флага на часть пользователей через `vhctl v3`.

## Предварительные условия

- У вас есть роль `flags-editor` в Varnholt
- Установлен `vhctl` версии 3 или выше

## Быстрый старт

### 1. Создайте флаг

```bash
vhctl flags create my-new-feature --default off
```

**Правила для имени флага:**
- Только строчные латинские буквы, цифры и дефисы
- До 40 символов
- Пример: `gradient-ui-v2`, `beta-checkout`, `ml-ranking-v3`

### 2. Включите на 10% пользователей в staging

```bash
vhctl flags rollout my-new-feature --percent 10 --env staging
```

### 3. Проверьте статус

```bash
vhctl flags get my-new-feature --env staging
```

В выводе должна быть строка:
```
rollout: 10%
```

### 4. Переведите в production (если staging хорош)

```bash
vhctl flags rollout my-new-feature --percent 10 --env production --confirm
```

> **Важно:** В production требуется флаг `--confirm`. Без него команда откажет.

## Увеличение процента

Повторите команду `rollout` с большим процентом:

```bash
vhctl flags rollout my-new-feature --percent 50 --env production --confirm
```

## Откат

Если что-то пошло не так:

```bash
vhctl flags rollout my-new-feature --percent 0 --env production --confirm
```

## Важно знать

- **Время распространения:** 60 секунд. После команды `rollout` изменение доедет до всех серверов за ~1 минуту.
- **Проверка в коде:** Убедитесь, что ваше приложение проверяет флаг по имени `my-new-feature` (или как вы его назвали).
- **Откат всегда безопасен:** Можно откатиться на любой этап, просто установив процент на 0.

## Типичный сценарий

```bash
# День 1: создание и 10% в staging
vhctl flags create smart-cache --default off
vhctl flags rollout smart-cache --percent 10 --env staging

# День 2: проверка в staging прошла, 5% в production
vhctl flags rollout smart-cache --percent 5 --env production --confirm

# День 3: метрики хорошие, 100% в production
vhctl flags rollout smart-cache --percent 100 --env production --confirm
```

---
