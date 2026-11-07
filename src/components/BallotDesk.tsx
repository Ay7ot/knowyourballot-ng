"use client";

import Link from "next/link";
import { useBallotState } from "./picks";
import { BallotToc } from "./MyBallot";
import PartyMark from "./PartyMark";
import type { TrayCandidate } from "./BallotTray";

type RaceLink = { id: string; label: string; office: string; fed?: string };

export default function BallotDesk({
  races,
  candidates,
  lgaName,
}: {
  races: RaceLink[];
  candidates: TrayCandidate[];
  lgaName: string;
}) {
  const { picks, compare } = useBallotState();
  const marked = races.filter((r) => picks[r.id]).length;
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const compared = compare.map((id) => byId.get(id)).filter(Boolean) as TrayCandidate[];

  function goNext() {
    for (const race of races) {
      if (picks[race.id]) continue;
      const element = document.getElementById(race.id);
      if (element && element.offsetParent !== null) {
        element.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
        element.querySelector<HTMLElement>("h1, h2, h3")?.focus({ preventScroll: true });
        return;
      }
    }
    document.getElementById("my-ballot")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const percent = races.length ? Math.round((marked / races.length) * 100) : 0;

  return (
    <div className="sheet overflow-hidden">
      <div className="sheet-band px-4 pb-3 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="label text-violet">Your ballot</p>
          <p className="mono text-xs text-muted">
            {marked}/{races.length}
          </p>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-rule"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${marked} of ${races.length} races marked`}
        >
          <div
            className="h-full rounded-full bg-violet transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-muted">
          {marked
            ? `${marked} of ${races.length} races marked in ${lgaName}.`
            : "Tap a thumbprint on a candidate to start."}
        </p>
      </div>

      <div className="max-h-[46vh] overflow-y-auto px-2 py-2">
        <BallotToc races={races} />
      </div>

      {compared.length > 0 && (
        <div className="border-t border-rule px-3 py-3">
          <p className="label text-[0.65rem] text-muted">Compare</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {compared.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <PartyMark code={c.party} logo={c.logo} name={c.partyName} size="sm" />
                <span className="truncate">{c.name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">Use the tray below to open the side-by-side view.</p>
        </div>
      )}

      <div className="border-t border-rule p-3">
        {marked < races.length ? (
          <button
            type="button"
            onClick={goNext}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md border-2 border-green px-3 text-sm font-semibold text-green hover:bg-green-soft"
          >
            {marked ? "Next unmarked race" : "Start marking"} <span aria-hidden>↓</span>
          </button>
        ) : (
          <a
            href="#my-ballot"
            className="flex min-h-10 w-full items-center justify-center rounded-md bg-violet px-3 text-sm font-semibold text-white"
          >
            Review my ballot
          </a>
        )}
        <Link
          prefetch={false}
          href="/guide#day"
          className="mt-2 flex min-h-9 items-center justify-center text-xs text-muted underline hover:text-ink"
        >
          How to vote on the day
        </Link>
      </div>
    </div>
  );
}
