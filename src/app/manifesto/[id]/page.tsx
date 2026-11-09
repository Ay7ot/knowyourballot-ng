import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  manifestoEntries,
  manifestoFor,
  PLATFORMS,
  partyLogo,
  platformDocumentKind,
  type ManifestoEntry,
} from "@/lib/data";
import { pageMeta } from "@/lib/seo";
import { Crumbs } from "@/components/ui";
import PartyMark from "@/components/PartyMark";
import Promises, { Cites, day } from "@/components/Promises";
import { correctionUrl, manifestoLibraryUrl, manifestoUrl } from "@/lib/site";
import { gutter } from "@/lib/gutter";

export const dynamicParams = false;

export function generateStaticParams() {
  return manifestoEntries().map((entry) => ({ id: entry.id }));
}

const headingFor = (entry: ManifestoEntry) =>
  entry.platform.title ??
  (entry.platform.status === "awaiting"
    ? "Manifesto not published yet"
    : entry.candidate
      ? `What ${entry.candidate.name} has promised`
      : `${entry.partyFull ?? entry.partyCode} platform`);

const subjectFor = (entry: ManifestoEntry) => entry.candidate?.name ?? entry.partyFull ?? entry.partyCode;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const entry = manifestoFor((await params).id);
  if (!entry) return {};
  const p = entry.platform;
  const who = subjectFor(entry);
  const heading = headingFor(entry);
  const kind = platformDocumentKind(p);
  const link = p.document
    ? kind === "full"
      ? " and a link to the full document"
      : kind === "abridged"
        ? " and a link to the abridged campaign document"
        : " and a link to the campaign website"
    : "";
  const description =
    p.status === "manifesto"
      ? `${who}${p.title ? ` — “${p.title}”` : ""}: ${p.pledges.length ? "key commitments with sources" : "manifesto details"}${link}.`
      : p.status === "awaiting"
        ? `${who}: no manifesto or pledges published yet.`
        : `${who}: the pledges we could source, each linked to the report it came from.`;
  const pageTitle = p.title ? `${p.title} — ${who}` : heading.includes(who) ? heading : `${heading} — ${who}`;
  return pageMeta({
    title: pageTitle,
    description,
    path: `/manifesto/${entry.id}`,
    type: "article",
    og: {
      k: `${entry.partyCode} · ${entry.race?.name ?? "Party platform"}`,
      t: heading.length > 86 ? `${heading.slice(0, 83)}…` : heading,
      s: who,
    },
  });
}

