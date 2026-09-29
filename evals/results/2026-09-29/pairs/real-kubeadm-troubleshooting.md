# Пара real-kubeadm-troubleshooting

Язык: en. Вид: update.

Запрос:

> The attached `troubleshooting-kubeadm.md` is an excerpt of a Kubernetes docs page about kubeadm failures. People land here with an error on their screen and search the page for it.
> 
> Rework the excerpt so a reader can find their error fast: for each problem, the message or symptom exactly as they see it, the cause, and what to do. Use only what the page says. If an entry in the source has no clear action, say so instead of making one up.

Факты:

- The source is an excerpt of the Kubernetes page "Troubleshooting kubeadm", cut after the section "TLS certificate errors"
- One entry covers kubeadm init hanging after the line "[apiclient] Created API client, waiting for the control plane to become ready"; its causes are network connection problems and control plane containers crashlooping or hanging
- One entry covers a v1.18 node that cannot join a v1.17 cluster because of missing RBAC for the bootstrap-token user to GET Node objects

Ожидания к ответу:

- Every error message or symptom quoted in the rework appears verbatim in the source
- The rework does not invent causes or fix commands that are not in the source
- Each entry keeps a symptom, a cause and an action

---

## X

# Troubleshooting kubeadm

Find the message or symptom you see, then read the cause and the action. Problems are grouped by where you meet them: `kubeadm init`, `kubeadm join` and `kubeadm reset`; Pods and networking after `kubeadm init`; and `kubectl` access.

## If your problem is not listed

