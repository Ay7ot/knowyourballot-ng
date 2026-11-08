#!/usr/bin/env bash
# Guard tests for scripts/open_data_pr.sh. These need no token and no network.
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
script="$repo_root/scripts/open_data_pr.sh"

bash -n "$script"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cd "$tmp"
git init -q
git config user.email test@example.com
git config user.name test
printf 'test\n' > file.txt
git add file.txt
git commit -qm init
body="$tmp/body.md"
printf 'test\n' > "$body"

# An accepted data branch with no staged changes is a no-op.
if ! bash "$script" data/ingest "test" "test" "$body"; then
  echo "data/ingest with no staged changes should exit 0" >&2
  exit 1
fi

# Anything that could target main must be rejected before touching git.
for bad in main master HEAD feature/x data/Ingest data/ingest/extra; do
  if bash "$script" "$bad" "test" "test" "$body" >/dev/null 2>&1; then
    echo "branch $bad should be rejected" >&2
    exit 1
  fi
done

# A checkout that is not an ancestor of main must be rejected before any push.
bare="$tmp/origin.git"
work="$tmp/work"
git init -q --bare "$bare"
git clone -q "$bare" "$work"
cd "$work"
git config user.email test@example.com
git config user.name test
git branch -M main
printf 'main\n' > main.txt
git add main.txt
git commit -qm main
git push -q origin main
git checkout -qb feature
printf 'feature\n' > feature.txt
git add feature.txt
git commit -qm feature
printf 'data\n' > data.txt
git add data.txt

if DATA_REMOTE="$bare" DATA_BOT_TOKEN=dummy GITHUB_REPOSITORY=test/repo \
  bash "$script" data/ingest "test" "test" "$body" >"$tmp/ancestor.log" 2>&1; then
  echo "feature branch checkout should be rejected" >&2
  cat "$tmp/ancestor.log" >&2
  exit 1
fi
if ! grep -q "not on main" "$tmp/ancestor.log"; then
  echo "expected a not-on-main error" >&2
  cat "$tmp/ancestor.log" >&2
  exit 1
fi

echo "open_data_pr guard tests pass"
