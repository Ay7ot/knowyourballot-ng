import Link from "next/link";
import type { BallotSection } from "@/lib/types";
import { OFFICE_LABEL, candidatesOf, ELECTIONS } from "@/lib/data";
import { CandidateRow, Pending } from "./ui";

const DATE: Record<string, string> = Object.fromEntries(
  ELECTIONS.flatMap((e) => e.offices.map((o) => [o, new Date(`${e.date}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })])),
);

export default function BallotSections({ sections, stateSlug }: { sections: BallotSection[]; stateSlug: string }) {
  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <section key={s.office} aria-labelledby={`h-${s.office}`} className="rounded-2xl border border-line bg-surface overflow-hidden">
          <header className="px-4 pt-4 pb-3 border-b border-line">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={`h-${s.office}`} className="text-lg font-semibold">{OFFICE_LABEL[s.office]}</h2>
              <span className="text-xs text-muted shrink-0">{DATE[s.office]}</span>
            </div>
            {s.note && <p className="mt-1 text-sm text-muted">{s.note}</p>}
          </header>
          {s.office === "assembly" && s.status === "loaded" && s.contests.length === 0 ? (
            s.note ? null : (
              <div className="px-4 py-4 text-sm text-muted">
                We couldn&apos;t match a state constituency to this LGA automatically.{" "}
                <Link className="underline" href={`/state/${stateSlug}#all-assembly`}>See all state constituencies in this state</Link>.
              </div>
            )
          ) : s.status === "pending" ? (
            <>
              {s.contests.map((c) => (
                <div key={c.districtId} data-fed={s.office === "rep" ? c.districtId : undefined} className="px-4 pt-3 text-sm font-medium">
                  {c.districtName}
                </div>
              ))}
              <div className="mt-3"><Pending what={`the ${OFFICE_LABEL[s.office]} candidates`} /></div>
            </>
          ) : (
            s.contests.map((c) => {
              const cands = c.race ? candidatesOf(c.race) : [];
              return (
                <div key={c.districtId} data-fed={s.office === "rep" ? c.districtId : undefined} className="border-b border-line last:border-0">
                  {s.office !== "president" && (
                    <div className="px-4 pt-3 flex items-baseline justify-between gap-3">
                      <h3 className="font-medium">{c.race?.name ?? c.districtName}</h3>
                      {c.race && (
                        <Link href={`/race/${c.race.id}`} className="text-sm text-brand hover:underline shrink-0">
                          {cands.length} candidates
                        </Link>
                      )}
                    </div>
                  )}
                  {cands.length ? (
                    <ul className="mt-1 divide-y divide-line">{cands.map((cd) => <CandidateRow key={cd.id} c={cd} />)}</ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-muted">No candidates found for this seat in INEC&apos;s list yet.</p>
                  )}
                </div>
              );
            })
          )}
        </section>
      ))}
    </div>
  );
}
