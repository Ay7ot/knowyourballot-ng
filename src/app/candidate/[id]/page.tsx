import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ballot, getCandidate, getRace, getState, OFFICE_LABEL, partyName } from "@/lib/data";
import type { Person } from "@/lib/types";
import { Crumbs, PartyBadge } from "@/components/ui";
import { correctionUrl } from "@/lib/site";

export const dynamicParams = false;
export function generateStaticParams() {
  // Next needs at least one param for a static route; the placeholder 404s.
  return ballot.candidates.length ? ballot.candidates.map((c) => ({ id: c.id })) : [{ id: "none" }];
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = getCandidate((await params).id);
  if (!c) return {};
  const r = getRace(c.race)!;
  return { title: `${c.name} (${c.party}), ${r.name}`, description: `${c.name}, ${c.party} candidate for ${OFFICE_LABEL[c.office]} (${r.name}) in 2027. Details as declared to INEC.` };
}

function Facts({ p }: { p: Person }) {
  const rows: [string, string | null][] = [
    ["Age", p.age ? `${p.age}` : null],
    ["Gender", p.gender],
    ["Qualifications", p.qualifications],
    ["Disability (PWD)", p.pwd],
  ];
  return (
    <dl className="divide-y divide-line">
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[140px_1fr] gap-3 px-4 py-3 text-sm">
          <dt className="text-muted">{k}</dt>
          <dd>{v ?? <span className="text-muted">Not stated in INEC&apos;s list</span>}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const c = getCandidate((await params).id);
  if (!c) notFound();
  const race = getRace(c.race)!;
  const st = race.state ? getState(race.state) : null;
  const doc = c.source.url.split("/").pop()!.replace(/^[0-9a-f-]{36}-/, "").replace(/%20/g, " ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Crumbs items={[{ href: "/", label: "Home" }, ...(st ? [{ href: `/state/${st.slug}`, label: st.name }] : []), { href: `/race/${race.id}`, label: race.name }, { label: c.name }]} />
      <div className="mt-4 flex items-center gap-3"><PartyBadge code={c.party} /><span className="text-sm text-muted">{partyName(c.party) ?? c.party}</span></div>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{c.name}</h1>
      <p className="mt-1 text-muted">Candidate for {OFFICE_LABEL[c.office]}{c.office !== "president" ? `, ${race.name}` : ""}{st && c.office !== "governor" ? `, ${st.short}` : ""}</p>

      <section className="mt-6 rounded-2xl border border-line bg-surface overflow-hidden">
        <h2 className="px-4 pt-4 pb-3 border-b border-line font-semibold">As declared to INEC</h2>
        <Facts p={c} />
        {c.remarks && <p className="px-4 py-3 text-sm border-t border-line"><span className="text-muted">INEC remarks: </span>{c.remarks}</p>}
      </section>

      {c.runningMate && (
        <section className="mt-6 rounded-2xl border border-line bg-surface overflow-hidden">
          <h2 className="px-4 pt-4 pb-3 border-b border-line font-semibold">Running mate: {c.runningMate.name}</h2>
          <Facts p={c.runningMate} />
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-semibold">Track record and background</h2>
        <p className="mt-2 text-sm text-muted">
          We only publish background that has a source: past offices, court records, and the affidavit and particulars INEC
          displays for public inspection. Nothing has been added for this candidate yet.
        </p>
        <a href={correctionUrl(`${c.name} (${c.party}), ${race.name}`, `/candidate/${c.id}`)} className="mt-3 inline-flex rounded-xl bg-brand px-4 h-10 items-center text-sm font-medium text-brand-ink">
          Add sourced information
        </a>
      </section>

      <section className="mt-6 text-sm text-muted space-y-1">
        <p>
          <span className="font-medium text-ink">Source:</span>{" "}
          <a className="underline break-all" href={c.source.url}>{doc}</a>, page {c.source.page} (INEC).
        </p>
        <p>Names, ages and qualifications are copied from INEC&apos;s document as published, including any spelling in the original.</p>
        <p><Link className="underline" href={`/race/${race.id}`}>See all candidates for {race.name}</Link></p>
      </section>
    </div>
  );
}
