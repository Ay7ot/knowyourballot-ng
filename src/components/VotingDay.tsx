import Link from "next/link";

/** INEC's own voting-day rules (inecnigeria.org/voters/education, checked 6 Nov 2026). */
export const VOTING_STEPS = [
  ["Go to your own polling unit", "You can only vote at the polling unit you registered at. That's the code on your voter's card."],
  ["Bring your PVC", "INEC's rule is “No PVC, no voting.” Your physical Permanent Voter Card is scanned on the BVAS device."],
  ["Get verified", "The BVAS checks your fingerprint. If that fails, it checks your face instead."],
  ["Collect your ballot", "An official checks your name on the register, then signs, stamps and hands you the ballot paper."],
  ["Thumbprint in private", "In the voting cubicle, press your inked thumb cleanly inside the box of the party you choose. Ink outside the box can void your vote."],
  ["Fold and drop", "Fold the ballot vertically inward and drop it in the ballot box. You may stay at least 300 metres away to watch the count."],
] as const;

export default function VotingDay({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="vd-h" className="sheet overflow-hidden">
      <header className="sheet-band px-5 pb-4 pt-5">
        <p className="label text-green">On the day</p>
        <h2 id="vd-h" className="display-tight mt-1 text-2xl">Polls open 8:30 am, close 2:30 pm</h2>
        <p className="mt-1 text-sm text-muted">Accreditation and voting happen together. Anyone already in the queue by 2:30 pm is entitled to vote.</p>
      </header>
      <ol className="grid gap-x-8 gap-y-4 px-5 py-5 sm:grid-cols-2">
        {(compact ? VOTING_STEPS.slice(0, 4) : VOTING_STEPS).map(([t, d], i) => (
          <li key={t} className="grid grid-cols-[auto_1fr] gap-3">
            <span className="mono mt-0.5 text-sm text-green">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <p className="font-semibold">{t}</p>
              <p className="text-sm text-muted">{d}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="border-t border-rule px-5 py-3 text-xs text-muted">
        Source: <a className="underline" href="https://inecnigeria.org/voters/education">INEC voter education</a>. INEC can change these rules before polling day, so check its final 2027 guidelines.
        {compact && (
          <>
            {" "}
            <Link prefetch={false} href="/guide" className="underline">Full voting-day guide</Link>
          </>
        )}
      </p>
    </section>
  );
}
