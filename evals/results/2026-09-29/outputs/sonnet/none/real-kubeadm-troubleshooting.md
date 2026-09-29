---
title: Troubleshooting kubeadm
content_type: concept
weight: 20
---

<!-- overview -->

As with any program, you might run into an error installing or running kubeadm.
This page lists common failure scenarios. For each one it gives the message or symptom you see, the cause, and steps that can help you fix the problem.

If your problem is not listed below, follow these steps:

- If you think your problem is a bug with kubeadm:
  - Go to [github.com/kubernetes/kubeadm](https://github.com/kubernetes/kubeadm/issues) and search for existing issues.
  - If no issue exists, please [open one](https://github.com/kubernetes/kubeadm/issues/new) and follow the issue template.

- If you are unsure about how kubeadm works, you can ask on [Slack](https://slack.k8s.io/) in `#kubeadm`,
  or open a question on [StackOverflow](https://stackoverflow.com/questions/tagged/kubernetes). Please include
  relevant tags like `#kubernetes` and `#kubeadm` so folks can help you.

<!-- body -->

## Find your error

| What you see | Go to |
|---|---|
| `kubeadm join` from v1.18 cannot join a cluster created by kubeadm v1.17 | [Cannot join a v1.18 Node to a v1.17 cluster](#not-possible-to-join-a-v118-node-to-a-v117-cluster-due-to-missing-rbac) |
| `[preflight] WARNING: ebtables not found in system path` or `[preflight] WARNING: ethtool not found in system path` | [ebtables or ethtool not found](#ebtables-or-some-similar-executable-not-found-during-installation) |
| `kubeadm init` hangs after `[apiclient] Created API client, waiting for the control plane to become ready` | [kubeadm blocks waiting for control plane](#kubeadm-blocks-waiting-for-control-plane-during-installation) |
| `kubeadm reset` hangs after `[reset] Removing kubernetes-managed containers` | [kubeadm blocks when removing managed containers](#kubeadm-blocks-when-removing-managed-containers) |
| Pods in `RunContainerError`, `CrashLoopBackOff` or `Error` state | [Pods in RunContainerError, CrashLoopBackOff or Error state](#pods-in-runcontainererror-crashloopbackoff-or-error-state) |
| `coredns` stuck in `Pending` | [coredns is stuck in the Pending state](#coredns-is-stuck-in-the-pending-state) |
| `HostPort` services do not work | [HostPort services do not work](#hostport-services-do-not-work) |
| Pods cannot reach themselves or other pods through a Service IP | [Pods are not accessible via their Service IP](#pods-are-not-accessible-via-their-service-ip) |
| `Unable to connect to the server: x509: certificate signed by unknown authority ...` | [TLS certificate errors](#tls-certificate-errors) |

## Not possible to join a v1.18 Node to a v1.17 cluster due to missing RBAC

**What you see:** `kubeadm join` from v1.18 cannot join a cluster that was created by kubeadm v1.17.
The page does not quote the exact error text for this case.

**Cause:** In v1.18, kubeadm added a check that prevents joining a Node if a Node with the same name already exists.
That check required adding RBAC so the bootstrap-token user can GET a Node object.
A cluster created by kubeadm v1.17 does not have that RBAC.

**What to do:** Use one of these two workarounds.

- Run `kubeadm init phase bootstrap-token` on a control-plane node, using kubeadm v1.18.
  This also enables the rest of the bootstrap-token permissions.

- Or apply the following RBAC manually using `kubectl apply -f ...`:

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

## `ebtables` or some similar executable not found during installation

**What you see:** These warnings while running `kubeadm init`:

```console
[preflight] WARNING: ebtables not found in system path
[preflight] WARNING: ethtool not found in system path
```

**Cause:** You may be missing `ebtables`, `ethtool` or a similar executable on your node.

**What to do:** Install them:

- Ubuntu/Debian: `apt install ebtables ethtool`
- CentOS/Fedora: `dnf install ebtables ethtool`

## kubeadm blocks waiting for control plane during installation

**What you see:** `kubeadm init` hangs after printing this line:

```console
[apiclient] Created API client, waiting for the control plane to become ready
```

**Cause:** Several problems can cause this. The most common are:

- Network connection problems.
- Control plane containers that are crashlooping or hanging.

**What to do:** The page gives no single fix. It gives checks for each cause:

- Check that your machine has full network connectivity before continuing.
- Run `docker ps`, then investigate each container with `docker logs`.
  For other container runtimes, see
  [Debugging Kubernetes nodes with crictl](/docs/tasks/debug/debug-cluster/crictl/).

## kubeadm blocks when removing managed containers

**What you see:** `sudo kubeadm reset` stops making progress after the last line below:

```console
[preflight] Running pre-flight checks
[reset] Stopping the kubelet service
[reset] Unmounting mounted directories in "/var/lib/kubelet"
[reset] Removing kubernetes-managed containers
```

**Cause:** The container runtime has halted and does not remove any Kubernetes-managed containers.

**What to do:** Restart the container runtime, then re-run `kubeadm reset`.
You can also use `crictl` to debug the state of the container runtime. See
[Debugging Kubernetes nodes with crictl](/docs/tasks/debug/debug-cluster/crictl/).
The page calls this "a possible solution", not a guaranteed one.

## Pods in `RunContainerError`, `CrashLoopBackOff` or `Error` state

**What you see:** Pods in the `RunContainerError`, `CrashLoopBackOff` or `Error` state.
Right after `kubeadm init` there should not be any pods in these states.

**Cause and what to do:** This depends on when you see it.

- **Right after `kubeadm init`:** Open an issue in the kubeadm repo.
  (`coredns`, or `kube-dns`, should be in the `Pending` state until you have deployed the network add-on.
  That is normal. See [below](#coredns-is-stuck-in-the-pending-state).)
- **After deploying the network add-on, with nothing happening to `coredns` (or `kube-dns`):**
  The Pod Network add-on you installed is very likely broken somehow.
  You might have to grant it more RBAC privileges or use a newer version.
  File an issue in the Pod Network provider's issue tracker and get the issue triaged there.

## `coredns` is stuck in the `Pending` state

**What you see:** `coredns` (or `kube-dns`) stays in `Pending`.

**Cause:** This is **expected** and part of the design. kubeadm is network provider-agnostic, so the admin
chooses and installs the pod network add-on. CoreDNS cannot be fully deployed until a Pod Network is installed.

**What to do:** [Install the pod network add-on](/docs/concepts/cluster-administration/addons/) of your choice.

## `HostPort` services do not work

**What you see:** Services that use `HostPort` (or `HostIP`) do not work.
The page does not quote an error message.

**Cause:** `HostPort` and `HostIP` functionality is available depending on your Pod Network provider.
Calico, Canal, and Flannel CNI providers are verified to support HostPort.

**What to do:**

- Contact the author of the Pod Network add-on to find out whether `HostPort` and `HostIP` are available.
- If your network provider does not support the portmap CNI plugin, you may need to use the
  [NodePort feature of services](/docs/concepts/services-networking/service/#type-nodeport)
  or use `HostNetwork=true`.
- For more information, see the
  [CNI portmap documentation](https://github.com/containernetworking/plugins/blob/master/plugins/meta/portmap/README.md).

## Pods are not accessible via their Service IP

**What you see:** Pods cannot be reached through their Service IP. The page does not quote an error message.

**Cause and what to do:** There are two possible causes.

- **The network add-on does not enable hairpin mode.**
  Many network add-ons do not yet enable
  [hairpin mode](/docs/tasks/debug/debug-application/debug-service/#a-pod-fails-to-reach-itself-via-the-service-ip),
  which allows pods to access themselves via their Service IP. This is related to
  [CNI](https://github.com/containernetworking/cni/issues/476).
  The page offers no fix here. Contact the network add-on provider for the latest status of their hairpin mode support.

- **You are using VirtualBox (directly or via Vagrant).**
  Make sure `hostname -i` returns a routable IP address. By default, the first
  interface is connected to a non-routable host-only network. A workaround
  is to modify `/etc/hosts`. See this
  [Vagrantfile](https://github.com/errordeveloper/k8s-playground/blob/22dd39dfc06111235620e6c4404a96ae146f26fd/Vagrantfile#L11)
  for an example.

## TLS certificate errors

**What you see:**

```none
# kubectl get pods
Unable to connect to the server: x509: certificate signed by unknown authority (possibly because of "crypto/rsa: verification error" while trying to verify candidate authority certificate "kubernetes")
```

**Cause:** A possible certificate mismatch. The page does not say what typically causes the mismatch.

**What to do:** Try these, in any order:

- Verify that the `$HOME/.kube/config` file contains a valid certificate, and
  regenerate a certificate if necessary. (The page does not say how to regenerate it.)
  The certificates in a kubeconfig file are base64 encoded.
  Use `base64 --decode` to decode the certificate and `openssl x509 -text -noout` to view its information.

- Unset the `KUBECONFIG` environment variable:

  ```sh
  unset KUBECONFIG
  ```

  Or set it to the default `KUBECONFIG` location:

  ```sh
  export KUBECONFIG=/etc/kubernetes/admin.conf
  ```

- Or overwrite the existing `kubeconfig` for the "admin" user:

  ```sh
  mv $HOME/.kube $HOME/.kube.bak
  mkdir $HOME/.kube
  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
  sudo chown $(id -u):$(id -g) $HOME/.kube/config
  ```
