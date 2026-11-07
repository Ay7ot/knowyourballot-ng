# Data

The site reads committed JSON. There is no runtime database. `data/ballot.json` is the single file the application uses for candidates and races; `data/geo.json` holds the electoral map.

## Sources

| What                                   | Source                                                                                                                                           | Notes                                          |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Candidates                             | INEC final and updated lists on [inecnigeria.org](https://www.inecnigeria.org/press/)                                                            | Every row keeps `source.url` and `source.page` |
| Polling unit to ward, LGA and district | INEC IReV polling-unit register, compiled by [Emeka-Onwuepe/Polling_Units_in_Nigeria](https://github.com/Emeka-Onwuepe/Polling_Units_in_Nigeria) | `data/raw/`                                    |
| LGA centroids                          | [Open Admin Data](https://openadmindata.org/ng/)                                                                                                 | CC BY 4.0                                      |
| State boundaries                       | [geoBoundaries](https://www.geoboundaries.org/) NGA ADM1 (GRID3)                                                                                 | CC BY 4.0                                      |
| Party logos                            | Each party's INEC profile page                                                                                                                   | `public/parties/`                              |
| Commons photos                         | Wikidata and Wikimedia Commons                                                                                                                   | Free licence, strict identity checks           |
| Official photos                        | The candidate's own X account                                                                                                                    | Only when the account is tied to the person    |
| Manifestos and pledges                 | Published documents and reputable reports                                                                                                        | Every claim links to a source                  |

## Generated and hand-maintained files

Generated, do not hand-edit:

- `data/candidates/*.json` and `data/candidates/_report.json`
- `data/geo.json` and `public/data/pu/*.json`
- `data/nigeria-map.json` (state boundary paths, built by `scripts/build_map.mjs`)
- `data/ballot.json`
- `data/party_logos.json`, `data/candidate_photos.json`, `data/photo_report.json`, `data/official_photos.json`
- `public/candidates/*.webp` and `public/parties/*.webp`

Hand-maintained inputs:

- `data/sources.json`: INEC press pages to scrape
- `data/official_handles.json`: candidate id to X handle, with a `why`
- `data/platforms.json`: sourced manifestos, pledges and party platforms
- `data/photo_rejects.json` and `data/photo_confirms.json`: human photo decisions
- `data/photo_overrides.json`: optional, present as `{}`
- `data/parties.json`: INEC's 22 parties
- `src/lib/economy.ts`: hand-checked figures; bump `ECONOMY_CHECKED` when a figure changes

## File shapes

`data/ballot.json`:

```json
{
  "generatedAt": "2026-11-06T08:53:12Z",
  "offices": {
    "presidential": { "status": "loaded", "documents": [{ "url": "...", "sha256": "..." }] }
  },
  "races": [
    {
      "id": "president",
      "office": "president",
      "name": "President of Nigeria",
      "state": null,
      "district": null,
      "candidates": ["president--aa"]
    }
  ],
  "candidates": [
    {
      "id": "president--aa",
      "race": "president",
      "office": "president",
      "party": "AA",
      "name": "...",
      "source": { "url": "...", "page": 1 }
    }
  ],
  "assembly": [{ "id": "abia--aba-north", "state": "01", "name": "Aba North", "lgas": ["01-01"] }],
  "unmatched": []
}
```

`data/geo.json` holds `states`, `lgas`, `wards`, `senatorial` and `federal` arrays. See `src/lib/types.ts` for the full types.

## ID conventions

| Entity       | Pattern                                                                                  | Example                         |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------- |
| State        | INEC numeric code, slug, name and short name                                             | `"01"`, `abia`                  |
| LGA          | `<stateCode>-<number>`                                                                   | `01-01`                         |
| Ward         | `<stateCode>-<lgaNumber>-<wardNumber>`                                                   | `01-01-01`                      |
| District     | `<stateSlug>--<districtSlug>`                                                            | `abia--aba-north`               |
| Race         | `president`, `gov--<state>`, `sen--<district>`, `rep--<district>`, `sha--<constituency>` | `sen--ogun--ogun-east`          |
| Candidate    | `<raceId>--<partyCode>`                                                                  | `president--ndc`                |
| Running mate | Nested under `candidate.runningMate`                                                     | Photo key `<candidateId>--mate` |

A numeric suffix (`-2`, `-3`) is added if a candidate id collides. IDs are derived from names, so a rename can change an ID. The data contract test fails when a stable ID is removed. Review the change, add a redirect if the old URL was public, then run `npm run snapshot:ids`.

## Invariants

`tests/data-contract.test.mjs` enforces these on every run:

1. Every office reports `loaded`.
2. Race, candidate and assembly IDs are unique.
3. Every `candidate.race` and `race.candidates[]` resolves.
4. Every candidate has an INEC source URL and page, and a known party code.
5. Every LGA has a senate district and at least one federal constituency.
6. Every ward and district points at a real LGA.
7. Every assembly constituency points at a real state and real LGAs.
8. `unmatched` is empty; a new row must be explained on `/data` before the test is updated.
9. Every referenced photo and logo file exists.
10. No stable candidate, race, state, LGA or district ID was removed.
11. The map file covers every state with a valid SVG path and bounding box.

## Pipeline order

The full pipeline needs Python 3.12 and the packages in `requirements.txt`.

```sh
uv venv --python 3.12
uv pip install -r requirements-dev.txt

uv run python scripts/build_geo.py
uv run python scripts/ingest_inec.py
uv run python scripts/build_ballot.py
uv run python scripts/fetch_party_logos.py
uv run python scripts/fetch_candidate_photos.py president,governor,senate
uv run python scripts/fetch_official_photos.py
```

`build_geo.py` reads the raw register and writes `data/geo.json` plus `public/data/pu/*.json`. `ingest_inec.py` downloads and parses INEC PDFs. `build_ballot.py` joins candidate rows to the map and writes `data/ballot.json`. The photo and logo scripts write their own JSON and image files.

All steps overwrite their outputs. A failed download is recorded in `data/candidates/_report.json` rather than silently dropped.

## Maps

`data/nigeria-map.json` holds simplified state boundary paths, per-state bounding boxes and a shared projection. `scripts/build_map.mjs` regenerates it from the geoBoundaries NGA ADM1 GeoJSON:

```sh
curl -L -o /tmp/nga-states.geojson \
  "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/NGA/ADM1/geoBoundaries-NGA-ADM1_simplified.geojson"
node scripts/build_map.mjs /tmp/nga-states.geojson
```

The boundaries are simplified for display, not survey-grade. Credit geoBoundaries / GRID3, CC BY 4.0 wherever the map appears. LGA points use the centroids from `data/geo.json`; four Imo LGAs have no centroid and therefore no dot.

## Adding or correcting data

- **A candidate fact:** find the INEC document in `data/sources.json`, correct the source or the parser, rerun ingest and build, then run the tests. Do not type a fact in by hand.
- **A manifesto or pledge:** add it to `data/platforms.json` with a public source. A person reviews each one.
- **A photo:** add a rejection to `data/photo_rejects.json` if a match is wrong. For a verified Commons choice, add it to `data/photo_overrides.json` or use the photo review workflow.
- **A party:** update `data/parties.json` only from INEC's register.

## Known gaps

- Some INEC lists have not been published, for example the Borno State Assembly list at the last check.
- State Assembly constituencies are matched to LGAs by name because INEC does not publish the ward composition.
- Photo coverage is deliberately low. A missing photo is better than a wrong one.
- Large files live in Git: `data/ballot.json` is about 6.5 MB and `public/data/pu` about 7.2 MB. See `HANDOFF.md` for the open decision on storage.
