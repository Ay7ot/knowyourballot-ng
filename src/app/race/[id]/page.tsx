import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ballot, candidatesOf, geo, getFederal, getLgaById, getRace, getSenatorial, getState, lgaHref, LEVEL_LABEL, OFFICE_INFO, OFFICE_LABEL, officeStatus, toTray } from "@/lib/data";
import type { District, Office, Race } from "@/lib/types";
import { Crumbs, Pending } from "@/components/ui";
import RaceSheet from "@/components/RaceSheet";
import BallotTray from "@/components/BallotTray";
import { ResetCompareOnMount } from "@/components/picks";
import { correctionUrl } from "@/lib/site";
import { gutter } from "@/lib/gutter";

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

const SUB: Partial<Record<Office, string>> = { senate: "Senatorial district", rep: "Federal constituency", assembly: "State constituency" };

export default async function RacePage({ params }: { params: Promise<{ id: string }> }) {
  const race = findRace((await params).id);
  if (!race) notFound();
  const st = race.state ? getState(race.state) : null;
  const cands = candidatesOf(race);
  const district: District | undefined =
    race.office === "senate" ? getSenatorial(race.district!) : race.office === "rep" ? getFederal(race.district!) : race.office === "assembly" ? ballot.assembly.find((a) => a.id === race.district) : undefined;
  const info = OFFICE_INFO[race.office];
  const pending = officeStatus(race.office) === "pending";
  const title = race.office === "president" ? "President of Nigeria" : race.name;

  return (
    <>
      <ResetCompareOnMount />
      <div className="mx-auto max-w-3xl py-8" style={gutter}>
        <Crumbs items={[{ href: "/", label: "Home" }, ...(st ? [{ href: `/state/${st.slug}`, label: st.name }] : []), { label: title }]} />
        <div className="mt-5">
          {pending ? (
            <div className="sheet overflow-hidden"><Pending what="these candidates" /></div>
          ) : cands.length === 0 ? (
            <div className="sheet px-5 py-5">
              <p className="label text-green">{OFFICE_LABEL[race.office]}</p>
              <h1 className="display-tight mt-1 text-2xl">{title}</h1>
              <p className="mt-2 text-sm text-muted">INEC&apos;s list has no candidates we could match to this seat yet.</p>
            </div>
          ) : (
            <RaceSheet race={race} title={title} sub={SUB[race.office]} main />
          )}
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-rule bg-rule text-sm sm:grid-cols-3">
          {[["Term", info.term], ["Seats", info.seats], ["Candidates", cands.length ? String(cands.length) : "None yet"]].map(([k, v]) => (
            <div key={k} className="bg-sheet px-4 py-3">
              <dt className="label text-[0.65rem] text-muted">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {district && district.lgas.length > 0 && (
          <p className="mt-4 text-sm">
            <span className="label mr-2 text-[0.65rem] text-muted">Covers</span>
            {district.lgas.map((id, i) => {
              const l = getLgaById(id)!;
              return (
                <span key={id}>
                  {i > 0 && ", "}
                  <Link className="underline decoration-rule underline-offset-2 hover:decoration-ink" href={lgaHref(l)}>{l.name}</Link>
                </span>
              );
            })}
          </p>
        )}

        <p className="mt-4 text-sm text-muted">
          Listed in INEC&apos;s order, which is also the order on the ballot paper. Something wrong?{" "}
          <a className="underline" href={correctionUrl(title, `/race/${race.id}`)}>Report a correction</a>.
        </p>
      </div>
      {cands.length > 0 && <BallotTray candidates={cands.map((c) => toTray(c, title))} races={[{ id: race.id, label: title }]} levelLabels={LEVEL_LABEL} />}
    </>
  );
}
