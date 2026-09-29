# KubePodCrashLooping

Alert `KubePodCrashLooping`: a container in the pod keeps dying, and Kubernetes keeps restarting it.

Get `<NAMESPACE>`, `<POD_NAME>` and `<CONTAINER>` from the alert labels `namespace`, `pod` and `container`.

## Impact and urgency

- The service is degraded or down. Rolling upgrades of this workload cannot finish. Apps that run tasks on start, such as data migrations, do not run them.
- Urgency: `<URGENCY_AND_TARGET_RESPONSE_TIME>`
- How to tell whether the affected service is user-facing: `<HOW_TO_FIND_SERVICE_OWNER_AND_TIER>`

## Diagnosis

Run these in order. Stop at the first check that matches.

```bash
kubectl -n <NAMESPACE> get pod <POD_NAME>
kubectl -n <NAMESPACE> describe pod <POD_NAME>
kubectl -n <NAMESPACE> logs <POD_NAME> -c <CONTAINER> --previous
```

| Where | You see | Cause | Go to |
|---|---|---|---|
| `get pod`, `STATUS` | `CrashLoopBackOff` | Alert confirmed | Continue below |
| `describe pod`, `Last State` | `Reason: OOMKilled` | Memory limit too low | Step 2 |
| `describe pod`, Events | `Liveness probe failed` or `Readiness probe failed` | Probe has the wrong port or command, or its timeout is too short | Step 3 |
| `describe pod`, Events | `FailedScheduling`, `Insufficient <RESOURCE>` (for example a GPU) | The pod requests a resource few nodes have | Step 3 |
| `describe pod`, Events | `FailedMount`, or `configmap "<NAME>" not found` | A ConfigMap, Secret or volume is missing | Step 3 |
| `logs --previous` | Error text, or a connection error to a database or another service | The app is misconfigured, or a dependency is down | Step 3 |
| Any of the above, and a rollout started shortly before the alert | Same output | A bad release | Step 1 |

Other causes to look for in the logs and pod spec: not enough CPU at start, a read-only filesystem, wrong user permissions, missing `securityContext` capabilities, a wrong working directory (OpenShift ignores `WORKDIR` from the Dockerfile).

## Actions

These steps assume the pod belongs to a Deployment. Get `<DEPLOYMENT>` from `kubectl -n <NAMESPACE> get deployment`.

1. **Roll back a bad release.**

   Capture the state:

   ```bash
   kubectl -n <NAMESPACE> get deployment <DEPLOYMENT> -o yaml > deployment-before.yaml
   kubectl -n <NAMESPACE> rollout history deployment/<DEPLOYMENT>
   ```

   Roll back:

   ```bash
   kubectl -n <NAMESPACE> rollout undo deployment/<DEPLOYMENT>
   ```

   Verify. Expected output: `deployment "<DEPLOYMENT>" successfully rolled out`.

   ```bash
   kubectl -n <NAMESPACE> rollout status deployment/<DEPLOYMENT>
   ```

   Rollback: run `kubectl -n <NAMESPACE> rollout undo deployment/<DEPLOYMENT>` again.

2. **Raise the memory limit** (only for `OOMKilled`).

   Read the current limit from `deployment-before.yaml`, or:

   ```bash
   kubectl -n <NAMESPACE> get deployment <DEPLOYMENT> -o jsonpath='{.spec.template.spec.containers[?(@.name=="<CONTAINER>")].resources.limits.memory}'
   ```

   Raise it:

   ```bash
   kubectl -n <NAMESPACE> set resources deployment/<DEPLOYMENT> -c <CONTAINER> --limits=memory=<NEW_MEMORY_LIMIT>
   ```

   `<NEW_MEMORY_LIMIT>`: `<HOW_TO_CHOOSE_NEW_LIMIT>`

   Verify. Expected: `RESTARTS` stops rising and `STATUS` is `Running`.

   ```bash
   kubectl -n <NAMESPACE> get pods -w
   ```

   Rollback:

   ```bash
   kubectl -n <NAMESPACE> set resources deployment/<DEPLOYMENT> -c <CONTAINER> --limits=memory=<OLD_MEMORY_LIMIT>
   ```

3. **Any other cause: escalate to the app owner.** Do not edit probes, config or secrets yourself.

   Send them the output of the three diagnosis commands. Find the owner as described in "Impact and urgency". `<APPROVED_FIXES_FOR_PROBES_CONFIG_AND_MOUNTS>`

   Verify: the owner confirms they have the output.

## Confirm the alert has cleared

Expected: `STATUS` is `Running`, and `RESTARTS` is the same on both runs, 10 minutes apart.

```bash
kubectl -n <NAMESPACE> get pod -l <POD_LABEL_SELECTOR>
```

Then confirm `KubePodCrashLooping` for this pod no longer fires in `<ALERTING_SYSTEM_URL_OR_NAME>`.

## Escalation

- Page `<TEAM_OR_ROLE>` via `<PAGING_TOOL_OR_CHANNEL>` if the pod still crash-loops `<MINUTES>` minutes after step 1 or 2, or immediately for cause 3.
- If they do not answer within `<MINUTES>` minutes: `<SECOND_CONTACT>`.

More on debugging pods: https://kubernetes.io/docs/tasks/debug-application-cluster/debug-application/#debugging-pods

Last verified: `<DATE>` by `<NAME>`

---

Questions to fill the gaps:
1. What is the urgency, and who owns each service (`<URGENCY_AND_TARGET_RESPONSE_TIME>`, `<HOW_TO_FIND_SERVICE_OWNER_AND_TIER>`)?
2. Who is paged, through which tool, and after how many minutes (`<TEAM_OR_ROLE>`, `<PAGING_TOOL_OR_CHANNEL>`, `<MINUTES>`, `<SECOND_CONTACT>`)?
3. How do you choose the new memory limit, and which fixes may on-call apply for probes, config and mounts (`<HOW_TO_CHOOSE_NEW_LIMIT>`, `<APPROVED_FIXES_FOR_PROBES_CONFIG_AND_MOUNTS>`)?
