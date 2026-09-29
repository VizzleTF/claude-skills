I've written the runbook below. I didn't make up anything you didn't give me, so there are two placeholders for you to fill in: `<NAME>` in the last line, and `<ACTION_75_90>` in "Escalate" (what to do if usage ends up between 75% and 90%). A few details are my own additions: saving the image list before the prune, the checks on the cordon and prune steps, and what to post when escalating.

---

# NodeDiskUsageHigh

The root filesystem on a node in the ingest node pool has been above 85% for 10 minutes. Nodes in the ingest pool run Grainline, our log collector.

## Impact and urgency

This alert has severity `warning` and does not page. If usage reaches 95%, NodeDiskUsageCritical fires and pages, so work through this page now.

## Diagnose

1. Copy the node name from the alert. Use it as `<NODE>` in every command on this page. Then open a shell on the node:

   ```
   kubectl debug node/<NODE> -it --image=busybox:1.36
   ```

   Check: you get a shell prompt. The node's filesystem is under `/host`.

2. Check disk usage:

   ```
   df -h /host
   ```

   Check: `Use%` is above 85%. Write this number down.

3. Find the largest pod log directories:

   ```
   du -sh /host/var/log/pods/* | sort -h | tail
   ```

   The largest directories are on the last lines. If they add up to most of `Used` from step 2, the cause is container logs piling up because log rotation broke. This is the usual cause. If they don't, the cause is probably old container images.

## Fix

1. In the same debug shell, save the list of images and copy the output into your incident notes:

   ```
   chroot /host crictl images
   ```

   Then remove unused images:

   ```
   chroot /host crictl rmi --prune
   ```

   Check: `chroot /host crictl images` shows fewer images than the list you saved.
   Undo: you can't undo this step. If a pod on this node fails to start afterwards, escalate in #platform-oncall.

2. Leave the debug shell with `exit`. Restart Grainline on this node to fix log rotation:

   ```
   kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

   Check: within 5 minutes, `STATUS` shows `Running`:

   ```
   kubectl -n grainline get pod -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

3. Do this only if the Grainline pod isn't `Running` after 5 minutes. Cordon the node:

   ```
   kubectl cordon <NODE>
   ```

   Check: `kubectl get node <NODE>` shows `Ready,SchedulingDisabled`.
   Undo: `kubectl uncordon <NODE>`

## Confirm

Wait 15 minutes. Then open a debug shell again and check usage:

```
kubectl debug node/<NODE> -it --image=busybox:1.36
df -h /host
```

It worked if `Use%` is below 75% and NodeDiskUsageHigh has resolved.

## Escalate

If `Use%` is still above 90% after all the steps above, post in #platform-oncall. Include the node name and the output of `df -h /host` and `du -sh /host/var/log/pods/* | sort -h | tail`.

If usage is between 75% and 90%: `<ACTION_75_90>`

## Last verified

Last verified: 2026-09-15 by `<NAME>`

---

Questions:
- Who walked through these steps on 2026-09-15? That name goes in `<NAME>`.
- What should on-call do if usage ends up between 75% and 90%: wait longer, escalate, or something else? That goes in `<ACTION_75_90>`.
