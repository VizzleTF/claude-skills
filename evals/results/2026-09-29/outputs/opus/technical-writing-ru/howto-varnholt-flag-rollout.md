Готово. Скрипт проверки текста не запустился: не было разрешения на запуск команд. Я перечитал текст глазами разработчика, которому нужно включить флаг прямо сейчас.

В одном месте факты противоречат друг другу. Для отката дана команда без `--confirm`, но в production команда `rollout` требует `--confirm`. Я написал откат ровно так, как вы его дали, и ничего не дописывал.

# Включить фича-флаг для части пользователей

Нужны `vhctl` версии 3 и роль `flags-editor`.

## Включить в staging

1. Если флага ещё нет, создайте его выключенным. Имя флага состоит из строчных латинских букв, цифр и дефисов, длина до 40 символов.

   ```bash
   vhctl flags create <FLAG> --default off
   ```

2. Включите флаг для 10% пользователей в staging:

   ```bash
   vhctl flags rollout <FLAG> --percent 10 --env staging
   ```

## Проверить

Изменение доезжает за 60 секунд. Подождите их и выполните:

```bash
vhctl flags get <FLAG> --env staging
```

В выводе есть строка:

```
rollout: 10%
```

## Включить в production

Запустите ту же команду с `--env production`. В production она требует параметр `--confirm`:

```bash
vhctl flags rollout <FLAG> --percent 10 --env production --confirm
```

Проверьте результат так же, как в staging, но с `--env production`.

## Откатить

Верните процент к нулю в том окружении, где включали флаг (`staging` или `production`):

```bash
vhctl flags rollout <FLAG> --percent 0 --env <ENV>
```

---

- Нужен ли `--confirm` при откате в production?
- Окружение production в `--env` называется именно `production`?
