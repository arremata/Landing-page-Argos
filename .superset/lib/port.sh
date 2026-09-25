# Per-workspace port allocation, shared by setup.sh, run.sh and teardown.sh.
#
# Superset does not assign ports, so every workspace running `npm run dev`
# would fight over 3000. Each workspace reserves a 20-port window in
# ~/.superset/port-allocations.json ({ "<worktree path>": <base port> }) —
# the same file, format and lock Superset's own repo uses, so allocations
# from different projects on this machine never overlap. The dev server
# listens on the window's base port.

PORT_ALLOC_FILE="$HOME/.superset/port-allocations.json"
PORT_ALLOC_LOCK="$HOME/.superset/port-allocations.lock"
PORT_ALLOC_START=3020 # 3000 stays free for `npm run dev` in the main checkout
PORT_ALLOC_RANGE=20

# macOS AirPlay (5000, 7000) and ports Node/browsers refuse to use.
PORT_RESERVED="3659 4045 5000 5060 5061 6000 6566 6665 6666 6667 6668 6669 6697 7000"

port_workspace_key() {
  printf '%s' "${SUPERSET_WORKSPACE_PATH:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
}

port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

port_window_is_safe() {
  local base=$1 reserved
  for reserved in $PORT_RESERVED; do
    if [ "$reserved" -ge "$base" ] && [ "$reserved" -lt "$((base + PORT_ALLOC_RANGE))" ]; then
      return 1
    fi
  done
  return 0
}

port_lock() {
  local waited=0 pid
  mkdir -p "$HOME/.superset"
  while ! mkdir "$PORT_ALLOC_LOCK" 2>/dev/null; do
    pid="$(cat "$PORT_ALLOC_LOCK/pid" 2>/dev/null || true)"
    if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
      rm -rf "$PORT_ALLOC_LOCK"
      continue
    fi
    if [ "$waited" -ge 30 ]; then
      echo "Timed out waiting for port allocation lock: $PORT_ALLOC_LOCK" >&2
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
  printf '%s\n' "$$" >"$PORT_ALLOC_LOCK/pid"
}

port_unlock() {
  rm -rf "$PORT_ALLOC_LOCK"
}

# Writes the JSON on stdin to the allocations file atomically.
port_write_file() {
  local tmp="$PORT_ALLOC_FILE.tmp.$$"
  cat >"$tmp" && mv "$tmp" "$PORT_ALLOC_FILE"
}

# Prints this workspace's base port, or nothing if it has none.
port_lookup() {
  [ -f "$PORT_ALLOC_FILE" ] || return 0
  jq -r --arg k "$(port_workspace_key)" '.[$k] // empty' "$PORT_ALLOC_FILE"
}

# Prints this workspace's base port, reserving a window first if needed.
port_allocate() {
  local key base used
  key="$(port_workspace_key)"

  port_lock || return 1
  [ -f "$PORT_ALLOC_FILE" ] || echo '{}' >"$PORT_ALLOC_FILE"

  base="$(jq -r --arg k "$key" '.[$k] // empty' "$PORT_ALLOC_FILE")"
  if [ -z "$base" ]; then
    used="$(jq -r '.[]' "$PORT_ALLOC_FILE")"
    base=$PORT_ALLOC_START
    # Skip windows already reserved, overlapping a reserved port, or whose
    # base is currently taken by something outside the allocation file.
    while printf '%s\n' "$used" | grep -qx "$base" ||
      ! port_window_is_safe "$base" ||
      port_in_use "$base"; do
      base=$((base + PORT_ALLOC_RANGE))
    done
    if ! jq --arg k "$key" --argjson v "$base" '. + {($k): $v}' "$PORT_ALLOC_FILE" | port_write_file; then
      port_unlock
      return 1
    fi
  fi

  port_unlock
  printf '%s\n' "$base"
}

# Drops this workspace's reservation. Prints the released base port, if any.
port_release() {
  local key base
  [ -f "$PORT_ALLOC_FILE" ] || return 0
  key="$(port_workspace_key)"

  port_lock || return 1
  base="$(jq -r --arg k "$key" '.[$k] // empty' "$PORT_ALLOC_FILE")"
  if [ -n "$base" ]; then
    jq --arg k "$key" 'del(.[$k])' "$PORT_ALLOC_FILE" | port_write_file
  fi
  port_unlock
  printf '%s' "$base"
}
