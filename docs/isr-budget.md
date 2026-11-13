# ISR budget and rollback

Vercel counts ISR writes in 8 KB units. The build's prerendered HTML and RSC are the predictable part. The on-demand LGA, race and candidate pages write again on first render after each deploy, so the build number alone is not the whole budget.

## Build guard

`npm run isr:budget` prints the units for the build. CI fails above 30,000:

```sh
npm run isr:budget -- --max 30000
```

Baseline on 13 Nov 2026: 16,581 units for 532 static pages. Before the route change: 152,633 units for 2,788 pages.

## Post-deploy check

After a production deploy, open Vercel, select the personal team, then Usage, ISR, last 24 hours, grouped by project.

- Soft threshold: 100,000 units in 24 hours. Find which routes are rendering and whether a crawler is walking the deferred set.
- Hard threshold: 250,000 units in 24 hours, or the Hobby ISR indicator above 40%. Roll back.

A full pass over the 2,263 deferred LGA and race pages is about 136,000 units at the current page sizes. That is the number to watch: one full crawl per deploy roughly equals the build saving. If it recurs, cut page weight (compact candidate rows or collapsed race lists) or move the project to Pro. Another build-only change will not fix it.

## Rollback

Fastest: Vercel, Deployments, the previous production deployment, Promote.

Or revert the merge commit on `main`:

```sh
git revert <merge-commit>
git push origin main
```

Record the ISR number and the routes responsible in the incident note before changing the code again.
