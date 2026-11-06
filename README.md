# Know Your Ballot · Nigeria 2027

Find every candidate on your 2027 ballot (President, Senate, House of Reps, Governor and State House of Assembly) by LGA, ward, polling unit code or location.

## Data

| What | Source |
| --- | --- |
| Candidates | INEC's published final lists (inecnigeria.org/press), fetched and parsed daily by `.github/workflows/ingest.yml` |
| Polling unit → ward → LGA → Senate district / federal constituency | INEC IReV polling-unit register, compiled by [Emeka-Onwuepe/Polling_Units_in_Nigeria](https://github.com/Emeka-Onwuepe/Polling_Units_in_Nigeria) |
| LGA centroids for "use my location" | [Open Admin Data](https://openadmindata.org/ng/) (CC BY 4.0) |

No religion, no unsourced claims. Corrections come in as GitHub issues and a person reviews each one.

## Pipeline

```
python scripts/build_geo.py      # data/raw -> data/geo.json + public/data/pu/*.json
python scripts/ingest_inec.py    # INEC PDFs -> data/candidates/*.json (needs network access to inecnigeria.org)
python scripts/build_ballot.py   # candidates + geo -> data/ballot.json
npm run build
```

## Develop

```
npm install
npm run dev
```
