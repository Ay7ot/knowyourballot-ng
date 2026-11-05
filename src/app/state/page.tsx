import Link from "next/link";
import type { Metadata } from "next";
import { geo, lgasOf } from "@/lib/data";
import { Crumbs } from "@/components/ui";

export const metadata: Metadata = { title: "States", description: "Browse 2027 candidates for all 36 states and the FCT." };

export default function States() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "States" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">All states</h1>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {geo.states.map((s) => (
          <li key={s.code}>
            <Link href={`/state/${s.slug}`} className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand">
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-muted">{s.zone} · {lgasOf(s.code).length} LGAs</div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
