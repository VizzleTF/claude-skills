# Отчёт A/B

## Параметры

- Дата: 2026-09-29
- Основные модели: sonnet
- Модели на ключевых сценариях: haiku, opus
- Судья: opus, два прохода с разным порядком, оценка — среднее
- Участники: writing-docs, technical-writing, technical-writing-ru, none
- sonnet: сценариев 28
- haiku: сценариев 8
- opus: сценариев 8

## Участник × критерий (sonnet)

| Участник | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| writing-docs | 4.7 | 4.4 | 4.1 | 4.6 | 4.7 | 4.7 | 4.9 | 4.1 | 4.3 | 4.5 |
| technical-writing | 4.9 | 4.6 | 4.4 | 4.6 | 4.5 | 4.9 | 5.0 | 4.6 | 4.6 | 4.7 |
| technical-writing-ru | 4.8 | 4.5 | 4.3 | 4.6 | 4.5 | 4.9 | 5.0 | 4.4 | 4.5 | 4.6 |
| none | 4.4 | 4.2 | 3.4 | 4.2 | 4.5 | 4.3 | 4.2 | 3.2 | 4.0 | 4.1 |

### writing-docs: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.5 | 5.0 | 4.8 |
| adr-veyrun-advisory-locks | 5.0 | 4.0 | 3.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.0 | 4.0 | 4.3 |
| ambiguous-deploy-instruction | 4.0 | 4.0 | 4.5 | 4.0 | 5.0 | 4.5 | 5.0 | 3.5 | 4.0 | 4.3 |
| ambiguous-devops-onboarding | 4.0 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.0 | 4.4 |
| ambiguous-service-description | 5.0 | 4.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 3.5 | 4.6 |
| changelog-pellmark-4-0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.9 |
| cli-help-errors-vendle | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.8 |
| conventions-brannock-terraform | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.0 | 4.7 |
| docstring-quarrybill-prorate | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.9 |
| explanation-tamrisk-cache | 4.0 | 4.5 | 3.5 | 3.0 | 5.0 | 4.5 | 4.5 | 3.5 | 4.5 | 4.1 |
| howto-varnholt-flag-rollout | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 |
| postmortem-quenby-index-lock | 5.0 | 4.5 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.8 |
| readme-tarnlog | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.0 | 4.8 |
| real-backstage-adr | 3.0 | 2.0 | 2.0 | 4.0 | 3.0 | 3.0 | 4.0 | 3.0 | 3.0 | 3.0 |
| real-crashloop-runbook | 5.0 | 4.5 | 4.5 | 5.0 | 4.5 | 5.0 | 5.0 | 3.5 | 4.0 | 4.6 |
| real-etcd-postmortem | 4.0 | 3.0 | 2.0 | 4.0 | 5.0 | 4.0 | 5.0 | 3.0 | 4.0 | 3.8 |
| real-fd-readme | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 4.9 |
| real-flask-changelog | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.8 |
| real-k8s-probes | 4.0 | 4.0 | 2.0 | 3.5 | 4.5 | 4.0 | 4.0 | 2.0 | 3.5 | 3.5 |
| real-kubeadm-troubleshooting | 5.0 | 4.5 | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.8 |
| real-react-effects-ru | 5.0 | 5.0 | 3.0 | 4.5 | 5.0 | 4.5 | 4.5 | 3.0 | 4.5 | 4.3 |
| real-react-useid-ru | 3.5 | 3.5 | 2.5 | 4.0 | 3.5 | 4.0 | 5.0 | 2.0 | 4.5 | 3.6 |
| reference-throttlewick-env | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.9 |
| review-explanation-en | 5.0 | 4.5 | 4.5 | 4.0 | 5.0 | 5.0 | 5.0 | 3.0 | 5.0 | 4.6 |
| review-readme-ru | 5.0 | 5.0 | 5.0 | 4.0 | 4.5 | 5.0 | 5.0 | 4.0 | 5.0 | 4.7 |
| runbook-disk-full | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.8 |
| troubleshooting-orbisk-agent | 5.0 | 5.0 | 2.5 | 4.5 | 4.0 | 5.0 | 5.0 | 4.0 | 4.0 | 4.3 |
| tutorial-lumbrook-first-pipeline | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 4.0 | 4.7 |

