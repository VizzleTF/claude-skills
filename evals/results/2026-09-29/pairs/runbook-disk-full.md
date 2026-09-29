# Пара runbook-disk-full

Язык: en. Вид: create.

Запрос:

> Write a runbook for the NodeDiskUsageHigh alert. The on-call engineer who opens it is usually woken up at night and has never looked at this alert before.
> 
> What we know:
> 
> - NodeDiskUsageHigh fires when the root filesystem on a node stays above 85% for 10 minutes. Severity: warning. At 95% a separate alert, NodeDiskUsageCritical, fires and pages.
> - It happens on nodes in the ingest node pool. Those nodes run Grainline, our log collector.
> - Most of the time the cause is container logs under /var/log/pods growing because log rotation broke. Less often it is old container images.
> - To get a shell on the node: `kubectl debug node/<NODE> -it --image=busybox:1.36`. The node filesystem is at /host inside that shell.
> - To look: `df -h /host`, then `du -sh /host/var/log/pods/* | sort -h | tail`.
> - To fix: in the same debug shell, `chroot /host crictl rmi --prune` removes unused images. Restarting Grainline on that node fixes the rotation: `kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>`.
> - It worked if usage is below 75% within 15 minutes and the alert resolves.
> - If the Grainline pod does not come back to Running within 5 minutes, cordon the node: `kubectl cordon <NODE>`.
> - If usage is still above 90% after all of this, escalate to the platform on-call in #platform-oncall.
> - I last walked through these steps on 2026-09-15.

Факты:

- The alert is NodeDiskUsageHigh; it fires when root filesystem usage on a node stays above 85% for 10 minutes; severity is warning
- At 95% a second alert, NodeDiskUsageCritical, fires with severity page
- The alert affects nodes in the ingest node pool, which run the Grainline log collector
- The most common cause is container logs under /var/log/pods growing because log rotation is broken; the second cause is unused container images
- Open a shell on the node with kubectl debug node/<NODE> -it --image=busybox:1.36; the node filesystem is mounted at /host
- Check usage with df -h /host and find the largest log directories with du -sh /host/var/log/pods/* | sort -h | tail
- Remove unused images with chroot /host crictl rmi --prune from the same kubectl debug shell
- Restart Grainline on the node with kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
- Success check: usage drops below 75% within 15 minutes and the alert resolves
- If the Grainline pod is not Running again within 5 minutes, cordon the node with kubectl cordon <NODE>
- Escalate to the platform on-call in the #platform-oncall channel if usage is still above 90% after all actions
- The procedure was last verified on 2026-09-15

---

## X

# Runbook: NodeDiskUsageHigh

**Severity:** warning (does not page). **Last walked through:** 2026-09-15.

The root filesystem on a node in the `ingest` node pool has been above 85% for 10 minutes. If usage reaches 95%, `NodeDiskUsageCritical` fires and pages. Fix this now, but you have some time.

The usual cause is container logs in `/var/log/pods` growing because log rotation broke on the node's Grainline pod. Grainline is our log collector. A less common cause is old container images.

## Steps

`<NODE>` is the node named in the alert.

1. Open a shell on the node. The node filesystem is at `/host` inside it.

   ```sh
   kubectl debug node/<NODE> -it --image=busybox:1.36
   ```

2. Check usage and find what is using it. Run both in the debug shell.

   ```sh
   df -h /host
   du -sh /host/var/log/pods/* | sort -h | tail
   ```

3. Choose the fix based on step 2.

   | What you see | Cause | Fix |
   |---|---|---|
   | Directories in `/var/log/pods` are large | Log rotation is broken | Step 4 |
   | `/var/log/pods` is small but `df` shows the disk is full | Old container images | Step 5 |
   | Not sure | | Do both. Step 5 only removes unused images. |

4. Restart Grainline on the node. Run this from your own terminal, not the debug shell.

   ```sh
   kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

   Check that the new pod reaches `Running` within 5 minutes:

   ```sh
   kubectl -n grainline get pods -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

   If it is not `Running` after 5 minutes, cordon the node so nothing new is scheduled on it:

   ```sh
   kubectl cordon <NODE>
   ```

5. Remove unused images. Run this in the debug shell.

   ```sh
   chroot /host crictl rmi --prune
   ```

## Check that it worked

Within 15 minutes, `df -h /host` shows usage below 75% and the alert resolves. Exit the debug shell.

## If it did not work

If usage is still above 90% after the steps above, escalate to the platform on-call in **#platform-oncall**. Say which node, what `du` showed, and which steps you ran.

---

## Y

# NodeDiskUsageHigh

**Impact and urgency.** The root filesystem on an ingest node pool node has been above 85% for 10 minutes. Severity is warning and nobody is paged. At 95% NodeDiskUsageCritical fires and pages, so act before usage gets there.

`<NODE>` is the name of the node in the alert. Use it in every command below.

## Diagnosis

1. Open a shell on the node. The node filesystem is at `/host` inside it.

   ```
   kubectl debug node/<NODE> -it --image=busybox:1.36
   ```

   Expected: a `/ #` prompt.

2. Confirm usage.

   ```
   df -h /host
   ```

   Expected: `Use%` for the `/host` filesystem is 85% or higher.

3. Find what is using the space.

   ```
   du -sh /host/var/log/pods/* | sort -h | tail
   ```

   Expected, most likely cause: a few pod directories hold most of the space, and one belongs to Grainline. Do step 1 under Actions.

   If the pod logs are small, the cause is old container images. Do step 2 under Actions.

## Actions

Run step 2 in the debug shell. Run steps 1, 3 and 4 from your own terminal.

1. Restart Grainline on the node to fix the broken log rotation.

   ```
   kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

   Verify within 5 minutes:

   ```
   kubectl -n grainline get pod -l app=grainline --field-selector spec.nodeName=<NODE>
   ```

   Expected: `STATUS` is `Running`.

   Rollback: none needed. The pod is recreated. If it is not `Running` after 5 minutes, do step 4.

2. Remove unused images. The removal cannot be undone, but removed images can be pulled again. First record what is there.

   ```
   chroot /host crictl images
   ```

   Then prune.

   ```
   chroot /host crictl rmi --prune
   ```

   Verify:

   ```
   df -h /host
   ```

   Expected: `Use%` is lower than before the prune.

   Rollback: none. If usage does not drop, escalate.

3. Wait 15 minutes, then check usage again with `df -h /host` in the debug shell.

4. If the Grainline pod is not `Running` 5 minutes after step 1, cordon the node.

   ```
   kubectl cordon <NODE>
   ```

   Verify:

   ```
   kubectl get node <NODE>
   ```

   Expected: `STATUS` includes `SchedulingDisabled`.

   Rollback:

   ```
   kubectl uncordon <NODE>
   ```

## Final verification

Usage on the node is below 75% within 15 minutes of the fix, and NodeDiskUsageHigh resolves in the alerting system.

```
df -h /host
```

Expected: `Use%` is below 75%.

## Escalation

If usage is still above 90% after all of the actions, post in #platform-oncall and page the platform on-call. Include `<NODE>`, the `df -h /host` output and the `du` output from diagnosis.

Last verified: 2026-09-15 by `<NAME>`

---

Questions:
- Which alert label holds the node name, so the runbook can say where to read `<NODE>`?
- Who walked the steps on 2026-09-15 (`<NAME>`)?
- How do people page the platform on-call: a tool, a schedule name, or only #platform-oncall?
