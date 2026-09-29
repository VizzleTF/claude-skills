I reviewed the page and revised it below. I didn't edit the file on disk, and I couldn't see the included YAML samples, so the field values I quote come from the page's own prose. The failure timings I derived assume the default `failureThreshold` of 3.

## What gets in the reader's way

1. **The page doesn't help you choose a probe (top of page).** A developer who wants to add a probe to their Pod has to read three demo exercises to learn that liveness restarts a container and readiness stops traffic. The page never says where the fields go or what the defaults are. The `timeoutSeconds` default of 1s is the one that bites slow health endpoints.
   - **Fix:** I added a "Choose a probe" section with a table, a mechanism list, and the defaults.
2. **The prose says one failed probe kills the container.**
   - *"If the command returns a non-zero value, the kubelet kills the container"* and *"after 10 seconds, the health checks will fail, and the kubelet will kill and restart the container"* skip `failureThreshold`. The page's own event output shows `(x3 over 20s)`, which contradicts the prose.
   - **Fix:** The prose now says "after consecutive failures" (3 by default).
3. **Two timing instructions don't match the behavior, so readers see nothing.**
   - *"After 35 seconds, view the Pod events again"*: the first failure lands at about 35s and the kill at about 45s. The sample output was captured at 57s.
   - *"After 10 seconds, view Pod events"* (HTTP): the kill happens at about 18s.
   - **Fix:** They now say "about a minute" and "about 20 seconds". I dropped "Wait another 30 seconds", because the sample output shows an age of 1m.
4. **The final sentence of the TCP section is broken and gives no expected result.** *"…view Pod events to verify that liveness probes:"* stops mid-sentence. The reader also isn't told what success looks like.
   - **Fix:** I completed the sentence and added the expected output.
5. **The TCP heading undersells its content.** *"Define a TCP liveness probe"* also covers the readiness probe, which is the only place readiness is explained. The TCP prose also never names `initialDelaySeconds` and `periodSeconds`, even though the earlier sections do.
   - **Fix:** I retitled it and kept the old anchor so existing links work. I also named the fields.
6. **Stale note in the HTTP section.** *"In releases after v1.13, local HTTP proxy environment variable settings do not affect…"* concerns a release from 2018, so I removed it. If you want to keep it, move it out of the middle of the flow.
7. **The success-code rule is buried.** *"Any code greater than or equal to 200 and less than 400 indicates success"* is the fact a developer most needs from the HTTP section. It now appears in the "Choose a probe" section and stays where it was.
8. **The h2c section doesn't say what happens when the feature gate is off.** *"the API server removes the `protocol` field"* doesn't say that the probe then silently uses HTTP/1.1 and fails against an h2c-only endpoint. Readers on managed clusters also can't change feature gates, so I said that too.
9. **No cleanup.** The demo Pods restart forever, and the reader is never told to delete them. I added a cleanup step.
10. **The page doesn't say the demos fail on purpose.** I added a sentence to the "Choose a probe" section.
11. **Minor fixes.**
    - "single `Container`" is now "single container", matching the HTTP section.
    - "pod" and "services" are now "Pod" and "Services".
    - The TCP comma splice is fixed.

## Revised document

````markdown
---
title: Configure Liveness, Readiness and Startup Probes
content_type: task
weight: 140
---

<!-- overview -->

This page shows how to configure liveness, readiness and startup probes for
containers.

For more information about probes, see
[Liveness, Readiness and Startup Probes](/docs/concepts/workloads/pods/probes).

## {{% heading "prerequisites" %}}

{{< include "task-tutorial-prereqs.md" >}}

<!-- steps -->

## Choose a probe

You set probes per container in the Pod spec, under `livenessProbe`,
`readinessProbe` and `startupProbe`. Each probe has a purpose and a mechanism.

**What the probe is for**

| Probe | When it fails, the kubelet... |
|-------|-------------------------------|
| `livenessProbe` | restarts the container |
| `readinessProbe` | stops sending Service traffic to the Pod; the container is not restarted |
| `startupProbe` | keeps the liveness and readiness probes from running until it succeeds; if it never succeeds, restarts the container |

**How the probe checks**

