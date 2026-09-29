Напишу инструкцию. Это **how-to** — читатель работает, ему нужно сделать X.

**Читатель:** разработчик, знакомый с флагами.  
**Цель:** включить флаг для части пользователей сейчас.

Черновик → вырезаю вдвое → проверяю чек-лист.

---

# Включить фича-флаг в Varnholt

Включите флаг постепенно, начиная с малого процента, чтобы отследить проблемы до production.

## Требование

У вас должна быть роль `flags-editor` в Varnholt.

## Шаги

### 1. Создайте флаг

```sh
vhctl flags create my-feature --default off
```

Заменяйте `my-feature` на название флага. Допустимы строчные латинские буквы, цифры и дефисы, до 40 символов.

### 2. Включите на 10% в staging

```sh
vhctl flags rollout my-feature --percent 10 --env staging
```

Начинайте с 10%, чтобы поймать ошибки до growth на других процентах.

### 3. Проверьте результат

```sh
vhctl flags get my-feature --env staging
```

В выводе должна появиться строка `rollout: 10%`.

Изменение доезжает за 60 секунд.

### 4. Готовы к production?

В production требуется подтверждение:

```sh
vhctl flags rollout my-feature --percent 10 --env production --confirm
```

## Откатить флаг

Если что-то пошло не так, отключите:

```sh
vhctl flags rollout my-feature --percent 0 --env staging
```

Замените `staging` на `production` для отката в production. Подтверждение не требуется.

---

**Итоговый документ:**

# Включить фича-флаг в Varnholt

Включите флаг постепенно, начиная с малого процента, чтобы отследить проблемы до production.

## Требование

У вас должна быть роль `flags-editor` в Varnholt.

## Шаги

### 1. Создайте флаг

```sh
vhctl flags create my-feature --default off
```

Заменяйте `my-feature` на название флага. Допустимы строчные латинские буквы, цифры и дефисы, до 40 символов.

### 2. Включите на 10% в staging

```sh
vhctl flags rollout my-feature --percent 10 --env staging
```

Начинайте с 10%, чтобы поймать ошибки до growth на других процентах.

### 3. Проверьте результат

```sh
vhctl flags get my-feature --env staging
```

В выводе должна появиться строка `rollout: 10%`.

Изменение доезжает за 60 секунд.

### 4. Готовы к production?

В production требуется подтверждение:

```sh
vhctl flags rollout my-feature --percent 10 --env production --confirm
```

## Откатить флаг

Если что-то пошло не так, отключите:

```sh
vhctl flags rollout my-feature --percent 0 --env staging
```

Замените `staging` на `production` для отката в production. Подтверждение не требуется.
