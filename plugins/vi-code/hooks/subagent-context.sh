#!/bin/sh
# SubagentStart ignores plain stdout, so wrap rules.md in hookSpecificOutput.additionalContext JSON.
f="$(dirname "$0")/../rules.md"
# A missing rules.md must not break every subagent start.
[ -r "$f" ] || exit 0
awk 'BEGIN { printf "{\"hookSpecificOutput\":{\"hookEventName\":\"SubagentStart\",\"additionalContext\":\"" }
{ gsub(/\r/, ""); gsub(/[\001-\010\013\014\016-\037]/, ""); gsub(/\\/, "\\\\"); gsub(/"/, "\\\""); gsub(/\t/, "\\t"); printf "%s\\n", $0 }
END { printf "\"}}\n" }' "$f"
