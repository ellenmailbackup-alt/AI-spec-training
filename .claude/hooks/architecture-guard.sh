#!/bin/bash
# Architecture guard hook — checks for direct DB calls in server/routes.ts
# Runs after every Edit/Write. Silent for non-routes files.

jq -r '.tool_input.file_path' | {
  read -r f
  if echo "$f" | grep -q 'server/routes\.ts$'; then
    violations=""
    for pattern in 'db\.transaction' 'db\.select' 'db\.insert' 'db\.update' 'db\.delete'; do
      count=$(grep -c "$pattern" "$f" 2>/dev/null | tail -1)
      if [ "$count" -gt 0 ] 2>/dev/null; then
        violations="$violations $pattern($count)"
      fi
    done
    if [ -n "$violations" ]; then
      echo "{\"hookSpecificOutput\":{\"hookEventName\":\"PostToolUse\",\"additionalContext\":\"ARCHITECTURE VIOLATION in server/routes.ts: Found direct DB calls:$violations. All database operations MUST go through *Service.ts files (business logic/transactions) or storage.ts (CRUD queries). Routes should only validate, auth-check, call service, and format response.\"}}"
    fi
  fi
}
