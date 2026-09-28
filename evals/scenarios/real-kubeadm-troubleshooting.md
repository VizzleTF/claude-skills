id: real-kubeadm-troubleshooting
lang: en
kind: update
expect: troubleshooting
core: false
fixtures: real-kubeadm-troubleshooting/
expect_notes:
- Every error message or symptom quoted in the rework appears verbatim in the source
- The rework does not invent causes or fix commands that are not in the source
- Each entry keeps a symptom, a cause and an action
facts:
- The source is an excerpt of the Kubernetes page "Troubleshooting kubeadm", cut after the section "TLS certificate errors"
- One entry covers kubeadm init hanging after the line "[apiclient] Created API client, waiting for the control plane to become ready"; its causes are network connection problems and control plane containers crashlooping or hanging
- One entry covers a v1.18 node that cannot join a v1.17 cluster because of missing RBAC for the bootstrap-token user to GET Node objects

The attached `troubleshooting-kubeadm.md` is an excerpt of a Kubernetes docs page about kubeadm failures. People land here with an error on their screen and search the page for it.

Rework the excerpt so a reader can find their error fast: for each problem, the message or symptom exactly as they see it, the cause, and what to do. Use only what the page says. If an entry in the source has no clear action, say so instead of making one up.
