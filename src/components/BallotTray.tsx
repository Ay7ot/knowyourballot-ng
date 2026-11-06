"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useBallotState, Thumbprint } from "./picks";
import PartyMark from "./PartyMark";

export type TrayCandidate = {
  id: string;
  name: string;
  party: string;
  partyName: string | null;
  logo: string | null;
  photo: string | null;
  age: number | null;
  gender: string | null;
  level: string | null;
  qualifications: string | null;
  mate: string | null;
  race: string;
  raceLabel: string;
};

/**
 * Sticky bar at the bottom of a ballot or race page: how many races you've marked,
 * and the side-by-side comparison of up to three candidates.
 */
export default function BallotTray({
  candidates,
  races,
  levelLabels,
}: {
  candidates: TrayCandidate[];
  races: { id: string; label: string }[];
  levelLabels: Record<string, string>;
}) {
  const { picks, compare, toggleCompare, clearCompare } = useBallotState();
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const marked = races.filter((r) => picks[r.id]).length;
  const cmp = compare.map((id) => byId.get(id)).filter(Boolean) as TrayCandidate[];

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    if (cmp.length === 0) setOpen(false);
  }, [cmp.length]);

  const rows: [string, (c: TrayCandidate) => React.ReactNode][] = [
    ["Party", (c) => c.partyName ?? c.party],
    ["Race", (c) => c.raceLabel],
    ["Age", (c) => (c.age ? `${c.age}` : "Not stated")],
    ["Gender", (c) => c.gender ?? "Not stated"],
    ["Highest qualification", (c) => (c.level ? levelLabels[c.level] : "None listed")],
    ["As written by INEC", (c) => <span className="text-muted">{c.qualifications ?? "Nothing listed"}</span>],
    ["Running mate", (c) => c.mate ?? "None for this seat"],
  ];

  return (
    <>
      <div className="no-print sticky bottom-0 z-20 mt-10 border-t border-rule bg-sheet/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 py-3" style={{ paddingLeft: "max(16px, env(safe-area-inset-left, 0px))", paddingRight: "max(16px, env(safe-area-inset-right, 0px))" }}>
          <a href="#my-ballot" className="flex items-center gap-2 text-sm">
            <Thumbprint className={`h-7 w-7 ${marked ? "text-violet" : "text-muted"}`} />
            <span>
              <strong className="tabular">{marked}</strong> of <span className="tabular">{races.length}</span> races marked
            </span>
          </a>
          {cmp.length > 0 ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearCompare} className="h-10 px-3 text-sm text-muted hover:text-ink">
                Clear
              </button>
              <button type="button" onClick={() => setOpen(true)} disabled={cmp.length < 2} className="h-10 rounded-md bg-green px-4 text-sm font-semibold text-green-ink disabled:opacity-50">
                {cmp.length < 2 ? "Pick one more to compare" : `Compare ${cmp.length} side by side`}
              </button>
            </div>
          ) : (
            <span className="text-sm text-muted">Tick “Compare” on up to 3 candidates</span>
          )}
        </div>
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(960px,calc(100vw-24px))] max-h-[88dvh] rounded-lg border border-rule bg-sheet p-0 text-ink backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 className="display-tight text-xl">Side by side</h2>
          <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-md px-3 text-sm font-medium hover:bg-green-soft">
            Close
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" style={{ minWidth: 96 + cmp.length * 128 }}>
            <thead>
              <tr className="border-b border-rule align-top">
                <th className="w-24 px-4 py-4 sm:w-40 sm:px-5" />
                {cmp.map((c) => (
                  <th key={c.id} className="px-3 py-4 font-normal sm:px-4">
                    <div className="flex items-end gap-2">
                      {c.photo && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.photo} alt="" width={52} height={64} className="h-16 w-[3.25rem] rounded-sm object-cover" />
                      )}
                      <PartyMark code={c.party} logo={c.logo} name={c.partyName} />
                    </div>
                    <Link href={`/candidate/${c.id}`} className="mt-2 block text-base font-semibold hover:underline">{c.name}</Link>
                    <button type="button" onClick={() => toggleCompare(c.id)} className="mt-1 text-xs text-muted underline">Remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, f]) => (
                <tr key={label} className="border-b border-rule align-top last:border-0">
                  <th scope="row" className="label px-4 py-3 text-[0.65rem] text-muted sm:px-5">{label}</th>
                  {cmp.map((c) => (
                    <td key={c.id} className="break-words px-3 py-3 sm:px-4">{f(c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-rule px-5 py-3 text-xs text-muted">Everything here is from INEC&apos;s published lists. &ldquo;Highest qualification&rdquo; is our reading of INEC&apos;s text.</p>
      </dialog>
    </>
  );
}
