# Branch protection

`main` is protected by the repository ruleset **Protect main history** (ID `26766584`), stored in [`.github/ruleset.json`](../.github/ruleset.json).

## What is enforced

- a pull request is required before merging;
- no approving review is required, because the project has one maintainer;
- the `App checks and build` and `Python pipeline tests` checks from the GitHub Actions app must pass;
- only squash merges are allowed;
- force pushes are blocked;
- the branch cannot be deleted;
- history stays linear;
- no bypass actor is listed. The rules bind everyone, including the repository owner. The check command below reports `bypass_actors` and `current_user_can_bypass`; record both after applying.

The ruleset, the workflow checkouts, the CI trigger and the script all target `main`. If you rename the default branch, update all four.

## Data pull requests

`ingest.yml`, `media.yml` and `official-photos.yml` do not push to `main`. They stage their changes, push a reserved branch (`data/ingest`, `data/media`, `data/official-photos`), open a pull request with `DATA_BOT_TOKEN`, and enable squash auto-merge. CI runs on the pull request, and GitHub merges it only after both checks pass. Once the full ruleset is applied, the token cannot push to `main` because it is not a bypass actor.

The pull request author is the account that owns the token. A fine-grained PAT acts as its owner, so the author is the maintainer; the commit author is `ballot-data-bot`. Use a GitHub App if you want a distinct actor. Auto-merge is enabled immediately, so the pull request is an audit trail, not a manual approval gate. Close it or revert if the diff is wrong. Do not use the `data/*` branches for human work.

The data workflow waits for the pull request to merge. A green run means the data merged, there were no data changes, or the change was already on `main`. A red run after the pull request was created means a required check failed, the pull request was closed, or the wait timed out. The workflows set `MERGE_TIMEOUT_SECONDS` to 1500 seconds, with job timeouts of 55 minutes for ingest and official photos and 335 minutes for media.

## Rollout status

The live ruleset is partial until the token exists, the workflow change is merged, and the full ruleset is applied. The order below keeps a schedule from auto-merging a data pull request while the ruleset has no required checks.

1. Create the `DATA_BOT_TOKEN` repository secret with the exact permissions below. Confirm the permission list before saving.
2. In Settings, General, enable Allow auto-merge and Allow squash merging.
3. Check for in-flight data runs. Disabling a workflow does not cancel a run that already started:

   ```sh
   gh run list --workflow=ingest.yml --status in_progress
   gh run list --workflow=media.yml --status in_progress
   gh run list --workflow=official-photos.yml --status in_progress
   ```

   Wait for them to finish or cancel them, then disable the three workflows:

   ```sh
   gh workflow disable ingest.yml
   gh workflow disable media.yml
   gh workflow disable official-photos.yml
   ```

4. Merge the workflow change after its CI passes.
5. Apply the full ruleset:

   ```sh
   gh api --method PUT repos/Ay7ot/knowyourballot-ng/rulesets/26766584 --input .github/ruleset.json
   ```

6. Record the live state:

   ```sh
   gh api repos/Ay7ot/knowyourballot-ng/rulesets/26766584 \
     --jq '{name,rules,bypass_actors,current_user_can_bypass}'
   ```

   Confirm there are no bypass actors and `current_user_can_bypass` is `never`.

7. Re-enable the workflows:

   ```sh
   gh workflow enable ingest.yml
   gh workflow enable media.yml
   gh workflow enable official-photos.yml
   ```

8. Run one data workflow and confirm the pull request waits for both checks and auto-merges:

   ```sh
   gh workflow run ingest.yml
   ```

   A no-change run exits 0 without creating a pull request, and a rerun of a change already on `main` also exits 0. Neither validates the gate. Rerun when data changes, or confirm the ruleset directly in step 6.

9. If the run fails, disable the workflows, use the emergency rollback below, fix the token or workflow, reapply the full ruleset, re-enable, and run the test again.

Do not merge the workflow change without the secret, and do not apply the full ruleset before the workflow change. Either mistake adds an avoidable window where data cannot merge; the disabled workflows in step 3 also pause data updates until step 7.

## Create `DATA_BOT_TOKEN`

Use a fine-grained personal access token:

