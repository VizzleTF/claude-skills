The reworked runbook is below. I wrote it from the source only and didn't run any of the commands against a cluster.

I fixed the source's "Check template" step, which was really a status check, and its "Docerkfile" typo. I also added `--previous` to the logs command, because the current container has usually just restarted and has no useful logs. Everything the source didn't cover is marked `[GAP: …]` and indexed at the end. That covers severity, contacts, deploy process and escalation timing. I invented no team names or channels.

````markdown
---
title: Kube Pod Crash Looping
weight: 20
---

# KubePodCrashLooping

A container in a pod keeps crashing and Kubernetes keeps restarting it. Use this page to find the cause, restore the pod, and confirm it is stable.

- **Severity and expected response time:** [GAP: copy from the alert rule / paging policy]
- **Meaning:** the app dies or hangs and Kubernetes restarts it. Between restarts Kubernetes waits longer each time, up to 5 minutes, so a fix can take several minutes to show.
- **Impact:** service degradation or outage, rolling upgrades blocked, and apps that must run tasks such as data migrations do not run them.

## 1. Set variables

Take the values from the alert labels (`namespace`, `pod`, `container`), then paste:

```sh
export NAMESPACE=<namespace>
export POD=<pod>
export CONTAINER=<container>
```

## 2. Check first: why is the container dying?

Run these in order.

```sh
# Status, restart count, and how the last run ended (reason and exit code)
kubectl -n $NAMESPACE get pod $POD -o wide
kubectl -n $NAMESPACE get pod $POD -o jsonpath='{range .status.containerStatuses[*]}{.name}{"\t"}restarts={.restartCount}{"\t"}{.state.waiting.reason}{"\t"}last={.lastState.terminated.reason}{"\t"}exit={.lastState.terminated.exitCode}{"\n"}{end}'

# Events (probe failures, missing volumes, scheduling problems). Read "Last State" and "Events".
kubectl -n $NAMESPACE describe pod $POD

# Logs of the crashed run (not the one that just restarted)
kubectl -n $NAMESPACE logs $POD -c $CONTAINER --previous --tail=100
```

If the container is an init container, it is listed under `initContainerStatuses` instead. Replace `containerStatuses` in the second command with `initContainerStatuses`.

Exit codes:

| Exit code | Usually means |
|---|---|
| 1 | App error. Read the logs. |
| 137 | Killed (SIGKILL). With reason `OOMKilled`, out of memory. |
| 143 | Stopped (SIGTERM). Often a failed liveness probe. |

## 3. Match what you see to a cause

| What you see | Likely cause | What to do |
|---|---|---|
| Reason `OOMKilled`, exit 137 | Memory limit too low, or a leak | Check usage with `kubectl -n $NAMESPACE top pod $POD --containers` (needs metrics-server). Raise the limit (section 4). |
| Events: `Liveness probe failed` or `Startup probe failed` | Wrong probe port or command. Timeout too short. App slow to start. | Compare the probe with what the app listens on: `kubectl -n $NAMESPACE get pod $POD -o yaml` (`livenessProbe`, `startupProbe`). Raise `timeoutSeconds` or `initialDelaySeconds`, or add a `startupProbe`. A failing readiness probe alone does not restart the container. |
| Logs: connection refused or timeouts to another service (database, etc.) | App exits when a dependency is not ready | Check that dependency's pods and service. The crash usually stops once it is healthy. |
| Events or logs: missing ConfigMap, Secret or volume | Referenced config or volume does not exist | List what exists with `kubectl -n $NAMESPACE get configmap,secret,pvc`, then create or restore the missing item. |
| Logs: `Read-only file system` or `permission denied` | Read-only filesystem, wrong container user, or missing capability in `securityContext` | Check `securityContext` and volume mounts in `kubectl -n $NAMESPACE get pod $POD -o yaml`. |
| Logs: `no such file or directory` for the entrypoint or a relative path | App runs in a different directory than expected (OpenShift ignores the Dockerfile `WORKDIR`) | Set `workingDir` in the pod spec. |
| Logs: stack trace or config error at startup, crashes began after a recent change | Misconfiguration | Roll back (section 4), then fix the config. |
| Logs empty or app very slow at start | Not enough CPU or memory at startup | Check `resources` in the pod spec and `kubectl -n $NAMESPACE top pod $POD --containers`. |
| App needs a scarce resource, for example a GPU | No suitable node, or requests exceed what nodes offer | Compare `resources` and `nodeSelector` with `kubectl describe node <node>`. |

