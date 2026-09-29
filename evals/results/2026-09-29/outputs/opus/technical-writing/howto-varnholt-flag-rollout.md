# Как включить фича-флаг в Varnholt для части пользователей

Вам понадобятся `vhctl` версии 3 и роль `flags-editor`.

## Шаги

1. Если флага ещё нет, создайте его выключенным:

   ```bash
   vhctl flags create <FLAG> --default off
   ```

   В имени флага допустимы строчные латинские буквы, цифры и дефисы, длина до 40 символов.

2. Включите флаг на 10% пользователей в staging:

   ```bash
   vhctl flags rollout <FLAG> --percent 10 --env staging
   ```

3. Подождите 60 секунд, пока изменение применится.

4. Проверьте результат:

   ```bash
   vhctl flags get <FLAG> --env staging
   ```

   Если всё прошло успешно, в выводе будет строка `rollout: 10%`.

5. Если флаг нужен и в production, выполните ту же команду с флагом `--confirm`:

   ```bash
   vhctl flags rollout <FLAG> --percent 10 --env production --confirm
   ```

## Откат

Чтобы выключить флаг, поставьте 0%. Вместо `<ENV>` подставьте `staging` или `production`:

```bash
vhctl flags rollout <FLAG> --percent 0 --env <ENV>
```

В production добавьте к этой команде `--confirm`.
