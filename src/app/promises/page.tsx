import Link from "next/link";
import type { Metadata } from "next";
import { candidatesOf, getRace, partyLogo, partyName, PLATFORMS, platformFor } from "@/lib/data";
import { Crumbs } from "@/components/ui";
import PartyMark from "@/components/PartyMark";
import { Cites, PlatformStatus } from "@/components/Promises";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = {
  title: "What the presidential candidates promise",
  description: "2027 presidential manifestos and campaign pledges, topic by topic, each linked to its source.",
};

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export default function PromisesPage() {
  const cands = candidatesOf(getRace("president")!);
  const withP = cands.filter((c) => platformFor(c.id)).sort((a, b) => Number(platformFor(b.id)!.status === "manifesto") - Number(platformFor(a.id)!.status === "manifesto"));
  const without = cands.filter((c) => !platformFor(c.id));
  return (
    <div className="mx-auto max-w-4xl py-8" style={gutter}>
      <Crumbs items={[{ href: "/", label: "Home" }, { href: "/race/president", label: "President of Nigeria" }, { label: "Promises" }]} />
      <h1 className="display mt-5 text-4xl sm:text-5xl">What the presidential candidates promise</h1>
      <p className="mt-3 max-w-[62ch] text-muted">
        Every pledge here links to the report it came from, and is paraphrased without judging it. Where a candidate has published a
        manifesto we say so; where they haven&apos;t, we use pledges reported from their campaign. Checked {day(PLATFORMS.checked)}.
      </p>

      <nav aria-label="Topics" className="mt-6 flex flex-wrap gap-2 text-sm">
        {PLATFORMS.topics.map((t) => (
          <a key={t} href={`#${t.toLowerCase().replace(/\W+/g, "-")}`} className="rounded-md border border-rule bg-sheet px-3 py-1.5 font-medium hover:border-green">{t}</a>
        ))}
      </nav>

      <section className="mt-10" aria-labelledby="status-h">
        <h2 id="status-h" className="display-tight text-2xl">Who has published what</h2>
        <ul className="sheet mt-4 divide-y divide-rule">
          {withP.map((c) => (
            <li key={c.id} className="flex gap-4 px-5 py-4">
              <PartyMark code={c.party} logo={partyLogo(c.party)} name={partyName(c.party)} size="sm" />
              <div className="min-w-0">
                <Link href={`/candidate/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                <div className="mt-1"><PlatformStatus p={platformFor(c.id)} /></div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">
          No manifesto or reported pledges found yet for: {without.map((c) => `${c.name} (${c.party})`).join(", ")}. If you have a source, use the
          correction link on their page.
        </p>
      </section>

      {PLATFORMS.topics.map((t) => {
        const rows = withP.flatMap((c) => platformFor(c.id)!.pledges.filter((x) => x.topic === t).map((x) => ({ c, x })));
        return (
          <section key={t} id={t.toLowerCase().replace(/\W+/g, "-")} className="mt-10 scroll-mt-24">
            <h2 className="label border-b-2 border-ink pb-2 text-ink">{t}</h2>
            {rows.length === 0 ? (
              <p className="py-3 text-sm text-muted">No candidate has a reported pledge on this yet.</p>
            ) : (
              <ul className="divide-y divide-rule">
                {rows.map(({ c, x }) => (
                  <li key={c.id + x.text} className="grid grid-cols-[auto_1fr] gap-4 py-3">
                    <PartyMark code={c.party} logo={partyLogo(c.party)} name={partyName(c.party)} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{c.name}</p>
                      <p className="mt-0.5 text-[0.95rem]">
                        {x.text}
                        <Cites ids={x.src} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
