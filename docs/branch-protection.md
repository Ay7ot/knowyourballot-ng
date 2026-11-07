# Branch protection

`main` is protected by a repository ruleset stored in [`.github/ruleset.json`](../.github/ruleset.json).

Rules:

- a pull request is required before merging;
- no approvals are required, because the project has one maintainer;
- the `App checks and build` and `Python pipeline tests` CI checks must pass;
- force pushes and branch deletion are blocked;
- history stays linear, so use squash or rebase merges;
- GitHub Actions is the only bypass actor, for the data workflows that validate and commit data.

The data workflows are trusted automation. They run `npm run test:data` before committing, but they can still bypass the pull request rule. If that risk becomes unacceptable, change them to open a pull request with a token or GitHub App that can trigger CI.

## Apply

The ruleset file is the source of truth. Apply it after changes with:

```sh
gh api --method POST repos/Ay7ot/knowyourballot-ng/rulesets --input .github/ruleset.json
```

If a ruleset with that name already exists, update it instead:

```sh
id=$(gh api repos/Ay7ot/knowyourballot-ng/rulesets --jq '.[] | select(.name == "Protect main") | .id')
gh api --method PUT "repos/Ay7ot/knowyourballot-ng/rulesets/$id" --input .github/ruleset.json
```

## Check

```sh
gh api repos/Ay7ot/knowyourballot-ng/rulesets
gh api repos/Ay7ot/knowyourballot-ng/rulesets/<id>
```
