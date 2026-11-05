import Link from "next/link";
import type { Candidate, Person } from "@/lib/types";
import { partyName } from "@/lib/data";

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? <Link className="hover:text-ink hover:underline" href={it.href}>{it.label}</Link> : <span className="text-ink">{it.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PartyBadge({ code }: { code: string }) {
  const full = partyName(code);
  return (
    <span title={full ?? code} className="inline-flex items-center rounded-md border border-line bg-bg px-2 py-0.5 text-xs font-semibold tracking-wide">
      {code}
    </span>
  );
}

export function personFacts(p: Person) {
  return [p.age ? `${p.age} yrs` : null, p.gender].filter(Boolean).join(" · ");
}

export function CandidateRow({ c }: { c: Candidate }) {
  return (
    <li>
      <Link href={`/candidate/${c.id}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-brand-soft/60">
        <PartyBadge code={c.party} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium group-hover:underline">{c.name}</span>
          <span className="block truncate text-sm text-muted">
            {[personFacts(c), c.runningMate ? `with ${c.runningMate.name}` : null].filter(Boolean).join(" · ") || partyName(c.party) || " "}
          </span>
        </span>
        <span aria-hidden className="text-muted group-hover:text-brand">›</span>
      </Link>
    </li>
  );
}

export function Pending({ what }: { what: string }) {
  return (
    <div className="px-4 py-4 text-sm text-warn-ink bg-warn-soft">
      INEC has published this list, but we haven&apos;t finished importing {what} yet. Check back soon, or{" "}
      <Link href="/data" className="underline">see where the data comes from</Link>.
    </div>
  );
}