### technical-writing: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 4.0 | 4.0 | 4.5 | 4.0 | 5.0 | 5.0 | 4.5 | 4.0 | 4.4 |
| adr-veyrun-advisory-locks | 5.0 | 5.0 | 3.5 | 4.5 | 4.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.6 |
| ambiguous-deploy-instruction | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.5 | 5.0 | 5.0 | 5.0 | 4.9 |
| ambiguous-devops-onboarding | 4.0 | 5.0 | 4.5 | 4.5 | 5.0 | 5.0 | 5.0 | 4.0 | 4.5 | 4.6 |
| ambiguous-service-description | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.9 |
| changelog-pellmark-4-0 | 5.0 | 4.0 | 5.0 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.6 |
| cli-help-errors-vendle | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.5 | 4.9 |
| conventions-brannock-terraform | 5.0 | 5.0 | 5.0 | 4.0 | 4.5 | 4.0 | 5.0 | 5.0 | 5.0 | 4.7 |
| docstring-quarrybill-prorate | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.9 |
| explanation-tamrisk-cache | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.8 |
| howto-varnholt-flag-rollout | 5.0 | 4.0 | 5.0 | 4.0 | 4.5 | 5.0 | 5.0 | 4.0 | 4.0 | 4.5 |
| postmortem-quenby-index-lock | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 |
| readme-tarnlog | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.8 |
| real-backstage-adr | 5.0 | 5.0 | 4.0 | 5.0 | 4.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.7 |
| real-crashloop-runbook | 5.0 | 4.0 | 3.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.0 | 4.6 |
| real-etcd-postmortem | 5.0 | 4.0 | 4.0 | 4.5 | 4.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.6 |
| real-fd-readme | 5.0 | 4.5 | 3.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.7 |
| real-flask-changelog | 5.0 | 4.5 | 4.5 | 4.0 | 4.5 | 4.5 | 5.0 | 4.0 | 4.0 | 4.4 |
| real-k8s-probes | 5.0 | 5.0 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.5 | 4.7 |
| real-kubeadm-troubleshooting | 5.0 | 4.5 | 3.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.5 | 4.7 |
| real-react-effects-ru | 4.5 | 3.5 | 3.0 | 2.5 | 4.0 | 4.5 | 4.5 | 4.0 | 4.0 | 3.8 |
| real-react-useid-ru | 5.0 | 4.5 | 4.0 | 5.0 | 4.0 | 4.5 | 5.0 | 4.0 | 5.0 | 4.6 |
| reference-throttlewick-env | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 |
| review-explanation-en | 5.0 | 4.0 | 4.0 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.6 |
| review-readme-ru | 5.0 | 4.5 | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.8 |
| runbook-disk-full | 5.0 | 5.0 | 4.0 | 5.0 | 4.5 | 5.0 | 5.0 | 3.0 | 5.0 | 4.6 |
| troubleshooting-orbisk-agent | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.8 |
| tutorial-lumbrook-first-pipeline | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.5 | 4.5 | 4.0 | 5.0 | 4.7 |

### technical-writing-ru: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 4.0 | 3.0 | 4.5 | 4.0 | 4.5 | 5.0 | 3.5 | 4.0 | 4.2 |
| adr-veyrun-advisory-locks | 5.0 | 5.0 | 5.0 | 4.5 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.9 |
| ambiguous-deploy-instruction | 5.0 | 4.0 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.0 | 4.7 |
| ambiguous-devops-onboarding | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.8 |
| ambiguous-service-description | 5.0 | 4.5 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.8 |
| changelog-pellmark-4-0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.9 |
| cli-help-errors-vendle | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 |
| conventions-brannock-terraform | 5.0 | 5.0 | 4.5 | 4.0 | 4.5 | 5.0 | 5.0 | 4.5 | 5.0 | 4.7 |
| docstring-quarrybill-prorate | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.9 |
| explanation-tamrisk-cache | 5.0 | 5.0 | 4.5 | 5.0 | 4.0 | 5.0 | 5.0 | 4.5 | 4.5 | 4.7 |
| howto-varnholt-flag-rollout | 5.0 | 4.0 | 4.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 3.5 | 4.5 |
| postmortem-quenby-index-lock | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 4.9 |
| readme-tarnlog | 5.0 | 5.0 | 4.5 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.7 |
| real-backstage-adr | 5.0 | 4.0 | 3.5 | 4.5 | 3.5 | 4.5 | 5.0 | 4.0 | 4.5 | 4.3 |
| real-crashloop-runbook | 5.0 | 4.5 | 3.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.7 |
| real-etcd-postmortem | 4.0 | 5.0 | 3.0 | 4.0 | 4.0 | 4.5 | 5.0 | 2.5 | 4.5 | 4.1 |
| real-fd-readme | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.9 |
| real-flask-changelog | 4.5 | 3.5 | 3.0 | 4.5 | 4.0 | 5.0 | 5.0 | 3.0 | 4.5 | 4.1 |
| real-k8s-probes | 4.0 | 4.0 | 3.0 | 4.5 | 4.0 | 4.5 | 5.0 | 3.0 | 4.5 | 4.1 |
| real-kubeadm-troubleshooting | 5.0 | 4.0 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.0 | 4.5 |
| real-react-effects-ru | 5.0 | 4.0 | 4.0 | 2.5 | 3.5 | 5.0 | 5.0 | 4.5 | 4.5 | 4.2 |
| real-react-useid-ru | 5.0 | 5.0 | 4.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.8 |
| reference-throttlewick-env | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 |
| review-explanation-en | 3.0 | 3.0 | 3.0 | 4.0 | 4.5 | 4.5 | 5.0 | 3.0 | 4.0 | 3.8 |
| review-readme-ru | 5.0 | 4.5 | 5.0 | 4.5 | 4.0 | 5.0 | 5.0 | 4.5 | 5.0 | 4.7 |
| runbook-disk-full | 5.0 | 4.0 | 5.0 | 4.0 | 4.5 | 5.0 | 5.0 | 4.5 | 4.0 | 4.6 |
| troubleshooting-orbisk-agent | 5.0 | 4.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.7 |
| tutorial-lumbrook-first-pipeline | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 4.0 | 5.0 | 4.8 |

