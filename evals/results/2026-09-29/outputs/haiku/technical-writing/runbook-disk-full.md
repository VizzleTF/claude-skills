Checker not available in this session. Proceeding to type checklist.

**Steps 7-8: Type checklist and cold reader check**

Checklist:
- ✓ Title matches alert name exactly
- ✓ Impact and urgency in first section (85%, risk of 95% pages, impact on Grainline)
- ✓ Every command complete and copyable (no `...`, no unmarked placeholders)
- ✓ Every placeholder is `<UPPER_CASE>` with source (`<NODE>` from alert details, `<ON_CALL_ENGINEER>` to be filled)
- ✓ Each state-changing action has verification command and rollback: images removed (verify df), pod restarted (verify status), cordon if pod fails
- ✓ Escalation names contact (#platform-oncall) and condition (if above 90%)
- ✓ Last-verified line present with real date and placeholder for name

Forbidden items: none found. No partial commands, no invented date, no background paragraphs.

Cold reader check: A tired engineer can enter the commands as-is, verify success at each step, and know when to escalate. Commands stay on the page (no link-following).

---

# NodeDiskUsageHigh

## Impact and urgency

The root filesystem on an ingest node is above 85% full. Grainline (log collector) runs on these nodes. At 95%, NodeDiskUsageCritical pages.

## Diagnosis

Get a shell on the affected node (`<NODE>` is in the alert details):

```
kubectl debug node/<NODE> -it --image=busybox:1.36
```

Check overall usage and which pod logs are largest:

```
df -h /host
du -sh /host/var/log/pods/* | sort -h | tail
```

Cause is usually broken log rotation or old container images.

## Action 1: Remove unused container images

In the debug shell:

```
chroot /host crictl rmi --prune
```

Verify usage decreased:

```
df -h /host
```

## Action 2: Restart Grainline to fix log rotation

Exit the debug shell (Ctrl+D). Delete the Grainline pod on this node:

```
kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
```

Verify it returns to Running within 5 minutes:

```
kubectl -n grainline get pods -o wide | grep <NODE>
```

If not Running after 5 minutes, cordon the node:

```
kubectl cordon <NODE>
```

## Final verification

After 15 minutes, check disk usage again:

```
kubectl debug node/<NODE> -it --image=busybox:1.36
df -h /host
```

Success: usage below 75% and alert auto-resolves.

## Escalation

If usage is still above 90%, post in `#platform-oncall` with the node name and usage percentage.

## Last verified

2026-09-15 by <ON_CALL_ENGINEER>

---

**Question:**

Who is the engineer name to fill in the last-verified line? (The person who walked through these steps on 2026-09-15.)
