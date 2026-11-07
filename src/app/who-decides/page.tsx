import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { ELECTIONS, OFFICE_INFO, OFFICE_LABEL } from "@/lib/data";
import { GLOSSARY, ISSUES, LEVEL_NAME, OFFICE_POWER, type Level } from "@/lib/civics";
import type { Office } from "@/lib/types";
import { Crumbs } from "@/components/ui";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = pageMeta({
  title: "Who decides what",
  description:
    "Fuel prices, the naira, roads, schools, hospitals, security: which office in Nigeria actually controls each one, and what the people on your 2027 ballot can change.",
  path: "/who-decides",
  og: {
    k: "Know your ballot · civics",
    t: "Who decides what",
    s: "The naira and petrol are federal. Roads, schools and hospitals are mostly your state's job.",
  },
});

const LEVEL_SHORT: Record<Level, string> = { federal: "Federal", state: "State", local: "Local" };
const LEVEL_STYLE: Record<Level, string> = {
  federal: "border-ink bg-ink text-paper",
  state: "border-green bg-green text-green-ink",
  local: "border-rule bg-sheet text-ink",
};
const OFFICES: Office[] = ["president", "senate", "rep", "governor", "assembly"];
const dayOf = (o: Office) => {
  const e = ELECTIONS.find((x) => x.offices.includes(o))!;
  return new Date(`${e.date}T12:00:00Z`).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

export default function WhoDecides() {
  return (
    <div className="mx-auto max-w-6xl py-8" style={gutter}>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "Who decides what" }]} />
      <h1 className="display mt-5 text-4xl sm:text-5xl">Who decides what</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-muted">
        Before you vote on an issue, know which office can change it. The naira and petrol are federal. Most roads,
        schools and hospitals are your state&apos;s job. Markets and refuse are local.
      </p>

      <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[
          ["#issues", "By issue"],
          ["#offices", "By office"],
          ["#words", "Election words"],
        ].map(([h, t]) => (
          <a
            key={h}
            href={h}
            className="rounded-md border border-rule bg-sheet px-3 py-2 font-medium hover:border-green"
          >
            {t}
          </a>
        ))}
      </nav>

      <section id="issues" aria-labelledby="issues-h" className="mt-12 scroll-mt-24">
        <h2 id="issues-h" className="display-tight text-2xl">
          By issue
        </h2>
        <p className="mt-1 text-muted">Who mainly controls each one, under the Constitution.</p>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs" aria-label="Key">
          {(Object.keys(LEVEL_NAME) as Level[]).map((l) => (
            <li key={l} className="flex items-center gap-1.5">
              <span className={`label rounded border px-1.5 py-0.5 text-[0.6rem] ${LEVEL_STYLE[l]}`}>
                {LEVEL_SHORT[l]}
              </span>
              <span className="text-muted">{LEVEL_NAME[l]}</span>
            </li>
          ))}
        </ul>
        <ul className="sheet mt-4 divide-y divide-rule">
          {ISSUES.map((i) => (
            <li key={i.id} id={`issue-${i.id}`} className="scroll-mt-24 px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <h3 className="font-semibold">{i.issue}</h3>
                <span className="flex gap-1">
                  {i.mostly.map((l) => (
                    <span key={l} className={`label rounded border px-1.5 py-0.5 text-[0.6rem] ${LEVEL_STYLE[l]}`}>
                      {LEVEL_SHORT[l]}
                    </span>
                  ))}
                </span>
              </div>
              <p className="mt-1 text-[0.95rem]">{i.who}.</p>
              {i.note && <p className="mt-1 text-sm text-muted">{i.note}</p>}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Based on the 1999 Constitution as amended: the Exclusive and Concurrent Legislative Lists (Second Schedule)
          and local government functions (Fourth Schedule). The 2023 amendments moved electricity and railways onto the
          shared list.
        </p>
      </section>

      <section id="offices" aria-labelledby="offices-h" className="mt-12 scroll-mt-24">
        <h2 id="offices-h" className="display-tight text-2xl">
          By office on your ballot
        </h2>
        <p className="mt-1 text-muted">What each person you vote for can change, and what they can&apos;t.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {OFFICES.map((o) => (
            <article key={o} id={`office-${o}`} className="sheet scroll-mt-24 overflow-hidden">
              <header className="sheet-band flex items-baseline justify-between gap-3 px-5 pb-3 pt-4">
                <h3 className="display-tight text-xl">{OFFICE_LABEL[o]}</h3>
                <span className="mono shrink-0 text-xs text-muted">{dayOf(o)}</span>
              </header>
              <dl className="space-y-3 px-5 py-4 text-[0.95rem]">
                <div>
                  <dt className="label text-[0.65rem] text-green">Can change</dt>
                  <dd>{OFFICE_POWER[o].can}</dd>
                </div>
                <div>
                  <dt className="label text-[0.65rem] text-muted">Can&apos;t</dt>
                  <dd>{OFFICE_POWER[o].cant}</dd>
                </div>
                <div>
                  <dt className="label text-[0.65rem] text-muted">Money</dt>
                  <dd>{OFFICE_POWER[o].money}</dd>
                </div>
              </dl>
              <p className="mono border-t border-rule px-5 py-2.5 text-xs text-muted">
                {OFFICE_INFO[o].term} · {OFFICE_INFO[o].seats}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-4 rounded-md bg-amber-soft px-4 py-3 text-sm text-amber-ink">
          Your <strong>LGA chairman and councillors</strong> aren&apos;t on INEC&apos;s ballot. Your state&apos;s own
          electoral commission runs those elections on a different date.
        </p>
      </section>

      <section id="words" aria-labelledby="words-h" className="mt-12 scroll-mt-24">
        <h2 id="words-h" className="display-tight text-2xl">
          Election words
        </h2>
        <p className="mt-1 text-muted">Terms you&apos;ll see on this site and on election day.</p>
        <dl className="sheet mt-4 divide-y divide-rule">
          {GLOSSARY.map((g) => (
            <div key={g.id} id={g.id} className="scroll-mt-24 px-5 py-3 sm:grid sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="font-semibold">{g.term}</dt>
              <dd className="text-[0.95rem] text-muted">{g.short}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-10 text-sm text-muted">
        Ready?{" "}
        <Link prefetch={false} href="/" className="font-medium text-green underline">
          Find who&apos;s on your ballot
        </Link>
        , see{" "}
        <Link prefetch={false} href="/economy" className="font-medium text-green underline">
          the economy in eight numbers
        </Link>
        , or read the{" "}
        <Link prefetch={false} href="/guide" className="font-medium text-green underline">
          voting-day guide
        </Link>
        .
      </p>
    </div>
  );
}
