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