### none: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 4.0 | 5.0 | 5.0 | 4.0 | 4.0 | 5.0 | 4.0 | 4.0 | 4.4 |
| adr-veyrun-advisory-locks | 5.0 | 5.0 | 4.0 | 4.5 | 5.0 | 3.5 | 4.5 | 4.0 | 5.0 | 4.5 |
| ambiguous-deploy-instruction | 4.0 | 5.0 | 5.0 | 4.0 | 4.0 | 4.0 | 4.5 | 3.0 | 4.5 | 4.2 |
| ambiguous-devops-onboarding | 3.0 | 3.0 | 2.0 | 3.0 | 4.0 | 3.0 | 2.5 | 2.0 | 3.0 | 2.8 |
| ambiguous-service-description | 3.0 | 3.0 | 4.0 | 4.5 | 4.0 | 4.5 | 4.5 | 4.5 | 2.0 | 3.8 |
| changelog-pellmark-4-0 | 4.5 | 3.0 | 2.0 | 4.0 | 4.0 | 4.0 | 3.5 | 3.0 | 3.5 | 3.5 |
| cli-help-errors-vendle | 5.0 | 4.0 | 2.0 | 4.5 | 4.5 | 4.0 | 5.0 | 4.0 | 3.0 | 4.0 |
| conventions-brannock-terraform | 4.5 | 5.0 | 3.5 | 4.5 | 5.0 | 5.0 | 4.0 | 2.5 | 5.0 | 4.3 |
| docstring-quarrybill-prorate | 4.5 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.0 | 4.5 | 4.6 |
| explanation-tamrisk-cache | 3.5 | 4.0 | 3.0 | 3.5 | 4.0 | 4.0 | 2.0 | 2.5 | 4.0 | 3.4 |
| howto-varnholt-flag-rollout | 5.0 | 4.0 | 3.5 | 4.0 | 5.0 | 3.0 | 5.0 | 4.0 | 3.5 | 4.1 |
| postmortem-quenby-index-lock | 4.0 | 4.0 | 2.0 | 4.0 | 4.0 | 3.5 | 2.0 | 2.0 | 3.5 | 3.2 |
| readme-tarnlog | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 3.5 | 4.0 | 4.6 |
| real-backstage-adr | 3.0 | 2.5 | 2.5 | 4.0 | 4.0 | 4.0 | 4.0 | 2.0 | 3.5 | 3.3 |
| real-crashloop-runbook | 5.0 | 4.5 | 4.0 | 3.0 | 4.5 | 5.0 | 5.0 | 2.5 | 4.5 | 4.2 |
| real-etcd-postmortem | 4.0 | 3.0 | 2.5 | 3.5 | 4.0 | 4.0 | 5.0 | 2.0 | 4.0 | 3.6 |
| real-fd-readme | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.5 | 4.5 | 5.0 | 4.8 |
| real-flask-changelog | 5.0 | 5.0 | 4.0 | 4.5 | 5.0 | 5.0 | 5.0 | 3.0 | 5.0 | 4.6 |
| real-k8s-probes | 4.0 | 4.5 | 2.5 | 4.0 | 4.0 | 4.0 | 4.5 | 3.0 | 4.5 | 3.9 |
| real-kubeadm-troubleshooting | 5.0 | 5.0 | 4.0 | 3.5 | 5.0 | 5.0 | 5.0 | 4.0 | 4.0 | 4.5 |
| real-react-effects-ru | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.0 | 3.0 | 5.0 | 4.6 |
| real-react-useid-ru | 5.0 | 4.0 | 3.0 | 4.0 | 5.0 | 4.0 | 4.5 | 3.5 | 4.5 | 4.2 |
| reference-throttlewick-env | 5.0 | 5.0 | 3.0 | 4.5 | 4.5 | 4.5 | 4.5 | 4.0 | 4.5 | 4.4 |
| review-explanation-en | 3.0 | 3.0 | 3.0 | 4.0 | 4.0 | 4.5 | 5.0 | 2.0 | 4.0 | 3.6 |
| review-readme-ru | 4.5 | 4.5 | 4.0 | 4.0 | 5.0 | 4.5 | 4.5 | 2.5 | 4.0 | 4.2 |
| runbook-disk-full | 5.0 | 4.0 | 3.0 | 4.0 | 4.0 | 4.0 | 4.0 | 3.5 | 3.0 | 3.8 |
| troubleshooting-orbisk-agent | 5.0 | 4.0 | 3.0 | 4.0 | 5.0 | 5.0 | 4.5 | 3.0 | 3.5 | 4.1 |
| tutorial-lumbrook-first-pipeline | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 4.0 | 3.5 | 3.0 | 4.0 | 4.3 |

