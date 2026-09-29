# Пара real-k8s-probes

Язык: en. Вид: review.

Запрос:

> Review the attached page from the Kubernetes docs, `configure-liveness-readiness-startup-probes.md`. Its readers are application developers who already deploy to Kubernetes and need to add a probe to their Pod today. It is an excerpt: everything after the TCP probe section was cut, so don't report those sections as missing.
> 
> Tell me what gets in the reader's way and how to fix it. Point to the heading or quote the sentence for each finding.

Факты:

- The fixture is an excerpt of the Kubernetes task page "Configure Liveness, Readiness and Startup Probes"; sections after the TCP liveness probe were cut for the eval
- The page is a task page, which is a how-to for readers who already run workloads on Kubernetes
- In the exec example the container creates /tmp/healthy, removes it after 30 seconds, and the probe runs cat /tmp/healthy
- In the exec example periodSeconds is 5; in the HTTP example periodSeconds is 3
- The prerequisites section is a Hugo include shortcode, not visible text

Ожидания к ответу:

- Any claim the review makes about probe behaviour matches the page; the review does not invent Kubernetes fields or defaults
- The review points to specific headings or quotes and gives a concrete fix for each finding

---

## X

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

---

## Y

I've reviewed the page, and the full revised document is below the findings. I couldn't see the example YAML files or run a cluster, so anything that depends on them is flagged for you to check.

## Findings

Facts first, then structure, then wording.

**Facts**
1. **Intro link** `/docs/concepts/workloads/pods/probes` looks wrong. The concept page I know is `/docs/concepts/configuration/liveness-readiness-startup-probes`. Check the link and fix it.
2. **Exec timing.** "After 35 seconds, view the Pod events again" is too early. The default `failureThreshold` is 3, so failures start at 35s and the kill comes around 45s. The sample output's `Age 57s` contradicts "35 seconds" too. A reader who follows the text sees no `Killing` event. Fix: check once at about a minute.
3. **HTTP timing.** "After 10 seconds, view Pod events…" has the same problem. The first failure is at about 12s and the kill at about 18s. Fix: "about 20 seconds". My arithmetic assumes the default `failureThreshold`, so verify both timings on a cluster.
4. **Sample output** looks out of date. `kubelet, node01` and a bare `RESTARTS 1` don't match what current `kubectl` prints. Regenerate the outputs; I left them as they were.
5. **"In releases after v1.13, local HTTP proxy environment variable settings…"** refers to a long-unsupported version and sits unrelated at the end of the HTTP section. Cut it.
6. **"After 15 seconds, view Pod events to verify that liveness probes:"** is a truncated sentence. It also never says what the reader should see, because in this demo nothing fails. Fix: state the expected result.
7. **TCP "continue to run this check every 10 seconds".** I believe the YAML's liveness `periodSeconds` differs from this. Compare the text with `tcp-liveness-readiness.yaml`. I dropped the period from the rewrite until you confirm it.

**Structure**
8. **Opening lines** ("This page shows how to configure…") don't help a reader who must add a probe today. There is no guide to picking exec, HTTP or TCP, and no snippet to paste. Each section is a demo built to fail. Fix: add a short lead with a mechanism table and one snippet.
9. **Headings** are inconsistent: "Define a liveness command", "…HTTP request", "…TCP liveness probe". Openers such as "Another kind…" and "A third type…" depend on reading order. The exec section never says "exec". Fix: consistent "Liveness probe: X" headings, with the old anchors kept as explicit IDs so inbound links survive.
10. **"Define a TCP liveness probe"** also teaches readiness, and the readiness paragraph repeats the liveness one. The key contrast (liveness restarts the container, readiness stops traffic) is buried. Fix: a two-row table and a heading that names both.
11. **The Go handler listing** and the "first 10 seconds" walkthrough are demo internals. The reader doesn't need them. Cut to one sentence plus the source link.
12. **h2c section** opens with the feature gate rather than the condition for using it. Fix: condition first, then who must enable the gate (a cluster admin). Also state the consequence of a disabled gate: the API server drops `protocol` silently and the probe falls back to HTTP/1.1.
13. **Clock-racing.** "Within 30 seconds…", "After 35 seconds…" and "Wait another 30 seconds…" make the reader race a timer. The first check shows nothing happening. Fix: cut it and use one check.
14. **No cleanup.** The demo Pods restart forever. Fix: one delete command.

