**Шаг 1 (Reader):** Разработчик, знающий Varnholt, включает фича-флаг для доли пользователей в процессе работы.

**Шаг 2:** Прочитаны type file (how-to), style file и pattern catalog.

**Шаг 3 (Skeleton для how-to):** Title → Prerequisites → Steps (numbered) → Verification → Откат.

**Шаг 4–5 (Draft & Edit):** Пишу и редактирую по passes (структура, параграфы, предложения, слова).

**Шаг 6:** Чекер для русского текста недоступен; пропускаю.

**Шаг 7:** Чеклист типа пройден — все требования соблюдены.

**Шаг 8:** Холодный тест: разработчик может выполнить все шаги, никаких пробелов.

---

# Включите фича-флаг в Varnholt

## Предусловия

Роль `flags-editor`, vhctl версии 3.

## Шаги

1. Создайте флаг:
   ```
   vhctl flags create <FLAG_NAME> --default off
   ```
   Используйте только строчные буквы, цифры и дефисы, до 40 символов.

2. Включите флаг на часть пользователей в staging:
   ```
   vhctl flags rollout <FLAG_NAME> --percent 10 --env staging
   ```

3. Подождите 60 секунд, пока изменение распространится.

4. Проверьте результат:
   ```
   vhctl flags get <FLAG_NAME> --env staging
   ```
   В выводе должна быть строка `rollout: 10%`.

5. Если нужно включить в production:
   ```
   vhctl flags rollout <FLAG_NAME> --percent <PERCENT> --env production --confirm
   ```

## Откат

В любой момент отключите флаг в среде:
```
vhctl flags rollout <FLAG_NAME> --percent 0 --env <ENV>
```
