# Runbook: NodeDiskUsageHigh

**Last reviewed:** 2026-09-15
**Severity:** Warning
**Related alert:** `NodeDiskUsageCritical` (pages, fires at 95%)

## What this alert means

The root filesystem on a node has been above 85% used for at least 10 minutes. This alert is **warning** severity — it does not page, but if usage climbs to 95%, `NodeDiskUsageCritical` will fire separately and will page.

This alert only fires on nodes in the **ingest node pool**. These nodes run **Grainline**, our log collector.

## Likely cause

In most cases, the cause is container logs under `/var/log/pods` growing unchecked because log rotation on Grainline has broken. Less commonly, the cause is accumulated old container images taking up disk space.

## Diagnosis

1. Get a shell on the affected node (replace `<NODE>` with the node name from the alert):
   ```
   kubectl debug node/<NODE> -it --image=busybox:1.36
   ```
   The node's filesystem is mounted at `/host` inside this shell.

2. Confirm the disk usage:
   ```
   df -h /host
   ```

3. Find what's consuming space under pod logs:
   ```
   du -sh /host/var/log/pods/* | sort -h | tail
   ```
   If a few pods dominate the output with unusually large log directories, that confirms broken log rotation as the cause.

## Fix

Run both of the following from the same debug shell:

1. Remove unused container images (addresses the "old images" cause):
   ```
   chroot /host crictl rmi --prune
   ```

2. Restart Grainline on the node (addresses the "broken log rotation" cause):
   ```
   kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

## Verify

Wait up to 15 minutes and check that disk usage on the node has dropped below 75%. The fix is considered successful once usage is below 75% and the alert resolves in the alerting system.

## If Grainline doesn't come back

If the Grainline pod on that node has not returned to `Running` within 5 minutes of being deleted, cordon the node so it stops receiving new workloads while it's unhealthy:
```
kubectl cordon <NODE>
```

## Escalation

If disk usage is still above 90% after completing the steps above (image prune + Grainline restart, and cordon if needed), escalate to the platform on-call in **#platform-oncall**. Include the node name, current disk usage, and what you've already tried.
