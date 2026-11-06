import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ballot, geo, getState, getRace, candidatesOf, lgasOf, lgaHref, getLgaById, officeStatus } from "@/lib/data";
import { CandidateRow, Crumbs, Pending } from "@/components/ui";
import FindBallot from "@/components/FindBallot";

export const dynamicParams = false;
export function generateStaticParams() {
  return geo.states.map((s) => ({ state: s.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const s = getState((await params).state);
  return s ? { title: `${s.name} candidates`, description: `Every 2027 candidate in ${s.name}: governorship, Senate, House of Reps and State Assembly.` } : {};
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Crumbs items={[{ href: "/", label: "Home" }, { href: "/state", label: "States" }, { label: st.name }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">{st.name}</h1>
      <p className="mt-1 text-muted">{st.zone} · {lgasOf(st.code).length} LGAs · {sen.length} Senate districts · {fed.length} federal constituencies{sha.length ? ` · ${sha.length} state constituencies` : ""}</p>

      <div className="mt-6 max-w-2xl"><FindBallot /></div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Find your LGA</h2>
        <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
          {lgasOf(st.code).map((l) => (
            <li key={l.id}><Link href={lgaHref(l)} className="block rounded-lg px-2 py-1.5 hover:bg-brand-soft">{l.name}</Link></li>
          ))}
        </ul>
      </section>

      {st.governorship ? (
        <section className="mt-10 rounded-2xl border border-line bg-surface overflow-hidden">
          <h2 className="px-4 pt-4 pb-3 border-b border-line text-lg font-semibold">Governor of {st.short}</h2>
          {officeStatus("governor") === "pending" ? <Pending what="governorship candidates" /> : gov ? (
            <ul className="divide-y divide-line">{candidatesOf(gov).map((c) => <CandidateRow key={c.id} c={c} />)}</ul>
          ) : <p className="px-4 py-3 text-sm text-muted">No governorship candidates found in INEC&apos;s list for this state.</p>}
        </section>
      ) : (
        <p className="mt-10 rounded-2xl bg-brand-soft p-4 text-sm">
          {st.slug === "fct" ? "The FCT doesn't elect a governor or state assembly. Its area councils vote on a separate timetable." : `${st.short}'s governorship election is off-cycle, so it isn't on the February 2027 ballot.`}
        </p>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="text-xl font-semibold">Senate districts</h2>
          <ul className="mt-3 space-y-2">
            {sen.map((d) => (
              <li key={d.id}>
                <Link href={`/race/sen--${d.id}`} className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand">
                  <div className="flex justify-between gap-3"><span className="font-medium">{d.name}</span><span className="text-sm text-muted tabular">{count(`sen--${d.id}`) ?? "–"}</span></div>
                  <div className="text-sm text-muted line-clamp-2">{lgaNames(d.lgas)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold">Federal constituencies</h2>
          <ul className="mt-3 space-y-2">
            {fed.map((d) => (
              <li key={d.id}>
                <Link href={`/race/rep--${d.id}`} className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand">
                  <div className="flex justify-between gap-3"><span className="font-medium">{getRace(`rep--${d.id}`)?.name ?? d.name}</span><span className="text-sm text-muted tabular">{count(`rep--${d.id}`) ?? "–"}</span></div>
                  <div className="text-sm text-muted line-clamp-2">{lgaNames(d.lgas)}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {st.assembly && (
        <section id="all-assembly" className="mt-10">
          <h2 className="text-xl font-semibold">State House of Assembly constituencies</h2>
          {sha.length === 0 ? (
            officeStatus("assembly") === "loaded" ? (
              <p className="mt-3 rounded-2xl bg-warn-soft text-warn-ink p-4 text-sm">INEC&apos;s published State Assembly list has no entries for {st.short} yet. We&apos;ll add them as soon as INEC publishes them.</p>
            ) : (
              <div className="mt-3 rounded-2xl overflow-hidden border border-line"><Pending what="State Assembly candidates" /></div>
            )
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sha.map((a) => (
                <li key={a.id}>
                  <Link href={`/race/sha--${a.id}`} className="flex justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 hover:border-brand">
                    <span className="font-medium">{a.name}</span><span className="text-sm text-muted tabular">{count(`sha--${a.id}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
