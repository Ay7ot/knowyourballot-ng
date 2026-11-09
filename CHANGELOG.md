# Changelog

All notable changes to this project are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

- Data contract tests for foreign keys, sources, photo files and stable IDs.
- Python unit tests for party codes, slugs, qualification levels and State Assembly matching.
- Production smoke test for key routes, security headers and `/api/search-miss` guards.
- CI workflow running audit, format/lint, typecheck, tests, build and smoke.
- Dependabot configuration for npm, pip and GitHub Actions.
- Security headers and a production Content Security Policy.
- Origin, content-type, body-size and rate-limit guards on `/api/search-miss`.
- Error and global error boundaries. The root loading boundary was removed because it caused soft 404s.
- `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.env.example`, `CHANGELOG.md` and the `docs/` guides.
- Correction, photo and manifesto issue templates.
- `uv` setup for the Python 3.12 pipeline, with pinned requirements.
- Added the MIT `LICENSE`.
- Polling unit parser tests for slash, hyphen, dot, middle dot and space separators.
- Interactive Nigeria state map with real boundaries, plus LGA dot maps on state and LGA pages.
- Global search dialog on `Cmd/Ctrl+K`, available from every page.
- Desktop ballot desk with progress, race list, compare summary and a next-race action.
- LGA filter on state pages.
- Wide desktop shell and two-column layouts for state, LGA, race and candidate pages.
- Policies tab in the side-by-side comparison, with candidate pledges, a party-platform fallback, per-topic missing-position states and campaign request links.
- Map build script and `data/nigeria-map.json`, credited to geoBoundaries / GRID3.
- Manifesto library at `/manifestos` and a reader at `/manifesto/[id]`, with source page references and the full document link where one exists.
- APC's 2027–2031 presidential manifesto, "From Reforms to Prosperity", with 17 page-cited commitments.

### Changed

- Replaced deprecated `next lint` with Biome for lint and formatting.
- Normalised party codes at build time. One candidate changed from `S D P` to `SDP`.
- Data workflows now run the data contract test before committing.
- Updated the README, HANDOFF and AGENTS documents for the current stack and checks.
- Data workflows push reserved data branches and open auto-merged pull requests with `DATA_BOT_TOKEN`; the full `main` ruleset requires a pull request and both CI checks and was applied on 2026-11-09 after a validated data PR.
- The data PR script rejects branch names that could target `main`, exits on a no-op rerun, and waits for the merge so a failed required check turns the workflow red.
- Bumped Pillow to 13.0.0 and pdfplumber to 0.11.10, and added `pip-audit` for the Linux resolution.
- Pinned GitHub Actions to commit SHAs and stopped persisting checkout credentials.
- Scoped the npm overrides to the vulnerable parents.
- The report accepts `Authorization: Bearer`, counts body size in bytes and returns an accurate `Retry-After`.

### Fixed

- Search suggestions are no longer clipped by the home hero or the global search dialog. The list flips above the input when space below is tight, is capped to the visible viewport, and scrolls internally on long result sets.
- `npm audit` now reports 0 vulnerabilities. `postcss` and `zod` are pinned through `overrides`.
- Permanent redirect from the old `sha--benue--gboko-iii--s-d-p` URL to the corrected candidate.
- Unknown candidate, race and state URLs return 404, and the smoke test checks them.
- Search input keeps its visible label as the accessible name.
- Candidate IDs are now in the stable-ID snapshot, with orphaned photo and platform keys checked.
- Removed an unused import in `RaceSheet`.
