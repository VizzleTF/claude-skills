# Включить фича-флаг для части пользователей

Гайд для тех, кому нужно раскатить флаг в Varnholt на процент пользователей. Сначала включите флаг в staging, потом в production.

**Что нужно:** `vhctl` версии 3 и роль `flags-editor`.

1. Если флага ещё нет, создайте его выключенным. Имя состоит из строчных латинских букв, цифр и дефисов, до 40 символов:

   ```bash
   vhctl flags create <FLAG> --default off
   ```

2. Включите флаг на 10% пользователей в staging:

   ```bash
   vhctl flags rollout <FLAG> --percent 10 --env staging
   ```

3. Подождите до 60 секунд: изменение применяется с такой задержкой.

4. Проверьте результат:

   ```bash
   vhctl flags get <FLAG> --env staging
   ```

   В выводе должна быть строка `rollout: 10%`.

5. Когда staging в порядке, включите флаг в production. Команда та же, но с `--confirm`:

   ```bash
   vhctl flags rollout <FLAG> --percent 10 --env production --confirm
   ```

   Изменение снова применяется до 60 секунд.

## Откат

Верните процент к нулю в нужной среде:

```bash
vhctl flags rollout <FLAG> --percent 0 --env <ENV>
```

В production добавьте `--confirm`.
