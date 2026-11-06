"use client";

import Link from "next/link";
import { useBallotState, Thumbprint } from "./picks";
import type { TrayCandidate } from "./BallotTray";
import PartyMark from "./PartyMark";

/** On-page summary of the voter's marks, plus a jump list of races. */
export function BallotToc({ races }: { races: { id: string; label: string; office: string; fed?: string }[] }) {
  const { picks } = useBallotState();
  return (
    <ol className="space-y-0.5 text-sm">
      {races.map((r) => (
        <li key={r.id} data-fed={r.fed}>
          <a href={`#${r.id}`} className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-green-soft">
            <Thumbprint className={`h-5 w-5 shrink-0 ${picks[r.id] ? "text-violet" : "text-muted/40"}`} />
            <span className="min-w-0">
              <span className="block text-xs text-muted">{r.office}</span>
              <span className="block truncate font-medium">{r.label}</span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function MyBallot({ races, candidates }: { races: { id: string; label: string; office: string; date: string; fed?: string }[]; candidates: TrayCandidate[] }) {
  const { picks, togglePick } = useBallotState();
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const marked = races.filter((r) => picks[r.id]).length;
  return (
    <section id="my-ballot" aria-labelledby="mb-h" className="sheet scroll-mt-32 lg:scroll-mt-24 overflow-hidden">
      <header className="sheet-band px-5 pb-4 pt-5">
        <p className="label text-violet">Step 3</p>
        <h2 id="mb-h" className="display-tight mt-1 text-2xl">Your marked ballot</h2>
        <p className="mt-1 text-sm text-muted">
          {marked ? `${marked} of ${races.length} races marked.` : "Nothing marked yet. Tap a thumbprint next to a candidate."} Saved only in this browser. Nobody else can see it.
        </p>
      </header>
      <ul className="divide-y divide-rule">
        {races.map((r) => {
          const c = picks[r.id] ? byId.get(picks[r.id]) : undefined;
          return (
            <li key={r.id} data-fed={r.fed} className="flex items-center gap-4 px-5 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">
                  {r.office} · {r.label} · <span className="mono">{r.date}</span>
                </p>
                {c ? (
                  <p className="mt-1 flex items-center gap-3 font-semibold">
                    <PartyMark code={c.party} logo={c.logo} name={c.partyName} size="sm" />
                    <Link prefetch={false} href={`/candidate/${c.id}`} className="hover:underline">{c.name}</Link>
                  </p>
                ) : (
                  <a href={`#${r.id}`} className="text-sm font-medium text-green hover:underline">Not marked yet, go to this race</a>
                )}
              </div>
              {c && (
                <button type="button" onClick={() => togglePick(r.id, c.id)} className="shrink-0 text-sm text-muted underline">
                  Clear
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
