import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ballot, geo, getState, getRace, candidatesOf, lgasOf, lgaHref, getLgaById, officeStatus, LEVEL_LABEL, toTray, quickEntries } from "@/lib/data";
import { Crumbs, Pending } from "@/components/ui";
import FindBallot from "@/components/FindBallot";
import RaceSheet from "@/components/RaceSheet";
import BallotTray from "@/components/BallotTray";
import { ResetCompareOnMount } from "@/components/picks";
import { gutter } from "@/lib/gutter";

export const dynamicParams = false;
export function generateStaticParams() {
  return geo.states.map((s) => ({ state: s.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const s = getState((await params).state);
  return s
    ? pageMeta({
        title: `${s.name} candidates`,
        description: `Every 2027 candidate in ${s.name}: governorship, Senate, House of Reps and State Assembly.`,
        path: `/state/${s.slug}`,
        og: { k: `${s.name} · 2027`, t: `Who's on the ballot in ${s.name}`, s: "Governorship, Senate, House of Reps and State Assembly candidates, from INEC's lists." },
      })
    : {};
}

function DistrictList({ title, items }: { title: string; items: { href: string; name: string; count?: number; lgas: string }[] }) {
  return (
    <section className="min-w-0">
      <h2 className="label border-b-2 border-ink pb-2 text-ink">{title}</h2>
      <ul className="divide-y divide-rule">
        {items.map((d) => (
          <li key={d.href}>
            <Link prefetch={false} href={d.href} className="group grid grid-cols-[1fr_auto] gap-x-3 py-3">
              <span className="font-semibold group-hover:underline">{d.name}</span>
              <span className="mono text-sm text-muted">{d.count ?? "–"}</span>
              <span className="col-span-2 line-clamp-2 text-sm text-muted">{d.lgas}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const st = getState((await params).state);
  if (!st) notFound();
  const sen = geo.senatorial.filter((d) => d.state === st.code);
  const fed = geo.federal.filter((d) => d.state === st.code);
  const sha = ballot.assembly.filter((a) => a.state === st.code).sort((a, b) => a.name.localeCompare(b.name));
  const gov = getRace(`gov--${st.slug}`);
  const count = (id: string) => getRace(id)?.candidates.length;
  const lgaNames = (ids: string[]) => ids.map((i) => getLgaById(i)!.name).join(", ");
  const lgas = lgasOf(st.code);

  return (
    <>
      <ResetCompareOnMount />
      <section className="border-b border-rule bg-sheet">
        <div className="mx-auto max-w-5xl pb-8 pt-6" style={gutter}>
          <Crumbs items={[{ href: "/", label: "Home" }, { href: "/state", label: "States" }, { label: st.name }]} />
          <p className="label mt-5 text-green">{st.zone}</p>
          <h1 className="display mt-2 text-4xl sm:text-5xl">{st.name}</h1>
          <p className="mono mt-2 text-sm text-muted">
            {lgas.length} LGAs · {sen.length} Senate districts · {fed.length} federal constituencies{sha.length ? ` · ${sha.length} state constituencies` : ""}
          </p>
          <div className="mt-6 max-w-2xl">
            <FindBallot quick={quickEntries()} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 py-10" style={gutter}>
        <section>
          <h2 className="display-tight text-2xl">Pick your LGA to see your whole ballot</h2>
          <p className="mt-1 text-muted">Your LGA decides your Senate, House of Reps and State Assembly races.</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 sm:grid-cols-3 lg:grid-cols-4">
            {lgas.map((l) => (
              <li key={l.id} className="border-b border-rule">
                <Link prefetch={false} href={lgaHref(l)} className="flex items-center justify-between gap-2 py-2.5 hover:text-green">
                  <span className="truncate">{l.name}</span>
                  <span aria-hidden className="text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {st.governorship ? (
          officeStatus("governor") === "pending" ? (
            <div className="sheet overflow-hidden"><Pending what="governorship candidates" /></div>
          ) : gov ? (
            <RaceSheet race={gov} title={`Governor of ${st.short}`} />
          ) : (
            <p className="sheet px-5 py-4 text-sm text-muted">No governorship candidates found in INEC&apos;s list for this state.</p>
          )
        ) : (
          <p className="rounded-md bg-green-soft px-5 py-4 text-sm">
            {st.slug === "fct"
              ? "The FCT doesn't elect a governor or state assembly. Its area councils vote on a separate timetable."
              : `${st.short}'s governorship election is off-cycle, so it isn't on the February 2027 ballot.`}
          </p>
        )}

        <div className="grid gap-10 lg:grid-cols-2">
          <DistrictList title="Senate districts" items={sen.map((d) => ({ href: `/race/sen--${d.id}`, name: d.name, count: count(`sen--${d.id}`), lgas: lgaNames(d.lgas) }))} />
          <DistrictList title="Federal constituencies" items={fed.map((d) => ({ href: `/race/rep--${d.id}`, name: getRace(`rep--${d.id}`)?.name ?? d.name, count: count(`rep--${d.id}`), lgas: lgaNames(d.lgas) }))} />
        </div>

        {st.assembly && (
          <section id="all-assembly" className="scroll-mt-24">
            <h2 className="label border-b-2 border-ink pb-2 text-ink">State House of Assembly constituencies</h2>
            {sha.length === 0 ? (
              officeStatus("assembly") === "loaded" ? (
                <p className="mt-3 rounded-md bg-amber-soft px-5 py-4 text-sm text-amber-ink">
                  INEC&apos;s published State Assembly list has no entries for {st.short} yet. We&apos;ll add them as soon as INEC publishes them.
                </p>
              ) : (
                <div className="sheet mt-3 overflow-hidden"><Pending what="State Assembly candidates" /></div>
              )
            ) : (
              <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                {sha.map((a) => (
                  <li key={a.id} className="border-b border-rule">
                    <Link prefetch={false} href={`/race/sha--${a.id}`} className="flex justify-between gap-3 py-2.5 hover:text-green">
                      <span className="min-w-0 truncate">{a.name}</span>
                      <span className="mono text-sm text-muted">{count(`sha--${a.id}`)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
      {gov && <BallotTray candidates={candidatesOf(gov).map((c) => toTray(c, `Governor of ${st.short}`))} races={[{ id: gov.id, label: `Governor of ${st.short}` }]} levelLabels={LEVEL_LABEL} />}
    </>
  );
}
