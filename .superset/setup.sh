#!/usr/bin/env bash
# Runs when a Superset workspace is created. Safe to re-run.
set -euo pipefail

cd "$(dirname "$0")/.."
source .superset/lib/port.sh

# Dependencies are public and package-lock.json resolves them from npmjs;
# don't let a global ~/.npmrc (e.g. a private registry) redirect installs.
export npm_config_registry="https://registry.npmjs.org/"

# Gitignored files the app may need, copied from the main checkout.
# data/signups.json is deliberately left out: each workspace gets its own
# waitlist store instead of writing into the main checkout's real signups.
UNTRACKED_FILES=(.env .env.local .env.development.local .vercel)

root="${SUPERSET_ROOT_PATH:-}"
if [ -n "$root" ] && [ "$(cd "$root" && pwd -P)" != "$(pwd -P)" ]; then
  for f in "${UNTRACKED_FILES[@]}"; do
    if [ -e "$root/$f" ] && [ ! -e "$f" ]; then
      cp -R "$root/$f" "$f"
      echo "✓ Copied $f from $root"
    fi
  done
else
  echo "! SUPERSET_ROOT_PATH not set (or this is the main checkout); skipping file copy"
fi

echo "→ Installing dependencies"
npm ci --no-audit --no-fund --prefer-offline

port="$(port_allocate)"
echo "✓ Dev server port for this workspace: $port (http://localhost:$port)"
