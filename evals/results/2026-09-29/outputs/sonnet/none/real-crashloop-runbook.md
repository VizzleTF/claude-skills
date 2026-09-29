---
title: Kube Pod Crash Looping
weight: 20
---

# KubePodCrashLooping

> **How to read this runbook.** Anything marked **`TODO(team)`** is information the public source runbook does not provide and we must fill in before this is production-ready. Do not guess at these at 3 a.m. If a TODO is still unfilled, use the fallback written next to it.

## Meaning

A container in the pod keeps dying, or stops responding and is killed. Kubernetes restarts it automatically, and each restart waits longer than the last (back-off, capped at 5 minutes). The pod shows `CrashLoopBackOff`.

## Impact

- Service degradation or unavailability.
- Rolling upgrades cannot complete.
- Some apps will not perform required tasks, such as data migrations.

`TODO(team)`: severity and response-time target for this alert, and how to tell whether customers are affected. Fallback: treat it as customer-impacting if the pod is part of a serving path and no healthy replica remains.

## Set up your shell (30 seconds)

Fill in the values from the alert labels, then paste the block. Every command below uses these variables.

```bash
export NAMESPACE=<namespace-from-alert>
export POD=<pod-from-alert>
export CONTAINER=<container-from-alert>
export WORKLOAD=<kind/name, e.g. deployment/my-app>   # owner of the pod

kubectl config current-context   # confirm this is the cluster named in the alert
```

`TODO(team)`: how to get access to the right cluster/context (login command, VPN, bastion), and the alert label names that carry the namespace, pod and container.

If you don't know `$WORKLOAD`, find it with:

```bash
kubectl -n $NAMESPACE get pod $POD -o jsonpath='{.metadata.ownerReferences[0].kind}/{.metadata.ownerReferences[0].name}{"\n"}'
```

A `ReplicaSet/...` result means a Deployment owns it. Run `kubectl -n $NAMESPACE get deploy` to find the Deployment.

## Triage: what to check first

Work through these in order. Stop at the first step that gives you a cause, then go to **Actions**.

### 1. How widespread is it?

```bash
# Just this pod, or many?
kubectl -n $NAMESPACE get pods -o wide

# Anywhere else in the cluster?
kubectl get pods -A | grep CrashLoopBackOff
```

- **One pod or one workload:** an app or config problem. Continue below.
- **Many workloads or namespaces at once:** likely a cluster or node problem, or a shared dependency. Go to **Escalation** now.

### 2. Why did the container die?

```bash
kubectl -n $NAMESPACE get pod $POD
kubectl -n $NAMESPACE describe pod $POD
```

In the `describe` output, read **Last State**, **Reason**, **Exit Code** and the **Events** at the bottom.

For a compact view of the same information:

```bash
kubectl -n $NAMESPACE get pod $POD -o jsonpath='{range .status.containerStatuses[*]}{.name}{"\trestarts="}{.restartCount}{"\treason="}{.lastState.terminated.reason}{"\texit="}{.lastState.terminated.exitCode}{"\n"}{end}'
kubectl -n $NAMESPACE get events --field-selector involvedObject.name=$POD --sort-by=.lastTimestamp
```

Common readings:

| You see | Likely cause | Go to |
|---|---|---|
| `OOMKilled`, exit code `137` | Memory limit too low | Action B |
| Exit code `1` or another app error, logs show a stack trace or config error | Misconfiguration or app bug | Actions A, D |
| Events say `configmap "..." not found` or `secret "..." not found`, or `CreateContainerConfigError` | Missing ConfigMap, Secret or volume | Action D |
| `Liveness probe failed` in events, exit code `143` or `137` | Probe wrong or too strict, or app too slow | Action E |
| Logs show connection refused or timeout to a database or another service | Dependency down or not ready | Action C |
| Logs show `permission denied` or `read-only file system` | Container user, filesystem or securityContext problem | Escalate to app owner |
| Exit code `126` or `127`, or "no such file or directory" for the entrypoint | Wrong command, or working directory differs from what the app expects | Escalate to app owner |

### 3. Read the logs of the crashed run

The current container may have just restarted and have empty logs. Always read the previous run as well:

```bash
kubectl -n $NAMESPACE logs $POD -c $CONTAINER --previous --tail=100
kubectl -n $NAMESPACE logs $POD -c $CONTAINER --tail=100
```

If the crashing container is an init container, use its name as `$CONTAINER`. List all container names with `kubectl -n $NAMESPACE get pod $POD -o jsonpath='{.spec.initContainers[*].name} {.spec.containers[*].name}{"\n"}'`.

`TODO(team)`: where centralized logs live (tool and link) for when the pod's own logs have rotated away.

### 4. Did something change recently?

```bash
kubectl -n $NAMESPACE rollout history $WORKLOAD
```

If the crash started right after a deploy or config change, rolling back is usually the fastest fix (Action A).

`TODO(team)`: where to see recent deploys and config changes (CD tool, GitOps repo, change log).

### 5. Check the pod spec (if the cause is still unclear)

```bash
# Resource requests and limits (does it request something the nodes don't have, such as a GPU?)
kubectl -n $NAMESPACE get pod $POD -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.resources}{"\n"}{end}'

# Probes (wrong port or command? timeout too short?)
kubectl -n $NAMESPACE get pod $POD -o jsonpath='{range .spec.containers[*]}{.name}{"\nliveness:  "}{.livenessProbe}{"\nreadiness: "}{.readinessProbe}{"\nstartup:   "}{.startupProbe}{"\n"}{end}'

# Live usage and node capacity (top needs metrics-server)
kubectl -n $NAMESPACE top pod $POD --containers
NODE=$(kubectl -n $NAMESPACE get pod $POD -o jsonpath='{.spec.nodeName}'); kubectl describe node $NODE | grep -A10 'Allocated resources'
```

