# Handoff: Know Your Ballot · Nigeria 2027

Paste everything below the line into your coding agent as its starting brief.

---

You're taking over **Know Your Ballot · Nigeria 2027**, a civic site where any Nigerian voter can find every candidate on their 2027 ballot (President, Senate, House of Reps, Governor, State House of Assembly) by state, LGA, ward, polling unit code or location, and read sourced information about them.

- Repo: https://github.com/Ay7ot/knowyourballot-ng (branch `main`)
- Local checkout: `/Users/ayomideathome/Documents/knowyourballot-ng`
- Live: https://knowyourballot-ng.vercel.app
- Election dates in the app (`src/lib/data.ts`, `ELECTIONS`): 16 Jan 2027 (Presidential and National Assembly), 6 Feb 2027 (Governorship and State Assembly).

## Ground rules for this project

1. **Every fact needs a source.** Candidate rows come only from INEC documents, and each row keeps the PDF URL and page. Manifestos and pledges link to their source. Nothing is typed in by hand without a citation.
2. **No religion, no unsourced claims, no editorialising.** The site must not look partisan. Corrections arrive as GitHub issues and a person reviews each one.
3. **Photos must be verified as the right person** before going live (details below). A wrong face on a candidate is worse than no photo.
4. **Pushing to `main` deploys to production.** Treat every push as a production deploy. Run typecheck and build first.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript, Tailwind CSS v4 (via `@tailwindcss/postcss`).
- Static-first: `npm run build` generates 532 static pages (37 state pages, 463 President/Governor candidate pages, 16 manifesto pages, and the static site pages). The 774 LGA pages and 1,489 race pages render on first request and cache; the remaining candidate pages do too, with `revalidate = false`. A full build takes about a minute locally.
- Data lives as JSON in `data/` and is imported at build time through `src/lib/data.ts` (server-only). `data/ballot.json` (~6.5 MB) is the single file the site reads for candidates and races.
- Client search: Fuse.js over `/search-index.json` (generated route). Search understands offices, parties, topics and plain questions.
- Self-hosted, subsetted fonts in `src/fonts` (Archivo, Atkinson Hyperlegible Next, IBM Plex Mono). Rebuild with `scripts/subset_fonts.py` if fonts change.
- Share images: `src/app/og/route.tsx` (edge runtime, TTFs sit beside it). Page metadata all goes through `pageMeta()` in `src/lib/seo.ts`.
- Two API routes: `src/app/api/search-miss/route.ts`, which logs searches that found nothing to a Vercel Blob store, and `src/app/api/candidate-details/route.ts`, which returns facts and policy for the compare tray when it opens.
- Python 3.12 data scripts in `scripts/`, run by GitHub Actions. Locally, use `uv venv --python 3.12 && uv pip install -r requirements-dev.txt`; the system Python is 3.9 and does not have the pipeline packages.

Key directories:

```
src/app/            routes: /, /state/[state]/[lga], /race/[id], /candidate/[id], /promises,
                    /manifestos, /manifesto/[id], /guide, /who-decides, /economy, /data, /og, /api/search-miss
src/components/     FindBallot, MyBallot, BallotTray, RaceSheet, Promises, SiteHeader, controls, ...
src/lib/            data.ts (data access), types.ts, seo.ts, civics.ts (glossary/issues),
                    economy.ts (hand-checked figures), site.ts
data/               ballot.json, geo.json, candidates/*.json, parties.json, platforms.json,
                    candidate_photos.json, official_photos.json, official_handles.json,
                    photo_rejects.json, photo_confirms.json, photo_report.json, sources.json, raw/
scripts/            Python data pipeline (see below)
public/             data/pu/*.json (polling units per state), parties/*.webp, candidates/*.webp
.github/workflows/  ingest.yml, media.yml, official-photos.yml, photo-options.yml
```

## Data sources

| What                                                           | Source                                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Candidates                                                     | INEC's published final/updated lists (press pages in `data/sources.json`)                                    |
| Polling unit, ward, LGA, Senate district, federal constituency | INEC IReV polling-unit register, compiled by github.com/Emeka-Onwuepe/Polling_Units_in_Nigeria (`data/raw/`) |
| LGA centroids for "use my location"                            | Open Admin Data (openadmindata.org/ng, CC BY 4.0)                                                            |
| Party logos                                                    | Each party's INEC profile page                                                                               |
| Candidate photos (free licence)                                | Wikidata + Wikimedia Commons, strict matching                                                                |
| Candidate photos (official)                                    | The candidate's own X account, only when tied to them (`data/official_handles.json`)                         |
| Manifestos, pledges, party platforms                           | Published documents and news reports, each linked (`data/platforms.json` and related)                        |

Current numbers: 15,137 candidates, 1,489 races, 0 unmatched rows. Known gap: some lists INEC hasn't published (e.g. Borno State Assembly at last check). The `/data` page shows coverage and anything that couldn't be placed.

## Pipelines

