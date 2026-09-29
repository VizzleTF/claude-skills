# Пара howto-varnholt-flag-rollout

Язык: ru. Вид: create.

Запрос:

> Напиши гайд для разработчиков: как включить фича-флаг в Varnholt для части пользователей. Читатели уже пользовались флагами, им нужно сделать это прямо сейчас.
> 
> Что известно:
> 
> - Флагами управляют через CLI `vhctl`, версия 3.
> - Нужна роль `flags-editor`.
> - Имя флага — строчные латинские буквы, цифры и дефисы, до 40 символов.
> - Создать флаг: `vhctl flags create <FLAG> --default off`.
> - Включить на 10% пользователей в staging: `vhctl flags rollout <FLAG> --percent 10 --env staging`. В production та же команда требует ещё `--confirm`.
> - Изменение доезжает за 60 секунд.
> - Проверить: `vhctl flags get <FLAG> --env staging` — в выводе должна быть строка `rollout: 10%`.
> - Откатить: `vhctl flags rollout <FLAG> --percent 0 --env <ENV>`.

Факты:

- Флаги в Varnholt управляются CLI vhctl версии 3
- Нужна роль flags-editor
- Имя флага: строчные латинские буквы, цифры и дефисы, не длиннее 40 символов
- Создать флаг: vhctl flags create <FLAG> --default off
- Включить для доли пользователей: vhctl flags rollout <FLAG> --percent 10 --env staging
- Для окружения production команда rollout требует флаг --confirm
- Изменение применяется в течение 60 секунд
- Проверка: vhctl flags get <FLAG> --env staging показывает строку rollout: 10%
- Откат: vhctl flags rollout <FLAG> --percent 0 --env <ENV>

---

## X

# Включить фича-флаг для части пользователей

Предпосылки: `vhctl` версии 3, роль `flags-editor`. Имя флага `<FLAG>` состоит из строчных латинских букв, цифр и дефисов, до 40 символов.

1. Создайте флаг выключенным по умолчанию:

   ```bash
   vhctl flags create <FLAG> --default off
   ```

2. Включите флаг на 10% пользователей в staging:

   ```bash
   vhctl flags rollout <FLAG> --percent 10 --env staging
   ```

3. Подождите 60 секунд: изменение доезжает за это время.
4. Проверьте флаг:

   ```bash
   vhctl flags get <FLAG> --env staging
   ```

   В выводе должна быть строка `rollout: 10%`.
5. Если нужен production, повторите шаг 2 с `--env production` и добавьте `--confirm`:

   ```bash
   vhctl flags rollout <FLAG> --percent 10 --env production --confirm
   ```

## Откатить

Верните процент к нулю в нужном окружении:

```bash
vhctl flags rollout <FLAG> --percent 0 --env <ENV>
```

---

## Y

# Включить фича-флаг для части пользователей

Как создать флаг в Varnholt и включить его на 10% пользователей в staging и production. Нужны `vhctl` версии 3 и роль `flags-editor`.

## 1. Создайте флаг

Если флаг уже есть, переходите к шагу 2.

```sh
vhctl flags create <FLAG> --default off
```

Имя флага: строчные латинские буквы, цифры и дефисы, до 40 символов. Например, `new-checkout`.

## 2. Включите флаг на 10% в staging

```sh
vhctl flags rollout <FLAG> --percent 10 --env staging
```

## 3. Проверьте

Изменение применяется в течение 60 секунд. Затем выполните:

```sh
vhctl flags get <FLAG> --env staging
```

Успех: в выводе есть строка `rollout: 10%`. Если её нет, подождите ещё минуту и повторите команду.

## 4. Включите в production

В production та же команда требует флаг `--confirm`:

```sh
vhctl flags rollout <FLAG> --percent 10 --env production --confirm
```

Проверка та же, что в шаге 3, с `--env production`.

## Откат

Верните процент к нулю в том окружении, где нужно отключить флаг:

```sh
vhctl flags rollout <FLAG> --percent 0 --env <ENV>
```

Для `production` добавьте `--confirm`, как в шаге 4. Откат тоже применяется в течение 60 секунд.
