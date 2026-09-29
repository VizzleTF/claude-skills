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
