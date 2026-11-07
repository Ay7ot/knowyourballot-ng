import Link from "next/link";
import type { Candidate } from "@/lib/types";
import { partyLogo, partyName, partyPlatform, PLATFORMS, platformFor } from "@/lib/data";
import PartyMark from "./PartyMark";
import { Cites, PlatformStatus } from "./Promises";

/** Everyone in a race: who has published what, then pledges topic by topic (candidate's own, else their party's). */
export default function RacePromises({ cands }: { cands: Candidate[] }) {
  const own = cands.filter((c) => platformFor(c.id));
  const viaParty = cands.filter((c) => !platformFor(c.id) && partyPlatform(c.party));
  const none = cands.filter((c) => !platformFor(c.id) && !partyPlatform(c.party));
  const src = (c: Candidate) => platformFor(c.id) ?? partyPlatform(c.party)!;
  const listed = [...own, ...viaParty];
  return (
    <div className="space-y-8">
      <div>
        <ul className="sheet divide-y divide-rule">
          {listed.map((c) => (
            <li key={c.id} className="flex gap-4 px-5 py-4">
              <PartyMark code={c.party} logo={partyLogo(c.party)} name={partyName(c.party)} size="sm" />
              <div className="min-w-0">
                <Link prefetch={false} href={`/candidate/${c.id}`} className="font-semibold hover:underline">
                  {c.name}
                </Link>
                {!platformFor(c.id) && (
                  <p className="text-xs text-muted">
                    No personal manifesto found. Showing their party&apos;s platform.
                  </p>
                )}
                <div className="mt-1">
                  <PlatformStatus p={src(c)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
        {none.length > 0 && (
          <p className="mt-3 text-sm text-muted">
            Nothing found yet for: {none.map((c) => `${c.name} (${c.party})`).join(", ")}. Know of a manifesto? Use the
            link on their page.
          </p>
        )}
      </div>
      {listed.length > 0 &&
        PLATFORMS.topics.map((t) => {
          const rows = listed.flatMap((c) =>
            src(c)
              .pledges.filter((x) => x.topic === t)
              .map((x) => ({ c, x })),
          );
          if (!rows.length) return null;
          return (
            <section key={t} id={`topic-${t.toLowerCase().replace(/\W+/g, "-")}`} className="scroll-mt-24">
              <h3 className="label border-b-2 border-ink pb-2 text-ink">{t}</h3>
              <ul className="divide-y divide-rule">
                {rows.map(({ c, x }) => (
                  <li key={c.id + x.text} className="grid grid-cols-[auto_1fr] gap-4 py-3">
                    <PartyMark code={c.party} logo={partyLogo(c.party)} name={partyName(c.party)} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {c.name}
                        {!platformFor(c.id) && <span className="font-normal text-muted"> (party platform)</span>}
                      </p>
                      <p className="mt-0.5 text-[0.95rem]">
                        {x.text}
                        <Cites ids={x.src} />
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}
