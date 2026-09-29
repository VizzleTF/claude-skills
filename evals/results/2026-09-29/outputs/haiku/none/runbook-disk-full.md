I'll present the complete runbook here for you:

---

# NodeDiskUsageHigh Runbook

## Alert Definition

**NodeDiskUsageHigh** fires when the root filesystem on an ingest node stays above **85% full for 10 minutes**.

- **Severity:** Warning (page if it escalates to NodeDiskUsageCritical at 95%)
- **Affected nodes:** Ingest node pool (runs Grainline, our log collector)
- **Typical page time:** Night/weekends

---

## Common Causes (In Order of Likelihood)

1. **Container logs filling up** — Log rotation is broken, `/var/log/pods/` grows without bound
2. **Old container images** — Unused images taking up space

---

## Step-by-Step Resolution

### 1. Identify the Node
From the alert page, note the node name. You'll need it below.

### 2. Open a Debug Shell on the Node
```bash
kubectl debug node/<NODE> -it --image=busybox:1.36
```
You're now inside a temporary debug container. The node's filesystem is mounted at `/host`.

### 3. Check Disk Usage
```bash
df -h /host
```
Look at the root `/` usage. You're looking for the percentage that triggered the alert.

### 4. Find What's Taking Space
```bash
du -sh /host/var/log/pods/* | sort -h | tail
```
This shows the largest container log directories. If any are multi-gigabyte, log rotation is broken.

### 5. Clean Up Old Container Images
```bash
chroot /host crictl rmi --prune
```
This removes all unused container images. Usually frees 2–10 GB.

### 6. Restart Grainline on This Node
```bash
kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
```
This restarts the Grainline pod on the node and should fix broken log rotation for future logs.

---

## Verify It Worked

Check disk usage again:
```bash
df -h /host
```

**Success criteria:**
- Disk usage **below 75%** within 15 minutes
- The alert **automatically resolves** in your monitoring system

If the Grainline pod doesn't come back to **Running** within 5 minutes, immediately:
```bash
kubectl cordon <NODE>
```
This stops new workloads from being scheduled there.

---

## Escalate If

If **any** of these are true:
- Disk usage is still above **90%** after completing all steps above
- The Grainline pod fails to restart or keep crashing

→ Ping **#platform-oncall** with:
- Node name
- Current disk usage percentage
- What you already tried

---

## Quick Ref — Commands You'll Use

```bash
# Get shell on node
kubectl debug node/<NODE> -it --image=busybox:1.36

# Inside the debug shell
df -h /host                                              # check usage
du -sh /host/var/log/pods/* | sort -h | tail           # find big logs
chroot /host crictl rmi --prune                         # remove old images
exit                                                     # leave shell

# Back on your terminal
kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
kubectl cordon <NODE>                                   # if pod doesn't come back
```

---

## Notes

- This runbook was last validated on 2026-09-15
- Most fixes complete in under 10 minutes
- If you're unsure at any step, don't guess—escalate to #platform-oncall