## Ключевые сценарии (haiku)

| Участник | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| writing-docs | 3.9 | 3.1 | 2.8 | 4.2 | 4.2 | 3.8 | 4.0 | 3.0 | 3.2 | 3.6 |
| technical-writing | 4.0 | 3.6 | 3.1 | 4.1 | 4.2 | 4.3 | 4.2 | 3.4 | 3.9 | 3.9 |
| technical-writing-ru | 3.8 | 2.9 | 2.7 | 3.9 | 4.0 | 4.1 | 4.1 | 3.8 | 3.1 | 3.6 |
| none | 3.1 | 2.8 | 2.1 | 3.8 | 4.1 | 3.8 | 3.4 | 2.6 | 3.0 | 3.2 |

### writing-docs: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 4.0 | 2.5 | 3.0 | 4.0 | 4.0 | 4.0 | 4.0 | 3.0 | 3.0 | 3.5 |
| ambiguous-service-description | 5.0 | 4.0 | 4.0 | 5.0 | 4.0 | 4.0 | 4.5 | 4.0 | 3.5 | 4.2 |
| cli-help-errors-vendle | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 4.5 | 4.0 | 4.7 |
| howto-varnholt-flag-rollout | 4.0 | 3.0 | 2.0 | 4.0 | 4.0 | 3.5 | 4.0 | 2.5 | 3.0 | 3.3 |
| real-etcd-postmortem | 2.5 | 2.0 | 2.0 | 4.0 | 4.0 | 3.5 | 4.0 | 2.0 | 3.0 | 3.0 |
| review-explanation-en | 3.0 | 2.5 | 2.0 | 3.5 | 4.5 | 3.5 | 3.0 | 2.0 | 3.5 | 3.1 |
| review-readme-ru | 3.0 | 3.0 | 1.5 | 3.5 | 4.0 | 3.0 | 3.0 | 2.0 | 3.0 | 2.9 |
| runbook-disk-full | 4.5 | 3.5 | 2.5 | 5.0 | 4.0 | 4.5 | 4.5 | 4.0 | 2.5 | 3.9 |

### technical-writing: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 4.0 | 2.5 | 4.0 | 4.0 | 4.0 | 4.0 | 4.0 | 3.5 | 3.9 |
| ambiguous-service-description | 4.0 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.6 |
| cli-help-errors-vendle | 4.5 | 4.0 | 3.0 | 3.0 | 4.0 | 5.0 | 4.0 | 2.5 | 5.0 | 3.9 |
| howto-varnholt-flag-rollout | 5.0 | 4.5 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.8 |
| real-etcd-postmortem | 2.5 | 2.0 | 1.0 | 3.5 | 4.0 | 3.5 | 3.0 | 2.0 | 2.5 | 2.7 |
| review-explanation-en | 3.0 | 3.0 | 3.0 | 5.0 | 4.0 | 4.0 | 4.5 | 2.5 | 4.5 | 3.7 |
| review-readme-ru | 3.0 | 3.5 | 2.0 | 3.0 | 4.0 | 3.0 | 3.0 | 2.0 | 3.5 | 3.0 |
| runbook-disk-full | 5.0 | 4.0 | 4.0 | 4.5 | 4.0 | 5.0 | 5.0 | 4.5 | 4.0 | 4.4 |

### technical-writing-ru: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 2.5 | 1.5 | 1.5 | 3.0 | 4.0 | 3.0 | 3.0 | 3.0 | 1.5 | 2.6 |
| ambiguous-service-description | 4.0 | 3.0 | 3.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 3.0 | 4.2 |
| cli-help-errors-vendle | 5.0 | 3.0 | 2.5 | 5.0 | 4.0 | 4.5 | 5.0 | 5.0 | 3.0 | 4.1 |
| howto-varnholt-flag-rollout | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.9 |
| real-etcd-postmortem | 2.0 | 2.0 | 1.0 | 3.0 | 3.5 | 3.0 | 2.0 | 2.0 | 2.0 | 2.3 |
| review-explanation-en | 2.5 | 2.0 | 2.5 | 4.0 | 4.0 | 4.0 | 4.0 | 2.0 | 3.5 | 3.2 |
| review-readme-ru | 4.0 | 3.0 | 3.0 | 2.0 | 3.0 | 4.0 | 4.0 | 3.0 | 4.0 | 3.3 |
| runbook-disk-full | 5.0 | 4.0 | 3.0 | 4.5 | 4.0 | 4.0 | 5.0 | 5.0 | 3.0 | 4.2 |

