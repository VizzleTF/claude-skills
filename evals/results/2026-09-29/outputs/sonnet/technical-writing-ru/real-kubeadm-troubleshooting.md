# Troubleshooting kubeadm

```yaml
title: Troubleshooting kubeadm
content_type: concept
weight: 20
```

This page lists common kubeadm failures. Find your error message or symptom below. Each entry gives what you see, the cause, and what to do.

If your problem is not listed:

- **You think it is a kubeadm bug.** Search the existing issues at [github.com/kubernetes/kubeadm](https://github.com/kubernetes/kubeadm/issues). If none matches, [open a new issue](https://github.com/kubernetes/kubeadm/issues/new) and follow the issue template.
- **You are unsure how kubeadm works.** Ask in `#kubeadm` on [Slack](https://slack.k8s.io/), or post a question on [StackOverflow](https://stackoverflow.com/questions/tagged/kubernetes). Add the tags `#kubernetes` and `#kubeadm` so people can find it.

## Index

| What you see | Entry |
|---|---|
| `kubeadm join` from v1.18 cannot join a cluster created by kubeadm v1.17 | [Join fails: v1.18 Node, v1.17 cluster](#join-fails-v118-node-v117-cluster) |
| `[preflight] WARNING: ebtables not found in system path` | [ebtables or ethtool not found](#ebtables-or-ethtool-not-found) |
| `kubeadm init` hangs after `waiting for the control plane to become ready` | [kubeadm init hangs](#kubeadm-init-hangs-waiting-for-the-control-plane) |
| `kubeadm reset` hangs after `Removing kubernetes-managed containers` | [kubeadm reset hangs](#kubeadm-reset-hangs-on-removing-managed-containers) |
| Pods in `RunContainerError`, `CrashLoopBackOff` or `Error` | [Pods in error states](#pods-in-runcontainererror-crashloopbackoff-or-error-state) |
| `coredns` is `Pending` | [coredns is Pending](#coredns-is-stuck-in-the-pending-state) |
| `HostPort` services do not work | [HostPort services](#hostport-services-do-not-work) |
| A Pod cannot reach itself via its Service IP | [Pods not reachable via Service IP](#pods-are-not-accessible-via-their-service-ip) |
| `x509: certificate signed by unknown authority` | [TLS certificate errors](#tls-certificate-errors) |

## Join fails: v1.18 Node, v1.17 cluster

**Symptom:** `kubeadm join` from v1.18 cannot join a cluster created by kubeadm v1.17. The page does not quote the error message.

**Cause:** Since v1.18, kubeadm refuses to join a Node if a Node with the same name already exists. To check this, the bootstrap-token user must be able to GET a Node object, which needs an RBAC rule. Clusters created by kubeadm v1.17 don't have that rule.

**Fix:** Use either option.

- On a control-plane node, run `kubeadm init phase bootstrap-token` with kubeadm v1.18. This also enables the rest of the bootstrap-token permissions.
- Or apply the RBAC manually with `kubectl apply -f ...`:

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

## ebtables or ethtool not found

**You see**, while running `kubeadm init`:

```console
[preflight] WARNING: ebtables not found in system path
[preflight] WARNING: ethtool not found in system path
```

**Cause:** `ebtables`, `ethtool` or a similar executable is missing on the node.

**Fix:** Install them.

- Ubuntu/Debian: `apt install ebtables ethtool`
- CentOS/Fedora: `dnf install ebtables ethtool`

## kubeadm init hangs waiting for the control plane

**You see:** `kubeadm init` stops after printing:

```console
[apiclient] Created API client, waiting for the control plane to become ready
```

**Cause:** Several problems can cause this. The most common are:

- Network connection problems.
- Control plane containers that are crashlooping or hanging.

**Fix:**

- Check that your machine has full network connectivity.
- Run `docker ps`, then run `docker logs` on each container to investigate. For other container runtimes, see [Debugging Kubernetes nodes with crictl](/docs/tasks/debug/debug-cluster/crictl/).

## kubeadm reset hangs on removing managed containers

**You see:**

```shell
sudo kubeadm reset
```

```console
[preflight] Running pre-flight checks
[reset] Stopping the kubelet service
[reset] Unmounting mounted directories in "/var/lib/kubelet"
[reset] Removing kubernetes-managed containers
(block)
```

**Cause:** The container runtime has halted and does not remove the Kubernetes-managed containers.

**Fix:** Restart the container runtime, then run `kubeadm reset` again. To inspect the runtime's state, use `crictl`. See [Debugging Kubernetes nodes with crictl](/docs/tasks/debug/debug-cluster/crictl/).

## Pods in `RunContainerError`, `CrashLoopBackOff` or `Error` state

**You see:** Pods in one of these states. Right after `kubeadm init` there should be none.

**Cause and fix depend on when you see them:**

- **Right after `kubeadm init`:** Open an issue in the kubeadm repo. Note that `coredns` (or `kube-dns`) should be `Pending` until you deploy the network add-on. That is not an error (see the next entry).
- **After deploying the network add-on, and `coredns` (or `kube-dns`) is still not running:** The Pod Network add-on you installed is very likely broken. You might have to grant it more RBAC privileges or use a newer version. File an issue in the Pod Network provider's issue tracker.

## `coredns` is stuck in the `Pending` state

**Cause:** This is expected and part of the design. kubeadm is network provider-agnostic, and CoreDNS can't be fully deployed until a Pod Network exists.

**Fix:** [Install the pod network add-on](/docs/concepts/cluster-administration/addons/) of your choice. No other action is described.

## `HostPort` services do not work

**Cause:** `HostPort` and `HostIP` support depends on your Pod Network provider. Calico, Canal and Flannel CNI providers are verified to support HostPort.

**Fix:**

- Ask the author of your Pod Network add-on whether `HostPort` and `HostIP` are available. See the [CNI portmap documentation](https://github.com/containernetworking/plugins/blob/master/plugins/meta/portmap/README.md).
- If your provider does not support the portmap CNI plugin, you may need to use the [NodePort feature of services](/docs/concepts/services-networking/service/#type-nodeport) or `HostNetwork=true`.

## Pods are not accessible via their Service IP

**You see:** A Pod can't reach itself through its Service IP. The page names two possible causes.

- **The network add-on doesn't enable [hairpin mode](/docs/tasks/debug/debug-application/debug-service/#a-pod-fails-to-reach-itself-via-the-service-ip).** Many add-ons don't yet. This is a [CNI issue](https://github.com/containernetworking/cni/issues/476). The page gives no fix beyond asking the add-on provider for the current status of their hairpin mode support.
- **You are using VirtualBox, directly or via Vagrant.** Make sure `hostname -i` returns a routable IP address. By default the first interface is connected to a non-routable host-only network. A workaround is to modify `/etc/hosts`. See this [Vagrantfile](https://github.com/errordeveloper/k8s-playground/blob/22dd39dfc06111235620e6c4404a96ae146f26fd/Vagrantfile#L11) for an example.

## TLS certificate errors

**You see:**

```none
# kubectl get pods
Unable to connect to the server: x509: certificate signed by unknown authority (possibly because of "crypto/rsa: verification error" while trying to verify candidate authority certificate "kubernetes")
```

**Cause:** A possible certificate mismatch.

**Fix:** Try these, in any order:

- Check that `$HOME/.kube/config` contains a valid certificate, and regenerate it if necessary. Certificates in a kubeconfig file are base64 encoded. Decode one with `base64 --decode` and view it with `openssl x509 -text -noout`.
- Unset the `KUBECONFIG` environment variable:

  ```sh
  unset KUBECONFIG
  ```

  Or set it to the default location:

  ```sh
  export KUBECONFIG=/etc/kubernetes/admin.conf
  ```

- Overwrite the existing kubeconfig for the "admin" user:

  ```sh
  mv $HOME/.kube $HOME/.kube.bak
  mkdir $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
  ```
