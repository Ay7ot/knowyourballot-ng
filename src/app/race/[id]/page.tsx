import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ballot, candidatesOf, geo, getFederal, getLgaById, getRace, getSenatorial, getState, lgaHref, OFFICE_LABEL, partyName, officeStatus, ELECTIONS } from "@/lib/data";
import type { District, Office, Race } from "@/lib/types";
import { Crumbs, Pending, PartyBadge, personFacts } from "@/components/ui";
import { correctionUrl } from "@/lib/site";

export const dynamicParams = false;

/** Race pages exist for every district on the map, even before INEC's list is imported. */
function allRaces(): Race[] {
  const have = new Map(ballot.races.map((r) => [r.id, r]));
  const placeholder = (id: string, office: Office, name: string, state: string | null, district: string | null): Race =>
    have.get(id) ?? { id, office, name, state, district, candidates: [] };
  const out = new Map<string, Race>(have);
  out.set("president", placeholder("president", "president", "President of Nigeria", null, null));
  for (const s of geo.states) if (s.governorship) out.set(`gov--${s.slug}`, placeholder(`gov--${s.slug}`, "governor", `Governor of ${s.short}`, s.code, null));
  for (const d of geo.senatorial) out.set(`sen--${d.id}`, placeholder(`sen--${d.id}`, "senate", d.name, d.state, d.id));
  for (const d of geo.federal) out.set(`rep--${d.id}`, placeholder(`rep--${d.id}`, "rep", d.name, d.state, d.id));
  return [...out.values()];
}
const findRace = (id: string) => getRace(id) ?? allRaces().find((r) => r.id === id);

export function generateStaticParams() {
  return allRaces().map((r) => ({ id: r.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const r = findRace((await params).id);
  if (!r) return {};
  const st = r.state ? getState(r.state) : null;
  const where = r.office === "president" || r.office === "governor" ? r.name : `${OFFICE_LABEL[r.office]}: ${r.name}${st ? `, ${st.short}` : ""}`;
  return { title: `${where} candidates 2027`, description: `All ${r.candidates.length || ""} candidates for ${where} in Nigeria's 2027 election, from INEC's final list.` };
}

export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const race = findRace((await params).id);
  if (!race) notFound();
  const st = race.state ? getState(race.state) : null;
  const cands = candidatesOf(race);
  const district: District | undefined =
    race.office === "senate" ? getSenatorial(race.district!) : race.office === "rep" ? getFederal(race.district!) : race.office === "assembly" ? ballot.assembly.find((a) => a.id === race.district) : undefined;
  const date = ELECTIONS.find((e) => e.offices.includes(race.office))!;
  const heading = race.office === "president" || race.office === "governor" ? race.name : race.name;
  const pending = officeStatus(race.office) === "pending";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Crumbs items={[{ href: "/", label: "Home" }, ...(st ? [{ href: `/state/${st.slug}`, label: st.name }] : []), { label: heading }]} />
      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-brand">{OFFICE_LABEL[race.office]}</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">{heading}</h1>
      <p className="mt-1 text-muted">
        {date.label} election · {new Date(`${date.date}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
        {cands.length > 0 && ` · ${cands.length} candidates`}
      </p>
      {district && district.lgas.length > 0 && (
        <p className="mt-3 text-sm">
          <span className="text-muted">Covers: </span>
          {district.lgas.map((id, i) => {
            const l = getLgaById(id)!;
            return <span key={id}>{i > 0 && ", "}<Link className="hover:underline" href={lgaHref(l)}>{l.name}</Link></span>;
          })}
        </p>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-surface overflow-hidden">
        {pending ? <Pending what="these candidates" /> : cands.length === 0 ? (
          <p className="px-4 py-4 text-sm text-muted">INEC&apos;s list has no candidates we could match to this seat yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {cands.map((c) => (
              <li key={c.id}>
                <Link href={`/candidate/${c.id}`} className="group block px-4 py-4 hover:bg-brand-soft/60">
                  <div className="flex items-center gap-3">
                    <PartyBadge code={c.party} />
                    <span className="font-semibold group-hover:underline">{c.name}</span>
                  </div>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    {partyName(c.party) && (<><dt className="text-muted">Party</dt><dd>{partyName(c.party)}</dd></>)}
                    {personFacts(c) && (<><dt className="text-muted">Age, gender</dt><dd>{personFacts(c)}</dd></>)}
                    {c.qualifications && (<><dt className="text-muted">Qualifications</dt><dd className="line-clamp-2">{c.qualifications}</dd></>)}
                    {c.runningMate && (<><dt className="text-muted">Running mate</dt><dd>{c.runningMate.name}</dd></>)}
                  </dl>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="mt-4 text-sm text-muted">
        Listed in INEC&apos;s order. Something wrong?{" "}
        <a className="underline" href={correctionUrl(heading, `/race/${race.id}`)}>Report a correction</a>.
      </p>
    </div>
  );
}