### none: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 2.0 | 1.0 | 1.0 | 3.0 | 4.0 | 3.0 | 3.0 | 3.0 | 1.0 | 2.3 |
| ambiguous-service-description | 3.0 | 3.5 | 2.0 | 4.0 | 4.0 | 3.0 | 1.5 | 2.0 | 3.0 | 2.9 |
| cli-help-errors-vendle | 5.0 | 4.0 | 4.5 | 5.0 | 4.5 | 4.5 | 5.0 | 5.0 | 4.0 | 4.6 |
| howto-varnholt-flag-rollout | 3.5 | 4.0 | 2.5 | 4.0 | 3.5 | 4.0 | 3.0 | 2.0 | 4.0 | 3.4 |
| real-etcd-postmortem | 2.5 | 2.0 | 1.5 | 3.0 | 4.0 | 3.5 | 4.0 | 2.0 | 3.0 | 2.8 |
| review-explanation-en | 2.5 | 2.0 | 2.0 | 4.0 | 4.0 | 4.0 | 4.0 | 2.0 | 3.0 | 3.1 |
| review-readme-ru | 2.5 | 2.0 | 1.5 | 4.0 | 4.0 | 4.0 | 4.0 | 2.0 | 2.5 | 2.9 |
| runbook-disk-full | 4.0 | 3.5 | 2.0 | 3.5 | 4.5 | 4.0 | 3.0 | 2.5 | 3.5 | 3.4 |

## Ключевые сценарии (opus)

| Участник | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| writing-docs | 4.6 | 4.7 | 3.9 | 4.7 | 4.9 | 4.9 | 4.8 | 3.5 | 4.2 | 4.5 |
| technical-writing | 5.0 | 4.5 | 4.4 | 4.6 | 4.4 | 5.0 | 4.9 | 4.8 | 4.5 | 4.7 |
| technical-writing-ru | 4.8 | 4.6 | 4.4 | 4.5 | 4.6 | 4.9 | 5.0 | 4.6 | 4.4 | 4.6 |
| none | 4.3 | 4.2 | 3.7 | 3.9 | 4.4 | 4.9 | 4.8 | 3.2 | 3.9 | 4.2 |

### writing-docs: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.9 |
| ambiguous-service-description | 5.0 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 3.0 | 4.4 |
| cli-help-errors-vendle | 5.0 | 5.0 | 4.5 | 4.5 | 5.0 | 5.0 | 5.0 | 4.0 | 4.0 | 4.7 |
| howto-varnholt-flag-rollout | 5.0 | 5.0 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.7 |
| real-etcd-postmortem | 3.5 | 3.5 | 3.5 | 4.5 | 4.5 | 4.5 | 5.0 | 2.5 | 4.5 | 4.0 |
| review-explanation-en | 4.5 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 4.5 | 3.0 | 5.0 | 4.6 |
| review-readme-ru | 4.0 | 5.0 | 3.5 | 5.0 | 5.0 | 5.0 | 4.0 | 2.5 | 5.0 | 4.3 |
| runbook-disk-full | 5.0 | 5.0 | 2.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 2.5 | 4.3 |

### technical-writing: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 5.0 | 4.5 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.8 |
| ambiguous-service-description | 5.0 | 4.5 | 3.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.7 |
| cli-help-errors-vendle | 5.0 | 4.0 | 4.5 | 4.5 | 4.0 | 5.0 | 5.0 | 4.5 | 4.0 | 4.5 |
| howto-varnholt-flag-rollout | 5.0 | 4.0 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.0 | 4.7 |
| real-etcd-postmortem | 5.0 | 4.0 | 4.0 | 4.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.6 |
| review-explanation-en | 5.0 | 5.0 | 5.0 | 4.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.8 |
| review-readme-ru | 5.0 | 4.5 | 4.0 | 4.0 | 4.0 | 5.0 | 4.5 | 4.0 | 4.5 | 4.4 |
| runbook-disk-full | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.9 |

### technical-writing-ru: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 5.0 | 4.0 | 4.5 | 4.0 | 4.0 | 5.0 | 5.0 | 4.5 | 4.6 |
| ambiguous-service-description | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.9 |
| cli-help-errors-vendle | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.5 | 5.0 | 4.9 |
| howto-varnholt-flag-rollout | 5.0 | 4.0 | 4.5 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 4.0 | 4.7 |
| real-etcd-postmortem | 5.0 | 4.0 | 4.0 | 4.0 | 4.0 | 5.0 | 5.0 | 4.0 | 4.5 | 4.4 |
| review-explanation-en | 3.5 | 3.5 | 3.5 | 4.0 | 4.5 | 5.0 | 5.0 | 3.0 | 4.0 | 4.0 |
| review-readme-ru | 5.0 | 5.0 | 4.5 | 5.0 | 4.5 | 5.0 | 5.0 | 5.0 | 5.0 | 4.9 |
| runbook-disk-full | 5.0 | 5.0 | 4.5 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.5 | 4.8 |

