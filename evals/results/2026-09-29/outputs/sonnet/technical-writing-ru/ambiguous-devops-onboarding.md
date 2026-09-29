# Первая выкатка в stage через infra-gitops

Здесь мы выкатим первое изменение в stage через репозиторий `infra-gitops`. Это займёт около `<TIME>`, не считая ожидания ревью.

Это первая задача каждого нового девопса на платформе Pollard. На дежурство новичок выходит через четыре недели. К этому сроку путь «коммит, ревью, merge, Argo CD применил» должен стать привычным.

Манифесты кластеров stage и prod лежат в `infra-gitops`. Argo CD следит за этим репозиторием и приводит кластер к состоянию из ветки `<MAIN_BRANCH>`. Поэтому мы меняем кластер только через merge и не запускаем `kubectl apply`.

## Что нужно до начала

- Доступ на запись в `infra-gitops` и доступ к кластеру stage. Подайте заявку в очередь OPS заранее: без доступа шаги 1 и 7 не пройти.
- git `<GIT_VERSION>`, kubectl `<KUBECTL_VERSION>`, argocd CLI `<ARGOCD_VERSION>`.
- Имя контекста kubectl для stage: `<STAGE_CONTEXT>`.

## Шаги

1. Клонируйте репозиторий и создайте ветку.

   ```bash
   git clone <INFRA_GITOPS_URL>
   cd infra-gitops
   git switch -c onboarding/<LOGIN>-replicas
   ```

   Git ответит `Switched to a new branch 'onboarding/<LOGIN>-replicas'`.

2. Откройте манифест `<PATH_TO_STAGE_MANIFEST>` и увеличьте `replicas` на единицу. Проверьте, что изменилась одна строка:

   ```bash
   git diff
   ```

   Вывод будет примерно таким:

   ```diff
   -  replicas: 2
   +  replicas: 3
   ```

3. Закоммитьте изменение и отправьте ветку.

   ```bash
   git commit -am "stage: <SERVICE> replicas 2 -> 3"
   git push -u origin HEAD
   ```

   В конце вывода будет строка `Branch 'onboarding/<LOGIN>-replicas' set up to track 'origin/onboarding/<LOGIN>-replicas'.`

4. Откройте pull request в `<MAIN_BRANCH>` и назначьте ревьюеров: `<REVIEWERS>`. Для merge нужны два одобрения. Пока их меньше, кнопка merge недоступна.

5. Когда два ревьюера одобрят, выполните merge.

6. Проверьте, что Argo CD применил изменение:

   ```bash
   argocd app get <APP_NAME>
   ```

   Вывод будет примерно таким. Посмотрите на две строки: статус синхронизации и здоровье.

   ```text
   Sync Status:        Synced to <MAIN_BRANCH> (<COMMIT>)
   Health Status:      Healthy
   ```

7. Проверьте результат в кластере:

   ```bash
   kubectl --context <STAGE_CONTEXT> get deployment <SERVICE> -n <NAMESPACE>
   ```

   Вывод будет примерно таким:

   ```text
   NAME        READY   UP-TO-DATE   AVAILABLE   AGE
   <SERVICE>   3/3     3            3           <AGE>
   ```

## Что получилось

Argo CD показывает `Synced` и `Healthy`, а в Deployment запущено 3 реплики из 3. Изменение прошло весь путь от коммита до кластера без ручного `kubectl apply`.

## Что дальше

- Изменения в prod идут тем же путём: только merge в `infra-gitops` после двух одобрений. Ссылка: `<LINK_PROD_HOWTO>`.
- Инфраструктура под кластерами описана в `infra-terraform`. Ссылка: `<LINK_TERRAFORM_INTRO>`.
- Как устроена связка Argo CD и `infra-gitops`: `<LINK_GITOPS_EXPLANATION>`.

**Вопросы, которые заполнят плейсхолдеры:**

1. Какой сервис и какой манифест в stage безопасно менять новичку (`<SERVICE>`, `<PATH_TO_STAGE_MANIFEST>`, `<APP_NAME>`)? Я предположил увеличение `replicas` на единицу.
2. Argo CD синхронизирует stage сам после merge или нужен ручной sync? Если ручной, между шагами 5 и 6 нужен ещё один шаг.
3. Какие версии инструментов, имя основной ветки и адрес `infra-gitops` подставить вместо `<GIT_VERSION>`, `<KUBECTL_VERSION>`, `<ARGOCD_VERSION>`, `<MAIN_BRANCH>`, `<INFRA_GITOPS_URL>`?