Also check, using the logs and spec above:

- The app is very slow because memory is too low, or because it needs more CPU at startup than it has.
- The app waits for another service (such as a database) that is not up.
- Misconfiguration makes the app crash on start.
- Files it needs are missing: ConfigMaps, Secrets or volumes.
- The filesystem is read-only.
- The container user lacks permissions.
- The container lacks required capabilities (`securityContext`).
- The app runs in a different directory than expected (for example, the Dockerfile `WORKDIR` is not honored on OpenShift).

## Actions

Pick the action that matches your finding. Before changing anything, check whether this workload is managed by GitOps or a CD pipeline. A direct `kubectl` change may be reverted on the next sync.

`TODO(team)`: what on-call is allowed to do without approval (rollback, restart, resource changes, scaling), and how changes must be made (direct `kubectl` versus a pull request or CD pipeline). Fallback: do the read-only steps above, then escalate before changing anything.

### A. Recent deploy or config change: roll back

```bash
kubectl -n $NAMESPACE rollout undo $WORKLOAD
kubectl -n $NAMESPACE rollout status $WORKLOAD --timeout=5m
```

`TODO(team)`: our real rollback procedure if it is not `kubectl rollout undo` (CD tool, GitOps revert).

### B. OOMKilled: raise the memory limit

```bash
kubectl -n $NAMESPACE set resources $WORKLOAD -c $CONTAINER --limits=memory=<NEW_LIMIT>
```

This triggers a new rollout. `TODO(team)`: how much headroom on-call may add (a maximum value or a multiple of the current limit), and who to tell afterwards so the change is made permanent in the source manifests.

### C. Dependency down (database or other service)

Fix or escalate the dependency. The pod usually recovers by itself once the dependency is back. To skip the remaining back-off wait once the dependency is healthy:

```bash
kubectl -n $NAMESPACE delete pod $POD
```

The controller recreates the pod and resets the back-off timer. Deleting the pod does not fix a crash that has a deterministic cause.

`TODO(team)`: dependency owners and their on-call contacts.

### D. Missing ConfigMap, Secret or volume, or bad config

Confirm what exists:

```bash
kubectl -n $NAMESPACE get configmap,secret,pvc
```

Restore or create the missing object through our normal process, then delete the pod as in Action C to pick it up.

`TODO(team)`: where config and secrets come from (secret manager, GitOps repo), and who may change them.

### E. Probes failing

Confirm from events and the probe settings (triage step 5). If the probe uses the wrong port or command, or its timeout is too short for how long the app takes to respond, fix the probe in the workload's source manifest. Roll back (Action A) if the probe change came from a recent deploy.

### F. Anything else, or you are unsure

Talk with the developers who own the app or read its documentation. Make sure the app has sane default values so it can start. Escalate using the section below.

## Confirm it worked

Run this and watch for **at least 10 minutes**. The back-off between restarts can reach 5 minutes, so a shorter check can miss the next crash.

```bash
kubectl -n $NAMESPACE get pods -w
```

The fix has worked when all of these hold:

- [ ] The pod is `Running` with all containers ready (for example `1/1`).
- [ ] The `RESTARTS` count has stopped increasing.
- [ ] No new `Warning` events: `kubectl -n $NAMESPACE get events --sort-by=.lastTimestamp | tail -20`
- [ ] For a rollout: `kubectl -n $NAMESPACE rollout status $WORKLOAD` reports success.
- [ ] The `KubePodCrashLooping` alert has resolved. `TODO(team)`: where to check alert state (Alertmanager or dashboard link).
- [ ] The service works end to end. `TODO(team)`: health check or dashboard link for this service.

If the pod is still restarting after your action, do not keep retrying the same fix. Escalate.

## Escalation: who to call

Escalate immediately if any of these is true:

- Many workloads or namespaces are crash looping, or the problem looks like a node or cluster issue.
- Customer impact is ongoing and you have no identified cause.
- The cause is outside your reach: a dependency, secrets, or cluster access you lack.
- The fix needs a change you are not allowed to make.
- `TODO(team)`: time limit before escalating (for example, "no progress after N minutes").

| Situation | Contact |
|---|---|
| Application owners (who owns this service?) | `TODO(team)`: team name, on-call rotation or paging target, chat channel |
| Platform / cluster / node problems | `TODO(team)`: team name, paging target, chat channel |
| Dependency owners (database, message queue, etc.) | `TODO(team)`: team name, paging target, chat channel |
| Incident commander / management escalation | `TODO(team)`: paging target |
| Incident declaration and status updates | `TODO(team)`: process, tool and channel |

`TODO(team)`: a way to look up the owner of any namespace or service (for example, an ownership label on the namespace, a service catalog, or a table here).

When you escalate, include the following so the next person doesn't start from zero:

- The alert name, cluster, `$NAMESPACE`, `$POD` and `$CONTAINER`.
- The `Reason` and `Exit Code` from triage step 2.
- The last lines of `logs --previous`.
- Any recent change you found.
- What you already tried.

## Gaps to fill in (checklist for the team)

- [ ] Severity, response-time target, and how to judge customer impact
- [ ] Cluster access and context instructions; alert label names
- [ ] Centralized logging link
- [ ] Deploy, config-change and GitOps/CD links; real rollback procedure
- [ ] What on-call may change without approval; how changes must be made
- [ ] Memory-limit headroom rule for OOMKilled
- [ ] Config and secret sources and owners
- [ ] Alert-state and service health dashboards
- [ ] Escalation time limit; all contacts in the table above; namespace-to-owner lookup
- [ ] Incident declaration process

## Reference

See [Debugging Pods](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-application/#debugging-pods) in the Kubernetes documentation.
