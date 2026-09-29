Описание — это README для продуктовой команды, которая подключается к Hollin. Там, где фактов не хватило, стоят плейсхолдеры `<UPPER_CASE>`; вопросы по ним — под документом.

```markdown
# Hollin

Hollin отправляет уведомления по email, SMS и push через один HTTP-запрос. Сервис нужен продуктовым командам, которые хотят слать уведомления своим пользователям.

## Подключение

1. Получите доступ: <ACCESS_PROCESS>.
2. Добавьте шаблон уведомления в репозиторий [`hollin-templates`](<TEMPLATES_REPO_URL>). Его идентификатор вы передадите в поле `template_id`.

## Первое уведомление

Отправьте запрос `POST /v1/notifications`:

​```bash
curl -X POST "https://<HOLLIN_HOST>/v1/notifications" \
  -H "Authorization: <AUTH_HEADER>" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "<CHANNEL>",
    "recipient": "<RECIPIENT>",
    "template_id": "<TEMPLATE_ID>",
    "params": {"<PARAM_NAME>": "<PARAM_VALUE>"}
  }'
​```

Успешный ответ:

​```
<SUCCESS_RESPONSE>
​```

| Поле | Что передать |
|---|---|
| `channel` | канал: <CHANNEL_VALUES> |
| `recipient` | адрес получателя в этом канале |
| `template_id` | идентификатор шаблона из `hollin-templates` |
| `params` | значения переменных шаблона |

## Ограничения

- Лимит: 50 запросов в секунду на клиента.
- Если доставка не удалась, Hollin повторяет её три раза: через 1, 4 и 16 секунд.

## Поддержка

Hollin принадлежит команде коммуникаций: <TEAM_CONTACT>. Сервис работает в Kubernetes в четырёх репликах.
```

1. Как команда получает доступ к Hollin и какой нужен заголовок авторизации (`<ACCESS_PROCESS>`, `<AUTH_HEADER>`)?
2. Какой адрес у сервиса (`<HOLLIN_HOST>`) и что он возвращает при успехе (`<SUCCESS_RESPONSE>`)?
3. Какие точные значения принимает `channel` (`<CHANNEL_VALUES>`)?
