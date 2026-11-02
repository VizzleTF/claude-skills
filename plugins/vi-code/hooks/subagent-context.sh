#!/bin/sh
# SubagentStart ignores plain stdout, so wrap rules.md in hookSpecificOutput.additionalContext JSON.
awk 'BEGIN { printf "{\"hookSpecificOutput\":{\"hookEventName\":\"SubagentStart\",\"additionalContext\":\"" }
{ gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\t/, "\\t"); printf "%s\\n", $0 }
END { printf "\"}}\n" }' "$(dirname "$0")/../rules.md"
