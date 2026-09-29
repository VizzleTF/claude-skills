---
title: Kube Pod Crashing Loop
weight: 20
---

# KubePodCrashLooping

## Impact and urgency

A container in the pod keeps dying and Kubernetes keeps restarting it. Expect a degraded or unavailable service, blocked rolling upgrades, and apps that skip required work such as data migrations.

Urgency: `<SEVERITY_AND_RESPONSE_TIME>`.

Take `<NAMESPACE>`, `<POD_NAME>` and `<CONTAINER>` from the alert labels `namespace`, `pod` and `container`. Take `<DEPLOYMENT>` from the pod name without its last two dash-separated parts (for example, `web-7d9f8c6b5-x2x4z` gives `web`).

## Diagnosis

1. Confirm the crash loop.

   ```bash
   kubectl -n <NAMESPACE> get pod <POD_NAME>
   ```

   Yes: `STATUS` is `CrashLoopBackOff` or `Error`, and `RESTARTS` keeps growing.

2. Read the logs of the previous, crashed container.

   ```bash
   kubectl -n <NAMESPACE> logs <POD_NAME> -c <CONTAINER> --previous
   ```

   Yes: the last lines show why the app exited. Match them against the table below.

3. Read the container's last exit state and the pod events.

   ```bash
   kubectl -n <NAMESPACE> describe pod <POD_NAME>
   ```

   Yes: `Last State: Terminated` gives a `Reason` and `Exit Code`, and `Events` lists failures. Match them against the table below.

4. Read the settings that most often cause the loop: priority, resources, probes, security context, working directory and volumes.

   ```bash
   kubectl -n <NAMESPACE> get pod <POD_NAME> -o yaml
   ```

   Yes: a value in `priorityClassName`, `resources`, `livenessProbe`, `readinessProbe`, `securityContext`, `workingDir` or `volumes` matches a row below.

| What you see | Cause | What to change |
|---|---|---|
| `Reason: OOMKilled`, or the app is extremely slow | Memory or CPU limit too low | Raise `resources.limits` |
| Events `Liveness probe failed` or `Readiness probe failed` | Wrong port or command, or timeout too short | Fix the probe |
| Pod requests a resource few nodes have, such as a GPU | Not enough suitable nodes | Fix `resources.requests` or add nodes |
| Events `MountVolume.SetUp failed` or `configmap ... not found` | Missing ConfigMap, Secret or volume | Create the object or fix the reference |
| Log `Read-only file system` | Read-only filesystem | Mount a writable volume |
| Log `Permission denied` | Wrong user or missing container capability | Fix `securityContext` |
| Log shows connection errors to a database or another service | App starts before its dependency | Restore the dependency, or wait for it |
| Log shows a configuration error right at startup | Misconfiguration | Fix the app config |
| Log shows files not found | App runs in an unexpected directory (for example, `WORKDIR` from the Dockerfile is ignored in OpenShift) | Set `workingDir` |

## Actions

1. If the loop began after a deploy, roll the Deployment back. Save its current state first.

   ```bash
   kubectl -n <NAMESPACE> get deployment <DEPLOYMENT> -o yaml > <DEPLOYMENT>-backup.yaml
   kubectl -n <NAMESPACE> rollout undo deployment/<DEPLOYMENT>
   ```

   Check:

   ```bash
   kubectl -n <NAMESPACE> rollout status deployment/<DEPLOYMENT> --timeout=120s
   ```

   Expected: `deployment "<DEPLOYMENT>" successfully rolled out`.

   Rollback: run the `rollout undo` command again to return to the revision you left.

2. If a rollback doesn't apply or doesn't help, fix the cause from the table through `<DEPLOY_PROCESS>`.

   Check:

   ```bash
   kubectl -n <NAMESPACE> get pods | grep <DEPLOYMENT>
   ```

   Expected: `READY` is `n/n`, `STATUS` is `Running`, and `RESTARTS` doesn't grow for `<STABLE_PERIOD>`.

   Rollback: revert the change through `<DEPLOY_PROCESS>`.

3. If you can't identify the cause, escalate to the app owner (see Escalation).

## Final check

The pods from step 2 of Actions stay `Running` with stable `RESTARTS` for `<STABLE_PERIOD>`, and the alert resolves in `<ALERTING_SYSTEM>`.

## Escalation

Escalate if the alert is still firing `<ESCALATION_DELAY>` after you start, or if you can't find the cause.

- App owner (config, code, probes): `<APP_OWNER_CONTACT>` via `<HOW_TO_REACH_APP_OWNER>`.
- Cluster problems (nodes, GPU capacity, scheduling): `<PLATFORM_ONCALL_CONTACT>` via `<HOW_TO_REACH_PLATFORM_ONCALL>`.

Last verified: `<DATE>` by `<NAME>`

---

Questions to fill the placeholders:
1. What are the alert's severity and response time, the escalation delay, and the contacts and channels for the app owner and platform on-call?
2. How do you deploy manifest changes (`<DEPLOY_PROCESS>`)? If a GitOps controller manages the Deployments, Action 1 (`kubectl rollout undo`) may be reverted, so it needs changing.
3. Do your alerts carry the `namespace`, `pod` and `container` labels, and how long must a pod stay stable before you consider it fixed (`<STABLE_PERIOD>`)?