**Wording**
15. Paragraphs such as "In the configuration file, you can see that…" restate the YAML that is directly above. Some sentences run long (lines 33–39). Fix: trim to what the YAML doesn't say.
16. Small inconsistencies: `Container` vs container, pod vs Pod, and a comma splice in "…healthy, if it can't it is considered a failure."

## Revised document

````markdown
---
title: Configure Liveness, Readiness and Startup Probes
content_type: task
weight: 140
---

<!-- overview -->

Probes tell the kubelet how to check whether a container is working. You add
them to a container in your Pod spec:

*   A **liveness** probe restarts the container when the check fails. Use it
    for apps that can end up in a broken state and recover only by restarting.
*   A **readiness** probe stops Services from sending traffic to the Pod when
    the check fails. The container is not restarted.
*   A **startup** probe holds off the other two probes until a slow-starting
    app is up.

Each probe uses one of three mechanisms:

| Mechanism | Container field | The probe succeeds when |
|---|---|---|
| Exec | `exec.command` | the command exits with code 0 |
| HTTP | `httpGet` | the response code is 200 or more and less than 400 |
| TCP | `tcpSocket` | the kubelet opens a connection to the port |

A probe sits inside the container definition:

```yaml
containers:
- name: app
  image: my-app:1.0
  livenessProbe:
    httpGet:
      path: /healthz
      port: 8080
    initialDelaySeconds: 3
    periodSeconds: 3
```

The sections below run a demo Pod for each mechanism so you can watch a probe
fail. The demos use liveness probes. For background on probes, see
[Liveness, Readiness and Startup Probes](/docs/concepts/configuration/liveness-readiness-startup-probes).

## {{% heading "prerequisites" %}}

{{< include "task-tutorial-prereqs.md" >}}

The demo Pods keep restarting until you delete them:

```shell
kubectl delete pod liveness-exec liveness-http goproxy --ignore-not-found
```

<!-- steps -->

## Liveness probe: exec command {#define-a-liveness-command}

The kubelet runs a command inside the container. Exit code 0 means healthy.
Any other code makes the kubelet kill the container and restart it.

The demo Pod runs `cat /tmp/healthy` every 5 seconds (`periodSeconds`),
starting 5 seconds after the container starts (`initialDelaySeconds`). The
container creates `/tmp/healthy`, deletes it after 30 seconds, then sleeps:

```shell
/bin/sh -c "touch /tmp/healthy; sleep 30; rm -f /tmp/healthy; sleep 600"
```

{{% code_sample file="pods/probe/exec-liveness.yaml" %}}

Create the Pod:

```shell
kubectl apply -f https://k8s.io/examples/pods/probe/exec-liveness.yaml
```

The kubelet kills the container after three consecutive failed probes, about
45 seconds after it starts. After a minute, view the Pod events:

```shell
kubectl describe pod liveness-exec
```

The output ends with the failed probes and the restart:

```none
Type     Reason     Age                From               Message
----     ------     ----               ----               -------
Normal   Scheduled  57s                default-scheduler  Successfully assigned default/liveness-exec to node01
Normal   Pulling    55s                kubelet, node01    Pulling image "registry.k8s.io/busybox:1.27.2"
Normal   Pulled     53s                kubelet, node01    Successfully pulled image "registry.k8s.io/busybox:1.27.2"
Normal   Created    53s                kubelet, node01    Created container liveness
Normal   Started    53s                kubelet, node01    Started container liveness
Warning  Unhealthy  10s (x3 over 20s)  kubelet, node01    Liveness probe failed: cat: can't open '/tmp/healthy': No such file or directory
Normal   Killing    10s                kubelet, node01    Container liveness failed liveness probe, will be restarted
```

