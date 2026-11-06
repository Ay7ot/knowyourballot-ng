import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ballot, getCandidate, getRace, getState, LEVEL_LABEL, OFFICE_INFO, OFFICE_LABEL, partyName } from "@/lib/data";
import type { Person } from "@/lib/types";
import { Crumbs } from "@/components/ui";
import { PickButton } from "@/components/picks";
import { correctionUrl } from "@/lib/site";
import { gutter } from "@/lib/gutter";
import { electionFor } from "@/components/RaceSheet";

// 15,000+ candidates: prebuild the President and Governor pages, render the rest on first visit and cache them.
export const dynamicParams = true;
export const revalidate = 86400;
export function generateStaticParams() {
  return ballot.candidates.filter((c) => c.office === "president" || c.office === "governor").map((c) => ({ id: c.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = getCandidate((await params).id);
  if (!c) return {};
  const r = getRace(c.race)!;
  return { title: `${c.name} (${c.party}), ${r.name}`, description: `${c.name}, ${partyName(c.party) ?? c.party} candidate for ${OFFICE_LABEL[c.office]} (${r.name}) in 2027. Details as declared to INEC.` };
}

function Facts({ p }: { p: Person }) {
  const rows: [string, React.ReactNode][] = [
    ["Age", p.age ? <span className="mono">{p.age}</span> : null],
    ["Gender", p.gender],
    [
      "Highest qualification",
      p.level ? (
        <>
          {LEVEL_LABEL[p.level]}
          <span className="block text-xs text-muted">Our reading of INEC&apos;s text below. <Link href="/guide#qualifications" className="underline">What the letters mean</Link></span>
        </>
      ) : null,
    ],
    ["Qualifications, as INEC printed them", p.qualifications ? <span className="mono text-[0.85rem]">{p.qualifications}</span> : null],
    ["Disability (PWD)", p.pwd ?? "None declared"],
  ];
  return (
    <dl className="divide-y divide-rule">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[12rem_1fr] sm:gap-4">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 break-words">{v ?? <span className="text-muted">Not stated in INEC&apos;s list</span>}</dd>
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
  const doc = decodeURIComponent(c.source.url.split("/").pop()!).replace(/^[0-9a-f-]{36}-/, "");
  const e = electionFor(c.office);
  const day = new Date(`${e.date}T12:00:00Z`).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const raceTitle = c.office === "president" ? "President of Nigeria" : race.name;
  const full = partyName(c.party);

  return (
    <div className="mx-auto max-w-3xl py-8" style={gutter}>
      <Crumbs items={[{ href: "/", label: "Home" }, ...(st ? [{ href: `/state/${st.slug}`, label: st.name }] : []), { href: `/race/${race.id}`, label: raceTitle }, { label: c.name }]} />

      <header className="sheet mt-5 overflow-hidden">
        <div className="sheet-band flex items-stretch">
          <div className="flex min-w-0 flex-1 items-center gap-4 px-5 py-5">
            <span className="party-box shrink-0" title={full ?? c.party}>{c.party}</span>
            <div className="min-w-0">
              <p className="label text-green">{OFFICE_LABEL[c.office]}</p>
              <h1 className="display-tight mt-1 text-3xl sm:text-4xl">{c.name}</h1>
              <p className="mt-1 text-sm text-muted">{full ?? c.party}</p>
            </div>
          </div>
          <div className="thumb-cell grid w-20 shrink-0 place-items-center">
            <PickButton race={race.id} cand={c.id} name={c.name} />
          </div>
        </div>
        <p className="px-5 py-3 text-sm">
          Running for <Link href={`/race/${race.id}`} className="font-medium underline">{raceTitle}</Link>
          {st && c.office !== "governor" ? `, ${st.short}` : ""} on <span className="mono">{day}</span>.{" "}
          <span className="text-muted">{OFFICE_INFO[c.office].what}</span>
        </p>
      </header>

      <section className="sheet mt-6 overflow-hidden" aria-labelledby="facts-h">
        <h2 id="facts-h" className="sheet-band px-5 pb-3 pt-4 font-semibold">As listed by INEC</h2>
        <Facts p={c} />
        {c.remarks && (
          <p className="border-t border-rule px-5 py-3 text-sm">
            <span className="text-muted">INEC remarks: </span>
            {c.remarks}
          </p>
        )}
      </section>

      {c.runningMate && (
        <section className="sheet mt-6 overflow-hidden" aria-labelledby="mate-h">
          <div className="sheet-band px-5 pb-3 pt-4">
            <p className="label text-muted">{c.office === "president" ? "Vice-presidential candidate" : "Deputy governorship candidate"}</p>
            <h2 id="mate-h" className="mt-1 font-semibold">{c.runningMate.name}</h2>
          </div>
          <Facts p={c.runningMate} />
        </section>
      )}

      <section className="mt-6 rounded-md border-2 border-dashed border-rule p-5" aria-labelledby="aff-h">
        <p className="label text-muted">Affidavit and personal particulars</p>
        <h2 id="aff-h" className="display-tight mt-1 text-xl">Not published online by INEC yet</h2>
        <p className="mt-2 text-sm">
          Every candidate swears an affidavit and submits personal particulars (INEC&apos;s nomination forms) with their date of birth,
          schooling and certificates. For 2027, INEC has published only the summary lists that this page is built from, not the forms themselves.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
          <li>The Electoral Act requires INEC to display each candidate&apos;s particulars for public inspection, usually at its office in the constituency.</li>
          <li>Anyone who believes a candidate&apos;s information is false can ask a court to look into it.</li>
          <li>If you obtain a copy from INEC, send it to us and we&apos;ll link it here after checking it.</li>
        </ul>
      </section>

      <section className="sheet mt-6 p-5" aria-labelledby="bg-h">
        <h2 id="bg-h" className="font-semibold">Track record and background</h2>
        <p className="mt-2 text-sm text-muted">
          We add past offices, court records and reported positions only with a link to an official record or reputable report. Nothing has
          been added for this candidate yet.
        </p>
        <a href={correctionUrl(`${c.name} (${c.party}), ${race.name}`, `/candidate/${c.id}`)} className="mt-4 inline-flex h-11 items-center rounded-md bg-green px-4 text-sm font-semibold text-green-ink">
          Suggest sourced information
        </a>
      </section>

      <footer className="mt-6 space-y-1 text-sm text-muted">
        <p>
          <span className="font-medium text-ink">Source:</span>{" "}
          <a className="break-all underline" href={c.source.url}>{doc}</a>, page {c.source.page} (INEC).
        </p>
        <p>Names, ages and qualifications are copied from INEC&apos;s document as published, including any spelling in the original.</p>
      </footer>
    </div>
  );
}
