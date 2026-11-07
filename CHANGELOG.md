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
- Error, global error and loading boundaries.
- `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `.env.example`, `CHANGELOG.md` and the `docs/` guides.
- Correction, photo and manifesto issue templates.
- `uv` setup for the Python 3.12 pipeline, with pinned requirements.

### Changed

- Replaced deprecated `next lint` with Biome for lint and formatting.
- Normalised party codes at build time. One candidate changed from `S D P` to `SDP`.
- Data workflows now run the data contract test before committing.
- Updated the README, HANDOFF and AGENTS documents for the current stack and checks.

### Fixed

- `npm audit` now reports 0 vulnerabilities. `postcss` and `zod` are pinned through `overrides`.
- Permanent redirect from the old `sha--benue--gboko-iii--s-d-p` URL to the corrected candidate.
- Search input now has an accessible name.
- Removed an unused import in `RaceSheet`.