### none: сценарий × критерий

| Сценарий | Тип | Каркас | Точность | Ответ первым | Сканируемость | Голос | Без LLM-паттернов | Без воды | Пригодность | Итог |
|---|---|---|---|---|---|---|---|---|---|---|
| adr-supersede | 5.0 | 5.0 | 3.5 | 4.0 | 4.0 | 5.0 | 5.0 | 4.0 | 3.0 | 4.3 |
| ambiguous-service-description | 5.0 | 4.5 | 4.0 | 4.0 | 4.0 | 5.0 | 4.0 | 3.0 | 3.5 | 4.1 |
| cli-help-errors-vendle | 5.0 | 5.0 | 4.0 | 5.0 | 5.0 | 5.0 | 5.0 | 4.0 | 5.0 | 4.8 |
| howto-varnholt-flag-rollout | 5.0 | 4.5 | 4.5 | 4.0 | 5.0 | 5.0 | 5.0 | 4.0 | 4.5 | 4.6 |
| real-etcd-postmortem | 2.5 | 2.5 | 1.5 | 3.5 | 3.5 | 4.0 | 5.0 | 2.0 | 2.5 | 3.0 |
| review-explanation-en | 3.5 | 3.0 | 3.0 | 3.5 | 4.0 | 5.0 | 5.0 | 3.0 | 4.0 | 3.8 |
| review-readme-ru | 3.5 | 5.0 | 5.0 | 3.5 | 5.0 | 5.0 | 4.5 | 2.5 | 5.0 | 4.3 |
| runbook-disk-full | 5.0 | 4.5 | 4.0 | 4.0 | 5.0 | 5.0 | 5.0 | 3.5 | 4.0 | 4.4 |

## По сценариям (sonnet)

