id: howto-varnholt-flag-rollout
lang: ru
kind: create
expect: how-to
core: true
facts:
- Флаги в Varnholt управляются CLI vhctl версии 3
- Нужна роль flags-editor
- Имя флага: строчные латинские буквы, цифры и дефисы, не длиннее 40 символов
- Создать флаг: vhctl flags create <FLAG> --default off
- Включить для доли пользователей: vhctl flags rollout <FLAG> --percent 10 --env staging
- Для окружения production команда rollout требует флаг --confirm
- Изменение применяется в течение 60 секунд
- Проверка: vhctl flags get <FLAG> --env staging показывает строку rollout: 10%
- Откат: vhctl flags rollout <FLAG> --percent 0 --env <ENV>

Напиши гайд для разработчиков: как включить фича-флаг в Varnholt для части пользователей. Читатели уже пользовались флагами, им нужно сделать это прямо сейчас.

Что известно:

- Флагами управляют через CLI `vhctl`, версия 3.
- Нужна роль `flags-editor`.
- Имя флага — строчные латинские буквы, цифры и дефисы, до 40 символов.
- Создать флаг: `vhctl flags create <FLAG> --default off`.
- Включить на 10% пользователей в staging: `vhctl flags rollout <FLAG> --percent 10 --env staging`. В production та же команда требует ещё `--confirm`.
- Изменение доезжает за 60 секунд.
- Проверить: `vhctl flags get <FLAG> --env staging` — в выводе должна быть строка `rollout: 10%`.
- Откатить: `vhctl flags rollout <FLAG> --percent 0 --env <ENV>`.
