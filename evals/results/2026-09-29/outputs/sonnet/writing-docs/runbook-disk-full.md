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