export default async function ManifestoPage({ params }: { params: Promise<{ id: string }> }) {
  const entry = manifestoFor((await params).id);
  if (!entry) notFound();
  const p = entry.platform;
  const who = subjectFor(entry);
  const heading = headingFor(entry);
  const kind = platformDocumentKind(p);
  const hasPledges = p.pledges.length > 0;
  const status =
    p.status === "manifesto"
      ? p.document
        ? kind === "full"
          ? "Manifesto"
          : kind === "abridged"
            ? "Manifesto · abridged online"
            : "Manifesto · campaign website"
        : "Manifesto · summary only"
      : p.status === "awaiting"
        ? "Awaiting publication"
        : hasPledges
          ? "Pledges only"
          : "No pledges recorded yet";
  const documentState = p.document
    ? kind === "full"
      ? p.documentPages
        ? `${p.documentPages} pages`
        : "Full text"
      : kind === "abridged"
        ? "Abridged version"
        : "Campaign website"
    : "Not online";
  const cta =
    kind === "full"
      ? `Read the full manifesto${p.documentPages ? ` (PDF, ${p.documentPages} pages)` : ""}`
      : kind === "abridged"
        ? "Read the abridged manifesto"
        : "Open the campaign website";
  const disclosure =
    kind === "full"
      ? "Opens the original document in a new tab. We link to it rather than host a copy."
      : kind === "abridged"
        ? "Opens the campaign website in a new tab. This is an abridged version; the full text is not linked here."
        : "Opens the campaign website in a new tab.";
  const sourced = [...new Set([...p.pledges.flatMap((pledge) => pledge.src), ...(p.noteSrc ?? [])])].flatMap((id) => {
    const source = PLATFORMS.sources[id];
    return source ? [{ id, ...source }] : [];
  });

  return (
    <div className="shell grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_20rem]" style={gutter}>
      <div className="min-w-0">
        <Crumbs
          items={[{ href: "/", label: "Home" }, { href: "/manifestos", label: "Manifestos" }, { label: heading }]}
        />

        <header className="sheet mt-5 overflow-hidden">
          <div className="sheet-band flex items-start gap-4 px-5 py-5">
            <PartyMark code={entry.partyCode} logo={partyLogo(entry.partyCode)} name={entry.partyFull} size="sm" />
            <div className="min-w-0">
              <p className="label text-green">
                {entry.race?.name ?? "Party platform"} · {entry.partyCode}
              </p>
              <h1 className="display-tight mt-1 text-3xl sm:text-4xl">{heading}</h1>
              <p className="mt-2 text-sm">
                {entry.candidate ? (
                  <>
                    <Link prefetch={false} href={`/candidate/${entry.candidate.id}`} className="font-medium underline">
                      {entry.candidate.name}
                    </Link>
                    <span className="text-muted">, {entry.partyFull ?? entry.partyCode}</span>
                  </>
                ) : (
                  who
                )}
              </p>
              <p className="mt-3 max-w-[75ch] text-sm text-muted">
                {p.note}
                <Cites ids={p.noteSrc ?? []} />
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-px border-t border-rule bg-rule text-sm sm:grid-cols-4">
            {[
              ["Status", status],
              ["Unveiled", p.unveiled ? day(p.unveiled) : "Date not stated"],
              ["Document", documentState],
              ["Party", entry.partyFull ?? entry.partyCode],
            ].map(([label, value]) => (
              <div key={label} className="bg-sheet px-4 py-3">
                <dt className="label text-[0.65rem] text-muted">{label}</dt>
                <dd className="mt-0.5 font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-3 border-t border-rule px-5 py-4">
            {p.document ? (
              <a
                href={p.document}
                target="_blank"
                rel="noopener noreferrer"
                aria-describedby="document-note"
                className="inline-flex h-11 items-center rounded-md bg-green px-4 text-sm font-semibold text-green-ink"
              >
                {cta}
              </a>
            ) : (
              <p className="max-w-[65ch] text-sm text-amber-ink">
                {hasPledges
                  ? "We haven't found the full document online. The commitments below are the ones we could source."
                  : "We haven't found the full document online yet."}
              </p>
            )}
            {entry.candidate && (
              <Link
                prefetch={false}
                href={`/candidate/${entry.candidate.id}`}
                className="inline-flex h-11 items-center rounded-md border border-rule px-4 text-sm font-medium hover:border-green hover:bg-green-soft"
              >
                Candidate profile
              </Link>
            )}
            {p.document && (
              <p id="document-note" className="w-full text-xs text-muted">
                {disclosure}
              </p>
            )}
          </div>
        </header>

        {hasPledges ? (
          <section className="sheet mt-6 overflow-hidden" aria-labelledby="commitments-h">
            <div className="sheet-band px-5 pb-3 pt-4">
              <h2 id="commitments-h" className="font-semibold">
                What it commits to
              </h2>
              <p className="mt-1 text-sm text-muted">
                {p.pledges.some((pledge) => pledge.page)
                  ? "Paraphrased from the document, with page numbers where shown."
                  : "Paraphrased from the linked reports. Each commitment links to its source."}
              </p>
            </div>
            <div className="px-5 py-4">
              <Promises p={p} showStatus={false} />
            </div>
          </section>
        ) : (
          <section className="sheet mt-6 overflow-hidden" aria-labelledby="commitments-h">
            <h2 id="commitments-h" className="sheet-band px-5 pb-3 pt-4 font-semibold">
              What it commits to
            </h2>
            <p className="max-w-[70ch] px-5 py-4 text-sm text-muted">
              {p.status === "manifesto"
                ? "We haven't summarised this manifesto's commitments yet. Read the version above, or check back."
                : "The campaign has not published a manifesto or pledges we can source yet. We will add them when it does."}
            </p>
          </section>
        )}

        <section className="sheet mt-6 overflow-hidden" aria-labelledby="sources-h">
          <h2 id="sources-h" className="sheet-band px-5 pb-3 pt-4 font-semibold">
            Sources
          </h2>
          <ul className="divide-y divide-rule">
            {sourced.map((source) => (
              <li key={source.id} className="px-5 py-3 text-sm">
                <a className="underline" href={source.url}>
                  {source.title}
                </a>
                <p className="mt-0.5 text-xs text-muted">
                  {source.outlet}, {day(source.date)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-4 max-w-[75ch] text-sm text-muted">
          We paraphrase and link; we do not judge whether a promise is realistic. If something is wrong or missing,{" "}
          <a className="underline" href={correctionUrl(heading, `/manifesto/${entry.id}`)}>
            send a correction with a source
          </a>
          .
        </p>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-3">
          <div className="sheet p-4">
            <p className="label text-muted">At a glance</p>
            <dl className="mt-2 space-y-2 text-sm">
              {entry.race && (
                <div>
                  <dt className="label text-[0.65rem] text-muted">Race</dt>
                  <dd>
                    <Link prefetch={false} href={`/race/${entry.race.id}`} className="underline">
                      {entry.race.name}
                    </Link>
                  </dd>
                </div>
              )}
              {entry.candidate && (
                <div>
                  <dt className="label text-[0.65rem] text-muted">Candidate</dt>
                  <dd>
                    <Link prefetch={false} href={`/candidate/${entry.candidate.id}`} className="underline">
                      {entry.candidate.name}
                    </Link>
                  </dd>
                </div>
              )}
              <div>
                <dt className="label text-[0.65rem] text-muted">Status</dt>
                <dd>{status}</dd>
              </div>
              {p.documentPages && (
                <div>
                  <dt className="label text-[0.65rem] text-muted">Length</dt>
                  <dd>{p.documentPages} pages</dd>
                </div>
              )}
            </dl>
          </div>
          <div className="sheet p-4">
            <p className="label text-muted">Send us the document</p>
            <p className="mt-1 text-sm text-muted">
              Campaigns and readers can send a link or a copy. We check it before publishing.
            </p>
            <a
              href={
                entry.candidate
                  ? manifestoUrl(who, `/manifesto/${entry.id}`)
                  : manifestoLibraryUrl(`/manifesto/${entry.id}`)
              }
              className="mt-3 inline-flex min-h-10 items-center rounded-full border border-rule px-3 text-sm font-medium hover:border-green hover:bg-green-soft"
            >
              Send a manifesto or correction
            </a>
          </div>
        </div>
      </aside>
    </div>
  );
}