| Сценарий | Участник | Итог | Слов | Скилл сработал | Файлы скилла прочитаны |
|---|---|---|---|---|---|
| adr-supersede | writing-docs | 4.8 | 400 | да | 0 |
| adr-supersede | technical-writing | 4.4 | 292 | да | 2 |
| adr-supersede | technical-writing-ru | 4.2 | 325 | да | 3 |
| adr-supersede | none | 4.4 | 304 | — | — |
| adr-veyrun-advisory-locks | writing-docs | 4.3 | 189 | да | 0 |
| adr-veyrun-advisory-locks | technical-writing | 4.6 | 214 | да | 2 |
| adr-veyrun-advisory-locks | technical-writing-ru | 4.9 | 168 | да | 3 |
| adr-veyrun-advisory-locks | none | 4.5 | 205 | — | — |
| ambiguous-deploy-instruction | writing-docs | 4.3 | 294 | да | 0 |
| ambiguous-deploy-instruction | technical-writing | 4.9 | 221 | да | 3 |
| ambiguous-deploy-instruction | technical-writing-ru | 4.7 | 214 | да | 3 |
| ambiguous-deploy-instruction | none | 4.2 | 292 | — | — |
| ambiguous-devops-onboarding | writing-docs | 4.4 | 618 | да | 0 |
| ambiguous-devops-onboarding | technical-writing | 4.6 | 539 | да | 2 |
| ambiguous-devops-onboarding | technical-writing-ru | 4.8 | 450 | да | 3 |
| ambiguous-devops-onboarding | none | 2.8 | 954 | — | — |
| ambiguous-service-description | writing-docs | 4.6 | 254 | да | 0 |
| ambiguous-service-description | technical-writing | 4.9 | 215 | да | 2 |
| ambiguous-service-description | technical-writing-ru | 4.8 | 200 | да | 3 |
| ambiguous-service-description | none | 3.8 | 139 | — | — |
| changelog-pellmark-4-0 | writing-docs | 4.9 | 211 | да | 0 |
| changelog-pellmark-4-0 | technical-writing | 4.6 | 134 | да | 3 |
| changelog-pellmark-4-0 | technical-writing-ru | 4.9 | 241 | нет | 0 |
| changelog-pellmark-4-0 | none | 3.5 | 305 | — | — |
| cli-help-errors-vendle | writing-docs | 4.8 | 259 | да | 0 |
| cli-help-errors-vendle | technical-writing | 4.9 | 206 | да | 3 |
| cli-help-errors-vendle | technical-writing-ru | 5.0 | 234 | да | 2 |
| cli-help-errors-vendle | none | 4.0 | 221 | — | — |
| conventions-brannock-terraform | writing-docs | 4.7 | 779 | да | 0 |
| conventions-brannock-terraform | technical-writing | 4.7 | 564 | да | 2 |
| conventions-brannock-terraform | technical-writing-ru | 4.7 | 687 | да | 3 |
| conventions-brannock-terraform | none | 4.3 | 1495 | — | — |
| docstring-quarrybill-prorate | writing-docs | 4.9 | 178 | да | 0 |
| docstring-quarrybill-prorate | technical-writing | 4.9 | 170 | да | 3 |
| docstring-quarrybill-prorate | technical-writing-ru | 4.9 | 197 | нет | 0 |
| docstring-quarrybill-prorate | none | 4.6 | 186 | — | — |
| explanation-tamrisk-cache | writing-docs | 4.1 | 377 | да | 0 |
| explanation-tamrisk-cache | technical-writing | 4.8 | 269 | да | 2 |
| explanation-tamrisk-cache | technical-writing-ru | 4.7 | 301 | да | 3 |
| explanation-tamrisk-cache | none | 3.4 | 501 | — | — |
| howto-varnholt-flag-rollout | writing-docs | 5.0 | 186 | да | 0 |
| howto-varnholt-flag-rollout | technical-writing | 4.5 | 163 | да | 2 |
| howto-varnholt-flag-rollout | technical-writing-ru | 4.5 | 128 | да | 3 |
| howto-varnholt-flag-rollout | none | 4.1 | 211 | — | — |
| postmortem-quenby-index-lock | writing-docs | 4.8 | 391 | да | 0 |
| postmortem-quenby-index-lock | technical-writing | 5.0 | 346 | да | 2 |
| postmortem-quenby-index-lock | technical-writing-ru | 4.9 | 422 | да | 3 |
| postmortem-quenby-index-lock | none | 3.2 | 645 | — | — |
| readme-tarnlog | writing-docs | 4.8 | 141 | да | 0 |
| readme-tarnlog | technical-writing | 4.8 | 115 | да | 2 |
| readme-tarnlog | technical-writing-ru | 4.7 | 130 | да | 3 |
| readme-tarnlog | none | 4.6 | 116 | — | — |
| real-backstage-adr | writing-docs | 3.0 | 1269 | да | 1 |
| real-backstage-adr | technical-writing | 4.7 | 667 | да | 4 |
| real-backstage-adr | technical-writing-ru | 4.3 | 729 | да | 0 |
| real-backstage-adr | none | 3.3 | 2404 | — | — |
| real-crashloop-runbook | writing-docs | 4.6 | 1267 | нет | 2 |
| real-crashloop-runbook | technical-writing | 4.6 | 654 | да | 3 |
| real-crashloop-runbook | technical-writing-ru | 4.7 | 700 | да | 3 |
| real-crashloop-runbook | none | 4.2 | 1849 | — | — |
| real-etcd-postmortem | writing-docs | 3.8 | 2195 | да | 1 |
| real-etcd-postmortem | technical-writing | 4.6 | 783 | да | 2 |
| real-etcd-postmortem | technical-writing-ru | 4.1 | 2317 | да | 3 |
| real-etcd-postmortem | none | 3.6 | 2470 | — | — |
| real-fd-readme | writing-docs | 4.9 | 409 | да | 0 |
| real-fd-readme | technical-writing | 4.7 | 248 | да | 3 |
| real-fd-readme | technical-writing-ru | 4.9 | 426 | нет | 0 |
| real-fd-readme | none | 4.8 | 375 | — | — |
| real-flask-changelog | writing-docs | 4.8 | 378 | нет | 1 |
| real-flask-changelog | technical-writing | 4.4 | 398 | да | 3 |
| real-flask-changelog | technical-writing-ru | 4.1 | 584 | нет | 0 |
| real-flask-changelog | none | 4.6 | 541 | — | — |
| real-k8s-probes | writing-docs | 3.5 | 1585 | да | 1 |
| real-k8s-probes | technical-writing | 4.7 | 792 | да | 4 |
| real-k8s-probes | technical-writing-ru | 4.1 | 1772 | да | 0 |
| real-k8s-probes | none | 3.9 | 2237 | — | — |
| real-kubeadm-troubleshooting | writing-docs | 4.8 | 1142 | да | 0 |
| real-kubeadm-troubleshooting | technical-writing | 4.7 | 1030 | да | 3 |
| real-kubeadm-troubleshooting | technical-writing-ru | 4.5 | 1077 | нет | 0 |
| real-kubeadm-troubleshooting | none | 4.5 | 1361 | — | — |
| real-react-effects-ru | writing-docs | 4.3 | 1661 | да | 0 |
| real-react-effects-ru | technical-writing | 3.8 | 798 | да | 3 |
| real-react-effects-ru | technical-writing-ru | 4.2 | 773 | да | 0 |
| real-react-effects-ru | none | 4.6 | 1755 | — | — |
| real-react-useid-ru | writing-docs | 3.6 | 834 | да | 1 |
| real-react-useid-ru | technical-writing | 4.6 | 506 | да | 3 |
| real-react-useid-ru | technical-writing-ru | 4.8 | 392 | да | 4 |
| real-react-useid-ru | none | 4.2 | 602 | — | — |
| reference-throttlewick-env | writing-docs | 4.9 | 170 | да | 0 |
| reference-throttlewick-env | technical-writing | 5.0 | 186 | да | 3 |
| reference-throttlewick-env | technical-writing-ru | 5.0 | 187 | да | 2 |
| reference-throttlewick-env | none | 4.4 | 199 | — | — |
| review-explanation-en | writing-docs | 4.6 | 643 | да | 0 |
| review-explanation-en | technical-writing | 4.6 | 362 | да | 4 |
| review-explanation-en | technical-writing-ru | 3.8 | 741 | нет | 0 |
| review-explanation-en | none | 3.6 | 860 | — | — |
| review-readme-ru | writing-docs | 4.7 | 488 | да | 1 |
| review-readme-ru | technical-writing | 4.8 | 323 | да | 3 |
| review-readme-ru | technical-writing-ru | 4.7 | 445 | да | 4 |
| review-readme-ru | none | 4.2 | 895 | — | — |
| runbook-disk-full | writing-docs | 4.8 | 348 | да | 0 |
| runbook-disk-full | technical-writing | 4.6 | 466 | да | 3 |
| runbook-disk-full | technical-writing-ru | 4.6 | 347 | нет | 0 |
| runbook-disk-full | none | 3.8 | 368 | — | — |
| troubleshooting-orbisk-agent | writing-docs | 4.3 | 259 | да | 0 |
| troubleshooting-orbisk-agent | technical-writing | 4.8 | 227 | да | 2 |
| troubleshooting-orbisk-agent | technical-writing-ru | 4.7 | 215 | да | 3 |
| troubleshooting-orbisk-agent | none | 4.1 | 421 | — | — |
| tutorial-lumbrook-first-pipeline | writing-docs | 4.7 | 300 | да | 0 |
| tutorial-lumbrook-first-pipeline | technical-writing | 4.7 | 272 | да | 3 |
| tutorial-lumbrook-first-pipeline | technical-writing-ru | 4.8 | 483 | нет | 0 |
| tutorial-lumbrook-first-pipeline | none | 4.3 | 496 | — | — |

