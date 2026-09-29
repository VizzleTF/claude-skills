# Агент Orbisk не работает: ошибки в логе и что с ними делать

Страница для тех, у кого агент Orbisk не собирает метрики. Найдите в таблице сообщение из лога агента (`journalctl -u orbisk-agent`) и выполните действие из той же строки.

| Сообщение в логе | Причина | Действие |
|---|---|---|
| `E101: token rejected (401)` | Токен истёк (он живёт 90 дней) или его отозвали. | [Выпустите новый токен](#e101-token-rejected-401). |
| `E204: clock skew 312s exceeds 120s` (число секунд бывает другим) | Часы сервера отличаются от наших больше чем на 120 секунд. | Включите NTP: `timedatectl set-ntp true`. |
| `E310: spool full (512 MiB)` | Агент давно не может подключиться к `ingest.orbisk.example:443`. Буфер заполнен, старые метрики выкидываются. | Верните серверу сетевой доступ к `ingest.orbisk.example:443`. Чтобы буфер вмещал больше, увеличьте `spool_max_mb` в `<CONFIG_FILE>` (максимум 4096). |
| `E415: unknown collector "nginx_plus"` (имя коллектора бывает другим) | Плагин коллектора не установлен. | Установите плагин с тем именем, которое указано в сообщении: `orbisk plugins install nginx_plus`. |

## `E101: token rejected (401)`

1. Создайте новый токен:

   ```bash
   orbisk token create
   ```

2. Впишите его в поле `token` в `/etc/orbisk/agent.yaml`.
3. Перезапустите агент:

   ```bash
   systemctl restart orbisk-agent
   ```

Если сообщения `E101` в `journalctl -u orbisk-agent` больше нет, токен принят.

---

Вопрос по плейсхолдеру:
- `<CONFIG_FILE>`: в каком файле задаётся `spool_max_mb` (это `/etc/orbisk/agent.yaml`?) и нужен ли после изменения `systemctl restart orbisk-agent`?
