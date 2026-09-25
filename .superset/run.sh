#!/usr/bin/env bash
# Superset "Run" button: starts the dev server on this workspace's port.
set -euo pipefail

cd "$(dirname "$0")/.."
source .superset/lib/port.sh

# Dependencies are public and package-lock.json resolves them from npmjs;
# don't let a global ~/.npmrc (e.g. a private registry) redirect installs.
export npm_config_registry="https://registry.npmjs.org/"

# Allocates on the fly for workspaces created before this config existed.
base="$(port_allocate)"

# If something outside Superset grabbed the base port, use the next free
# port inside this workspace's reserved window.
port=$base
while port_in_use "$port"; do
  port=$((port + 1))
  if [ "$port" -ge "$((base + PORT_ALLOC_RANGE))" ]; then
    echo "✗ Ports $base-$((port - 1)) are all in use" >&2
    exit 1
  fi
done

[ -d node_modules ] || npm ci --no-audit --no-fund --prefer-offline

PORT=$port exec npm run dev
