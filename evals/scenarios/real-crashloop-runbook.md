id: real-crashloop-runbook
lang: en
kind: update
expect: runbook
core: false
fixtures: real-crashloop-runbook/
expect_notes:
- The rework marks the missing escalation contact as a gap to fill instead of inventing a team or channel
- Any command added in the rework is valid kubectl syntax
facts:
- The source is the KubePodCrashLooping runbook from the prometheus-operator runbooks repository
- The alert means a pod is in CrashLoop: the app dies or is unresponsive and Kubernetes keeps restarting it
- The source's impact: service degradation or unavailability, rolling upgrades blocked, some apps skip required tasks such as data migrations
- The source's diagnosis commands are kubectl -n $NAMESPACE get pod $POD, kubectl -n $NAMESPACE describe pod $POD and kubectl -n $NAMESPACE logs $POD -c $CONTAINER
- The source's mitigation is only "talk with developers or read documentation about the app" and a link to Debugging Pods
- The source names no escalation contact
- The source has a typo "Docerkfile"

The attached `KubePodCrashLooping.md` is a public runbook for the KubePodCrashLooping alert. Rework it so an on-call engineer paged at 3 a.m. can act on it: commands they can copy, clear placeholders, what to check first, what to do, how to confirm it worked, and who to call. Where the source doesn't give something a runbook needs, mark the gap for us to fill in; don't invent our team names or channels.
