#!/usr/bin/env bash
# Commit staged data changes to a reserved branch, then open or update a pull
# request and enable squash auto-merge.
#
# Usage: scripts/open_data_pr.sh <branch> <commit-message> <pr-title> <pr-body-file>
#
# The caller must stage the data files with `git add` first. The script exits 0
# when nothing is staged, so a no-change run is a no-op.
#
# Environment:
#   DATA_BOT_TOKEN     fine-grained PAT or GitHub App token with contents:write
#                      and pull-requests:write on this repository
#   GITHUB_REPOSITORY  owner/repo, set by GitHub Actions

set -euo pipefail

branch="${1:?branch is required}"
message="${2:?commit message is required}"
title="${3:?pull request title is required}"
body_file="${4:?pull request body file is required}"

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

# Keep the bot identity separate from the checkout credentials. The token is
# only used for the explicit fetch and push below.
git config user.name "ballot-data-bot"
git config user.email "actions@users.noreply.github.com"
git commit -m "$message"

remote="https://x-access-token:${DATA_BOT_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"

# Rebase on the latest main so the pull request is not based on a stale commit.
# A conflict fails the run before anything is pushed.
git fetch --quiet "$remote" main
git rebase FETCH_HEAD

git checkout -B "$branch"
git push --force "$remote" "HEAD:refs/heads/${branch}"

export GH_TOKEN="$DATA_BOT_TOKEN"
export GH_REPO="$GITHUB_REPOSITORY"
pr="$(gh pr list --head "$branch" --state open --json number --jq '.[0].number // empty')"
if [ -z "$pr" ]; then
  gh pr create --base main --head "$branch" --title "$title" --body-file "$body_file"
  pr="$branch"
fi

if [ "$(gh pr view "$pr" --json state --jq '.state')" = "MERGED" ]; then
  echo "Pull request ${pr} is already merged."
  exit 0
fi

# The ruleset enforces the required checks. Ask GitHub to squash-merge as soon
# as they pass. Retry because a freshly created pull request can take a moment
# to become mergeable.
for attempt in 1 2 3; do
  if gh pr merge "$pr" --auto --squash --delete-branch; then
    exit 0
  fi
  echo "Auto-merge attempt ${attempt} failed; retrying in 5 seconds." >&2
  sleep 5
done

echo "Could not enable auto-merge for ${pr}." >&2
exit 1
