I wrote the runbook below. The text checker didn't run because the command was declined, and nobody has run the finished runbook yet.

I added two things you didn't give me, so check them before publishing:
- **Commands:** I added `crictl images` to record the image list before the prune. I also added `kubectl get pod` and `kubectl get node` to confirm Grainline restarted and the node was cordoned, plus `kubectl uncordon` to undo the cordon.
- **Debug shell prompt:** Step 1 says the prompt changes to `/ #`. That's the usual busybox prompt; I haven't checked it on your nodes.

---

# NodeDiskUsageHigh

The root filesystem on a node in the ingest node pool has stayed above 85% for 10 minutes. This alert is a warning and doesn't page anyone. At 95%, a separate alert, NodeDiskUsageCritical, fires and pages, so fix the disk before it gets there.

Get `<NODE>` from the alert. Ingest nodes run Grainline, the log collector.

## Diagnose

1. Open a shell on the node and keep it open until the end. Inside this shell, the node's filesystem is at `/host`.

   ```bash
   kubectl debug node/<NODE> -it --image=busybox:1.36
   ```

   Verify: the prompt changes to `/ #`.

2. Check disk usage.

   ```bash
   df -h /host
   ```

   The disk is the problem if `Use%` is 85% or higher.

3. Find the largest pod log directories.

   ```bash
   du -sh /host/var/log/pods/* | sort -h | tail
   ```

   If the last lines hold most of the used space, the cause is container logs: log rotation is broken, and step 2 of the fix repairs it. Otherwise the cause is usually old container images, which step 1 removes. Run both steps either way.

## Fix

1. In the debug shell, save the image list, then remove unused images.

   ```bash
   chroot /host crictl images
   chroot /host crictl rmi --prune
   ```

   Verify: `df -h /host` shows a lower `Use%` than before.
   Rollback: none. If anything fails after the prune, escalate in #platform-oncall.

2. In a second terminal on your workstation, restart Grainline on the node. This fixes log rotation.

   ```bash
   kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

   Verify: within 5 minutes, this command shows the new pod with `STATUS` `Running`:

   ```bash
   kubectl -n grainline get pod -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

   If the pod isn't `Running` after 5 minutes, cordon the node:

   ```bash
   kubectl cordon <NODE>
   ```

   Verify: `kubectl get node <NODE>` shows `SchedulingDisabled` in `STATUS`.
   Rollback: `kubectl uncordon <NODE>`.

## Confirm the alert cleared

The fix worked if, within 15 minutes, `df -h /host` in the debug shell shows `Use%` below 75% and NodeDiskUsageHigh resolves.

## Escalate

If `Use%` is still above 90% after all steps, escalate to the platform on-call in #platform-oncall.

Last verified: 2026-09-15 by <NAME>

---

- Who ran through the steps on 2026-09-15? Their name replaces `<NAME>`.
- Which alert label holds the node name? The runbook can then say exactly where to find `<NODE>`.
