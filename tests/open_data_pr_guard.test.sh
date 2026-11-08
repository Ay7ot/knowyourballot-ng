#!/usr/bin/env bash
# Guard tests for scripts/open_data_pr.sh. These need no token and no network.
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
script="$repo_root/scripts/open_data_pr.sh"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cd "$tmp"
git init -q
git config user.email test@example.com
git config user.name test
printf 'test\n' > file.txt
git add file.txt
git commit -qm init

# An accepted data branch with no staged changes is a no-op.
if ! bash "$script" data/ingest "test" "test" /dev/null; then
  echo "data/ingest with no staged changes should exit 0" >&2
  exit 1
fi

# Anything that could target main must be rejected before touching git.
for bad in main master HEAD feature/x data/Ingest data/ingest/extra; do
  if bash "$script" "$bad" "test" "test" /dev/null >/dev/null 2>&1; then
    echo "branch $bad should be rejected" >&2
    exit 1
  fi
done

echo "open_data_pr guard tests pass"