Confirm the restart:

```shell
kubectl get pod liveness-exec
```

`RESTARTS` is now 1:

```none
NAME            READY     STATUS    RESTARTS   AGE
liveness-exec   1/1       Running   1          1m
```

## Liveness probe: HTTP GET {#define-a-liveness-http-request}

The kubelet sends an HTTP GET request to the port and path you specify. A
status code of 200 or more and less than 400 is success. Any other code, or no
response, is failure, and the kubelet kills and restarts the container.

The demo Pod probes port 8080, path `/healthz`, every 3 seconds, starting 3
seconds after the container starts. Its server returns 200 for the first 10
seconds and 500 after that, so the probe starts failing and the container is
restarted after three consecutive failures. See the
[server source](https://github.com/kubernetes/kubernetes/blob/master/test/images/agnhost/liveness/server.go).

{{% code_sample file="pods/probe/http-liveness.yaml" %}}

Create the Pod:

```shell
kubectl apply -f https://k8s.io/examples/pods/probe/http-liveness.yaml
```

After about 20 seconds, view the Pod events. They include
`Liveness probe failed: HTTP probe failed with statuscode: 500` and a container
restart:

```shell
kubectl describe pod liveness-http
```

### Use HTTP/2 cleartext (h2c) with HTTP probes {#use-h2c-with-http-probes}

{{< feature-state feature_gate_name="H2CContainerProbe" >}}

By default the kubelet sends HTTP/1.1 requests. If your app serves health
endpoints only over HTTP/2 cleartext (h2c), which is HTTP/2 over plain TCP
without TLS, set `protocol: HTTP2` in `httpGet`:

{{% code_sample file="pods/probe/h2c-liveness.yaml" %}}

*   A cluster administrator must enable the `H2CContainerProbe`
    [feature gate](/docs/reference/command-line-tools-reference/feature-gates/)
    on both the `kube-apiserver` and the `kubelet`.
*   If the gate is disabled, the API server silently removes the `protocol`
    field from new or updated Pods, and the probe uses HTTP/1.1.
*   Don't combine `protocol: HTTP2` with `scheme: HTTPS` or with a `host`
    value. Those combinations aren't supported.

## Liveness and readiness probes: TCP socket {#define-a-tcp-liveness-probe}

The kubelet tries to open a TCP connection to the container on the port you
specify. If the connection opens, the probe succeeds. Otherwise it fails.

The demo Pod uses the same TCP check for both probe kinds. Only the result of a
failure differs:

| Probe | On failure |
|---|---|
| Liveness | The kubelet restarts the container. |
| Readiness | The Pod is marked unready and receives no traffic from Services. |

Both probes connect to port 8080 of the `goproxy` container. Each waits 15
seconds after the container starts before its first check.

{{% code_sample file="pods/probe/tcp-liveness-readiness.yaml" %}}

Create the Pod:

```shell
kubectl apply -f https://k8s.io/examples/pods/probe/tcp-liveness-readiness.yaml
```

After 15 seconds, view the Pod events:

```shell
kubectl describe pod goproxy
```

Both probes succeed, so the events contain no `Unhealthy` warnings. The Pod
shows `READY 1/1` and `RESTARTS 0` in `kubectl get pod goproxy`.
````

## Notes on the rewrite

- **Added content:** the mechanism table, the YAML placement snippet, the cleanup command, the two-row liveness/readiness table and the "expected result" line for the TCP demo. Read them once for accuracy, since I wrote them from general Kubernetes behaviour rather than from the example files.
- **Unchanged:** the `code_sample` and `include` shortcodes, and the feature-state shortcode.
- **Left as they were:** the exec sample output (which you should regenerate) and the `goproxy` peer names.
