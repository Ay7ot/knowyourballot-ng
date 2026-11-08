# Branch protection

`main` is protected by the repository ruleset **Protect main history** (ID `26766584`), stored in [`.github/ruleset.json`](../.github/ruleset.json).

## What is enforced

- a pull request is required before merging;
- no approving review is required, because the project has one maintainer;
- the `App checks and build` and `Python pipeline tests` checks must pass;
- force pushes are blocked;
- the branch cannot be deleted;
- history stays linear, so use squash merges;
- no bypass actor is listed. The rules bind everyone, including the repository owner. The API reports `current_user_can_bypass: "never"`.

The data workflows are not an exception. `ingest.yml`, `media.yml` and `official-photos.yml` stage their changes, push a reserved branch (`data/ingest`, `data/media`, `data/official-photos`), open a pull request with `DATA_BOT_TOKEN`, and enable squash auto-merge. CI runs on the pull request, and GitHub merges it only after both checks pass. The token cannot push to `main` because it is not a bypass actor. Auto-merge is enabled immediately, so the pull request is an audit trail, not a manual approval gate; close it or revert if the diff is wrong. Do not use the `data/*` branches for human work.

## Rollout status

The full ruleset and the workflow changes are ready. The safe order is:

1. Create the `DATA_BOT_TOKEN` repository secret.
2. Merge the workflow change after its CI passes.
3. Apply the full ruleset:

   ```sh
   gh api --method PUT repos/Ay7ot/knowyourballot-ng/rulesets/26766584 --input .github/ruleset.json
   ```

4. Run one data workflow and confirm the pull request waits for both checks and auto-merges:

   ```sh
   gh workflow run ingest.yml
   ```

5. If the run fails, use the emergency rollback below, fix the token or workflow, and reapply.

Apply the ruleset before the validation run. Under the partial ruleset a pull request has no required checks, so auto-merge can merge immediately. The full ruleset is what makes auto-merge wait for CI.

Until steps 1 to 3 are done, the live ruleset is the partial one: deletion, non-fast-forward and linear history only. A direct push to `main` is still accepted, and Vercel deploys without waiting for CI.

## Create `DATA_BOT_TOKEN`

Use a fine-grained personal access token:

1. On GitHub, open Settings, Developer settings, Personal access tokens, Fine-grained tokens, then Generate new token.
2. Name it `knowyourballot-data-bot` and set an expiry of at most 365 days. Add the expiry date to the runbook.
3. Under Repository access, choose Only select repositories and `Ay7ot/knowyourballot-ng`.
4. Under Permissions, set Contents to Read and write and Pull requests to Read and write. Metadata is read-only and selected automatically.
5. Generate the token, then add it to the repository as an Actions secret named `DATA_BOT_TOKEN` (Settings, Secrets and variables, Actions, New repository secret).

A GitHub App with the same repository permissions also works and does not expire. Add a step that mints an installation token with `actions/create-github-app-token`, then pass its output as `DATA_BOT_TOKEN` to the data pull request step instead of reading a repository secret.

## Apply

Apply after the token exists and the workflow change is merged. The file describes the applied state.

```sh
gh api --method PUT repos/Ay7ot/knowyourballot-ng/rulesets/26766584 --input .github/ruleset.json
```

If the ruleset is ever recreated, use `POST` and update the ID in this document.

## Check

```sh
gh api repos/Ay7ot/knowyourballot-ng/rulesets/26766584 \
  --jq '{name,rules,bypass_actors,current_user_can_bypass}'
```

## Emergency rollback

If the data workflows cannot open or merge a pull request, revert the live ruleset to the partial definition without editing the repository file:

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

Fix the token or workflow, reapply `.github/ruleset.json`, then run one data workflow and confirm the pull request waits for CI and auto-merges. Keep the partial ruleset in place meanwhile; it still blocks history rewrites.

## Why there is no Actions bypass

On a repository owned by a personal account, GitHub refuses the built-in GitHub Actions integration as a ruleset bypass actor:

```
422 Validation Failed
Actor GitHub Actions integration must be part of the ruleset source or owner organization
```

That is why the data workflows use a separate bot identity and a pull request instead of pushing to `main`. Do not add the Actions integration to `bypass_actors`; it cannot be applied here.