```
python scripts/build_geo.py               # data/raw -> data/geo.json + public/data/pu/*.json
python scripts/ingest_inec.py             # INEC PDFs -> data/candidates/*.json (+ _report.json)
python scripts/build_ballot.py            # candidates + geo -> data/ballot.json
python scripts/fetch_party_logos.py       # INEC party pages -> public/parties/*.webp
python scripts/fetch_candidate_photos.py president,governor,senate   # Wikidata/Commons photos
python scripts/fetch_official_photos.py   # X profile photos for handles in official_handles.json
python scripts/photo_options.py <id> "<Commons category>"   # list Commons options for a human to pick
```

GitHub Actions (they open auto-merged data pull requests; the merge triggers a deploy):

- **ingest.yml**: daily 05:00 UTC, plus on changes to `sources.json` or the ingest scripts. Downloads INEC PDFs, parses with pdfplumber, rebuilds `ballot.json`. INEC substitutes candidates and courts change lists right up to election day, so this matters.
- **media.yml**: Mondays, or manual with an `offices` input. Party logos and Commons photos. Long runs (up to 5 hours for all offices).
- **official-photos.yml**: on changes to `official_handles.json` or its script.
- **photo-options.yml**: manual. Pushes review thumbnails to the `photo-review` branch (never `main`). That branch is a scratch area; nothing in it needs merging.

All data workflows share the `ingest` concurrency group so they don't race each other's branch pushes. If you push while a workflow is running, pull first.

### Photo matching rules (don't loosen without a reason)

A Wikidata person is accepted only if: human with Nigerian citizenship; at least two name words match (two-word INEC names must match the main label); birth year within 1 year of INEC's age, or party matches when there's no birth date; exactly one person passes; the Commons image has a free licence; and it isn't in `photo_rejects.json`. A broader search once matched a Taraba candidate to Kaduna's governor, which is why these rules exist. Result: 43 verified photos out of about 15,500 candidates and running mates.

Official X photos (currently only Peter Obi, `president--ndc`) are shown ahead of the Commons photo with a credit naming the account and a link for the campaign to request a change or removal. They are **not** freely licensed.

## Run locally

```
cd /Users/ayomideathome/Documents/knowyourballot-ng
npm ci
npm run dev          # http://localhost:3000 (3100 is used by another local app)
npm run check        # Biome formatting and lint
npm run typecheck
npm test             # data contract and ID snapshot
npm run build && npm run smoke

uv venv --python 3.12
uv pip install -r requirements-dev.txt
uv run pytest -q
```

Verified on 13 Nov 2026: `npm run audit`, `npm run check`, `npm run typecheck`, `npm test`, `npm run build`, `npm run isr:budget` and `npm run smoke` pass on this Mac. The build generated 532 static pages and 16,581 ISR units, and the smoke test returned 200 for `/`, `/race/president`, `/state/lagos/agege`, `/candidate/president--ndc`, `/state/lagos`, `/economy`, `/promises`, `/manifestos`, `/manifesto/president--apc`, `/data`, `/search-index.json`, `/lga-points.json`, `/api/candidate-details` and `/og`.

