import Link from "next/link";
import FindBallot from "@/components/FindBallot";
import Countdown from "@/components/Countdown";
import { ELECTIONS, OFFICE_LABEL, geo, stats } from "@/lib/data";

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

export default function Home() {
  const s = stats();
  const zones = Object.entries(
    geo.states.reduce<Record<string, typeof geo.states>>((acc, st) => ((acc[st.zone] ??= []).push(st), acc), {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-3xl px-4 pt-12 pb-10 sm:pt-20 sm:pb-14">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand">Nigeria 2027 general election</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight text-balance">Who is on your ballot?</h1>
          <p className="mt-4 text-lg text-muted text-pretty">
            Find every candidate you can vote for, from President down to your State House of Assembly seat. Straight from INEC&apos;s
            official lists, for all 36 states and the FCT.
          </p>
          <div className="mt-8">
            <FindBallot autoFocus />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {ELECTIONS.map((e) => (
            <div key={e.date} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold">{e.label}</h2>
                <span className="text-sm font-medium text-brand"><Countdown date={e.date} /></span>
              </div>
              <p className="mt-1 text-sm text-muted">{fmt(e.date)}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {e.offices.map((o) => (
                  <li key={o} className="rounded-full bg-brand-soft px-3 py-1 text-sm">{OFFICE_LABEL[o]}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Dates from INEC&apos;s revised 2027 timetable. Governorship polls in Anambra, Bayelsa, Edo, Ekiti, Imo, Kogi, Ondo and Osun run on a
          separate calendar, and the FCT has no governor or state assembly.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["Find your area", "Type your LGA or ward, use your location, or enter the polling unit code on your voter's card."],
            ["See your whole ballot", "We work out your Senate district, federal and state constituencies, so you see exactly the races you vote in."],
            ["Check each candidate", "Age, qualifications and party as declared to INEC, with a link to the official document for every entry."],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-2xl border border-line bg-surface p-5">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-brand-ink text-sm font-semibold">{i + 1}</span>
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-4 mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Browse by state</h2>
          <span className="text-sm text-muted tabular">
            {s.lgas} LGAs · {s.wards.toLocaleString()} wards · {s.senatorial} Senate districts · {s.federal} Reps seats
          </span>
        </div>
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map(([zone, states]) => (
            <div key={zone}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">{zone}</h3>
              <ul className="mt-2 grid grid-cols-2 gap-1">
                {states.map((st) => (
                  <li key={st.code}>
                    <Link href={`/state/${st.slug}`} className="block rounded-lg px-2 py-1.5 hover:bg-brand-soft">{st.short}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
