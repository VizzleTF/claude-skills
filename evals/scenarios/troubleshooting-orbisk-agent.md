id: troubleshooting-orbisk-agent
lang: ru
kind: create
expect: troubleshooting
core: false
facts:
- Агент сбора метрик Orbisk пишет логи в journald, смотреть их командой journalctl -u orbisk-agent
- "E101: token rejected (401)" — токен истёк (срок жизни 90 дней) или отозван; создать новый командой orbisk token create, записать в поле token файла /etc/orbisk/agent.yaml и выполнить systemctl restart orbisk-agent
- "E204: clock skew 312s exceeds 120s" — системные часы расходятся с сервером больше чем на 120 секунд; включить NTP командой timedatectl set-ntp true
- "E310: spool full (512 MiB)" — агент долго не может отправить данные на ingest.orbisk.example:443, буфер заполнен и старые метрики отбрасываются; восстановить сетевой доступ к ingest.orbisk.example:443, при необходимости увеличить spool_max_mb (максимум 4096)
- "E415: unknown collector "nginx_plus"" — плагин коллектора не установлен; установить командой orbisk plugins install nginx_plus
- Число 312 в E204 и имя nginx_plus в E415 меняются от случая к случаю

Сделай страницу для тех, у кого не работает агент Orbisk (он собирает метрики на серверах). Человек приходит с ошибкой из лога и ищет её на странице. Логи агента: `journalctl -u orbisk-agent`.

Ошибки, которые мы видим чаще всего:

1. `E101: token rejected (401)`. Токен истёк (живёт 90 дней) или его отозвали. Лечится так: `orbisk token create`, новый токен в поле `token` в `/etc/orbisk/agent.yaml`, потом `systemctl restart orbisk-agent`.
2. `E204: clock skew 312s exceeds 120s` (число секунд бывает разным). Часы сервера разошлись с нашими больше чем на 120 секунд. Включить NTP: `timedatectl set-ntp true`.
3. `E310: spool full (512 MiB)`. Агент давно не может достучаться до `ingest.orbisk.example:443`, буфер забит, старые метрики выкидываются. Нужно вернуть сетевой доступ к этому адресу; буфер можно увеличить параметром `spool_max_mb`, максимум 4096.
4. `E415: unknown collector "nginx_plus"` (имя коллектора бывает другим). Плагин не установлен: `orbisk plugins install nginx_plus`.
