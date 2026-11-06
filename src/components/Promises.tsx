import { PLATFORMS, type Platform } from "@/lib/data";
import { manifestoUrl } from "@/lib/site";

export const day = (iso: string) =>
  iso.length === 7
    ? new Date(`${iso}-15T12:00:00Z`).toLocaleDateString("en-NG", { month: "short", year: "numeric" })
    : new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

/** Numbered source links for a pledge, like footnotes. */
export function Cites({ ids }: { ids: string[] }) {
  return (
    <span className="text-xs">
      {ids.map((id) => {
        const s = PLATFORMS.sources[id];
        return (
          <a key={id} href={s.url} title={`${s.outlet}, ${day(s.date)}: ${s.title}`} className="ml-1.5 inline-block whitespace-nowrap text-muted underline decoration-rule underline-offset-2 hover:text-ink">
            {s.outlet.split(" (")[0]}, {day(s.date)}
          </a>
        );
      })}
    </span>
  );
}

export function PlatformStatus({ p, who = "this candidate" }: { p: Platform | null; who?: string }) {
  if (!p)
    return (
      <p className="text-sm text-muted">
        We haven&apos;t found a published manifesto or reported pledges for {who} as of {day(PLATFORMS.checked)}.
      </p>
    );
  return (
    <div className="text-sm">
      <p>
        {p.status === "manifesto" ? (
          <span className="mr-2 rounded bg-green-soft px-1.5 py-0.5 text-xs font-semibold text-green">Manifesto</span>
        ) : (
          <span className="mr-2 rounded bg-amber-soft px-1.5 py-0.5 text-xs font-semibold text-amber-ink">No manifesto yet</span>
        )}
        {p.title && <strong>{p.title}</strong>}
        {p.unveiled && <span className="text-muted">, unveiled {day(p.unveiled)}</span>}
        {p.document && (
          <>
            {" · "}
            <a className="underline" href={p.document}>Read it</a>
          </>
        )}
      </p>
      <p className="mt-1 text-muted">
        {p.note}
        {p.noteSrc && <Cites ids={p.noteSrc} />}
      </p>
    </div>
  );
}

/** A candidate's pledges grouped by topic, each with its source. */
export default function Promises({ p, who }: { p: Platform | null; who?: string }) {
  const topics = p ? PLATFORMS.topics.filter((t) => p.pledges.some((x) => x.topic === t)) : [];
  return (
    <div className="space-y-4">
      <PlatformStatus p={p} who={who} />
      {topics.length > 0 && (
        <dl className="divide-y divide-rule border-y border-rule">
          {topics.map((t) => (
            <div key={t} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
              <dt className="label pt-0.5 text-[0.65rem] text-muted">{t}</dt>
              <dd className="space-y-1.5">
                {p!.pledges.filter((x) => x.topic === t).map((x) => (
                  <p key={x.text} className="text-[0.95rem]">
                    {x.text}
                    <Cites ids={x.src} />
                  </p>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

/** The candidate's own promises, then their party's platform, then a way for campaigns to send theirs. */
export function CandidatePromises({ p, party, partyFull, name, pageUrl }: { p: Platform | null; party: Platform | null; partyFull: string; name: string; pageUrl: string }) {
  return (
    <div className="space-y-5">
      <Promises p={p} />
      {party && (
        <div className="rounded-md bg-paper p-4">
          <p className="label text-[0.65rem] text-muted">Their party&apos;s platform: {partyFull}</p>
          <div className="mt-2"><Promises p={party} /></div>
        </div>
      )}
      <p className="text-xs text-muted">
        Pledges are paraphrased neutrally from the linked reports; we don&apos;t judge whether a promise is realistic.{" "}
        <a className="underline" href={manifestoUrl(name, pageUrl)}>Send us {p ? "more of" : ""} this candidate&apos;s manifesto</a>.
      </p>
    </div>
  );
}
