#!/usr/bin/env bash
# Runs when a Superset workspace is deleted. Stops this workspace's dev
# server (if still running) and releases its port reservation.
set -uo pipefail

cd "$(dirname "$0")/.."
source .superset/lib/port.sh

workspace="$(pwd -P)"
base="$(port_lookup)"

if [ -n "$base" ]; then
  # Only kill listeners whose working directory is this worktree, so a
  # process that merely reused one of these ports is left alone.
  for port in $(seq "$base" "$((base + PORT_ALLOC_RANGE - 1))"); do
    for pid in $(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null); do
      cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
      case "$cwd" in
        "$workspace" | "$workspace"/*)
          kill "$pid" 2>/dev/null && echo "✓ Stopped dev server on port $port (pid $pid)"
          ;;
      esac
    done
  done
fi

released="$(port_release)"
if [ -n "$released" ]; then
  echo "✓ Released port $released"
else
  echo "! No port allocation for this workspace"
fi
