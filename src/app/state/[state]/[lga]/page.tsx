import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ballotForLga, geo, getLga, getSenatorial, getState, wardsOf } from "@/lib/data";
import BallotSections from "@/components/BallotSections";
import WardContext from "@/components/WardContext";
import ShareButton from "@/components/ShareButton";
import { Crumbs } from "@/components/ui";

export const dynamicParams = false;
export function generateStaticParams() {
  return geo.lgas.map((l) => ({ state: getState(l.state)!.slug, lga: l.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ state: string; lga: string }> }): Promise<Metadata> {
  const p = await params;
  const f = getLga(p.state, p.lga);
  if (!f) return {};
  return {
    title: `Your 2027 ballot in ${f.lga.name}, ${f.state.short}`,
    description: `Every candidate a voter in ${f.lga.name} LGA, ${f.state.name} can vote for in 2027: President, Senate, House of Reps, Governor and State Assembly.`,
  };
}

export default async function LgaBallot({ params }: { params: Promise<{ state: string; lga: string }> }) {
  const p = await params;
  const found = getLga(p.state, p.lga);
  if (!found) notFound();
  const { state, lga } = found;
  const sections = ballotForLga(lga);
  const wards = wardsOf(lga.id).map((w) => ({ code: w.id.split("-")[2], name: w.name, federal: w.federal }));
  const sen = getSenatorial(lga.senatorial)!;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Crumbs items={[{ href: "/", label: "Home" }, { href: `/state/${state.slug}`, label: state.name }, { label: lga.name }]} />
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Your 2027 ballot</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{lga.name}, {state.short}</h1>
          <p className="mt-1 text-muted">
            {sen.name === "FCT" ? "FCT" : sen.name} Senate district · {lga.federal.length > 1 ? "2 federal constituencies" : "1 federal constituency"} · {wards.length} wards
          </p>
        </div>
        <ShareButton title={`My 2027 ballot: ${lga.name}, ${state.short}`} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 lg:order-1 min-w-0"><BallotSections sections={sections} stateSlug={state.slug} /></div>
        <aside className="order-1 lg:order-2 space-y-4 lg:sticky lg:top-20 self-start">
          <Suspense fallback={<div className="h-28 rounded-2xl border border-line bg-surface" />}>
            <WardContext stateCode={state.code} lgaCode={lga.id.split("-")[1]} wards={wards} split={lga.federal.length > 1} />
          </Suspense>
          <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted space-y-2">
            <p><strong className="text-ink">Vote where you registered.</strong> Your ballot depends on the polling unit on your voter&apos;s card, not where you live now.</p>
            <p>Candidates appear in INEC&apos;s order. Tap a name for their declared age, qualifications and the source document.</p>
            <p><Link className="underline" href="/data">How we build this page</Link></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