## Отказы в чтении (Read вернул ошибку прав)

- sonnet / writing-docs / real-backstage-adr: 1
- sonnet / writing-docs / real-etcd-postmortem: 1
- sonnet / writing-docs / real-k8s-probes: 2
- sonnet / writing-docs / real-react-effects-ru: 1
- sonnet / writing-docs / real-react-useid-ru: 1
- sonnet / writing-docs / review-explanation-en: 1
- sonnet / writing-docs / review-readme-ru: 1

## Наибольшее расхождение между участниками

| Сценарий | Разброс | Лучший | Худший |
|---|---|---|---|
| ambiguous-devops-onboarding | 2.0 | technical-writing-ru | none |
| postmortem-quenby-index-lock | 1.8 | technical-writing | none |
| real-backstage-adr | 1.7 | technical-writing | writing-docs |
| explanation-tamrisk-cache | 1.4 | technical-writing | none |
| changelog-pellmark-4-0 | 1.4 | writing-docs | none |

## Позиционные расхождения (> 1 балла между проходами)

| Модель | Сценарий | Участник | Критерии (проход 1/проход 2) |
|---|---|---|---|
| sonnet | real-etcd-postmortem | technical-writing-ru | accuracy 2/4 |
| sonnet | real-react-effects-ru | writing-docs | accuracy 2/4 |
| sonnet | troubleshooting-orbisk-agent | none | accuracy 2/4 |
| haiku | cli-help-errors-vendle | technical-writing | answer_first 2/4 |

## Компактность (слов в документе)

| Модель | Участник | Медиана | Среднее | Медиана / writing-docs |
|---|---|---|---|---|
| sonnet | writing-docs | 384.5 | 615.2 | 1.00 |
| sonnet | technical-writing | 307.5 | 398.6 | 0.80 |
| sonnet | technical-writing-ru | 407 | 531.6 | 1.06 |
| sonnet | none | 498.5 | 800.2 | 1.30 |
| haiku | writing-docs | 385 | 531.6 | 1.00 |
| haiku | technical-writing | 357 | 551.2 | 0.93 |
| haiku | technical-writing-ru | 264.5 | 493.4 | 0.69 |
| haiku | none | 340.5 | 553.6 | 0.88 |
| opus | writing-docs | 577 | 788.4 | 1.00 |
| opus | technical-writing | 287 | 351.9 | 0.50 |
| opus | technical-writing-ru | 299 | 464.2 | 0.52 |
| opus | none | 603 | 766.9 | 1.05 |

## Упавшие вызовы

нет

## Слепой вердикт владельца

Пары «writing-docs против нового скилла» лежат в `pairs/`, бланк — `verdict.md`. Отчёт не называет, какая метка у какого участника; это покажет `python3 evals/run.py --reveal --date 2026-09-29`.
