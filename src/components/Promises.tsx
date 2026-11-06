import { PLATFORMS, type Platform } from "@/lib/data";

const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

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

export function PlatformStatus({ p }: { p: Platform | null }) {
  if (!p)
    return (
      <p className="text-sm text-muted">
        We haven&apos;t found a published manifesto or reported pledges for this candidate as of {day(PLATFORMS.checked)}.
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
export default function Promises({ p }: { p: Platform | null }) {
  const topics = p ? PLATFORMS.topics.filter((t) => p.pledges.some((x) => x.topic === t)) : [];
  return (
    <div className="space-y-4">
      <PlatformStatus p={p} />
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