Nothing matches: read the whole log and `describe` output again, then escalate (section 6).

Per-service notes (safe defaults, known startup failures): [GAP: link to where per-service docs or owners live].

## 4. Fix or mitigate

Deleting the pod does not fix a crash loop. The replacement crashes the same way.

Who may change production, and how (GitOps, CI pipeline, direct `kubectl`): [GAP: state the approval rule and the deploy path]. If a GitOps tool manages the workload, a direct `kubectl` change may be reverted.

**Crashes started after a deploy: roll back.**

```sh
# Find the owner. Output looks like ReplicaSet/my-app-7d9c8b6f5; the workload is deployment/my-app.
kubectl -n $NAMESPACE get pod $POD -o jsonpath='{.metadata.ownerReferences[0].kind}/{.metadata.ownerReferences[0].name}{"\n"}'

export WORKLOAD=deployment/<name>      # or statefulset/<name>, daemonset/<name>
kubectl -n $NAMESPACE rollout history $WORKLOAD
kubectl -n $NAMESPACE rollout undo $WORKLOAD
```

**`OOMKilled`: raise the memory limit** (this triggers a rollout; pick a value the nodes can hold):

```sh
kubectl -n $NAMESPACE set resources $WORKLOAD -c $CONTAINER --limits=memory=<new-limit>
```

Then make the same change in the source manifest so the next deploy keeps it.

**Any other cause:** apply the fix from the table through the normal deploy path. If the fix needs app knowledge, escalate to the service owner.

## 5. Confirm it worked

```sh
kubectl -n $NAMESPACE get pods -w
```

Success looks like this, and `RESTARTS` stops increasing:

```
NAME             READY   STATUS    RESTARTS   AGE
my-app-6f7d-x2   1/1     Running   0          4m
```

- Wait through at least one full restart back-off (up to 5 minutes) before calling it fixed.
- A rollout creates a new pod name. Check the new pod, not the old one.
- Keep watching for [GAP: how long, for example the alert's `for` duration].
- Confirm the alert has resolved: [GAP: where to check, such as the alerting UI link].

## 6. Escalate

Escalate if any of these is true:

- You cannot identify the cause after section 3.
- The fix needs a change you are not allowed to make.
- Several pods or namespaces are crash looping at once, which points to a cluster or shared-dependency problem.
- Users are affected and the pod is not recovering after [GAP: time limit before escalating].

| Who | When | How to reach them |
|---|---|---|
| Service owner (team that owns the namespace) | Cause is app-specific | [GAP: how to look up the owner, and how to page them] |
| Platform / cluster team | Multi-namespace crash loops, node or cluster problems | [GAP: team and paging route] |
| Secondary on-call | You are stuck or need a second person | [GAP: rotation and contact] |
| Incident channel or process | Customer-visible impact | [GAP: channel or tool, and when to declare an incident] |

When you hand off, include: namespace, pod, container, exit code and reason, the last 20 log lines, and what you already tried.

## References

- [Debugging Pods](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-application/#debugging-pods)

## Gaps to fill

Search this page for `[GAP:` to find each one.

1. Alert severity and expected response time.
2. Link to per-service docs or owners.
3. Approval rule and deploy path for production changes.
4. How long to watch after a fix, and where to confirm the alert resolved.
5. Time limit before escalating.
6. Contacts: service owner lookup, platform team, secondary on-call, incident channel.
````
