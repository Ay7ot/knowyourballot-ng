import { Suspense } from "react";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ballotForLga,
  candidatesOf,
  ELECTIONS,
  geo,
  getLga,
  getSenatorial,
  getState,
  lgaMapPoints,
  LEVEL_LABEL,
  OFFICE_LABEL,
  stateMapPath,
  stateMapViewBox,
  toTray,
  wardsOf,
} from "@/lib/data";
import type { Office, Race } from "@/lib/types";
import RaceSheet from "@/components/RaceSheet";
import WardContext from "@/components/WardContext";
import ShareButton from "@/components/ShareButton";
import BallotTray from "@/components/BallotTray";
import BallotDesk from "@/components/BallotDesk";
import MyBallot from "@/components/MyBallot";
import VotingDay from "@/components/VotingDay";
import RaceNav from "@/components/RaceNav";
import GeoMap from "@/components/GeoMap";
import { ResetCompareOnMount } from "@/components/picks";
import { Crumbs } from "@/components/ui";
import { gutter } from "@/lib/gutter";

export const dynamicParams = false;
export function generateStaticParams() {
  return geo.lgas.map((l) => ({ state: getState(l.state)!.slug, lga: l.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; lga: string }>;
}): Promise<Metadata> {
  const p = await params;
  const f = getLga(p.state, p.lga);
  if (!f) return {};
  return pageMeta({
    title: `Your 2027 ballot in ${f.lga.name}, ${f.state.short}`,
    description: `Every candidate a voter in ${f.lga.name} LGA, ${f.state.name} can vote for in 2027: President, Senate, House of Reps, Governor and State Assembly.`,
    path: `/state/${p.state}/${p.lga}`,
    og: {
      k: `${f.state.name} · ${f.lga.name} LGA`,
      t: `Your 2027 ballot in ${f.lga.name}`,
      s: "President, Senate, House of Reps, Governor and State Assembly: every candidate, from INEC's lists.",
    },
  });
}

const longDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
const SUB: Partial<Record<Office, string>> = {
  senate: "Senatorial district",
  rep: "Federal constituency",
  assembly: "State constituency",
};

type Item = { race: Race; office: Office; title: string; fed?: string };

export default async function LgaBallot({ params }: { params: Promise<{ state: string; lga: string }> }) {
  const p = await params;
  const found = getLga(p.state, p.lga);
  if (!found) notFound();
  const { state, lga } = found;
  const sections = ballotForLga(lga);
  const mapPoints = lgaMapPoints(state.code);
  const statePath = stateMapPath(state.slug);
  const selectedOnMap = mapPoints.some((p) => p.id === lga.id) ? lga.id : undefined;
  const wards = wardsOf(lga.id).map((w) => ({ code: w.id.split("-")[2], name: w.name, federal: w.federal }));
  const sen = getSenatorial(lga.senatorial)!;
  const split = lga.federal.length > 1;

  const items: Item[] = [];
  for (const s of sections)
    for (const c of s.contests)
      if (c.race?.candidates.length)
        items.push({
          race: c.race,
          office: s.office,
          title: s.office === "president" ? "President of Nigeria" : c.race.name,
          fed: s.office === "rep" ? c.districtId : undefined,
        });

  const dateOf = (o: Office) => ELECTIONS.find((e) => e.offices.includes(o))!.date;
  const tocRaces = items.map((i) => ({
    id: i.race.id,
    label: i.title,
    office: OFFICE_LABEL[i.office],
    date: new Date(`${dateOf(i.office)}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
    fed: i.fed,
  }));
  const multiSha = items.filter((i) => i.office === "assembly").length > 1;
  const SHORT: Record<Office, string> = {
    president: "President",
    senate: "Senate",
    rep: "Reps",
    governor: "Governor",
    assembly: "Assembly",
  };
  const navRaces = items.map((i) => ({
    id: i.race.id,
    fed: i.fed,
    short:
      (i.office === "assembly" && multiSha) || (i.office === "rep" && split)
        ? `${SHORT[i.office]} · ${i.race.name}`
        : SHORT[i.office],
  }));
  const tray = items.flatMap((i) => candidatesOf(i.race).map((c) => toTray(c, i.title)));

  const chips = [
    { k: "Senate", v: sen.name },
    ...lga.federal.map((f) => ({
      k: "Reps",
      v: sections.find((s) => s.office === "rep")!.contests.find((c) => c.districtId === f)!.districtName,
      fed: split ? f : undefined,
    })),
    ...(sections.find((s) => s.office === "assembly")?.contests ?? []).map((c) => ({
      k: "Assembly",
      v: c.districtName,
    })),
  ];

  return (
    <>
      <ResetCompareOnMount />
      <section className="border-b border-rule bg-sheet">
        <div
          className="shell grid gap-8 pb-8 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start"
          style={gutter}
        >
          <div className="min-w-0">
            <Crumbs
              items={[
                { href: "/", label: "Home" },
                { href: `/state/${state.slug}`, label: state.name },
                { label: lga.name },
              ]}
            />
            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0">
                <p className="label text-green">Your 2027 ballot</p>
                <h1 className="display mt-2 text-4xl sm:text-5xl">
                  {lga.name}
                  <span className="text-muted">, {state.short}</span>
                </h1>
              </div>
              <ShareButton title={`My 2027 ballot: ${lga.name}, ${state.short}`} />
            </div>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {chips.map((c) => (
                <li
                  key={c.k + c.v}
                  data-fed={"fed" in c ? c.fed : undefined}
                  className="flex items-center gap-2 rounded-md border border-rule bg-paper px-2.5 py-1.5"
                >
                  <span className="label text-[0.65rem] text-muted">{c.k}</span>
                  <span className="font-medium">{c.v}</span>
                </li>
              ))}
            </ul>
            <ol className="mt-6 grid grid-cols-3 gap-2 text-sm" aria-label="How to use this page">
              {[
                ["Check your area", "#area"],
                ["Read each race", `#${items[0]?.race.id ?? "area"}`],
                ["Mark your picks", "#my-ballot"],
              ].map(([t, h], i) => (
                <li key={t}>
                  <a
                    href={h}
                    className="flex h-full flex-col gap-1.5 rounded-md border border-rule px-2.5 py-2.5 leading-tight hover:border-green sm:flex-row sm:items-center sm:gap-3 sm:px-3"
                  >
                    <span className="mono grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-green text-xs text-green">
                      {i + 1}
                    </span>
                    <span className="font-medium">{t}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
          <div className="min-w-0">
            <GeoMap
              paths={statePath ? [statePath] : []}
              points={mapPoints}
              viewBox={stateMapViewBox(state.slug)}
              selected={selectedOnMap}
              title={`${lga.name} in ${state.short}`}
              description={
                selectedOnMap
                  ? "Your LGA is highlighted. Hover another dot to compare."
                  : "This LGA has no centroid yet, so it is not shown as a dot. Use the list below."
              }
              compact
            />
          </div>
        </div>
      </section>

      <RaceNav races={navRaces} />

      <div className="shell grid grid-cols-1 gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_22rem]" style={gutter}>
        <div className="min-w-0 space-y-10">
          <section id="area" aria-labelledby="area-h" className="scroll-mt-32 lg:scroll-mt-24">
            <p className="label text-green">Step 1</p>
            <h2 id="area-h" className="display-tight mt-1 text-2xl">
              Check this is your area
            </h2>
            <p className="mt-1 max-w-[62ch] text-muted">
              Your ballot depends on the polling unit printed on your voter&apos;s card, not where you live now.
              {split
                ? " This LGA is split between two federal constituencies, so choose your ward to see the right House of Reps race."
                : " Choosing your ward is optional."}
            </p>
            <div className="mt-4">
              <Suspense fallback={<div className="sheet h-28" />}>
                <WardContext stateCode={state.code} lgaCode={lga.id.split("-")[1]} wards={wards} split={split} />
              </Suspense>
            </div>
          </section>

          {ELECTIONS.map((e) => {
            const secs = sections.filter((s) => e.offices.includes(s.office));
            if (!secs.length) return null;
            return (
              <section key={e.date} aria-labelledby={`day-${e.date}`} className="space-y-5">
                <div className="border-b-2 border-ink pb-3">
                  <p className="label text-green">Step 2 · {e.label}</p>
                  <h2 id={`day-${e.date}`} className="display-tight mt-1 text-2xl">
                    {longDay(e.date)}
                  </h2>
                </div>
                {secs.map((s) => (
                  <div key={s.office} className="space-y-4">
                    {s.note && <p className="rounded-md bg-amber-soft px-4 py-3 text-sm text-amber-ink">{s.note}</p>}
                    {s.office === "assembly" && s.contests.length === 0 && !s.note && (
                      <p className="sheet px-5 py-4 text-sm text-muted">
                        <strong className="text-ink">State House of Assembly.</strong> We couldn&apos;t match a state
                        constituency to this LGA from INEC&apos;s list.{" "}
                        <Link prefetch={false} className="underline" href={`/state/${state.slug}#all-assembly`}>
                          See every state constituency in {state.short}
                        </Link>
                        .
                      </p>
                    )}
                    {s.contests.map((c) =>
                      c.race?.candidates.length ? (
                        <div key={c.districtId} data-fed={s.office === "rep" ? c.districtId : undefined}>
                          <RaceSheet
                            race={c.race}
                            title={s.office === "president" ? "President of Nigeria" : c.race.name}
                            sub={SUB[s.office]}
                          />
                        </div>
                      ) : (
                        <p
                          key={c.districtId}
                          data-fed={s.office === "rep" ? c.districtId : undefined}
                          className="sheet px-5 py-4 text-sm text-muted"
                        >
                          <strong className="text-ink">
                            {OFFICE_LABEL[s.office]}, {c.districtName}.
                          </strong>{" "}
                          INEC&apos;s list has no candidates we could match to this seat yet.
                        </p>
                      ),
                    )}
                  </div>
                ))}
              </section>
            );
          })}

          <MyBallot races={tocRaces} candidates={tray} />
          <VotingDay compact />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3">
            <BallotDesk races={tocRaces} candidates={tray} lgaName={lga.name} />
            <p className="px-1 text-xs text-muted">
              Candidates are in INEC&apos;s order.{" "}
              <Link prefetch={false} href="/data" className="underline">
                How we build this page
              </Link>
            </p>
          </div>
        </aside>
      </div>
      <BallotTray candidates={tray} races={tocRaces} levelLabels={LEVEL_LABEL} />
    </>
  );
}
