## Findings

1. **Page start, before "Define a liveness command":** The reader must pick exec, HTTP or TCP, but the page never says what the choices are or when each one succeeds. The success rules are scattered across three sections. Add a short "Choose a probe mechanism" section with a table of mechanism, field and success condition.
2. **Same place; "Define a TCP liveness probe":** Readiness is explained only inside the TCP liveness example. The page never says how a failing liveness probe differs from a failing readiness probe. State the difference in the opening. Add the readiness behavior to the table.
3. **Last sentence of the page, "After 15 seconds, view Pod events to verify that liveness probes:":** The sentence is cut off and shows no expected result. Replace it with "…to verify that the probes pass. The events contain no `Unhealthy` warnings."
4. **"The kubelet will continue to run this check every 10 seconds":** The prose says 10 seconds for the liveness probe. The upstream `tcp-liveness-readiness.yaml` sets the liveness `periodSeconds` to 20. I couldn't check the included file, so this is not verified. Check it against the YAML. I removed the number from the rewrite.
5. **Output "Unhealthy 10s (x3 over 20s)":** The page never says why there are three failures before the restart. Add one sentence: the kubelet restarts the container after `failureThreshold` consecutive failures, and the default is 3.
6. **Whole page, no cleanup:** The demo Pods restart forever, and the reader is on a real cluster. Add a `kubectl delete pod` step at the end.
7. **"Define a liveness HTTP request", the Go `/healthz` listing:** The server source is unrelated to the reader's own app. Remove it and keep the link to `server.go`.
8. **"Use HTTP/2 cleartext (h2c)":** The feature gate must be on for both `kube-apiserver` and `kubelet`. Without it the API server silently drops `protocol`. That warning comes last. Move it first, since many readers can't change gates.
9. **"In releases after v1.13, local HTTP proxy environment variable settings do not affect…":** This is an orphan paragraph with a long-obsolete version. Reword it as a plain fact.
10. **Wording throughout:**
    - The page uses "health checks" and "probes" for the same thing.
    - It writes "Pod", "pod" and "Container" inconsistently.
    - It uses ordinals ("A third type") that break when sections move.
    - It has filler openers ("In the configuration file, you can see that", "As you can see").

    Use "probe" and "Pod" everywhere. Drop the ordinals and the filler.

**Verdict:** ready after the listed fixes (item 4 needs your check against the YAML).

## Final document

````markdown
---
title: Configure Liveness, Readiness and Startup Probes
content_type: task
weight: 140
---

<!-- overview -->

This page shows how to add liveness, readiness and startup probes to a
container. The examples use disposable Pods, so you can see each probe fail
and recover before you copy the fields into your own manifest.

A failing liveness probe makes the kubelet restart the container. A failing
readiness probe removes the Pod from Service endpoints and doesn't restart it.

For more information about probes, see
[Liveness, Readiness and Startup Probes](/docs/concepts/workloads/pods/probes).

## {{% heading "prerequisites" %}}

{{< include "task-tutorial-prereqs.md" >}}

<!-- steps -->

## Choose a probe mechanism

Each probe uses one of these mechanisms. All of them accept `periodSeconds`
and `initialDelaySeconds`.

| Mechanism | Field | The probe succeeds when |
|---|---|---|
| Command | `exec` | The command exits with code 0. |
| HTTP request | `httpGet` | The response code is at least 200 and less than 400. |
| TCP connection | `tcpSocket` | The kubelet opens a connection to the port. |

If a probe fails `failureThreshold` times in a row (default 3), the kubelet
acts on it: it restarts the container for a liveness probe and marks the Pod
unready for a readiness probe.

## Define a liveness command

Many applications running for long periods of time eventually transition to
broken states, and cannot recover except by being restarted. Kubernetes provides
liveness probes to detect and remedy such situations.

In this exercise, you create a Pod that runs a container based on the
`registry.k8s.io/busybox:1.27.2` image. Here is the configuration file for the Pod:

{{% code_sample file="pods/probe/exec-liveness.yaml" %}}

The Pod has a single container.
The `periodSeconds` field specifies that the kubelet should perform a liveness
probe every 5 seconds. The `initialDelaySeconds` field tells the kubelet that it
should wait 5 seconds before performing the first probe. To perform a probe, the
kubelet executes the command `cat /tmp/healthy` in the target container. If the
command succeeds, it returns 0, and the kubelet considers the container to be alive and
healthy. If the command returns a non-zero value, the kubelet kills the container
and restarts it.

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

After 35 seconds, view the Pod events again:

```shell
kubectl describe pod liveness-exec
```

