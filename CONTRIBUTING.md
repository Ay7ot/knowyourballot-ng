# Contributing

Know Your Ballot is a non-partisan civic project. Contributions are welcome, especially sourced corrections, new manifesto links and fixes to the data pipeline.

## Before you start

- For a non-trivial change, open an issue first so the approach can be agreed.
- For a wrong or missing fact, use the correction issue template.
- For a candidate photo the campaign owns, use the photo issue template.
- For a manifesto or pledge, use the manifesto issue template.
- Do not open a public issue for a security problem. Follow [SECURITY.md](SECURITY.md).

## Ground rules

1. Every candidate fact must come from an INEC document and keep its source URL and page.
2. No religion, no unsourced claims, no editorialising. The site must not look partisan.
3. A candidate photo must be verified as the right person. A wrong face is worse than no photo.
4. Do not hand-edit generated files. Change the source or the script, then rerun the pipeline.
5. Pushing to `main` deploys production. Do not push without running the checks below and getting review.

## Development setup

Requirements: Node.js 24, npm 11, and Python 3.12 for the data pipeline. `uv` is the easiest way to get Python 3.12 and the pinned packages.

```sh
npm ci
uv venv --python 3.12
uv pip install -r requirements-dev.txt
npm run dev
```

The site runs at http://localhost:3000. Port 3100 is used by another local app.

## Checks

Run these before opening a pull request:

```sh
npm run audit        # npm audit, fails on any vulnerability
npm run check        # Biome formatting and lint
npm run typecheck    # tsc --noEmit
npm test             # data contract tests
npm run build        # production build
npm run smoke        # starts the built server and checks key routes and API guards
uv run pytest -q     # Python pipeline tests
```

`npm run format` writes formatting fixes. Do not mix formatting changes with behaviour changes in the same pull request.

## Code style

- Biome formats and lints the repository. The config is `biome.json`: 2 spaces, double quotes, 120 columns.
- TypeScript is strict. Prefer the types in `src/lib/types.ts`.
- Server components by default. Add `"use client"` only when the component needs state, effects or browser APIs.
- Data access goes through `src/lib/data.ts`. Do not import JSON data directly in components.
- Use the semantic CSS tokens in `src/app/globals.css` rather than hardcoded colours.
- Keep client JavaScript small. The performance budget is part of the product.

## Data changes

Generated files include `data/ballot.json`, `data/geo.json`, `data/candidates/*.json`, the photo and logo JSON, and `public/data/pu/*.json`. Do not edit them by hand.

Hand-maintained inputs include `data/sources.json`, `data/platforms.json`, `data/official_handles.json`, `data/photo_rejects.json`, `data/photo_confirms.json`, `data/parties.json` and `src/lib/economy.ts`.

After a pipeline run:

```sh
npm test
uv run pytest -q
```

If a race, state, LGA or district ID is removed, the data contract test fails on purpose. Review the rename, add a redirect if the old URL was public, then update the snapshot with `npm run snapshot:ids`.

## Commit messages

Use conventional commits:

- `feat: ...` for a new capability;
- `fix: ...` for a bug fix;
- `data: ...` for a data refresh;
- `docs: ...` for documentation;
- `chore: ...` for tooling and maintenance.

## Pull request checklist

- [ ] The change is sourced and non-partisan.
- [ ] `npm run audit`, `npm run check`, `npm run typecheck`, `npm test`, `npm run build` and `npm run smoke` pass.
- [ ] `uv run pytest -q` passes for pipeline changes.
- [ ] Generated data was rebuilt, not hand-edited.
- [ ] New behaviour has a test, or the pull request explains why not.
- [ ] Documentation and `CHANGELOG.md` are updated when needed.

## Labels

The issue templates use the labels `correction`, `photo` and `manifesto`. If those labels are missing, a maintainer can create them with the commands in [docs/labels.md](docs/labels.md).

## Review

The maintainer reviews every pull request. A pull request is merged only when the checks pass and the change does not weaken the sourcing, photo or non-partisan rules.

`main` is protected by a ruleset. The full gate requires a pull request and the `App checks and build` and `Python pipeline tests` checks, and blocks force pushes, branch deletion and non-linear history. The data workflows open auto-merged pull requests with the `DATA_BOT_TOKEN` credential. The full gate is applied. [docs/branch-protection.md](docs/branch-protection.md) records the rollout, the token setup and the emergency rollback.
