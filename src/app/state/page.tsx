import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { geo, lgasOf } from "@/lib/data";
import { Crumbs } from "@/components/ui";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = pageMeta({
  title: "States",
  description: "Browse 2027 candidates for all 36 states and the FCT.",
  path: "/state",
  og: {
    k: "Nigeria 2027",
    t: "Candidates in every state",
    s: "All 36 states and the FCT: governorship, Senate, House of Reps and State Assembly.",
  },
});

export default function States() {
  const zones = Object.entries(
    geo.states.reduce<Record<string, typeof geo.states>>((acc, st) => {
      if (!acc[st.zone]) acc[st.zone] = [];
      acc[st.zone].push(st);
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="shell py-8" style={gutter}>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "States" }]} />
      <h1 className="display mt-5 text-4xl sm:text-5xl">36 states and the FCT</h1>
      <p className="mt-2 max-w-[60ch] text-muted">
        Each state page lists its governorship race, Senate districts, federal constituencies and State Assembly seats.
        Off-cycle states don&apos;t elect a governor in 2027.
      </p>
      <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {zones.map(([zone, states]) => (
          <section key={zone}>
            <h2 className="label border-b-2 border-ink pb-2 text-ink">{zone}</h2>
            <ul className="divide-y divide-rule">
              {states.map((s) => (
                <li key={s.code}>
                  <Link
                    prefetch={false}
                    href={`/state/${s.slug}`}
                    className="flex items-baseline justify-between gap-3 py-2.5 hover:text-green"
                  >
                    <span className="font-medium">{s.short}</span>
                    <span className="mono text-xs text-muted">
                      {lgasOf(s.code).length} LGAs{!s.governorship && s.slug !== "fct" ? " · off-cycle" : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
