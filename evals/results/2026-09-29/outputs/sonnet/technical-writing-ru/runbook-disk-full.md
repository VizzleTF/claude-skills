# NodeDiskUsageHigh

**Last walked through:** 2026-09-15

## What this alert means

The root filesystem on a node has been above 85% for 10 minutes. Severity is warning, so nothing is broken yet. At 95%, NodeDiskUsageCritical fires and pages, so fix this before then.

The alert fires on nodes in the ingest node pool. Those nodes run Grainline, our log collector.

Usually, container logs under `/var/log/pods` are growing because log rotation broke. Less often, old container images are filling the disk.

## 1. Get a shell on the node

The alert names the node. Use that name as `<NODE>` in every command below.

```
kubectl debug node/<NODE> -it --image=busybox:1.36
```

The node's filesystem is at `/host` inside this shell.

## 2. Look at the disk

```
df -h /host
du -sh /host/var/log/pods/* | sort -h | tail
```

- If a few directories under `/var/log/pods` are huge, the cause is broken log rotation. Go to step 3b (restart Grainline). Also do step 3a if you want the extra space.
- If `/var/log/pods` is small, the cause is probably old images. Do step 3a.

## 3. Fix

**a. Remove unused images.** Run this in the debug shell:

```
chroot /host crictl rmi --prune
```

**b. Restart Grainline on that node.** This fixes the rotation. Run it from your own terminal, not the debug shell:

```
kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
```

## 4. Check that it worked

Within 15 minutes:

- `df -h /host` shows usage **below 75%**.
- The NodeDiskUsageHigh alert resolves.

Also check that the Grainline pod is back:

```
kubectl -n grainline get pods -o wide --field-selector spec.nodeName=<NODE>
```

## If it did not work

**The Grainline pod is not Running within 5 minutes.** Cordon the node so nothing new is scheduled on it:

```
kubectl cordon <NODE>
```

**Usage is still above 90% after all of the above.** Escalate to the platform on-call in **#platform-oncall**. Include the node name, the `df -h /host` output, and the `du` output from step 2.

If you cordoned the node, say so in your message.
