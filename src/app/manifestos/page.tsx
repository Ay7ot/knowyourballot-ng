import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { manifestoEntries, PLATFORMS, partyLogo, platformDocumentKind, type ManifestoEntry } from "@/lib/data";
import PartyMark from "@/components/PartyMark";
import { day } from "@/components/Promises";
import { Crumbs } from "@/components/ui";
import { manifestoLibraryUrl } from "@/lib/site";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = pageMeta({
  title: "Manifestos and pledges",
  description:
    "Every 2027 manifesto we have found, with the full document where it is online and sourced campaign pledges where it is not.",
  path: "/manifestos",
  og: {
    k: "Nigeria 2027",
    t: "Manifestos and pledges",
    s: "Every manifesto we have found, with sources, in one place.",
  },
});

const GROUPS = [
  ["president", "President"],
  ["governor", "Governors"],
  ["senate", "Senate"],
  ["rep", "House of Representatives"],
  ["assembly", "State Houses of Assembly"],
  ["party", "Party platforms"],
] as const;

function grouped(entries: ManifestoEntry[]) {
  return GROUPS.map(([key, label]) => ({
    key,
    label,
    entries: entries.filter((entry) => (entry.office ?? "party") === key),
  })).filter((group) => group.entries.length > 0);
}

function Card({ entry }: { entry: ManifestoEntry }) {
  const p = entry.platform;
  const who = entry.candidate?.name ?? entry.partyFull ?? entry.partyCode;
  const kind = platformDocumentKind(p);
  const state =
    p.status === "manifesto"
      ? p.document
        ? kind === "full"
          ? "Manifesto · full text linked"
          : kind === "abridged"
            ? "Manifesto · abridged text linked"
            : "Manifesto · campaign website linked"
        : p.pledges.length
          ? "Manifesto · summary only"
          : "Manifesto · summary pending"
      : p.status === "awaiting"
        ? "Awaiting publication"
        : p.pledges.length
          ? "Pledges only · no manifesto found"
          : "No pledges recorded yet";
  return (
    <li className="sheet overflow-hidden">
      <Link
        prefetch={false}
        href={`/manifesto/${entry.id}`}
        className="group flex items-start gap-3 px-4 py-4 hover:bg-green-soft/50"
      >
        <PartyMark code={entry.partyCode} logo={partyLogo(entry.partyCode)} name={entry.partyFull} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="label block text-[0.65rem] text-muted">{entry.race?.name ?? "Party platform"}</span>
          <span className="mt-0.5 block font-semibold group-hover:underline">{who}</span>
          <span className="block text-sm">{entry.title}</span>
          <span className="mt-1 block text-xs text-muted">
            {state}
            {p.unveiled ? ` · ${day(p.unveiled)}` : ""}
          </span>
        </span>
        <span aria-hidden className="pt-1 text-muted group-hover:text-green">
          ›
        </span>
      </Link>
    </li>
  );
}

export default function ManifestosPage() {
  const entries = manifestoEntries();
  const manifestos = entries.filter((entry) => entry.platform.status === "manifesto");
  const pledges = entries.filter((entry) => entry.platform.status === "pledges" && entry.platform.pledges.length > 0);
  const awaiting = entries.filter((entry) => entry.platform.status === "awaiting");

  return (
    <div className="mx-auto max-w-6xl py-8" style={gutter}>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "Manifestos" }]} />
      <h1 className="display mt-5 text-4xl sm:text-5xl">Manifestos and pledges</h1>
      <p className="mt-3 max-w-[65ch] text-muted">
        Every 2027 manifesto we have found, with the full document where it is online, and the sourced pledges we could
        verify where it is not. Nothing here is judged or scored. Checked {day(PLATFORMS.checked)}.
      </p>
      <p className="mt-2 text-sm text-muted">
        {manifestos.length} manifestos recorded and {pledges.length} records with campaign pledges only
        {awaiting.length > 0 ? `, plus ${awaiting.length} we are still waiting for` : ""}.{" "}
        <Link prefetch={false} href="/promises" className="font-medium text-green underline">
          Compare the presidential candidates topic by topic
        </Link>
        .
      </p>

      <section className="mt-10" aria-labelledby="published-h">
        <h2 id="published-h" className="display-tight text-2xl">
          Published manifestos
        </h2>
        <p className="mt-1 max-w-[70ch] text-sm text-muted">
          A manifesto document exists. Where a campaign has not put the full text online, we say so and link the reports
          we used.
        </p>
        {grouped(manifestos).map((group) => (
          <div key={group.key} className="mt-6">
            <h3 className="label border-b-2 border-ink pb-2 text-ink">{group.label}</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {group.entries.map((entry) => (
                <Card key={entry.id} entry={entry} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="mt-10" aria-labelledby="pledges-h">
        <h2 id="pledges-h" className="display-tight text-2xl">
          Pledges without a published manifesto
        </h2>
        <p className="mt-1 max-w-[70ch] text-sm text-muted">
          We have not found a manifesto document. These are pledges reported from the campaign, each linked to its
          source.
        </p>
        {grouped(pledges).map((group) => (
          <div key={group.key} className="mt-6">
            <h3 className="label border-b-2 border-ink pb-2 text-ink">{group.label}</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {group.entries.map((entry) => (
                <Card key={entry.id} entry={entry} />
              ))}
            </ul>
          </div>
        ))}
      </section>

      {awaiting.length > 0 && (
        <section className="mt-10" aria-labelledby="awaiting-h">
          <h2 id="awaiting-h" className="display-tight text-2xl">
            Not published yet
          </h2>
          <p className="mt-1 max-w-[70ch] text-sm text-muted">
            The campaign says a manifesto is coming, or we have not found one. We will add it when it is published.
          </p>
          {grouped(awaiting).map((group) => (
            <div key={group.key} className="mt-6">
              <h3 className="label border-b-2 border-ink pb-2 text-ink">{group.label}</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {group.entries.map((entry) => (
                  <Card key={entry.id} entry={entry} />
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <div className="mt-10 rounded-md border-2 border-dashed border-rule p-5">
        <p className="label text-muted">Missing one?</p>
        <p className="mt-1 max-w-[70ch] text-sm">
          We publish a manifesto or pledge only with a public source, and a person reviews each one. If you have a link,
          send it and we will check it.
        </p>
        <a
          href={manifestoLibraryUrl("/manifestos")}
          className="mt-4 inline-flex h-11 items-center rounded-md bg-green px-4 text-sm font-semibold text-green-ink"
        >
          Send us a manifesto
        </a>
      </div>
    </div>
  );
}
