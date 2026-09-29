# NodeDiskUsageHigh Runbook

**Use this if:** The NodeDiskUsageHigh alert woke you up.

**What it means:** A node in the ingest pool has less than 15% free disk space and has stayed there for 10 minutes. At 5% free (95% full), a separate critical alert fires and pages.

**You need:** kubectl access, 15 minutes.

---

## Get shell access to the node

The alert name tells you which node. Extract it — e.g., from `node-ingest-12` in the alert title.

```sh
kubectl debug node/node-ingest-12 -it --image=busybox:1.36
```

You are now in a debug container. The node's filesystem is at `/host`.

---

## Check what is using space

```sh
df -h /host
```

This tells you how full the root filesystem is. If it's below 75%, the alert will likely resolve on its own soon; skip to Verify below.

If it's still above 85%, find what is taking space:

```sh
du -sh /host/var/log/pods/* | sort -h | tail
```

This shows the largest log directories. Container logs that stopped rotating are the most common culprit.

---

## Clean up space

Run both steps. They address the two main causes and do not conflict.

**Remove unused container images:**
```sh
chroot /host crictl rmi --prune
```

**Restart the Grainline pod to fix log rotation:**
```sh
kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=node-ingest-12
```

Replace `node-ingest-12` with the actual node name.

---

## Verify the fix worked

Wait 15 minutes. Disk usage should drop below 75% and stay there.

Check progress:
```sh
df -h /host
```

If you see it dropping, you are done. The alert will resolve automatically.

---

## If the Grainline pod does not restart

After you delete the pod, it should come back to Running within 5 minutes. Check:

```sh
kubectl -n grainline get pods --field-selector spec.nodeName=node-ingest-12
```

If the pod is stuck in a failed state after 5 minutes, cordon the node to stop new work landing on it:

```sh
kubectl cordon node-ingest-12
```

Then go to step Escalate below.

---

## If disk usage is still above 90%

After image cleanup and pod restart, usage should drop. If it stays above 90% after 15 minutes:

1. Post in `#platform-oncall` with the node name and your disk usage numbers (`df -h /host` output).
2. Include the output of `du -sh /host/var/log/pods/* | sort -h | tail` so they can see what is consuming space.
3. Include your timestamp and actions taken.

They own the underlying node and storage issues.

---

## Context

- **Last tested:** 2026-09-15
- **Grainline:** our log collector running on ingest nodes
- **Common root causes:** broken log rotation in container runtimes, old container images not cleaned up
- **Node pool:** only affects the ingest node pool, not others