Environment variables (none needed for local dev):

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob store `kyb-search-misses`, already connected on Vercel. Without it, `/api/search-miss` returns 204 and stores nothing. `vercel env pull .env.local` fetches it (install the Vercel CLI first; it isn't on this Mac).
- `SEARCH_REPORT_KEY`: **not set yet**. Once set in Vercel, `GET /api/search-miss?key=<key>` lists the last 30 days of failed searches. Without it the route returns 404.
- `NEXT_PUBLIC_SITE_URL`: optional, defaults to https://knowyourballot-ng.vercel.app.

## Deploy flow

Vercel is connected to the GitHub repo. Push to `main` and Vercel builds and deploys to production; other branches get preview URLs. There's no `vercel.json`. `main` has a ruleset. The full gate in `.github/ruleset.json` requires a pull request and the `App checks and build` and `Python pipeline tests` checks, and blocks force pushes, branch deletion and non-linear history. It was applied on 2026-11-09 after the `DATA_BOT_TOKEN` secret and one validated data PR. The data workflows push reserved branches and open auto-merged pull requests; they do not push to `main`. Human changes still go through a pull request and the full local checklist. Before pushing: `npm run audit && npm run check && npm run typecheck && npm test && npm run build && npm run smoke`. CI in `.github/workflows/ci.yml` runs the same checks on every pull request and push to `main`. A merge cannot land before the checks pass. After pushing, check the live page and the CI run. `docs/branch-protection.md` has the token setup, apply command and emergency rollback. Lighthouse is 100 on desktop and 96 to 98 for mobile performance, limited by Next/React's ~110 KB of shared JS; keep new client JS small.

## Security and limits

- `next.config.ts` sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`, HSTS and, in production, a CSP. The CSP allows inline scripts and styles because Next injects both; everything else is locked to self.
- `/api/search-miss` rejects browser cross-origin requests when `Origin` is present (403), non-JSON (415), bodies over 512 bytes (413) and more than 30 requests per 10 minutes per instance (429). The report requires `SEARCH_REPORT_KEY`, accepts `Authorization: Bearer` or `?key=`, and uses a timing-safe comparison. The limiter is in memory per serverless instance, not a global quota.
- GitHub Actions are pinned to commit SHAs, and checkouts do not persist credentials. Python dependencies are audited on the Linux resolution with `pip-audit`; macOS uses a dev-only `cryptography` pin because 49+ has no wheel for x86_64. Pillow is 13.0.0 and pdfplumber is 0.11.10.
- `npm audit` is clean. `postcss` and `zod` are pinned through `overrides` in `package.json`; review those pins when Next or `@vercel/blob` changes.
- There are `error` and `global-error` boundaries. There is deliberately no root `loading.tsx`: it made unknown candidate URLs return 200, so `npm run smoke` asserts 404 for unknown routes.

## Recent changes (5 to 7 Nov 2026)

- Nationwide build from INEC lists, constituency lookup by LGA, ward, polling unit and location.
- Redesigned as a guided ballot: ballot-paper sheets, picks, compare, voting-day guide.
- "What they promise" on every candidate and race page: own manifesto or pledges when sourced, otherwise the party platform (labelled as such), plus a link for campaigns to send theirs. Governorship manifestos so far: Lagos, Oyo, Akwa Ibom, Kaduna, Rivers, Benue, Niger, Kwara.
- Party logos from INEC; verified Commons photos (43); photo review tool and per-candidate overrides; Obi's official X photo with credit.
- Mobile navbar fixed (single-row sticky header with a menu sheet); faster pages on mobile data.
- Search understands offices, parties, topics and plain questions; failed searches are logged.
- `/who-decides` (who controls what) with election terms defined in place; `/economy` (eight numbers, hand-checked: bump `ECONOMY_CHECKED` in `src/lib/economy.ts` whenever a figure changes).
- Single focus ring, custom pill toggles, dropdown and checkbox, full meta tags and per-page share images.

### Hardening (7 Nov 2026)

- `npm audit` is clean. `postcss` and `zod` are pinned through `overrides` to patched versions.
- Biome replaces `next lint` for lint and format. `npm run check` is the gate.
- Data contract tests, Python unit tests and a production smoke test now exist.
- CI runs audit, check, typecheck, tests, build and smoke on every pull request and push to `main`.
- Security headers and a production CSP are set in `next.config.ts`; `/api/search-miss` has origin, content-type, size and rate guards.
- `error` and `global-error` boundaries were added. The root loading boundary was removed after it caused soft 404s; the smoke test now checks 404s and the redirect.
- Party codes are normalised at build time. One candidate changed from `S D P` to `SDP`, with a permanent redirect from the old URL.

### Manifesto library (9 Nov 2026)

- APC's 2027–2031 presidential manifesto, “From Reforms to Prosperity”, added with 17 page-cited commitments and a link to the 109-page document.
- `/manifestos` lists every manifesto and pledge record; `/manifesto/[id]` gives each one a reader with its sources and an explicit document state (full, abridged, summary only, or awaiting publication).
- Manifestos is in the header nav, home cards, footer and search; pledges across the site now show page references where a source has them.

## Decisions already made

- **Licence: MIT.** See `LICENSE`.
- **Generated JSON stays in Git.** No Git LFS and no external artifact store; review large additions and keep new committed artifacts small.
- **Full gate on `main`: a dedicated token with auto-merged data pull requests.** The data workflows push reserved branches and open pull requests with `DATA_BOT_TOKEN`; the full ruleset requires a pull request and both CI checks, with no bypass actor. It was applied on 2026-11-09 after the secret and one validated data PR. See `docs/branch-protection.md`.

## Open decisions (need Ayomide)

1. **Set `DATA_BOT_TOKEN` and validate auto-merge.** Create the fine-grained token, add the repository secret, disable the three data workflows, merge the workflow change, apply `.github/ruleset.json`, record the ruleset state, re-enable the workflows, then run one ingest. The exact steps are in `docs/branch-protection.md`.
2. **Official X photos for other candidates.** Options: (a) President, Governor and Senate first, then report coverage (recommended: that's where voters look and where accounts can be verified); (b) everyone verifiable, including Reps and Assembly (slow, most have no verifiable account); (c) Obi only, add others when campaigns send photos. These images are not freely licensed; credit and removal requests are the mitigation.
3. **Set `SEARCH_REPORT_KEY`** in Vercel so failed searches can be reviewed.
4. **Campaign outreach** for photos and manifestos: the reliable way to cover the ~13,000 candidates with no public record.

## Suggested next steps

1. Get a decision on X photos, then add handles to `data/official_handles.json` with a `why` and let `official-photos.yml` run.
2. Review the failed-search log weekly once `SEARCH_REPORT_KEY` is set.
3. Extend tests: browser end-to-end for search, picks and compare; unit tests for the photo matcher; performance budgets in CI.
4. Watch the daily ingest for INEC substitutions and parser failures (`data/candidates/_report.json`, the `/data` page). Re-check the Borno State Assembly list.