- If you think it is a bug in kubeadm, search the [kubeadm issues](https://github.com/kubernetes/kubeadm/issues). If no issue exists, [open one](https://github.com/kubernetes/kubeadm/issues/new) and follow the issue template.
- If you are unsure how kubeadm works, ask in `#kubeadm` on [Slack](https://slack.k8s.io/) or on [StackOverflow](https://stackoverflow.com/questions/tagged/kubernetes). Add the tags `#kubernetes` and `#kubeadm`.

## Running `kubeadm init`, `join` and `reset`

| Message or symptom | Cause | Action |
|---|---|---|
| `[preflight] WARNING: ebtables not found in system path`<br>`[preflight] WARNING: ethtool not found in system path` | `ebtables`, `ethtool` or a similar executable is missing on the node. | Ubuntu/Debian: `apt install ebtables ethtool`. CentOS/Fedora: `dnf install ebtables ethtool`. |
| `kubeadm init` hangs after `[apiclient] Created API client, waiting for the control plane to become ready` | Not stated. The page names two common causes: network problems, or control plane containers that crash-loop or hang. | See [the control plane wait](#kubeadm-init-hangs-at-waiting-for-the-control-plane-to-become-ready). |
| `kubeadm reset` hangs at `[reset] Removing kubernetes-managed containers` | The container runtime has halted and does not remove the Kubernetes-managed containers. | Restart the container runtime, then run `kubeadm reset` again. To inspect the runtime, use `crictl`: [Debugging Kubernetes nodes with crictl](/docs/tasks/debug/debug-cluster/crictl/). |
| `kubeadm join` from v1.18 cannot join a cluster created by kubeadm v1.17. The page gives no error text. | v1.18 refuses to join a Node whose name already exists in the cluster. That check needs RBAC for the bootstrap-token user to GET a Node object, and a v1.17 cluster does not have it. | See [joining a v1.18 Node to a v1.17 cluster](#joining-a-v118-node-to-a-v117-cluster). |

### `kubeadm init` hangs at "waiting for the control plane to become ready"

The line is:

```console
[apiclient] Created API client, waiting for the control plane to become ready
```

The page does not give one cause. The most common are, in this order:

1. Network connection problems. Check that the machine has full network connectivity.
2. Control plane containers are crash-looping or hanging. Run `docker ps`, then run `docker logs` for each container. For another container runtime, see [Debugging Kubernetes nodes with crictl](/docs/tasks/debug/debug-cluster/crictl/).

### Joining a v1.18 Node to a v1.17 cluster

Do one of the following.

- On a control-plane node, run `kubeadm init phase bootstrap-token` with kubeadm v1.18. This also enables the rest of the bootstrap-token permissions.
- Save the following RBAC to a file and apply it with `kubectl apply -f <FILE>`:

  ```yaml
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRole
  metadata:
    name: kubeadm:get-nodes
  rules:
    - apiGroups:
        - ""
      resources:
        - nodes
      verbs:
        - get
  ---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRoleBinding
  metadata:
    name: kubeadm:get-nodes
  roleRef:
    apiGroup: rbac.authorization.k8s.io
    kind: ClusterRole
    name: kubeadm:get-nodes
  subjects:
    - apiGroup: rbac.authorization.k8s.io
      kind: Group
      name: system:bootstrappers:kubeadm:default-node-token
  ```

## Pods and networking after `kubeadm init`

| Message or symptom | Cause | Action |
|---|---|---|
| Pods in `RunContainerError`, `CrashLoopBackOff` or `Error` state **right after** `kubeadm init` | These states are not expected at this point. The page gives no cause. | Open an issue in the kubeadm repo. |
| Pods in `RunContainerError`, `CrashLoopBackOff` or `Error` state after you deployed the network add-on, and nothing happens to `coredns` (or `kube-dns`) | The Pod Network add-on is very likely broken. The page does not say how it is broken. | Grant the add-on more RBAC privileges or use a newer version. Then file an issue in the Pod Network provider's issue tracker. |
| `coredns` (or `kube-dns`) is in the `Pending` state | This is expected. kubeadm is network provider-agnostic, and CoreDNS is not fully deployed until a Pod Network is installed. | Nothing is wrong. To leave `Pending`, [install the pod network add-on](/docs/concepts/cluster-administration/addons/) of your choice. |
| `HostPort` services do not work | `HostPort` and `HostIP` are available only if your Pod Network provider supports them. Calico, Canal and Flannel CNI providers are verified to support `HostPort`. | Ask the author of your Pod Network add-on whether it supports `HostPort` and `HostIP`. If the provider does not support the portmap CNI plugin, use the [NodePort feature of services](/docs/concepts/services-networking/service/#type-nodeport) or `HostNetwork=true`. See the [CNI portmap documentation](https://github.com/containernetworking/plugins/blob/master/plugins/meta/portmap/README.md). |
| Pods are not accessible via their Service IP | Either of the two causes below. | See [Pods are not accessible via their Service IP](#pods-are-not-accessible-via-their-service-ip). |

### Pods are not accessible via their Service IP

Check these causes:

- **The network add-on does not enable hairpin mode.** Many add-ons do not yet enable [hairpin mode](/docs/tasks/debug/debug-application/debug-service/#a-pod-fails-to-reach-itself-via-the-service-ip), which lets a Pod reach itself via its Service IP. This is a [CNI issue](https://github.com/containernetworking/cni/issues/476). Ask the network add-on provider for the status of their hairpin support.
- **You use VirtualBox (directly or via Vagrant) and `hostname -i` does not return a routable IP address.** By default, the first interface is connected to a non-routable host-only network. Work around it by modifying `/etc/hosts`. See this [Vagrantfile](https://github.com/errordeveloper/k8s-playground/blob/22dd39dfc06111235620e6c4404a96ae146f26fd/Vagrantfile#L11) for an example.

## Accessing the cluster with `kubectl`

| Message or symptom | Cause | Action |
|---|---|---|
| `Unable to connect to the server: x509: certificate signed by unknown authority (possibly because of "crypto/rsa: verification error" while trying to verify candidate authority certificate "kubernetes")` | Possibly a certificate mismatch. The page says only "possible". | See [TLS certificate errors](#tls-certificate-errors). |

### TLS certificate errors

The error appears when you run `kubectl get pods`:

```none
# kubectl get pods
Unable to connect to the server: x509: certificate signed by unknown authority (possibly because of "crypto/rsa: verification error" while trying to verify candidate authority certificate "kubernetes")
```

Try these in order:

1. Verify that `$HOME/.kube/config` contains a valid certificate, and regenerate the certificate if necessary. The certificates in a kubeconfig file are base64 encoded. Decode one with `base64 --decode` and view it with `openssl x509 -text -noout`.
2. Unset the `KUBECONFIG` environment variable:

   ```sh
   unset KUBECONFIG
   ```

   Or set it to the default location:

   ```sh
   export KUBECONFIG=/etc/kubernetes/admin.conf
   ```

3. Overwrite the existing kubeconfig for the "admin" user:

   ```sh
   mv $HOME/.kube $HOME/.kube.bak
   mkdir $HOME/.kube
   sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
   sudo chown $(id -u):$(id -g) $HOME/.kube/config
   ```

---

## Y

# Troubleshooting kubeadm

```markdown
---
title: Troubleshooting kubeadm
content_type: concept
weight: 20
---

<!-- overview -->

Find the message or symptom you see below. Each entry gives the cause and what to do.
If your problem is not listed, see [Your problem is not listed](#your-problem-is-not-listed).

<!-- body -->

## Node v1.18 cannot join a v1.17 cluster (missing RBAC)

**You see:** `kubeadm join` from v1.18 cannot join a cluster created by kubeadm v1.17.
The page gives no error text.

**Cause:** kubeadm v1.18 refuses to join a Node if a Node with the same name already exists.
That check needs RBAC that lets the bootstrap-token user GET a Node object.
Clusters created by v1.17 lack this RBAC.

**Fix:** Choose one option.

- On a control-plane node, run `kubeadm init phase bootstrap-token` using kubeadm v1.18.
  This also enables the rest of the bootstrap-token permissions.
- Apply this RBAC manually. Save it to a file and run `kubectl apply -f <file>`:

  ```yaml
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRole
  metadata:
    name: kubeadm:get-nodes
  rules:
    - apiGroups:
        - ""
      resources:
        - nodes
      verbs:
        - get
  ---
  apiVersion: rbac.authorization.k8s.io/v1
  kind: ClusterRoleBinding
  metadata:
    name: kubeadm:get-nodes
  roleRef:
    apiGroup: rbac.authorization.k8s.io
    kind: ClusterRole
    name: kubeadm:get-nodes
  subjects:
    - apiGroup: rbac.authorization.k8s.io
      kind: Group
      name: system:bootstrappers:kubeadm:default-node-token
  ```

## `ebtables` or `ethtool` not found during installation

**You see:** these warnings from `kubeadm init`:

```console
[preflight] WARNING: ebtables not found in system path
[preflight] WARNING: ethtool not found in system path
```

**Cause:** `ebtables`, `ethtool`, or a similar executable is missing on the node.

**Fix:** Install them.

- Ubuntu/Debian: `apt install ebtables ethtool`
- CentOS/Fedora: `dnf install ebtables ethtool`

## `kubeadm init` hangs at "waiting for the control plane to become ready"

**You see:** `kubeadm init` stops after this line:

```console
[apiclient] Created API client, waiting for the control plane to become ready
```

**Cause:** Several problems can cause this. The most common are:

- Network connection problems.
- Control plane containers that are crashlooping or hanging.

**Fix:** The page gives checks, not fixes.

- Check that your machine has full network connectivity.
- Run `docker ps`, then investigate each container with `docker logs <container>`.
  For other container runtimes, see
  [Debugging Kubernetes nodes with crictl](/docs/tasks/debug/debug-cluster/crictl/).

The page does not say what to do once you find a failing container.

## `kubeadm reset` hangs at "Removing kubernetes-managed containers"

**You see:** `sudo kubeadm reset` stops after this output:

```console
[preflight] Running pre-flight checks
[reset] Stopping the kubelet service
[reset] Unmounting mounted directories in "/var/lib/kubelet"
[reset] Removing kubernetes-managed containers
(block)
```

**Cause:** The container runtime has halted and does not remove any Kubernetes-managed containers.

**Fix:** Restart the container runtime, then run `kubeadm reset` again.
To debug the runtime state, use `crictl`. See
[Debugging Kubernetes nodes with crictl](/docs/tasks/debug/debug-cluster/crictl/).

## Pods in `RunContainerError`, `CrashLoopBackOff` or `Error` state

**You see:** Pods in one of these states. What to do depends on when it happens.

| When | Cause | Fix |
|---|---|---|
| Right after `kubeadm init` | Pods should not be in these states at this point. | Open an issue in the kubeadm repo. |
| After you deployed the network add-on, and nothing happens to `coredns` (or `kube-dns`) | Very likely the Pod Network add-on you installed is broken. | Grant the add-on more RBAC privileges, or use a newer version. File an issue in the Pod Network provider's issue tracker. |

`coredns` (or `kube-dns`) in `Pending` state before you deploy the network add-on is normal.
See the next entry.

## `coredns` is stuck in the `Pending` state

**You see:** `coredns` (or `kube-dns`) in `Pending`.

**Cause:** This is **expected**, not an error. kubeadm is network provider-agnostic,
so you choose and install the pod network add-on yourself.
CoreDNS cannot be fully deployed until a Pod Network is installed.

**Fix:** [Install the pod network add-on](/docs/concepts/cluster-administration/addons/) of your choice.

## `HostPort` services do not work

**You see:** `HostPort` (or `HostIP`) services do not work. The page gives no error text.

**Cause:** `HostPort` and `HostIP` support depends on your Pod Network provider.
Calico, Canal, and Flannel CNI providers are verified to support `HostPort`.

**Fix:**

1. Ask the author of your Pod Network add-on whether `HostPort` and `HostIP` are available.
   See also the
   [CNI portmap documentation](https://github.com/containernetworking/plugins/blob/master/plugins/meta/portmap/README.md).
2. If your provider does not support the portmap CNI plugin, use the
   [NodePort feature of services](/docs/concepts/services-networking/service/#type-nodeport)
   or `HostNetwork=true`.

## Pods are not accessible via their Service IP

**You see:** Pods cannot reach a Service IP. The page gives no error text.
There are two causes.

**Cause 1: the network add-on does not enable hairpin mode.**
[Hairpin mode](/docs/tasks/debug/debug-application/debug-service/#a-pod-fails-to-reach-itself-via-the-service-ip)
lets a pod reach itself via its Service IP. Many network add-ons do not yet enable it.
This is a [CNI issue](https://github.com/containernetworking/cni/issues/476).

**Fix:** Ask the network add-on provider for the current status of their hairpin mode support.
The page gives no workaround.

**Cause 2: VirtualBox (directly or via Vagrant).**
By default the first interface is connected to a non-routable host-only network,
so `hostname -i` does not return a routable IP address.

**Fix:** Make `hostname -i` return a routable IP address. One workaround is to modify `/etc/hosts`.
See this
[Vagrantfile](https://github.com/errordeveloper/k8s-playground/blob/22dd39dfc06111235620e6c4404a96ae146f26fd/Vagrantfile#L11)
for an example.

## TLS certificate error: `x509: certificate signed by unknown authority`

**You see:**

```none
# kubectl get pods
Unable to connect to the server: x509: certificate signed by unknown authority (possibly because of "crypto/rsa: verification error" while trying to verify candidate authority certificate "kubernetes")
```

**Cause:** A possible certificate mismatch.

**Fix:** Use any of these options. The page does not rank them.

- Verify that `$HOME/.kube/config` contains a valid certificate, and regenerate it if necessary.
  The page does not say how to regenerate it.
  Certificates in a kubeconfig file are base64 encoded.
  Decode one with `base64 --decode`, and view it with `openssl x509 -text -noout`.
- Unset the `KUBECONFIG` environment variable:

  ```sh
  unset KUBECONFIG
  ```

  Or set it to the default location:

  ```sh
  export KUBECONFIG=/etc/kubernetes/admin.conf
  ```

- Overwrite the existing kubeconfig for the "admin" user. This moves your current `$HOME/.kube` to `$HOME/.kube.bak`:

  ```sh
  mv $HOME/.kube $HOME/.kube.bak
  mkdir $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
  ```

## Your problem is not listed

- If you think it is a bug in kubeadm, search existing issues at
  [github.com/kubernetes/kubeadm](https://github.com/kubernetes/kubeadm/issues).
  If none exists, [open one](https://github.com/kubernetes/kubeadm/issues/new) and follow the issue template.
- If you are unsure how kubeadm works, ask in `#kubeadm` on [Slack](https://slack.k8s.io/),
  or open a question on [StackOverflow](https://stackoverflow.com/questions/tagged/kubernetes).
  Include the tags `#kubernetes` and `#kubeadm` so people can help you.
```

The source gives no error text for the v1.18 join failure, `HostPort` and Service IP entries, so those entries say that instead of inventing a message. I made three edits beyond restructuring:

- I fixed the intro's grammar.
- I wrote `<file>` where the source had `...` in `kubectl apply -f`.
- I added a note that the last TLS fix moves `$HOME/.kube` to `$HOME/.kube.bak`.

The v1.18/v1.17 entry is version-specific and may be stale. A maintainer should decide whether to keep it.
