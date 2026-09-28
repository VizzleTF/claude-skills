id: real-k8s-probes
lang: en
kind: review
expect: how-to
core: false
fixtures: real-k8s-probes/
expect_notes:
- Any claim the review makes about probe behaviour matches the page; the review does not invent Kubernetes fields or defaults
- The review points to specific headings or quotes and gives a concrete fix for each finding
facts:
- The fixture is an excerpt of the Kubernetes task page "Configure Liveness, Readiness and Startup Probes"; sections after the TCP liveness probe were cut for the eval
- The page is a task page, which is a how-to for readers who already run workloads on Kubernetes
- In the exec example the container creates /tmp/healthy, removes it after 30 seconds, and the probe runs cat /tmp/healthy
- In the exec example periodSeconds is 5; in the HTTP example periodSeconds is 3
- The prerequisites section is a Hugo include shortcode, not visible text

Review the attached page from the Kubernetes docs, `configure-liveness-readiness-startup-probes.md`. Its readers are application developers who already deploy to Kubernetes and need to add a probe to their Pod today. It is an excerpt: everything after the TCP probe section was cut, so don't report those sections as missing.

Tell me what gets in the reader's way and how to fix it. Point to the heading or quote the sentence for each finding.
