import Link from "next/link";
import type { Candidate, Office, Race } from "@/lib/types";
import { candidatesOf, ELECTIONS, LEVEL_SHORT, OFFICE_LABEL, partyLogo, partyName } from "@/lib/data";
import PartyMark from "./PartyMark";
import { CompareToggle, PickButton } from "./picks";
import RaceFilter from "./RaceFilter";
import Term from "./Term";
import { OFFICE_POWER } from "@/lib/civics";

const SUB_TERM: Partial<Record<Office, string>> = {
  senate: "senatorial-district",
  rep: "federal-constituency",
  assembly: "state-constituency",
};

const fmtDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" });
export const electionFor = (o: Office) => ELECTIONS.find((e) => e.offices.includes(o))!;

function CandidateLine({ c, raceId }: { c: Candidate; raceId: string }) {
  const facts = [c.age ? `${c.age}` : null, c.gender, c.level ? LEVEL_SHORT[c.level] : null].filter(Boolean);
  return (
    <li data-row data-gender={c.gender ?? ""} data-level={c.level ?? "none"} className="flex items-stretch">
      <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-3 sm:gap-4">
        <PartyMark code={c.party} logo={partyLogo(c.party)} name={partyName(c.party)} />
        <div className="min-w-0 flex-1">
          <Link
            prefetch={false}
            href={`/candidate/${c.id}`}
            className="block font-semibold leading-snug hover:underline"
          >
            {c.name}
          </Link>
          <p className="truncate text-sm text-muted">
            {partyName(c.party) ?? c.party}
            {c.runningMate && <> · with {c.runningMate.name}</>}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {facts.length > 0 && <span className="mono text-xs text-muted">{facts.join(" · ")}</span>}
            <CompareToggle cand={c.id} />
          </div>
        </div>
      </div>
      <div className="thumb-cell grid w-16 shrink-0 place-items-center sm:w-20">
        <PickButton race={raceId} cand={c.id} name={c.name} />
      </div>
    </li>
  );
}

/** One race as a ballot sheet: band with the office and date, then INEC-ordered rows. */
export default function RaceSheet({
  race,
  title,
  sub,
  showInfo = true,
  collapsed = false,
  main = false,
}: {
  race: Race;
  title?: string;
  sub?: string;
  showInfo?: boolean;
  collapsed?: boolean;
  main?: boolean;
}) {
  const cands = candidatesOf(race);
  const e = electionFor(race.office);
  const H = main ? "h1" : "h3";
  const scope = `race-${race.id.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <section
      id={race.id}
      aria-labelledby={`${scope}-h`}
      className="sheet overflow-hidden scroll-mt-32 lg:scroll-mt-24"
      data-scope={scope}
    >
      <header className="sheet-band px-4 pb-4 pt-4 sm:px-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="label text-green">{OFFICE_LABEL[race.office]}</p>
          <p className="mono text-xs text-muted">{fmtDay(e.date)}</p>
        </div>
        <H
          id={`${scope}-h`}
          tabIndex={-1}
          className={`display-tight mt-1 outline-none ${main ? "text-3xl sm:text-4xl" : "text-2xl"}`}
        >
          {title ?? race.name}
        </H>
        {sub && (
          <p className="mt-0.5 text-sm text-muted">
            {SUB_TERM[race.office] ? <Term id={SUB_TERM[race.office]!}>{sub}</Term> : sub}
          </p>
        )}
        {showInfo && (
          <p className="mt-2 max-w-[62ch] text-[0.95rem]">
            <span className="label mr-1.5 text-[0.65rem] text-green">Can change</span>
            {OFFICE_POWER[race.office].can}{" "}
            <Link
              prefetch={false}
              href={`/who-decides#office-${race.office}`}
              className="whitespace-nowrap text-sm text-muted underline hover:text-ink"
            >
              and what they can&apos;t
            </Link>
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            <span className="tabular font-semibold text-ink">{cands.length}</span> candidates · tap the thumbprint to
            mark your pick
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {!main && (
              <Link
                prefetch={false}
                href={race.id === "president" ? "/promises" : `/race/${race.id}#promises`}
                className="text-sm font-medium text-green underline"
              >
                What they promise
              </Link>
            )}
            {cands.length > 6 && <RaceFilter scope={scope} />}
          </div>
        </div>
      </header>
      {cands.length ? (
        <details open={!collapsed} className="group">
          <summary className="cursor-pointer list-none px-4 py-2 text-sm font-medium text-green group-open:hidden sm:px-5">
            Show all {cands.length} candidates
          </summary>
          <ol className="divide-y divide-rule" data-list>
            {cands.map((c) => (
              <CandidateLine key={c.id} c={c} raceId={race.id} />
            ))}
          </ol>
        </details>
      ) : (
        <p className="px-5 py-4 text-sm text-muted">
          INEC&apos;s list has no candidates we could match to this seat yet.
        </p>
      )}
    </section>
  );
}
