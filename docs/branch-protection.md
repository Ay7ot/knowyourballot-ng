# Branch protection

`main` is protected by the repository ruleset **Protect main history** (ID `26766584`), stored in [`.github/ruleset.json`](../.github/ruleset.json).

## What is enforced

- force pushes are blocked (`non_fast_forward`);
- the branch cannot be deleted (`deletion`);
- history stays linear (`required_linear_history`), so merge with squash or rebase;
- no bypass actor is listed, so the rules bind everyone, including the repository owner. The API reports `current_user_can_bypass: "never"`.

## What is not enforced yet

The ruleset does not require a pull request or passing CI. A direct push to `main` is still accepted, including one that breaks a test, the smoke check or a data rule. Vercel builds on push and does not wait for CI, so such a push can reach production. The local checklist in `AGENTS.md` is the only pre-push gate for a human; CI runs after the push. `npm run test:data` is the only gate for a data workflow push.

The reason is the data workflows. `ingest.yml`, `media.yml` and `official-photos.yml` push to `main` with the job's `GITHUB_TOKEN`. On a repository owned by a personal account, GitHub refuses the built-in GitHub Actions integration as a ruleset bypass actor:

```
422 Validation Failed
Actor GitHub Actions integration must be part of the ruleset source or owner organization
```

Adding the `pull_request` or `required_status_checks` rules without a bypass would block those workflows at the push step (`GH013`), so the protection was applied without them.

## Options for a full pull-request and CI gate

1. **Bot identity and auto-merged data pull requests (recommended).** Install a GitHub App on the repository, or create a fine-grained personal access token, and store its credential as `DATA_BOT_TOKEN`. Change the data workflows to push a branch, open a pull request and enable auto-merge. CI runs on the pull request because it is created by the bot, not by `GITHUB_TOKEN`. The ruleset can then require a pull request and both CI checks. A GitHub App key does not expire; a fine-grained token needs rotation, 365 days at most. This is the only option that keeps the data automation while giving every change, human or automated, a pull request and a passing CI run.
2. **Manual data pull requests.** Have the data workflows push a branch and open a pull request with `GITHUB_TOKEN`. That pull request does not start CI automatically, so the maintainer must approve the run and merge. No secret to manage, but the daily ingest creates a pull request even when only the report timestamp changed. Make that timestamp stable first, or accept the daily step.
3. **Transfer the repository to an organization.** The built-in GitHub Actions integration becomes a legal bypass actor there. Apply the full PR + CI ruleset with GitHub Actions in `bypass_actors` and leave the workflows unchanged. The repository URL changes, Vercel must be reconnected, and the data bot still bypasses the pull-request gate, so data commits remain covered only by `npm run test:data`.
4. **Keep the current partial protection.** Force pushes, deletion and non-linear history are blocked for everyone. Direct pushes and failing CI are not blocked. This is the current state.

## Apply

The ruleset file describes the state that is actually applied, not the desired end state. Apply it after changes with:

```sh
gh api --method POST repos/Ay7ot/knowyourballot-ng/rulesets --input .github/ruleset.json
```

If the ruleset already exists, update it instead:

```sh
id=$(gh api repos/Ay7ot/knowyourballot-ng/rulesets --jq '.[] | select(.name == "Protect main history") | .id')
gh api --method PUT "repos/Ay7ot/knowyourballot-ng/rulesets/$id" --input .github/ruleset.json
```

When one of the options above is implemented, update the JSON file and this document in the same change.

## Check

```sh
gh api repos/Ay7ot/knowyourballot-ng/rulesets
gh api repos/Ay7ot/knowyourballot-ng/rulesets/26766584 \
  --jq '{name,rules,bypass_actors,current_user_can_bypass}'
```
