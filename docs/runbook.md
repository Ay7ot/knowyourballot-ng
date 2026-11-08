# Runbook

Operational procedures for the live site and the data pipeline. Pushing to `main` deploys production, so any change to `main` needs the usual checks and approval.

## Quick reference

| Symptom                                 | First action                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------- |
| Daily ingest failed                     | Check the Actions log and `data/candidates/_report.json`                     |
| Data PR or auto-merge failed            | Check `DATA_BOT_TOKEN`, the reserved branch and the auto-merge setting       |
| `DATA_BOT_TOKEN` compromised            | Revoke it, disable the data workflows, audit scripts and workflows           |
| Bad data reached production             | Roll back the data commit and the Vercel deployment, then fix the parser     |
| Vercel build failed                     | Run `npm run build` locally and compare the error                            |
| Search report returns 404               | Set or check `SEARCH_REPORT_KEY` in Vercel                                   |
| Wrong candidate photo                   | Add the match to `data/photo_rejects.json` and rerun the media workflow      |
| Data contract test fails after a rename | Review the removed IDs, add a redirect, update the snapshot                  |
| Unknown candidate URL returns 200       | Check for a root `loading.tsx` or a new Suspense boundary; smoke asserts 404 |
| npm audit reports a vulnerability       | Check the dependency chain, prefer an override, then rerun all checks        |

## Ingest failure

`ingest.yml` runs daily at 05:00 UTC and on changes to `data/sources.json` or the ingest scripts.

1. Open the failed run:

   ```sh
   gh run list --workflow=ingest.yml --limit 5
   gh run view <run-id> --log
   ```

2. Check `data/candidates/_report.json` for the office, document count, row count and failures.
3. Check the `/data` page for coverage and unmatched rows.
4. If INEC changed a PDF layout, update the header matching or table parsing in `scripts/ingest_inec.py` and add a fixture or test where possible.
5. Rerun the workflow after the fix:

   ```sh
   gh run rerun <run-id>
   ```

The workflow opens a pull request only if the data contract test passes. If it fails, no commit is pushed.

## Data pull request or auto-merge failure

The data workflows push a reserved branch and open an auto-merged pull request. They do not push to `main`.

1. Open the failed run and read the job log. It names the branch (`data/ingest`, `data/media` or `data/official-photos`) and the failing step.
2. If the log says `DATA_BOT_TOKEN is not set`, add the repository secret. See [branch-protection.md](branch-protection.md).
3. If the push is rejected, check that the token has Contents: Read and write and Pull requests: Read and write, is scoped to this repository, and has not expired.
4. If `gh pr create` says a pull request already exists, open it and let auto-merge finish. The next run force-updates the same branch.
5. If auto-merge is unavailable, check Settings, General, Allow auto-merge. The workflow enables it with `gh pr merge --auto`.
6. If the pull request conflicts, resolve it on the data branch or close the pull request and rerun the workflow. Do not push the data commit to `main` by hand.
7. If a required check never reports, confirm the check names are exactly `App checks and build` and `Python pipeline tests`, and that `ci.yml` runs on `pull_request`.
8. If the run is red after the pull request was created, open the pull request and check the failing required job. The data workflow waits for the merge; a failed check, a closed pull request or a timeout makes the run red.
9. A green run with no pull request means there were no data changes. It does not validate the gate.

## Bad data in production

1. Identify the data commit:

   ```sh
   git log --oneline -- data/ballot.json data/candidates
   ```

2. Revert it on a branch, run `npm test`, `npm run build` and `npm run smoke`, then open a pull request. Do not force-push `main`.
3. If the site is actively wrong, use the Vercel dashboard to promote the last known good deployment to production while the fix is prepared.
4. Add a regression test or a data contract check for the failure mode.
5. Record what happened in the pull request and, if the cause was a parser assumption, in `docs/data.md`.

## Deploy failure

1. Reproduce locally:

   ```sh
   npm ci
   npm run check
   npm run typecheck
   npm test
   npm run build
   ```

