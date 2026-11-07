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
- Almost entirely static: about 15k pages prerendered at build time with `generateStaticParams` (candidates, 1,489 races, 37 states, 774 LGAs). A full `npm run build` takes several minutes locally.
- Data lives as JSON in `data/` and is imported at build time through `src/lib/data.ts` (server-only). `data/ballot.json` (~6.5 MB) is the single file the site reads for candidates and races.
- Client search: Fuse.js over `/search-index.json` (generated route). Search understands offices, parties, topics and plain questions.
- Self-hosted, subsetted fonts in `src/fonts` (Archivo, Atkinson Hyperlegible Next, IBM Plex Mono). Rebuild with `scripts/subset_fonts.py` if fonts change.
- Share images: `src/app/og/route.tsx` (edge runtime, TTFs sit beside it). Page metadata all goes through `pageMeta()` in `src/lib/seo.ts`.
- One API route: `src/app/api/search-miss/route.ts`, which logs searches that found nothing to a Vercel Blob store.
- Python 3.12 data scripts in `scripts/`, run by GitHub Actions. The Mac has Python 3.9 by default, so install 3.12 (e.g. `brew install python@3.12`) before running scripts locally.

Key directories:

```
src/app/            routes: /, /state/[state]/[lga], /race/[id], /candidate/[id], /promises,
                    /guide, /who-decides, /economy, /data, /og, /api/search-miss
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

| What | Source |
| --- | --- |
| Candidates | INEC's published final/updated lists (press pages in `data/sources.json`) |
| Polling unit, ward, LGA, Senate district, federal constituency | INEC IReV polling-unit register, compiled by github.com/Emeka-Onwuepe/Polling_Units_in_Nigeria (`data/raw/`) |
| LGA centroids for "use my location" | Open Admin Data (openadmindata.org/ng, CC BY 4.0) |
| Party logos | Each party's INEC profile page |
| Candidate photos (free licence) | Wikidata + Wikimedia Commons, strict matching |
| Candidate photos (official) | The candidate's own X account, only when tied to them (`data/official_handles.json`) |
| Manifestos, pledges, party platforms | Published documents and news reports, each linked (`data/platforms.json` and related) |

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

GitHub Actions (they commit data back to `main`, which triggers a deploy):

- **ingest.yml**: daily 05:00 UTC, plus on changes to `sources.json` or the ingest scripts. Downloads INEC PDFs, parses with pdfplumber, rebuilds `ballot.json`. INEC substitutes candidates and courts change lists right up to election day, so this matters.
- **media.yml**: Mondays, or manual with an `offices` input. Party logos and Commons photos. Long runs (up to 5 hours for all offices).
- **official-photos.yml**: on changes to `official_handles.json` or its script.
- **photo-options.yml**: manual. Pushes review thumbnails to the `photo-review` branch (never `main`). That branch is a scratch area; nothing in it needs merging.

All data workflows share the `ingest` concurrency group so they don't race each other's commits. If you push while a workflow is running, pull first.

### Photo matching rules (don't loosen without a reason)

A Wikidata person is accepted only if: human with Nigerian citizenship; at least two name words match (two-word INEC names must match the main label); birth year within 1 year of INEC's age, or party matches when there's no birth date; exactly one person passes; the Commons image has a free licence; and it isn't in `photo_rejects.json`. A broader search once matched a Taraba candidate to Kaduna's governor, which is why these rules exist. Result: 43 verified photos out of about 15,500 candidates and running mates.

Official X photos (currently only Peter Obi, `president--ndc`) are shown ahead of the Commons photo with a credit naming the account and a link for the campaign to request a change or removal. They are **not** freely licensed.

## Run locally

```
cd /Users/ayomideathome/Documents/knowyourballot-ng
npm ci
npm run dev          # http://localhost:3000 (3100 is used by another local app)
npm run typecheck
npm run build && npx next start -p 3210
```

Verified on 7 Nov 2026: `npm ci`, `npm run typecheck` and `npm run build` all pass on this Mac, and the production server returned 200 for `/`, `/race/president`, `/candidate/president--ndc`, `/state/lagos`, `/economy`, `/search-index.json` and `/og`.

Environment variables (none needed for local dev):

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob store `kyb-search-misses`, already connected on Vercel. Without it, `/api/search-miss` returns 204 and stores nothing. `vercel env pull .env.local` fetches it (install the Vercel CLI first; it isn't on this Mac).
- `SEARCH_REPORT_KEY`: **not set yet**. Once set in Vercel, `GET /api/search-miss?key=<key>` lists the last 30 days of failed searches. Without it the route returns 404.
- `NEXT_PUBLIC_SITE_URL`: optional, defaults to https://knowyourballot-ng.vercel.app.

## Deploy flow

Vercel is connected to the GitHub repo. Push to `main` and Vercel builds and deploys to production; other branches get preview URLs. There's no `vercel.json`. Before pushing: `npm run typecheck && npm run build`. After pushing, check the live page. Lighthouse is 100 on desktop and 96 to 98 for mobile performance, limited by Next/React's ~110 KB of shared JS; keep new client JS small.

## Recent changes (5 to 7 Nov 2026)

- Nationwide build from INEC lists, constituency lookup by LGA, ward, polling unit and location.
- Redesigned as a guided ballot: ballot-paper sheets, picks, compare, voting-day guide.
- "What they promise" on every candidate and race page: own manifesto or pledges when sourced, otherwise the party platform (labelled as such), plus a link for campaigns to send theirs. Governorship manifestos so far: Lagos, Oyo, Akwa Ibom, Kaduna, Rivers, Benue, Niger, Kwara.
- Party logos from INEC; verified Commons photos (43); photo review tool and per-candidate overrides; Obi's official X photo with credit.
- Mobile navbar fixed (single-row sticky header with a menu sheet); faster pages on mobile data.
- Search understands offices, parties, topics and plain questions; failed searches are logged.
- `/who-decides` (who controls what) with election terms defined in place; `/economy` (eight numbers, hand-checked: bump `ECONOMY_CHECKED` in `src/lib/economy.ts` whenever a figure changes).
- Single focus ring, custom pill toggles, dropdown and checkbox, full meta tags and per-page share images.

## Open decisions (need Ayomide)

1. **Official X photos for other candidates.** Options: (a) President, Governor and Senate first, then report coverage (recommended: that's where voters look and where accounts can be verified); (b) everyone verifiable, including Reps and Assembly (slow, most have no verifiable account); (c) Obi only, add others when campaigns send photos. Tradeoffs: these images aren't freely licensed (low but non-zero copyright risk, handled by credit plus honouring removal requests); an X blue check is now just a paid subscription, so only accept accounts Wikidata lists (P2002) or that news reports tie to the person.
2. **Set `SEARCH_REPORT_KEY`** in Vercel so failed searches can be reviewed.
3. **Campaign outreach** for photos and manifestos: the reliable way to cover the ~13,000 candidates with no public record. A short message to parties and campaigns could be drafted.

## Suggested next steps

1. Get a decision on item 1 above, then add handles to `data/official_handles.json` with a `why` for each, and let `official-photos.yml` run.
2. Review the failed-search log weekly once the key is set, and fix search gaps it shows.
3. Keep adding sourced governorship manifestos as campaigns publish them.
4. Watch the daily ingest for INEC substitutions and parser failures (`data/candidates/_report.json`, the `/data` page). Re-check the Borno State Assembly list.
5. Add automated tests: there are none yet. Start with the Python matchers (photo matching, `build_ballot` constituency joins) and a smoke test that builds and hits the key routes.
