# Runbook: NodeDiskUsageHigh

**Severity:** warning (does not page)
**Last checked:** 2026-09-15

## What this alert means

The root filesystem on a Kubernetes node has been above 85% full for 10 minutes. It happens on nodes in the **ingest** node pool. Those nodes run **Grainline**, our log collector.

This alert does not need action within seconds, but don't leave it for the morning. If the disk reaches 95%, a separate alert, **NodeDiskUsageCritical**, fires and pages.

**Usual cause:** Container logs under `/var/log/pods` keep growing because log rotation has broken. Restarting Grainline on the node fixes this.
**Less common cause:** Old container images are taking up space. Pruning them fixes this.

## Before you start

Find the node name in the alert. It is `<NODE>` in every command below.

---

## Step 1: Open a shell on the node

```sh
kubectl debug node/<NODE> -it --image=busybox:1.36
```

Inside this shell, the node's filesystem is mounted at `/host`. Keep the shell open, because Step 3 uses it.

## Step 2: Find what is using the space

Check overall usage:

```sh
df -h /host
```

Check which pods' logs are largest:

```sh
du -sh /host/var/log/pods/* | sort -h | tail
```

- **A few pod log directories are very large (often gigabytes):** log rotation is broken. Go to **Step 3A**.
- **Nothing in `/var/log/pods` is large:** old images are the likely cause. Go to **Step 3B**.

## Step 3A: Fix broken log rotation by restarting Grainline

Run this from your normal terminal, not the debug shell:

```sh
kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
```

Watch for the replacement pod to reach `Running`:

```sh
kubectl -n grainline get pod -l app=grainline --field-selector spec.nodeName=<NODE> -w
```

**If the pod is not `Running` within 5 minutes**, cordon the node so that no new pods are scheduled onto it:

```sh
kubectl cordon <NODE>
```

Then go to Step 4.

## Step 3B: Remove unused container images

In the debug shell from Step 1:

```sh
chroot /host crictl rmi --prune
```

This removes only images that no container is using. Then go to Step 4.

## Step 4: Check that it worked

Wait up to **15 minutes** and watch usage in the debug shell:

```sh
df -h /host
```

**The fix worked when** usage is **below 75%** and the alert has resolved.

- **Usage is still at or above 75% after 15 minutes:** do the step you skipped (3A or 3B), then check again.
- **Usage is still above 90% after both 3A and 3B:** go to Step 5.

When you're done, exit the debug shell (`exit`). Leaving the shell does not delete the debug pod. Find it with `kubectl get pods | grep node-debugger` and delete it.

## Step 5: Escalate

If usage is **still above 90%** after all the steps above, post in **#platform-oncall** and include:

- The node name
- The current `df -h /host` output
- The `du` output from Step 2
- What you tried, and whether you cordoned the node

---

## Quick reference

| Situation | Action |
|---|---|
| Large directories in `/var/log/pods` | Restart Grainline on the node (3A) |
| Logs are small | `chroot /host crictl rmi --prune` (3B) |
| Grainline pod not `Running` after 5 min | `kubectl cordon <NODE>` |
| Below 75% and alert resolved | Done |
| Still above 90% after 3A and 3B | Escalate in #platform-oncall |

---

A few gaps in the runbook you should fill in yourself:

- **Where the node name appears in the alert.** I didn't know the label name, so the runbook just says to find the node name in the alert. Put in the exact label if you have it.
- **What to do after cordoning.** Your notes only say to cordon if Grainline doesn't come back. I didn't make up a next step. The engineer carries on to the check in Step 4 and mentions the cordon if they escalate. Add an uncordon or follow-up step if you have one.
- **Choosing a fix.** Your notes list both fixes. I made the choice depend on the `du` output and added "try the other one if the first doesn't work," so the escalation rule ("after all of this") still applies.
- **The debug pod cleanup.** This is my addition, not something from your walkthrough. `kubectl debug node/...` leaves a pod behind after you exit the shell, so the runbook tells the engineer to delete it.
