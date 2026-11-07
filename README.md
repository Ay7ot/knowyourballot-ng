# Know Your Ballot · Nigeria 2027

Find every candidate on your 2027 ballot (President, Senate, House of Representatives, Governor and State House of Assembly) by LGA, ward, polling unit code or location.

Live: https://knowyourballot-ng.vercel.app

## What this is

A non-partisan civic site. Every candidate row comes from an INEC document and keeps the source URL and page. There is no religion, no unsourced claim and no editorialising. Corrections arrive as GitHub issues and a person reviews each one.

## Data

| What                                                                | Source                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Candidates                                                          | INEC's published final lists (inecnigeria.org/press), fetched and parsed daily by `.github/workflows/ingest.yml`                                 |
| Polling unit to ward, LGA, senate district and federal constituency | INEC IReV polling-unit register, compiled by [Emeka-Onwuepe/Polling_Units_in_Nigeria](https://github.com/Emeka-Onwuepe/Polling_Units_in_Nigeria) |
| LGA centroids for "use my location"                                 | [Open Admin Data](https://openadmindata.org/ng/) (CC BY 4.0)                                                                                     |
| Party logos                                                         | Each party's INEC profile page                                                                                                                   |
| Candidate photos                                                    | Wikidata and Wikimedia Commons, with strict identity checks; official X photos only when tied to the candidate                                   |
| Manifestos and pledges                                              | Published documents and reputable reports, each linked                                                                                           |

## Develop

Requirements: Node.js 24, npm 11, and Python 3.12 for the data pipeline.

```sh
npm ci
npm run dev          # http://localhost:3000
```

Port 3100 is used by another local app.

## Verify

```sh
npm run audit        # no known npm vulnerabilities
npm run check        # Biome formatting and lint
npm run typecheck    # tsc --noEmit
npm test             # data contract, polling unit parser and ID snapshot
npm run build        # production build, 2,777 static pages
npm run smoke        # built server, key routes, headers and API guards
```

For the Python pipeline:

```sh
uv venv --python 3.12
uv pip install -r requirements-dev.txt
uv run pytest -q
uv run pip-audit -r requirements.txt
```

## Data pipeline

```sh
uv run python scripts/build_geo.py               # data/raw -> data/geo.json + public/data/pu/*.json
uv run python scripts/ingest_inec.py             # INEC PDFs -> data/candidates/*.json
uv run python scripts/build_ballot.py            # candidates + geo -> data/ballot.json
uv run python scripts/fetch_party_logos.py       # INEC party pages -> public/parties/*.webp
uv run python scripts/fetch_candidate_photos.py president,governor,senate
uv run python scripts/fetch_official_photos.py
```

`ingest_inec.py` needs network access to inecnigeria.org. The other scripts use the committed `data/raw` files or the public photo APIs.

## Deploy

Vercel is connected to the repository. A push to `main` builds and deploys production; other branches get previews. Run the checks above before pushing.

Environment variables:

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob store for failed-search analytics. Optional locally.
- `SEARCH_REPORT_KEY`: required to read the failed-search report.
- `NEXT_PUBLIC_SITE_URL`: optional, defaults to the Vercel URL.

See [.env.example](.env.example).

## Documentation

- [HANDOFF.md](HANDOFF.md): current operating brief, data sources, deploy flow and open decisions.
- [AGENTS.md](AGENTS.md): rules, architecture, commands and conventions for agents.
- [docs/data.md](docs/data.md): data dictionary, ID conventions and invariants.
- [docs/testing.md](docs/testing.md): test layers, snapshots and CI.
- [docs/runbook.md](docs/runbook.md): what to do when ingest, deploy or photos fail.

## Contributing and security

Read [CONTRIBUTING.md](CONTRIBUTING.md) before a pull request. Report security problems privately through [SECURITY.md](SECURITY.md), never in a public issue. Community standards are in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
