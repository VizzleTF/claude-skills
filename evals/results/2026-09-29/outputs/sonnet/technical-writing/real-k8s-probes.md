1. **Whole page.** The page is built as a demo, not as steps for adding a probe to your own Pod. Every section makes you deploy a `busybox`, `agnhost` or `goproxy` Pod and watch it fail. Nowhere does it show the probe block you would paste into your own container spec, or list the fields you tune (`httpGet`, `exec`, `tcpSocket`, `timeoutSeconds`, `failureThreshold`).
   - Fix: open with a short "Add a probe to your container" task. Give one snippet per probe type (`exec`, `httpGet`, `tcpSocket`) and one line per field.
   - Fix: keep the demos below it as an optional walkthrough, or link them out.
2. **Opening paragraph ("This page shows how to configure…").**
   - The first paragraph is metadiscourse: it says what the page covers and gives no answer. It never says which probe to choose.
   - Fix: replace it with one sentence per probe. For example: "A failed liveness probe restarts the container. A failed readiness probe stops Service traffic to the Pod." Add the same for startup probes if you keep them in the title.
3. **"Define a TCP liveness probe".**
   - The heading says liveness only. The section also introduces the readiness probe, the only one on the page, and a reader looking for readiness won't find it here.
   - Fix: retitle it "Define TCP liveness and readiness probes", or split readiness into its own section.
4. **Last sentence of the TCP section: "After 15 seconds, view Pod events to verify that liveness probes:".**
   - The sentence is cut off and no expected output follows, so the reader can't tell whether the probe worked. The `exec` section shows output; this one doesn't.
   - Fix: complete the sentence ("…that both probes pass") and show the `kubectl describe pod goproxy` output that means success.
5. **All three demos: no cleanup.**
   - `liveness-exec` restarts every ~30 seconds and `liveness-http` restarts after 10, so they keep cycling until deleted.
   - Fix: end each demo with `kubectl delete pod liveness-exec`, `kubectl delete pod liveness-http` and `kubectl delete pod goproxy`.
6. **HTTP section: the Go handler block and the `server.go` link.**
   - A developer adding a probe doesn't need the demo server's source. The prose already says "200 for 10 seconds, then 500".
   - Fix: delete the code block and the link.
   - Fix: also delete or move "In releases after v1.13, local HTTP proxy environment variable settings do not affect the HTTP liveness probe." It sits alone with no context, and "after v1.13" is a version anyone on a current cluster can ignore.
7. **`exec` section, timing instructions.**
   - The steps say "Within 30 seconds", "After 35 seconds" and "Wait another 30 seconds", so the reader has to race a clock. The second sample output shows `Age 57s`, which doesn't match "after 35 seconds".
   - Fix: say "Wait about a minute, then run…" and make the sample ages agree with the wait.
   - Also: "Note that the `RESTARTS` counter increments as soon as a failed container comes back to the running state" is a side note that interrupts the verification step. Move it after the output.
8. **h2c section: "If the feature gate is disabled, the API server removes the `protocol` field from new or updated Pods."**
   - This is the failure the reader will hit, and it comes last. The gate requirement is also buried mid-paragraph. Whether the reader gets an error or a silently dropped field is not stated.
   - Fix: put the requirement first: "Before you start: enable `H2CContainerProbe` on `kube-apiserver` and `kubelet`."
   - Fix: after the YAML, say what the reader sees when the gate is off. I could not verify that behaviour, so check it before writing it.
9. **TCP section: "The kubelet will run the first liveness probe 15 seconds after the container starts… every 10 seconds".**
   - The `exec` and HTTP sections name `initialDelaySeconds` and `periodSeconds`. Here the numbers appear without field names, so the reader can't map them to the YAML.
   - Fix: write "`initialDelaySeconds: 15`, `periodSeconds: 10`".
   - Also: "connect to the `goproxy` container" — I could not check whether `goproxy` is the container name or the Pod name (the `describe` command uses it as the Pod name). Confirm against the manifest.
10. **Whole page: inconsistent terms and filler.**
    - Terms: "health checks" and "probes" mean the same thing. "Container", `Container`, "Pod" and "pod", and "services" for Service objects also vary.
    - Filler: "you can see that the Pod has a single container" and "As you can see" restate the YAML.
    - Fix: use "probe", "container", "Pod" and "Service" consistently, and delete "you can see that" and "As you can see".

**Verdict:** needs restructuring first. Fix 1 to 3 before the sentence-level edits, because they change what the page contains. The rest are quick fixes.
