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
