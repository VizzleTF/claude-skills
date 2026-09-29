I didn't have a repo or existing runbook format to match, so this is in plain Markdown. A few things you should check before publishing:

- **75–90% after the fix isn't covered.** Your facts say what counts as success (under 75%) and when to escalate (over 90%), but not what to do in between. That row in step 5 says so directly and points to #platform-oncall. Replace it with the real answer.
- **I assumed the alert includes the node name.** If the node name is under a label like `instance` or `node`, name that label in the "Before you start" section.
- **I added three commands you didn't give me:** the `kubectl get pod ... -w` watch in step 4, the `cmd /host/...` check in step 3, and the debug-pod cleanup. The cleanup is there because `kubectl debug node/...` leaves its pod behind after you exit. I haven't run any of the three against your cluster, so run them once before this goes live.

---

# Runbook: NodeDiskUsageHigh

Last verified: 2026-09-15

**What fired:** the root filesystem on a node in the `ingest` node pool has been above 85% full for 10 minutes. Severity: warning.

**How urgent:** fix it now, but you have time. If the disk reaches 95%, a separate alert (NodeDiskUsageCritical) fires and pages.

**Usual cause:** the node runs Grainline, our log collector. Log rotation breaks, and container logs under `/var/log/pods` keep growing. Less often, old container images fill the disk.

**Usual fix:** remove unused images and restart the Grainline pod on that node. It takes about 20 minutes, including the wait to confirm.

## Before you start

- You need `kubectl` access to the cluster.
- Get the node name from the alert. It is written as `<NODE>` below.
- Open two terminals. One is a shell on the node. The other runs `kubectl` from your machine.

## 1. Open a shell on the node

In terminal 1:

```sh
kubectl debug node/<NODE> -it --image=busybox:1.36
```

In this shell, the node's filesystem is at `/host`. Leave the shell open until step 5.

## 2. Check what is using the disk

In terminal 1:

```sh
df -h /host                                      # overall usage; note the Use% value
du -sh /host/var/log/pods/* | sort -h | tail     # largest pod log directories, biggest last
```

- **Large log directories at the bottom of the list:** broken log rotation is the cause. Step 4 fixes it.
- **No large log directories:** old images are probably the cause. Step 3 fixes it.

Do steps 3 and 4 either way. Save both outputs in case you need to escalate.

## 3. Remove unused container images

In terminal 1:

```sh
cmd /host/var/lib/containerd /host/var/lib/docker 2>/dev/null; chroot /host crictl rmi --prune
```

Only `chroot /host crictl rmi --prune` matters here. It deletes images that no container on the node is using, so running containers are not affected.

## 4. Restart Grainline on this node

In terminal 2:

```sh
kubectl -n grainline delete pod -l app=grainline --field-selector spec.nodeName=<NODE>
```

This deletes the Grainline pod on this node. A new pod replaces it, and the restart fixes log rotation. Watch the new pod start:

```sh
kubectl -n grainline get pod -l app=grainline --field-selector spec.nodeName=<NODE> -w
```

**Success:** `STATUS` shows `Running` within 5 minutes. Press Ctrl+C to stop watching.

**If it is not `Running` after 5 minutes:** cordon the node so no new pods are scheduled on it, then go on to step 5.

```sh
kubectl cordon <NODE>
```

## 5. Confirm the fix

Wait up to 15 minutes, then run this in terminal 1:

```sh
df -h /host
```

| Result | What to do |
|---|---|
| Below 75% and the alert has resolved | You're done. Clean up (next section). |
| Between 75% and 90% | This runbook does not cover this case yet. If unsure, ask in #platform-oncall. |
| Above 90% | Escalate to the platform on-call in **#platform-oncall** (details below). |

When you escalate, post:

- the node name
- the `df` and `du` output from step 2, and the `df` output from step 5
- whether the Grainline pod came back, and whether you cordoned the node

## Clean up

1. Type `exit` in terminal 1 to leave the node shell.
2. The debug pod stays behind after you exit. Find it and delete it in terminal 2:

   ```sh
   kubectl get pods | grep node-debugger
   kubectl delete pod <node-debugger-pod-name>
   ```

3. If you cordoned the node, say so in the alert thread or your handoff notes. The node stays unschedulable until someone runs `kubectl uncordon <NODE>`.