1. On GitHub, open Settings, Developer settings, Personal access tokens, Fine-grained tokens, then Generate new token.
2. Name it `knowyourballot-data-bot`. Set an expiry of at most 365 days, record the date in [runbook.md](runbook.md), and set a reminder 14 days before.
3. Under Repository access, choose Only select repositories and `Ay7ot/knowyourballot-ng`.
4. Under Permissions, set Contents to Read and write and Pull requests to Read and write. Metadata is read-only and selected automatically.
5. Do not grant Workflows, Administration, Actions, Secrets, Environments or any other permission. A Workflows grant lets the token change CI; an Administration grant lets it weaken the ruleset. Verify the permission list before saving.
6. Generate the token, then add it to the repository as an Actions secret named `DATA_BOT_TOKEN` (Settings, Secrets and variables, Actions, New repository secret).

A GitHub App is the stronger option: it gives a distinct actor and a one-hour installation token. Add a step that mints a token with `actions/create-github-app-token`, pass its output as `DATA_BOT_TOKEN` to the data pull request step, and grant only Contents and Pull requests. The GitHub App private key is the long-lived secret.

## Apply

Apply after the token exists and the workflow change is merged. Confirm Allow auto-merge and Allow squash merging are enabled. The file describes the applied state.

```sh
gh api --method PUT repos/Ay7ot/knowyourballot-ng/rulesets/26766584 --input .github/ruleset.json
```

If the ruleset is ever recreated, use `POST` and update the ID in this document.

## Check

```sh
gh api repos/Ay7ot/knowyourballot-ng/rulesets/26766584 \
  --jq '{name,rules,bypass_actors,current_user_can_bypass}'
```

Record the output in the pull request or the runbook. A ruleset that shows a bypass actor, or `current_user_can_bypass` other than `never`, is not the full gate.

## Emergency rollback

If the data workflows cannot open or merge a pull request, disable the three workflows, close any open data pull request, then revert the live ruleset to the partial definition without editing the repository file:

```sh
gh workflow disable ingest.yml
gh workflow disable media.yml
gh workflow disable official-photos.yml

for branch in data/ingest data/media data/official-photos; do
  gh pr list --state open --head "$branch" --json number --jq '.[].number' |
    while read -r pr; do [ -n "$pr" ] && gh pr close "$pr" --delete-branch; done
done
```

Close the pull requests before downgrading. An auto-merge request that is already armed would become mergeable without the failed required check.

```sh
gh api --method PUT repos/Ay7ot/knowyourballot-ng/rulesets/26766584 --input - <<'JSON'
{
  "name": "Protect main history",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "include": ["refs/heads/main"], "exclude": [] } },
  "rules": [{ "type": "deletion" }, { "type": "non_fast_forward" }, { "type": "required_linear_history" }],
  "bypass_actors": []
}
JSON
```

Fix the token or workflow, reapply `.github/ruleset.json`, record the live state, re-enable the workflows, then run one data workflow and confirm the pull request waits for CI and auto-merges. The partial ruleset still blocks history rewrites, but direct pushes are allowed again until you reapply. Reapply in the same session.

## Residual risks

- **The PAT acts as the maintainer.** A leaked PAT can merge any non-workflow change that passes CI. Use a GitHub App for a distinct actor and a one-hour token, and follow the compromise procedure in [runbook.md](runbook.md).
- **Required checks are context names.** A pull request that edits `.github/workflows/` can create jobs with the same names and satisfy the gate without running the real checks. Review any pull request that edits workflows by hand. A trusted `pull_request_target` path gate is a planned follow-up.
- **The token shares a job with third-party code.** The data workflows run `pip install`, the ingest parsers and `npm ci` before the token-bearing step. Split generation from publishing in a follow-up so a compromised dependency cannot read the token.
- **The token lives for up to 365 days.** Rotate it and record the expiry.
- **A failing required check blocks every merge.** The emergency rollback is the escape hatch, but it is fail-open until you reapply the full ruleset. Close any open data pull request first and reapply in the same session.

## Why there is no Actions bypass

On a repository owned by a personal account, GitHub refuses the built-in GitHub Actions integration as a ruleset bypass actor:

```
422 Validation Failed
Actor GitHub Actions integration must be part of the ruleset source or owner organization
```

That is why the data workflows use a dedicated credential and a pull request instead of pushing to `main`. Do not add the Actions integration to `bypass_actors`; it cannot be applied here. Do not add the owner, a repository role or the maintainer's user as a bypass actor while the data workflows use the maintainer's PAT; the token inherits the bypass.
