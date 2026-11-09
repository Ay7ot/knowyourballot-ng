import Link from "next/link";
import FindBallot from "@/components/FindBallot";
import Countdown from "@/components/Countdown";
import GeoMap from "@/components/GeoMap";
import {
  ELECTIONS,
  OFFICE_INFO,
  OFFICE_LABEL,
  geo,
  nationalMapPaths,
  nationalMapViewBox,
  quickEntries,
  stats,
} from "@/lib/data";
import { gutter } from "@/lib/gutter";
import { Thumbprint } from "@/components/picks";

const fmt = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

export default function Home() {
  const s = stats();
  const mapPaths = nationalMapPaths();
  const zones = Object.entries(
    geo.states.reduce<Record<string, typeof geo.states>>((acc, st) => {
      if (!acc[st.zone]) acc[st.zone] = [];
      acc[st.zone].push(st);
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <section className="relative border-b border-rule bg-sheet">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_8%,var(--green-soft),transparent_42%)] opacity-80"
        />
        <div
          className="shell relative grid gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center"
          style={gutter}
        >
          <div className="min-w-0">
            <p className="label text-green">Nigeria · 2027 general election</p>
            <h1 className="display mt-3 max-w-[18ch] text-[2.5rem] leading-[0.98] sm:text-6xl xl:text-7xl">
              Know who&apos;s on your ballot <span className="text-green">before you thumbprint it.</span>
            </h1>
            <p className="mt-5 max-w-[58ch] text-lg text-muted">
              Every candidate you can vote for, from President to your State Assembly seat, taken from INEC&apos;s
              official lists for all 36 states and the FCT.
            </p>
            <div className="mt-8 max-w-2xl">
              <FindBallot autoFocus quick={quickEntries()} />
            </div>
            <p className="mt-3 max-w-[64ch] text-sm text-muted">
              Your voter&apos;s card has a code like <span className="mono text-ink">24/14/05/012</span>. Type it above,
              or search by LGA, ward, candidate or party.
            </p>
            <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3 border-t border-rule pt-5">
              {[
                ["Candidates", s.candidates.toLocaleString()],
                ["LGAs", s.lgas.toLocaleString()],
                ["Wards", s.wards.toLocaleString()],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="label text-[0.65rem] text-muted">{label}</dt>
                  <dd className="display-tight mt-1 text-2xl text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="min-w-0">
            <GeoMap
              paths={mapPaths}
              viewBox={nationalMapViewBox}
              title="37 states. One ballot."
              description="Each shape is a state or the FCT. Tap to open one; on desktop, hover to see its name."
            />
          </div>
        </div>
      </section>

      <section className="shell py-12" style={gutter}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="display-tight text-2xl">Two voting days, five votes</h2>
            <p className="mt-1 max-w-[62ch] text-muted">
              Most voters cast five ballots across two Saturdays. The FCT and the eight off-cycle states vote in fewer
              races.
            </p>
          </div>
          <Link
            prefetch={false}
            href="/guide"
            className="inline-flex min-h-11 items-center rounded-full border border-rule bg-sheet px-4 text-sm font-medium hover:border-green hover:bg-green-soft"
          >
            How voting day works <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {ELECTIONS.map((e) => (
            <article
              key={e.date}
              className="sheet overflow-hidden motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-0.5"
            >
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
      </section>

      <section className="border-y border-rule bg-sheet">
        <div className="shell py-12" style={gutter}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="display-tight text-2xl">From your voter&apos;s card to a decision</h2>
              <p className="mt-1 max-w-[62ch] text-muted">Three steps, no account. Your marks stay in this browser.</p>
            </div>
            <Link
              prefetch={false}
              href="/who-decides"
              className="inline-flex min-h-11 items-center rounded-full border border-rule bg-paper px-4 text-sm font-medium hover:border-green hover:bg-green-soft"
            >
              See who decides what <span aria-hidden>→</span>
            </Link>
          </div>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
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
              <li
                key={t}
                className="group rounded-lg border border-rule bg-paper p-5 motion-safe:transition-colors hover:border-green hover:bg-green-soft/40"
              >
                <div className="flex items-center gap-3">
                  <span className="display grid h-11 w-11 place-items-center rounded-full border-2 border-green text-lg text-green">
                    {i + 1}
                  </span>
                  <h3 className="display-tight text-xl">{t}</h3>
                </div>
                <p className="mt-3 text-[0.95rem] text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell py-12" style={gutter}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="display-tight text-2xl">Browse by state</h2>
          <p className="mono text-xs text-muted">
            {s.candidates.toLocaleString()} candidates · {s.lgas} LGAs · {s.wards.toLocaleString()} wards
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {zones.map(([zone, states]) => (
            <div key={zone} className="rounded-lg border border-rule bg-sheet p-4">
              <h3 className="label border-b border-rule pb-2 text-muted">{zone}</h3>
              <ul className="mt-1 grid grid-cols-2">
                {states.map((st) => (
                  <li key={st.code}>
                    <Link
                      prefetch={false}
                      href={`/state/${st.slug}`}
                      className="flex min-h-10 items-center justify-between gap-2 rounded px-2 py-1.5 text-sm hover:bg-green-soft hover:text-green"
                    >
                      <span className="truncate">{st.short}</span>
                      <span aria-hidden className="text-muted">
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-rule bg-sheet">
        <div className="shell grid gap-4 py-10 md:grid-cols-2" style={gutter}>
          <Link
            prefetch={false}
            href="/data"
            className="group rounded-lg border-2 border-green bg-green-soft/50 p-5 hover:bg-green-soft"
          >
            <p className="label text-green">Sourced</p>
            <p className="display-tight mt-2 text-xl">Every candidate links back to INEC&apos;s document.</p>
            <p className="mt-1 text-sm text-muted">See coverage, known gaps and how corrections work.</p>
          </Link>
          <Link
            prefetch={false}
            href="/manifestos"
            className="group rounded-lg border border-rule bg-paper p-5 hover:border-green hover:bg-green-soft/40"
          >
            <p className="label text-violet">Manifestos</p>
            <p className="display-tight mt-2 text-xl">Every manifesto, in one place.</p>
            <p className="mt-1 text-sm text-muted">
              Published manifestos and campaign pledges, by office and race, each linked to its source.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