2. Check the Vercel build log for a different Node version, a missing environment variable or a memory limit.
3. Confirm `BLOB_READ_WRITE_TOKEN` and `NEXT_PUBLIC_SITE_URL` are set for the environment.
4. After a successful deploy, check `/`, `/race/president`, `/candidate/president--ndc`, `/state/lagos`, `/api/search-miss` and `/og`.

## Search-miss endpoint

`POST /api/search-miss` records failed searches in Vercel Blob. `GET ?key=...` returns a 30-day report.

- Without `BLOB_READ_WRITE_TOKEN`, POST returns 204 and stores nothing.
- Without `SEARCH_REPORT_KEY`, GET returns 404.
- The route rejects non-JSON requests with 415, browser cross-origin requests with 403, bodies over 512 bytes with 413, and more than 30 requests per 10 minutes per instance with 429.
- The rate limiter is in memory per serverless instance. It reduces casual abuse but is not a global quota. If abuse becomes a real cost problem, add a Vercel WAF rate limit or a shared store.

To review failed searches:

```sh
curl -H "Authorization: Bearer $SEARCH_REPORT_KEY" "https://knowyourballot-ng.vercel.app/api/search-miss"
```

## Wrong or missing photo

- Wrong match: add the candidate id to `data/photo_rejects.json` with the reason, then rerun `media.yml`.
- Better Commons photo: add an entry to `data/photo_overrides.json` with the candidate id, the Wikidata id and the Commons file, then rerun the media workflow.
- Campaign photo: use the photo issue template. Add the handle and a `why` to `data/official_handles.json` only when the account is tied to the person. Official X photos are not freely licensed and must keep the credit and removal link.
- Never loosen the matching rules to raise coverage. A wrong face is worse than no photo.

## ID snapshot failure

The data contract test fails when a race, state, LGA or district ID disappears.

1. Find the removed IDs in the test output.
2. Decide whether the change is a rename, a merge or a real removal.
3. If the old URL was public, add a permanent redirect in `next.config.ts`.
4. Run `npm run snapshot:ids` after the review.
5. Run `npm test` and `npm run build`.

## Dependency vulnerability

1. Run `npm audit --json` and inspect the chain.
2. Prefer a patched transitive version through `overrides` in `package.json` over a major framework upgrade.
3. Run `npm ci`, `npm run audit`, `npm run check`, `npm run typecheck`, `npm test`, `npm run build` and `npm run smoke`.
4. If the only fix is a major upgrade, treat it as an architecture change and review it separately.
5. Keep `@biomejs/biome` and the pinned Python packages current through Dependabot pull requests.

## Rollback

- **Application:** Vercel dashboard, Deployments, choose the last known good deployment, Promote to Production.
- **Data:** revert the data commit on a branch, run the checks, and merge through a pull request.
- **Workflow change:** revert the workflow commit. A rerun uses the workflow from the commit that triggered it.

## Token compromised

`DATA_BOT_TOKEN` can push data branches and merge pull requests. If it leaks:

1. Revoke the token in GitHub settings and delete the repository secret.
2. Disable the three data workflows (`ingest.yml`, `media.yml`, `official-photos.yml`).
3. Review the repository security log, recent pull requests and `git log` for `scripts/`, `.github/`, `data/sources.json`, `package.json` and `next.config.ts`.
4. Revert anything unexplained. A planted change can read a rotated token on the next run, so revocation alone is not enough.
5. Create a replacement token with only Contents: Read and write and Pull requests: Read and write, add the secret, re-enable the workflows, and run one ingest. Confirm the pull request waits for both checks and auto-merges.

## Rotate `DATA_BOT_TOKEN`

Token expiry: ____________________ (record the date when the token is created; set a reminder 14 days before).

1. Create a replacement fine-grained token with Contents: Read and write and Pull requests: Read and write, scoped to this repository. Grant nothing else.
2. Update the repository secret `DATA_BOT_TOKEN`.
3. Run `gh workflow run ingest.yml` and confirm the run either merges a data pull request after both checks or exits with no changes. A no-change run does not validate auto-merge.
4. Revoke the old token.

## Escalation

The project has one maintainer. For a live security issue, follow [SECURITY.md](../SECURITY.md) and do not open a public issue. For a data correction, use the correction issue template.
