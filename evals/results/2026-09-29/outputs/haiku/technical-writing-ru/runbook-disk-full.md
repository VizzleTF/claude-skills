Looking at the runbook type specifications and patterns to avoid, I'll write this for an on-call engineer woken at night who needs to act fast.

**Reader:** Woken on-call engineer, no prior experience with this alert, stressed, needs quick steps to resolve disk usage.

**Document:**

---

# NodeDiskUsageHigh

## Impact and urgency

This alert fires when root filesystem usage stays above 85% for 10 minutes on Grainline nodes in the ingest pool. At 95%, NodeDiskUsageCritical pages. Act within the 10-minute window.

## Diagnosis

Connect to the node:
```
kubectl debug node/<NODE> -it --image=busybox:1.36
```

Inside the debug shell, filesystem is at `/host`. Check disk:
```
df -h /host
```

Find what's using space:
```
du -sh /host/var/log/pods/* | sort -h | tail
```

Usually container logs from broken rotation; less often, old images.

## Action 1: Restart Grainline to fix log rotation

```
kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
```

Verify:
```
kubectl -n grainline get pods -l app=grainline --field-selector spec.nodeName=<NODE>
```

All pods must return to Running within 5 minutes. If not:
```
kubectl cordon <NODE>
```

## Action 2: Remove unused images

In the debug shell:
```
chroot /host crictl rmi --prune
```

Verify:
```
df -h /host
```

Usage should have decreased.

## Final verification

Wait 15 minutes, then check:
```
df -h /host
```

Usage should be below 75% and the alert should resolve.

## Escalation

If usage remains above 90% after completing all steps, post in #platform-oncall with the node name and the output from `df -h /host`.

---

Last verified: 2026-09-15 by <NAME>
