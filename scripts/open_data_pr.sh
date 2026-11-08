#!/usr/bin/env bash
# Commit staged data changes to a reserved branch, then open or update a pull
# request, enable squash auto-merge, and wait for the merge.
#
# Usage: scripts/open_data_pr.sh <branch> <commit-message> <pr-title> <pr-body-file>
#
# The caller must stage the data files with `git add` first. The script exits 0
# when nothing is staged or the change is already on main, so a no-change run
# is a no-op.
#
# Environment:
#   DATA_BOT_TOKEN         fine-grained PAT or GitHub App token with
#                          contents:write and pull-requests:write on this repo
#   GITHUB_REPOSITORY      owner/repo, set by GitHub Actions
#   MERGE_TIMEOUT_SECONDS  optional, default 1200
#   MERGE_POLL_SECONDS     optional, default 10, minimum 1
#   DATA_REMOTE            optional test override for the git remote

set -euo pipefail

branch="${1:?branch is required}"
message="${2:?commit message is required}"
title="${3:?pull request title is required}"
body_file="${4:?pull request body file is required}"

# The data branches are reserved. Refuse anything that could target main.
if ! [[ "$branch" =~ ^data/[a-z-]+$ ]]; then
  echo "Branch must match ^data/[a-z-]+, got: $branch" >&2
  exit 1
fi

if git diff --cached --quiet; then
  echo "No staged changes; nothing to open."
  exit 0
fi

: "${DATA_BOT_TOKEN:?DATA_BOT_TOKEN is not set}"
: "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY is not set}"

if [ ! -f "$body_file" ]; then
  echo "Pull request body file not found: $body_file" >&2
  exit 1
fi

# The token is used for the explicit fetch and push and for the gh calls below.
remote="${DATA_REMOTE:-https://x-access-token:${DATA_BOT_TOKEN}@github.com/${GITHUB_REPOSITORY}.git}"

# Refuse to run from a feature branch. The workflows pin actions/checkout to
# main, but workflow_dispatch can still be started from another ref.
git fetch --quiet "$remote" main
if ! git merge-base --is-ancestor HEAD FETCH_HEAD; then
  echo "Refusing to run from a commit that is not on main." >&2
  exit 1
fi

git config user.name "ballot-data-bot"
git config user.email "actions@users.noreply.github.com"
git commit -m "$message"

# Rebase on the latest main so the pull request is not based on a stale commit.
# A conflict fails the run before anything is pushed.
git rebase FETCH_HEAD

# A rerun after the previous PR merged can replay an identical data change. The
# rebase drops it as empty; exit instead of opening an empty pull request.
if [ "$(git rev-list --count FETCH_HEAD..HEAD)" -eq 0 ]; then
  echo "No commits ahead of main; nothing to open."
  exit 0
fi
if git diff --quiet FETCH_HEAD..HEAD; then
  echo "No commits ahead of main; nothing to open."
  exit 0
else
  diff_status=$?
  if [ "$diff_status" -gt 1 ]; then
    echo "git diff failed with status ${diff_status}" >&2
    exit "$diff_status"
  fi
fi

git checkout -B "$branch"
git push --force "$remote" "HEAD:refs/heads/${branch}"

export GH_TOKEN="$DATA_BOT_TOKEN"
export GH_REPO="$GITHUB_REPOSITORY"

pr="$(gh pr list --head "$branch" --state open --json number --jq '.[0].number // empty')"
if [ -z "$pr" ]; then
  pr_url="$(gh pr create --base main --head "$branch" --title "$title" --body-file "$body_file")"
  pr="${pr_url##*/}"
  if ! [[ "$pr" =~ ^[0-9]+$ ]]; then
    echo "Could not parse the pull request number from: ${pr_url}" >&2
    exit 1
  fi
fi

# The ruleset enforces the required checks. Ask GitHub to squash-merge as soon
# as they pass. A freshly created pull request can take a moment to become
# mergeable, so retry a few times.
for attempt in 1 2 3; do
  if gh pr merge "$pr" --auto --squash --delete-branch; then
    break
  fi
  state="$(gh pr view "$pr" --json state --jq '.state')"
  if [ "$state" = "MERGED" ]; then
    echo "Pull request ${pr} is already merged."
    exit 0
  fi
  if [ "$attempt" -lt 3 ]; then
    echo "Auto-merge attempt ${attempt} failed; retrying in 5 seconds." >&2
    sleep 5
  fi
done

state="$(gh pr view "$pr" --json state --jq '.state')"
if [ "$state" = "MERGED" ]; then
  echo "Pull request ${pr} merged."
  exit 0
fi

auto_merge="$(gh pr view "$pr" --json autoMergeRequest --jq '.autoMergeRequest')"
if [ -z "$auto_merge" ] || [ "$auto_merge" = "null" ]; then
  echo "Could not enable auto-merge for ${pr}. Check the repository auto-merge setting and the token's pull request permission." >&2
  exit 1
fi

# A green workflow should mean the data merged, not merely that auto-merge was
# requested. Wait for the merge so a failed required check shows up here. The
# workflows set MERGE_TIMEOUT_SECONDS above the CI job timeouts.
merge_timeout="${MERGE_TIMEOUT_SECONDS:-1200}"
poll="${MERGE_POLL_SECONDS:-10}"
if [ "$poll" -lt 1 ]; then
  poll=10
fi
waited=0

while [ "$waited" -lt "$merge_timeout" ]; do
  state="$(gh pr view "$pr" --json state --jq '.state')"
  case "$state" in
    MERGED)
      echo "Pull request ${pr} merged."
      exit 0
      ;;
    CLOSED)
      echo "Pull request ${pr} was closed without merging." >&2
      exit 1
      ;;
  esac
  sleep "$poll"
  waited=$((waited + poll))
done

echo "Timed out after ${merge_timeout}s waiting for pull request ${pr} to merge." >&2
exit 1
