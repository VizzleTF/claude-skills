# Первый выкат в stage через `infra-gitops`

В этой методичке мы выкатим первое изменение в stage платформы Pollard через pull request в `infra-gitops`. Активная работа занимает около `<MINUTES>` минут, ожидание доступов и ревью в это время не входит.

Инфраструктура Pollard живёт в git, и Argo CD применяет её в кластеры stage и prod. Манифесты лежат в `infra-gitops`, Terraform в `infra-terraform`. Первое изменение затрагивает только `infra-gitops`.

Три правила действуют с первого дня:

- Доступы запрашиваются заявкой в очередь OPS.
- В prod вручную ничего не применяем, `kubectl apply` запрещён. Изменение попадает туда только через merge в `infra-gitops`.
- Pull request сливается после двух одобрений.

На дежурство вы выходите через четыре недели после начала работы. Эта задача входит в подготовку к нему.

## Что нужно до начала

- `git` версии `<GIT_VERSION>` или новее.
- `kubectl` версии `<KUBECTL_VERSION>`, только для чтения (`get`, `describe`, `logs`).
- Учётная запись в `<GIT_HOST>`.
- Наставник `<MENTOR_NAME>`. Он придёт на ревью вторым.

## Шаги

1. **Запросите доступы.** Создайте заявку в очереди OPS `<OPS_QUEUE_LINK>` и запросите:
   - запись в `infra-gitops`;
   - доступ к Argo CD;
   - доступ к кластеру stage.

   Доступ к prod и к `infra-terraform` для этой задачи не нужен. Заявка закрыта, когда OPS подтвердил все три доступа в комментарии.

2. **Склонируйте репозиторий.**

   ```bash
   git clone <GIT_HOST>/infra-gitops.git
   cd infra-gitops
   git status
   ```

   Вывод начинается со строки `On branch <DEFAULT_BRANCH>`.

3. **Создайте ветку.**

   ```bash
   git switch -c <BRANCH_NAME>
   ```

   Ответ: `Switched to a new branch '<BRANCH_NAME>'`.

4. **Внесите изменение только в манифесты stage.** Возьмите задачу у `<MENTOR_NAME>`: `<TASK_DESCRIPTION>`. Отредактируйте файл `<PATH_TO_STAGE_MANIFEST>` и проверьте диф.

   ```bash
   git diff
   ```

   В дифе должны быть только ваши строки и только файлы stage. Если в нём оказался путь prod, откатите его: `git checkout -- <PATH_TO_PROD_FILE>`.

5. **Закоммитьте и отправьте ветку.**

   ```bash
   git add <PATH_TO_STAGE_MANIFEST>
   git commit -m "<COMMIT_MESSAGE>"
   git push -u origin <BRANCH_NAME>
   ```

   Git печатает ссылку для создания pull request.

6. **Откройте pull request и получите два одобрения.** Укажите в описании, что и зачем меняется, и назначьте ревьюерами `<MENTOR_NAME>` и `<SECOND_REVIEWER>`. Без двух одобрений merge недоступен. Если ревьюер просит правки, внесите их новым коммитом в ту же ветку.

7. **Сделайте merge.** Нажмите Merge, когда есть оба одобрения. После этого Argo CD подхватывает изменение из ветки `<DEFAULT_BRANCH>`.

8. **Проследите синхронизацию в Argo CD.**

   ```bash
   argocd app get <ARGO_APP_NAME>
   ```

   Ищите строки `Sync Status: Synced` и `Health Status: Healthy`. Статус `OutOfSync` сразу после merge означает, что Argo CD ещё не забрал изменение. Подождите `<SYNC_INTERVAL>`, затем повторите команду.

9. **Проверьте результат в кластере stage.**

   ```bash
   kubectl --context <STAGE_CONTEXT> -n <NAMESPACE> get <RESOURCE_KIND> <RESOURCE_NAME>
   ```

   Значение `<FIELD>` в выводе совпадает с тем, что вы записали в манифест.

## Результат

Ваш коммит слит в `infra-gitops`, приложение `<ARGO_APP_NAME>` в Argo CD имеет статус `Synced` и `Healthy`, а кластер stage показывает новое значение. Так выглядит любой выкат на Pollard, в том числе в prod. Меняется только путь к манифестам.

## Что дальше

- `<LINK_TO_ONCALL_PLAN>`: план подготовки к дежурству на четыре недели.
- `<LINK_TO_ARGO_REFERENCE>`: справочник по приложениям Argo CD.
- `<LINK_TO_TERRAFORM_DOC>`: работа с `infra-terraform`.

---

Вопросы, чтобы заполнить плейсхолдеры:
1. Где в `infra-gitops` лежат манифесты stage и как называются приложения в Argo CD (`<PATH_TO_STAGE_MANIFEST>`, `<ARGO_APP_NAME>`)?
2. Какая основная ветка и включена ли автосинхронизация в stage (`<DEFAULT_BRANCH>`, `<SYNC_INTERVAL>`)?
3. Какое учебное изменение получает новичок и кто второй ревьюер (`<TASK_DESCRIPTION>`, `<SECOND_REVIEWER>`)?
