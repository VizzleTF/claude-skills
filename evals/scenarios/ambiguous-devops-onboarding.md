id: ambiguous-devops-onboarding
lang: ru
kind: ambiguous
expect: tutorial,how-to,conventions
core: false
expect_notes:
- Запрос неоднозначен: «методичка» может быть обучающим туром, сборником рецептов или сводом правил команды; верный ответ либо выбирает тип или набор документов и объясняет выбор, либо задаёт уточняющий вопрос
facts:
- Платформа называется Pollard; инфраструктура управляется через GitOps на Argo CD
- Манифесты лежат в репозитории infra-gitops, Terraform — в репозитории infra-terraform
- Кластеров два: stage и prod
- Доступы запрашиваются заявкой в очереди OPS
- Правило: в prod ничего не применяется вручную через kubectl apply, только через merge в infra-gitops
- Правило: pull request требует двух одобрений
- Новый сотрудник выходит на дежурство через четыре недели
- Первая задача новичка — выкатить изменение в stage через infra-gitops

Сделай методичку для новых девопсов.

Вводные: платформа Pollard, инфраструктура через GitOps на Argo CD. Манифесты в репозитории `infra-gitops`, Terraform в `infra-terraform`. Кластеры stage и prod. Доступы — заявкой в очередь OPS. В prod руками через `kubectl apply` ничего не применяем, только merge в `infra-gitops`. На pull request нужно два одобрения. На дежурство новичок выходит через четыре недели. Первая задача у всех — выкатить изменение в stage через `infra-gitops`.
