import type { Metadata } from "next";
import { ballot, stats } from "@/lib/data";
import { Crumbs } from "@/components/ui";
import { REPO } from "@/lib/site";

export const metadata: Metadata = { title: "About the data", description: "Where every candidate and constituency on Know Your Ballot comes from, and what isn't covered yet." };

const OFFICE_NAMES: Record<string, string> = {
  presidential: "President",
  senate: "Senate",
  reps: "House of Representatives",
  governorship: "Governorship",
  assembly: "State Houses of Assembly",
};

export default function DataPage() {
  const s = stats();
  const byOffice = Object.fromEntries(Object.keys(OFFICE_NAMES).map((k) => [k, 0]));
  const map: Record<string, string> = { president: "presidential", senate: "senate", rep: "reps", governor: "governorship", assembly: "assembly" };
  for (const c of ballot.candidates) byOffice[map[c.office]]++;
  const updated = ballot.generatedAt ? new Date(ballot.generatedAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "About the data" }]} />
      <h1 className="mt-3 text-3xl font-bold tracking-tight">About the data</h1>
      <p className="mt-3 text-muted">
        Know Your Ballot is independent and non-partisan. We only show what we can source, and every candidate links back to the INEC
        document it came from.
      </p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Coverage right now</h2>
        {updated && <p className="mt-1 text-sm text-muted">Last checked against INEC: {updated} (Lagos time). We re-check daily.</p>}
        <div className="mt-3 rounded-2xl border border-line bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg text-left text-muted">
              <tr><th className="px-4 py-2 font-medium">Office</th><th className="px-4 py-2 font-medium">Candidates</th><th className="px-4 py-2 font-medium">INEC documents</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {Object.entries(OFFICE_NAMES).map(([k, label]) => {
                const o = ballot.offices[k as keyof typeof ballot.offices];
                const ok = o?.documents.filter((d) => !d.error).length ?? 0;
                return (
                  <tr key={k}>
                    <td className="px-4 py-2">{label}</td>
                    <td className="px-4 py-2 tabular">{o?.status === "loaded" ? byOffice[k].toLocaleString() : <span className="text-warn-ink">Importing</span>}</td>
                    <td className="px-4 py-2 tabular">{o?.status === "loaded" ? ok : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ballot.unmatched.length > 0 && (
          <p className="mt-2 text-sm text-muted">
            {ballot.unmatched.length} rows from INEC&apos;s lists couldn&apos;t be matched to a constituency automatically and are being checked by hand.
          </p>
        )}
      </section>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <h2 className="text-xl font-semibold">Where it comes from</h2>
        <div>
          <h3 className="font-semibold">Candidates</h3>
          <p className="text-muted">
            INEC&apos;s final lists of candidates for the 2027 elections, published on{" "}
            <a className="underline" href="https://www.inecnigeria.org/press/">inecnigeria.org</a>, including the updated lists of 31 October 2026.
            An automated job downloads the PDFs every day, reads the tables, and records each file&apos;s fingerprint so changes from
            substitutions and court orders show up. Names, ages, gender and qualifications are exactly as INEC printed them.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Your constituency</h3>
          <p className="text-muted">
            The map from polling unit to ward, LGA, Senate district and federal constituency comes from INEC&apos;s polling-unit register on
            the IReV portal ({s.wards.toLocaleString()} wards, {s.lgas} LGAs, {s.senatorial} Senate districts, {s.federal} federal
            constituencies), compiled by{" "}
            <a className="underline" href="https://github.com/Emeka-Onwuepe/Polling_Units_in_Nigeria">Emeka Onwuepe</a>. LGA locations for
            &quot;use my location&quot; come from <a className="underline" href="https://openadmindata.org/ng/">Open Admin Data</a> (CC BY 4.0),
            and only suggest nearby LGAs. You choose.
          </p>
          <p className="text-muted mt-2">
            <strong className="text-ink">Known gap:</strong> INEC doesn&apos;t publish which wards make up each State House of Assembly
            constituency. We match them to LGAs by name, so when an LGA has two or more state constituencies we show all of them.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">What we leave out</h3>
          <p className="text-muted">
            Religion, ethnicity, and any claim without a source. Background and track records are added only with a link to an official
            record, court document or reputable report.
          </p>
        </div>
      </section>

      <section id="corrections" className="mt-10 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-xl font-semibold">Corrections and additions</h2>
        <p className="mt-2 text-muted">
          Every page has a &quot;Report a correction&quot; link. Reports are public, need a source, and a person reviews each one before
          anything changes on the site.
        </p>
        <a className="mt-3 inline-flex rounded-xl bg-brand px-4 h-10 items-center text-sm font-medium text-brand-ink" href={`${REPO}/issues/new?labels=correction&title=Correction`}>
          Report a correction
        </a>
      </section>
    </div>
  );
}
