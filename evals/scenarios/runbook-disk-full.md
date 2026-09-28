id: runbook-disk-full
lang: en
kind: create
expect: runbook
core: true
facts:
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

Write a runbook for the NodeDiskUsageHigh alert. The on-call engineer who opens it is usually woken up at night and has never looked at this alert before.

What we know:

- NodeDiskUsageHigh fires when the root filesystem on a node stays above 85% for 10 minutes. Severity: warning. At 95% a separate alert, NodeDiskUsageCritical, fires and pages.
- It happens on nodes in the ingest node pool. Those nodes run Grainline, our log collector.
- Most of the time the cause is container logs under /var/log/pods growing because log rotation broke. Less often it is old container images.
- To get a shell on the node: `kubectl debug node/<NODE> -it --image=busybox:1.36`. The node filesystem is at /host inside that shell.
- To look: `df -h /host`, then `du -sh /host/var/log/pods/* | sort -h | tail`.
- To fix: in the same debug shell, `chroot /host crictl rmi --prune` removes unused images. Restarting Grainline on that node fixes the rotation: `kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>`.
- It worked if usage is below 75% within 15 minutes and the alert resolves.
- If the Grainline pod does not come back to Running within 5 minutes, cordon the node: `kubectl cordon <NODE>`.
- If usage is still above 90% after all of this, escalate to the platform on-call in #platform-oncall.
- I last walked through these steps on 2026-09-15.