At the bottom of the output, there are messages indicating that the liveness
probes have failed, and the failed containers have been killed and recreated.
The `x3` in the `Unhealthy` line is the three consecutive failures
(`failureThreshold`) that trigger the restart.

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

Wait another 30 seconds, and verify that the container has been restarted:

```shell
kubectl get pod liveness-exec
```

The output shows that `RESTARTS` has been incremented. Note that the `RESTARTS` counter
increments as soon as a failed container comes back to the running state:

```none
NAME            READY     STATUS    RESTARTS   AGE
liveness-exec   1/1       Running   1          1m
```

Delete the Pod, which otherwise keeps restarting:

```shell
kubectl delete pod liveness-exec
```

## Define a liveness HTTP request

Another kind of liveness probe uses an HTTP GET request. Here is the configuration
file for a Pod that runs a container based on the `registry.k8s.io/e2e-test-images/agnhost` image.

{{% code_sample file="pods/probe/http-liveness.yaml" %}}

The Pod has a single container.
The `periodSeconds` field specifies that the kubelet should perform a liveness
probe every 3 seconds. The `initialDelaySeconds` field tells the kubelet that it
should wait 3 seconds before performing the first probe. To perform a probe, the
kubelet sends an HTTP GET request to the server that is running in the container
and listening on port 8080. If the handler for the server's `/healthz` path
returns a success code, the kubelet considers the container to be alive and
healthy. If the handler returns a failure code, the kubelet kills the container
and restarts it.

Any code greater than or equal to 200 and less than 400 indicates success. Any
other code indicates failure.

For the first 10 seconds that the container is alive, the `/healthz` handler
returns a status of 200. After that, the handler returns a status of 500. You can
see the source code for the server in
[server.go](https://github.com/kubernetes/kubernetes/blob/master/test/images/agnhost/liveness/server.go).

The kubelet sends the first probe 3 seconds after the container starts, so the
first probes succeed. After 10 seconds the probes fail, and the kubelet kills and
restarts the container.

To try the HTTP liveness probe, create a Pod:

```shell
kubectl apply -f https://k8s.io/examples/pods/probe/http-liveness.yaml
```

After 10 seconds, view Pod events to verify that liveness probes have failed and
the container has been restarted:

```shell
kubectl describe pod liveness-http
```

Local HTTP proxy environment variables don't affect HTTP probes.

Delete the Pod:

```shell
kubectl delete pod liveness-http
```

### Use HTTP/2 cleartext (h2c) with HTTP probes {#use-h2c-with-http-probes}

{{< feature-state feature_gate_name="H2CContainerProbe" >}}

The `protocol` field works only if the `H2CContainerProbe`
[feature gate](/docs/reference/command-line-tools-reference/feature-gates/) is
enabled on both the `kube-apiserver` and the `kubelet`. If the gate is disabled,
the API server silently removes `protocol` from new or updated Pods, and the
probe sends HTTP/1.1 requests.

By default the kubelet sends HTTP/1.1 requests when executing an HTTP probe.
If your application serves health endpoints only over HTTP/2 cleartext (h2c),
add the `protocol` field to the `httpGet` field in the probe specification and
set it to `HTTP2`.

{{% code_sample file="pods/probe/h2c-liveness.yaml" %}}

When `protocol` is set to `HTTP2`, the kubelet connects using h2c: HTTP/2 over
plain TCP without TLS. The following configurations aren't supported:

*   `protocol: HTTP2` and `scheme: HTTPS`
*   `protocol: HTTP2` and a value in the `host` field

## Define a TCP liveness probe

A TCP probe makes the kubelet try to open a socket to your container on the
specified port. If the connection succeeds, the container is healthy. If it
fails, the probe fails.

{{% code_sample file="pods/probe/tcp-liveness-readiness.yaml" %}}

The configuration for a TCP probe is similar to an HTTP probe.
This example uses both a readiness probe and a liveness probe. The kubelet runs
the first liveness probe 15 seconds after the container starts. The probe tries
to connect to the `goproxy` container on port 8080. If the liveness probe fails,
the container is restarted. The kubelet keeps running the probe at the interval
set by `periodSeconds`.

The readiness probe works the same way and also runs its first probe 15 seconds
after the container starts. If it succeeds, the Pod is marked ready and receives
traffic from Services. If it fails, the Pod is marked unready and receives no
traffic from any Service.

To try the TCP probes, create a Pod:

```shell
kubectl apply -f https://k8s.io/examples/pods/probe/tcp-liveness-readiness.yaml
```

After 15 seconds, view Pod events to verify that the probes pass:

```shell
kubectl describe pod goproxy
```

The events contain no `Unhealthy` warnings.

Delete the Pod:

```shell
kubectl delete pod goproxy
```
````