* `exec`: runs a command in the container. Exit code 0 is success.
  See [Define a liveness command](#define-a-liveness-command).
* `httpGet`: sends an HTTP GET request. Any status code from 200 up to (but not
  including) 400 is success. See [Define a liveness HTTP request](#define-a-liveness-http-request).
* `tcpSocket`: opens a TCP connection to a port. A successful connection is
  success. See [Define a TCP liveness and readiness probe](#define-a-tcp-liveness-probe).

**Timing fields and defaults**

| Field | Default | Meaning |
|-------|---------|---------|
| `initialDelaySeconds` | 0 | Seconds to wait after the container starts before the first probe |
| `periodSeconds` | 10 | Seconds between probes |
| `timeoutSeconds` | 1 | Seconds to wait for a response before the probe counts as failed |
| `failureThreshold` | 3 | Consecutive failures before the kubelet acts |

The examples below use demo containers that are built to fail after a short
time, so that you can watch a probe take action. To probe your own container,
copy the `livenessProbe` (or `readinessProbe`) block from the example that
matches your check and change the command, path or port.

## Define a liveness command

Many applications running for long periods of time eventually transition to
broken states, and cannot recover except by being restarted. Kubernetes provides
liveness probes to detect and remedy such situations.

In this exercise, you create a Pod that runs a container based on the
`registry.k8s.io/busybox:1.27.2` image. Here is the configuration file for the Pod:

{{% code_sample file="pods/probe/exec-liveness.yaml" %}}

In the configuration file, you can see that the Pod has a single container.
The `periodSeconds` field specifies that the kubelet should perform a liveness
probe every 5 seconds. The `initialDelaySeconds` field tells the kubelet that it
should wait 5 seconds before performing the first probe. To perform a probe, the
kubelet executes the command `cat /tmp/healthy` in the target container. If the
command succeeds, it returns 0, and the kubelet considers the container to be alive and
healthy. If the command returns a non-zero value, the probe has failed. After
`failureThreshold` consecutive failures (3 by default), the kubelet kills the
container and restarts it.

When the container starts, it executes this command:

```shell
/bin/sh -c "touch /tmp/healthy; sleep 30; rm -f /tmp/healthy; sleep 600"
```

For the first 30 seconds of the container's life, there is a `/tmp/healthy` file.
So during the first 30 seconds, the command `cat /tmp/healthy` returns a success
code. After 30 seconds, `cat /tmp/healthy` returns a failure code.

Create the Pod:

```shell
kubectl apply -f https://k8s.io/examples/pods/probe/exec-liveness.yaml
```

Within 30 seconds, view the Pod events:

```shell
kubectl describe pod liveness-exec
```

The output indicates that no liveness probes have failed yet:

```none
Type    Reason     Age   From               Message
----    ------     ----  ----               -------
Normal  Scheduled  11s   default-scheduler  Successfully assigned default/liveness-exec to node01
Normal  Pulling    9s    kubelet, node01    Pulling image "registry.k8s.io/busybox:1.27.2"
Normal  Pulled     7s    kubelet, node01    Successfully pulled image "registry.k8s.io/busybox:1.27.2"
Normal  Created    7s    kubelet, node01    Created container liveness
Normal  Started    7s    kubelet, node01    Started container liveness
```

After about a minute, view the Pod events again. The first probe fails about 35
seconds after the container starts, and the container is killed after the third
consecutive failure.

```shell
kubectl describe pod liveness-exec
```

At the bottom of the output, there are messages indicating that the liveness
probes have failed, and the failed containers have been killed and recreated.

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

Verify that the container has been restarted:

```shell
kubectl get pod liveness-exec
```

The output shows that `RESTARTS` has been incremented. Note that the `RESTARTS` counter
increments as soon as a failed container comes back to the running state:

```none
NAME            READY     STATUS    RESTARTS   AGE
liveness-exec   1/1       Running   1          1m
```

## Define a liveness HTTP request

Another kind of liveness probe uses an HTTP GET request. Here is the configuration
file for a Pod that runs a container based on the `registry.k8s.io/e2e-test-images/agnhost` image.

{{% code_sample file="pods/probe/http-liveness.yaml" %}}

In the configuration file, you can see that the Pod has a single container.
The `periodSeconds` field specifies that the kubelet should perform a liveness
probe every 3 seconds. The `initialDelaySeconds` field tells the kubelet that it
should wait 3 seconds before performing the first probe. To perform a probe, the
kubelet sends an HTTP GET request to the server that is running in the container
and listening on port 8080. If the handler for the server's `/healthz` path
returns a success code, the kubelet considers the container to be alive and
healthy. If the handler returns a failure code, the probe has failed. After
`failureThreshold` consecutive failures (3 by default), the kubelet kills the
container and restarts it.

Any code greater than or equal to 200 and less than 400 indicates success. Any
other code indicates failure.

You can see the source code for the server in
[server.go](https://github.com/kubernetes/kubernetes/blob/master/test/images/agnhost/liveness/server.go).

For the first 10 seconds that the container is alive, the `/healthz` handler
returns a status of 200. After that, the handler returns a status of 500.

```go
http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
    duration := time.Now().Sub(started)
    if duration.Seconds() > 10 {
        w.WriteHeader(500)
        w.Write([]byte(fmt.Sprintf("error: %v", duration.Seconds())))
    } else {
        w.WriteHeader(200)
        w.Write([]byte("ok"))
    }
})
```

The kubelet starts performing health checks 3 seconds after the container starts.
So the first few health checks will succeed. After 10 seconds, the health checks
start to fail, and after three consecutive failures the kubelet kills and
restarts the container.

To try the HTTP liveness check, create a Pod:

```shell
kubectl apply -f https://k8s.io/examples/pods/probe/http-liveness.yaml
```

After about 20 seconds, view Pod events to verify that liveness probes have failed and
the container has been restarted:

```shell
kubectl describe pod liveness-http
```

### Use HTTP/2 cleartext (h2c) with HTTP probes {#use-h2c-with-http-probes}

{{< feature-state feature_gate_name="H2CContainerProbe" >}}

By default the kubelet sends HTTP/1.1 requests when executing an HTTP probe.
If your application serves health endpoints only over HTTP/2 cleartext (h2c),
you can add the `protocol` field to the `httpGet` field in the probe specification and
specify a value of `HTTP2`. This requires the `H2CContainerProbe`
[feature gate](/docs/reference/command-line-tools-reference/feature-gates/) to be
enabled on both the `kube-apiserver` and the `kubelet`. If you use a managed
cluster where you can't change feature gates, this option may not be available.

{{% code_sample file="pods/probe/h2c-liveness.yaml" %}}

When `protocol` is set to `HTTP2`, the kubelet connects using HTTP/2 cleartext
(h2c) — HTTP/2 over plain TCP without TLS. The following configurations aren't
supported:

*   `protocol: HTTP2` and `scheme: HTTPS`
*   `protocol: HTTP2` and a value in the `host` field

If the feature gate is disabled, the API server removes the `protocol`
field from new or updated Pods without returning an error. The probe then uses
HTTP/1.1, and it fails if your endpoint only serves h2c.

## Define a TCP liveness and readiness probe {#define-a-tcp-liveness-probe}

A third type of liveness probe uses a TCP socket. With this configuration, the
kubelet attempts to open a socket to your container on the specified port.
If it can establish a connection, the container is considered healthy. If it
can't, the probe has failed.

{{% code_sample file="pods/probe/tcp-liveness-readiness.yaml" %}}

As you can see, configuration for a TCP check is quite similar to an HTTP check.
This example uses both readiness and liveness probes. With `initialDelaySeconds`
set to 15, the kubelet runs the first liveness probe 15 seconds after the
container starts. This probe attempts to connect to the `goproxy` container on
port 8080. If the liveness probe fails, the container is restarted. With
`periodSeconds` set to 10, the kubelet runs this check every 10 seconds.

In addition to the liveness probe, this configuration includes a readiness
probe. The kubelet runs the first readiness probe 15 seconds after the
container starts. Like the liveness probe, it attempts to connect to the
`goproxy` container on port 8080. If the probe succeeds, the Pod is marked as
ready and receives traffic from Services. If the readiness probe fails, the Pod
is marked unready and receives no traffic from any Service. Unlike a failed
liveness probe, a failed readiness probe does not restart the container.

To try the TCP liveness check, create a Pod:

```shell
kubectl apply -f https://k8s.io/examples/pods/probe/tcp-liveness-readiness.yaml
```

After 15 seconds, view Pod events to verify that the probes are succeeding:

```shell
kubectl describe pod goproxy
```

The events should contain no `Unhealthy` warnings, and `kubectl get pod goproxy`
shows `1/1` under `READY`.

## Clean up

The demo Pods in this page keep running (and, for the liveness demos, keep
restarting). Delete them when you're done:

```shell
kubectl delete pod liveness-exec liveness-http goproxy
```
````
