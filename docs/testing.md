# Testing

The project uses deterministic checks rather than manual inspection. Run the full set before a pull request.

## Gates

| Command                                 | What it proves                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------- |
| `npm run audit`                         | No known npm vulnerabilities at any severity                                                |
| `npm run check`                         | Biome formatting and lint pass                                                              |
| `npm run typecheck`                     | TypeScript compiles with `strict: true`                                                     |
| `npm test`                              | The data contract, polling unit parser and ID snapshot hold                                 |
| `bash tests/open_data_pr_guard.test.sh` | Data branch names and non-main checkouts are rejected; a no-change data run is a no-op      |
| `npm run build`                         | Every static page and route builds                                                          |
| `npm run smoke`                         | The built server returns 200 for key routes, sets security headers, and enforces API guards |
| `uv run pytest -q`                      | Python pipeline helpers behave as expected                                                  |
| `uv run pip-audit -r requirements.txt`  | Python dependencies are clean on the Linux resolution                                       |

`npm run smoke` expects a production build. Run `npm run build` first.

## What each layer covers

### Data contract

`tests/data-contract.test.mjs` uses Node's built-in test runner. It checks:

- office status and plausible counts;
- unique race, candidate and assembly IDs;
- every foreign key between races, candidates, LGAs, wards and districts;
- INEC source URL and page on every candidate;
- normalised party codes and known parties;
- every referenced photo, logo and platform key belongs to a live candidate;
- no stable candidate, race, state, LGA or district ID was removed.

The snapshot lives in `tests/fixtures/data-ids.json`. When a rename is intentional, review the removed IDs, add a redirect if the old URL was public, then run:

```sh
npm run snapshot:ids
```

### Python unit tests

`tests/python/test_build_ballot.py` covers party-code normalisation, slug and title helpers, qualification levels, and State Assembly constituency matching. `tests/python/test_image_processing.py` exercises the Pillow WebP thumbnail path used by the media scripts. Run with:

```sh
uv run pytest -q
```

The tests read the committed data but do not touch the network.

### Build and smoke

`npm run build` generates 532 static pages; the 774 LGA and 1,489 race pages render on first request and cache, so they are not in the build output. It catches broken routes, invalid static params and server/client boundary mistakes. `npm run isr:budget -- --max 30000` caps the build's ISR write units in CI.

`scripts/smoke.sh` starts the built server on port 3210 and checks:

- `/`, `/race/president`, `/state/lagos/agege`, `/candidate/president--ndc`, `/state/lagos`, `/economy`, `/promises`, `/manifestos`, `/manifesto/president--apc`, `/manifesto/gov--oyo--apm`, `/manifesto/gov--kwara--pdp`, `/data`;
- `/search-index.json`, `/lga-points.json`, `/api/candidate-details`, `/og`;
- an invalid LGA returns 404; the candidate-details API rejects more than 10 ids, reports missing ids and sends `s-maxage`;
- unknown candidate, race, state and manifesto URLs return 404;
- the APC reader contains its title and a page reference; the Oyo APM reader says "abridged" and not "full"; the Kwara reader says "Manifesto not published yet" and has no empty "commitments below" copy; the party reader does not duplicate the party name;
- the old `sha--benue--gboko-iii--s-d-p` candidate URL redirects with 308;
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Content-Security-Policy`;
- `/api/search-miss` rejects a non-JSON body, a browser cross-origin request and an oversized body, hides the report without a key, accepts a bearer key and rate-limits repeated requests.

### Data PR guards

`tests/open_data_pr_guard.test.sh` runs the branch, checkout and no-change guards in `scripts/open_data_pr.sh`. It checks that `main`, `master`, `HEAD`, `feature/x`, `data/Ingest` and `data/ingest/extra` are rejected, that a checkout which is not an ancestor of `main` is refused, and that an accepted data branch with no staged changes exits 0. It does not need a token or network and does not exercise GitHub.

### CI

`.github/workflows/ci.yml` runs the app checks, the data PR guard test, the Python tests and `pip-audit` on every pull request and every push to `main`. The data workflows also run `npm run test:data` before they open a pull request, so a broken join or a missing photo file stops the commit.

## Not covered yet

- Browser end-to-end tests for the search, picks and compare interactions.
- Automated accessibility audits beyond the Biome rules and the manual checks in the components.
- Performance budgets in CI. The shared JavaScript is about 103 kB and should stay close to that.
- Python tests for the photo matcher. The data contract test covers the output, not the matching rules.
- Browser end-to-end coverage for the maps and the desktop ballot desk that are being added next.

## Adding a test

- Put JavaScript tests in `tests/*.test.mjs` and run them with `node --test`.
- Put Python tests in `tests/python/test_*.py`. `pytest.ini` sets `testpaths` and `pythonpath`.
- Prefer fixtures or committed data over network calls.
- If a test needs a new script, add it to `package.json` and to CI.
