import Link from "next/link";
import FindBallot from "@/components/FindBallot";
import Countdown from "@/components/Countdown";
import { ELECTIONS, OFFICE_INFO, OFFICE_LABEL, geo, stats, quickEntries } from "@/lib/data";
import { gutter } from "@/lib/gutter";
import { Thumbprint } from "@/components/picks";

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

/** Schematic voter's card showing where the polling unit code lives. Not a replica. */
function CardHint() {
  return (
    <figure className="relative mx-auto w-full max-w-[22rem]" aria-labelledby="card-cap">
      <div
        className="sheet relative overflow-hidden p-4 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)]"
        style={{ aspectRatio: "1.586", maxWidth: "100%" }}
      >
        <div className="absolute inset-x-0 top-0 h-2 bg-green" />
        <div className="mt-2 flex items-start gap-3">
          <div className="h-16 w-14 shrink-0 rounded-sm bg-green-soft" />
          <div className="flex-1 space-y-1.5 pt-1">
            <div className="h-2 w-3/4 rounded bg-rule" />
            <div className="h-2 w-1/2 rounded bg-rule" />
            <div className="h-2 w-2/3 rounded bg-rule" />
          </div>
        </div>
        <div className="absolute inset-x-4 bottom-4 rounded border-2 border-dashed border-violet bg-violet-soft px-3 py-2">
          <p className="label text-[0.65rem] text-violet">Polling unit code</p>
          <p className="mono text-lg font-medium tracking-wider">24/14/05/012</p>
        </div>
      </div>
      <figcaption id="card-cap" className="mt-3 text-center text-sm text-muted">
        Your voter&apos;s card (PVC) carries your polling unit code: four numbers for state, LGA, ward and unit.
      </figcaption>
    </figure>
  );
}

export default function Home() {
  const s = stats();
  const zones = Object.entries(
    geo.states.reduce<Record<string, typeof geo.states>>((acc, st) => {
      if (!acc[st.zone]) acc[st.zone] = [];
      acc[st.zone].push(st);
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <section className="border-b border-rule">
        <div
          className="mx-auto grid max-w-5xl items-center gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
          style={gutter}
        >
          <div className="min-w-0">
            <p className="label text-green">Nigeria · 2027 general election</p>
            <h1 className="display mt-3 text-[2.6rem] sm:text-6xl">
              Know who&apos;s on your ballot <span className="text-green">before you thumbprint it.</span>
            </h1>
            <p className="mt-5 max-w-[52ch] text-lg text-muted">
              Every candidate you can vote for, from President to your State Assembly seat, taken from INEC&apos;s
              official lists for all 36 states and the FCT.
            </p>
            <div className="mt-8">
              <FindBallot autoFocus quick={quickEntries()} />
            </div>
          </div>
          <div className="min-w-0">
            <CardHint />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl py-12" style={gutter}>
        <h2 className="display-tight text-2xl">Two voting days, five votes</h2>
        <p className="mt-1 text-muted">
          Most voters cast five ballots across two Saturdays. The FCT and the eight off-cycle states vote in fewer
          races.
        </p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {ELECTIONS.map((e) => (
            <article key={e.date} className="sheet overflow-hidden">
              <header className="sheet-band flex items-start justify-between gap-4 px-5 pb-4 pt-5">
                <div>
                  <p className="label text-green">{e.label}</p>
                  <p className="display-tight mt-1 text-2xl">{fmt(e.date)}</p>
                </div>
                <p className="mono shrink-0 rounded bg-green-soft px-2 py-1 text-xs">
                  <Countdown date={e.date} />
                </p>
              </header>
              <ul className="divide-y divide-rule">
                {e.offices.map((o) => (
                  <li key={o} className="flex gap-4 px-5 py-3">
                    <Thumbprint className="mt-0.5 h-6 w-6 shrink-0 text-violet/70" />
                    <div>
                      <p className="font-semibold">{OFFICE_LABEL[o]}</p>
                      <p className="text-sm text-muted">{OFFICE_INFO[o].what}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Dates from INEC&apos;s revised 2027 timetable. Governorship polls in Anambra, Bayelsa, Edo, Ekiti, Imo, Kogi,
          Ondo and Osun run on their own calendar. The FCT has no governor or state assembly.
        </p>
        <Link
          prefetch={false}
          href="/who-decides"
          className="mt-6 flex items-center justify-between gap-4 rounded-md border-2 border-green bg-green-soft px-5 py-4 hover:bg-green-soft/70"
        >
          <span>
            <span className="display-tight block text-lg">Who controls fuel prices? Your roads? Your school?</span>
            <span className="block text-sm text-muted">
              See which office decides what before you choose who to vote for.
            </span>
          </span>
          <span aria-hidden className="text-2xl text-green">
            →
          </span>
        </Link>
      </section>

      <section className="border-y border-rule bg-sheet">
        <div className="mx-auto max-w-5xl py-12" style={gutter}>
          <h2 className="display-tight text-2xl">From your voter&apos;s card to a decision</h2>
          <ol className="mt-6 grid gap-8 md:grid-cols-3">
            {[
              [
                "Find your ballot",
                "Enter your polling unit code, your LGA or ward, or let us suggest LGAs near you. We work out your Senate district, federal and state constituencies.",
              ],
              [
                "Go race by race",
                "Each race is laid out like the ballot paper. See age, qualifications and party for every candidate, filter the list, and compare up to three side by side.",
              ],
              [
                "Mark your picks",
                "Tap the thumbprint to mark who you're leaning towards. It stays on this phone only. Bring your PVC and vote at your own polling unit.",
              ],
            ].map(([t, d], i) => (
              <li key={t} className="grid grid-cols-[auto_1fr] gap-4">
                <span className="display grid h-10 w-10 place-items-center rounded-full border-2 border-green text-lg text-green">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{t}</h3>
                  <p className="mt-1 text-[0.95rem] text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl py-12" style={gutter}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="display-tight text-2xl">Browse by state</h2>
          <p className="mono text-xs text-muted">
            {s.candidates.toLocaleString()} candidates · {s.lgas} LGAs · {s.wards.toLocaleString()} wards
          </p>
        </div>
        <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map(([zone, states]) => (
            <div key={zone}>
              <h3 className="label border-b border-rule pb-2 text-muted">{zone}</h3>
              <ul className="mt-1 grid grid-cols-2">
                {states.map((st) => (
                  <li key={st.code}>
                    <Link
                      prefetch={false}
                      href={`/state/${st.slug}`}
                      className="block rounded px-1 py-1.5 hover:bg-green-soft hover:text-green"
                    >
                      {st.short}
                    </Link>
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
