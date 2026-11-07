"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";

export type LgaLink = { id: string; name: string; href: string; wards: number };

export default function LgaFilter({ lgas }: { lgas: LgaLink[] }) {
  const [q, setQ] = useState("");
  const uid = useId().replace(/:/g, "");
  const inputId = `lga-filter-${uid}`;
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return lgas;
    return lgas.filter((l) => l.name.toLowerCase().includes(term));
  }, [lgas, q]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="label mb-2 block text-ink">
            Find your LGA
          </label>
          <div className="relative max-w-xl">
            <input
              id={inputId}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${lgas.length} LGAs`}
              className="control h-12 w-full rounded-lg border-2 border-rule bg-sheet px-4 pr-24 text-base placeholder:text-muted focus:border-green"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full px-3 text-sm text-muted hover:bg-green-soft hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <p className="mono text-xs text-muted" role="status" aria-live="polite">
          {filtered.length} of {lgas.length} LGAs
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-4 rounded-md bg-amber-soft px-4 py-3 text-sm text-amber-ink">
          No LGA matches &ldquo;{q.trim()}&rdquo;. Try a shorter name or check the spelling.
        </p>
      ) : (
        <ul className="mt-4 grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <li key={l.id} className="border-b border-rule">
              <Link
                prefetch={false}
                href={l.href}
                className="group flex min-h-11 items-center justify-between gap-3 py-2.5 hover:text-green"
              >
                <span className="truncate">{l.name}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-muted">
                  <span className="mono">{l.wards} wards</span>
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
