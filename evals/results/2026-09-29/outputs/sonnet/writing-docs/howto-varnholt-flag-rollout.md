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
