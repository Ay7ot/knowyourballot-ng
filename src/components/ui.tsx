import Link from "next/link";
import type { Candidate, Person } from "@/lib/types";
import { partyLogo, partyName } from "@/lib/data";
import PartyMark from "./PartyMark";

export function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={it.href ?? it.label} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <Link prefetch={false} className="hover:text-ink hover:underline" href={it.href}>
                {it.label}
              </Link>
            ) : (
              <span className="text-ink">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PartyBadge({ code }: { code: string }) {
  const full = partyName(code);
  return (
    <span
      title={full ?? code}
      className="mono inline-flex items-center rounded border-[1.5px] border-ink px-1.5 py-0.5 text-xs font-medium"
    >
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
      <Link
        prefetch={false}
        href={`/candidate/${c.id}`}
        className="group flex items-center gap-3 px-4 py-3 hover:bg-green-soft/60"
      >
        <PartyMark code={c.party} logo={partyLogo(c.party)} name={partyName(c.party)} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium group-hover:underline">{c.name}</span>
          <span className="block truncate text-sm text-muted">
            {[personFacts(c), c.runningMate ? `with ${c.runningMate.name}` : null].filter(Boolean).join(" · ") ||
              partyName(c.party) ||
              " "}
          </span>
        </span>
        <span aria-hidden className="text-muted group-hover:text-green">
          ›
        </span>
      </Link>
    </li>
  );
}

export function Pending({ what }: { what: string }) {
  return (
    <div className="bg-amber-soft px-5 py-4 text-sm text-amber-ink">
      INEC has published this list, but we haven&apos;t finished importing {what} yet. Check back soon, or{" "}
      <Link prefetch={false} href="/data" className="underline">
        see where the data comes from
      </Link>
      .
    </div>
  );
}
