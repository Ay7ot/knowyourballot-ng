import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { ECONOMY_CHECKED, INDICATORS } from "@/lib/economy";
import { ISSUES, LEVEL_NAME } from "@/lib/civics";
import { Crumbs } from "@/components/ui";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = pageMeta({
  title: "Nigeria's economy in eight numbers",
  description:
    "Inflation, the naira, petrol prices, jobs, the minimum wage, the budget, debt and state allocations, in plain words, with who controls each and what candidates promise.",
  path: "/economy",
  og: {
    k: "Before you vote",
    t: "Nigeria's economy in eight numbers",
    s: "Inflation, the naira, petrol, jobs, wages, the budget, debt and state allocations.",
  },
});

const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
const topicHref = (t: string) => `/promises#topic-${t.toLowerCase().replace(/\W+/g, "-")}`;

export default function Economy() {
  return (
    <div className="mx-auto max-w-6xl py-8" style={gutter}>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "Economy" }]} />
      <h1 className="display mt-5 text-4xl sm:text-5xl">The economy in eight numbers</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-muted">
        Where prices, the naira, jobs and public money stand before you vote, who controls each one, and what the
        candidates say they&apos;ll do. Figures from official publishers, checked {day(ECONOMY_CHECKED)}.
      </p>

      <nav aria-label="Numbers on this page" className="mt-6 flex flex-wrap gap-2 text-sm">
        {INDICATORS.map((i) => (
          <a
            key={i.id}
            href={`#${i.id}`}
            className="rounded-md border border-rule bg-sheet px-3 py-2 font-medium hover:border-green"
          >
            {i.title}
          </a>
        ))}
      </nav>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {INDICATORS.map((i) => {
          const issue = i.issue ? ISSUES.find((x) => x.id === i.issue) : undefined;
          return (
            <article
              key={i.id}
              id={i.id}
              aria-labelledby={`${i.id}-h`}
              className="sheet flex scroll-mt-24 flex-col overflow-hidden"
            >
              <header className="sheet-band px-5 pb-4 pt-5">
                <h2 id={`${i.id}-h`} className="label text-green">
                  {i.title}
                </h2>
                <p className="display-tight mt-2 text-3xl tabular">{i.value}</p>
                <p className="mono mt-1 text-xs text-muted">{i.asOf}</p>
              </header>
              <div className="flex-1 space-y-3 px-5 py-4 text-[0.95rem]">
                <p>{i.plain}</p>
                {i.example && <p className="rounded-md bg-green-soft px-3 py-2 text-sm">{i.example}</p>}
                {i.compare && (
                  <dl className="divide-y divide-rule rounded-md border border-rule text-sm">
                    {i.compare.map((c) => (
                      <div key={c.label} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                        <dt className="text-muted">{c.label}</dt>
                        <dd className="mono shrink-0 font-medium">{c.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {i.note && <p className="text-sm text-muted">{i.note}</p>}
                <ul className="space-y-1 text-sm">
                  {issue && (
                    <li>
                      <span className="text-muted">Who controls it: </span>
                      <Link
                        prefetch={false}
                        href={`/who-decides#issue-${issue.id}`}
                        className="font-medium text-green underline"
                      >
                        {issue.mostly.map((l) => LEVEL_NAME[l].split(":")[0]).join(", ")}
                      </Link>
                    </li>
                  )}
                  {i.topic && (
                    <li>
                      <Link prefetch={false} href={topicHref(i.topic)} className="font-medium text-green underline">
                        What presidential candidates promise on {i.topic.toLowerCase()}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
              <p className="border-t border-rule px-5 py-2.5 text-xs text-muted">
                Source:{" "}
                {i.sources.map((s, n) => (
                  <span key={s.url}>
                    {n > 0 && "; "}
                    <a href={s.url} className="underline" rel="noopener">
                      {s.label}
                    </a>
                  </span>
                ))}
              </p>
            </article>
          );
        })}
      </div>

      <section aria-labelledby="ask-h" className="mt-10 rounded-md border-2 border-green bg-green-soft px-5 py-5">
        <h2 id="ask-h" className="display-tight text-xl">
          Questions worth asking the people on your ballot
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.95rem]">
          <li>Presidential candidates: what will you do about food prices and the naira, and by when?</li>
          <li>Senate and House candidates: which law or budget line will you push to bring jobs to this area?</li>
          <li>
            Governorship candidates: how will you spend the state&apos;s monthly allocation, and will you pay the
            minimum wage?
          </li>
          <li>State Assembly candidates: how will you check the governor&apos;s spending?</li>
        </ul>
        <p className="mt-3 text-sm">
          <Link prefetch={false} href="/" className="font-medium text-green underline">
            Find who&apos;s on your ballot
          </Link>
          {" · "}
          <Link prefetch={false} href="/who-decides" className="font-medium text-green underline">
            Who decides what
          </Link>
        </p>
      </section>

      <p className="mt-6 text-xs text-muted">
        We report numbers as their official publishers released them and don&apos;t rate any government&apos;s record.
        NBS, CBN and DMO publish these on their own sites; we link the news report we read each in. See a newer figure?{" "}
        <Link prefetch={false} href="/data#corrections" className="underline">
          Tell us with a source
        </Link>
        .
      </p>
    </div>
  );
}
