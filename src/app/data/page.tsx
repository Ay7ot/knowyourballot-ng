import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { ALL_PARTIES, ballot, stats } from "@/lib/data";
import { gutter } from "@/lib/gutter";
import { Crumbs } from "@/components/ui";
import { REPO } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "About the data",
  description: "Where every candidate and constituency on Know Your Ballot comes from, and what isn't covered yet.",
  path: "/data",
  og: {
    k: "Sources",
    t: "Where our data comes from",
    s: "INEC's official candidate lists and constituency maps, and what isn't covered yet.",
  },
});

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
  const map: Record<string, string> = {
    president: "presidential",
    senate: "senate",
    rep: "reps",
    governor: "governorship",
    assembly: "assembly",
  };
  for (const c of ballot.candidates) byOffice[map[c.office]]++;
  const updated = ballot.generatedAt
    ? new Date(ballot.generatedAt).toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Africa/Lagos",
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl py-8" style={gutter}>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "About the data" }]} />
      <h1 className="display mt-5 text-4xl sm:text-5xl">Where this comes from</h1>
      <p className="mt-3 text-muted">
        Know Your Ballot is independent and non-partisan. We only show what we can source, and every candidate links
        back to the INEC document it came from.
      </p>

      <section className="mt-8">
        <h2 className="display-tight text-2xl">Coverage right now</h2>
        {updated && (
          <p className="mt-1 text-sm text-muted">
            Last checked against INEC: {updated} (Lagos time). We re-check daily.
          </p>
        )}
        <div className="mt-3 sheet overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sheet-band text-left text-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Office</th>
                <th className="px-4 py-2 font-medium">Candidates</th>
                <th className="px-4 py-2 font-medium">INEC documents</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {Object.entries(OFFICE_NAMES).map(([k, label]) => {
                const o = ballot.offices[k as keyof typeof ballot.offices];
                const ok = o?.documents.filter((d) => !d.error).length ?? 0;
                return (
                  <tr key={k}>
                    <td className="px-4 py-2">{label}</td>
                    <td className="px-4 py-2 tabular">
                      {o?.status === "loaded" ? (
                        byOffice[k].toLocaleString()
                      ) : (
                        <span className="text-amber-ink">Importing</span>
                      )}
                    </td>
                    <td className="px-4 py-2 tabular">{o?.status === "loaded" ? ok : "–"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ballot.unmatched.length > 0 && (
          <p className="mt-2 text-sm text-muted">
            {ballot.unmatched.length} rows from INEC&apos;s lists couldn&apos;t be matched to a constituency
            automatically and are being checked by hand.
          </p>
        )}
      </section>

      <section className="mt-10 space-y-4 text-[15px] leading-relaxed">
        <h2 className="display-tight text-2xl">Where it comes from</h2>
        <div>
          <h3 className="font-semibold">Candidates</h3>
          <p className="text-muted">
            INEC&apos;s final lists of candidates for the 2027 elections, published on{" "}
            <a className="underline" href="https://www.inecnigeria.org/press/">
              inecnigeria.org
            </a>
            , including the updated lists of 31 October 2026. An automated job downloads the PDFs every day, reads the
            tables, and records each file&apos;s fingerprint so changes from substitutions and court orders show up.
            Names, ages, gender and qualifications are exactly as INEC printed them.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Your constituency</h3>
          <p className="text-muted">
            The map from polling unit to ward, LGA, Senate district and federal constituency comes from INEC&apos;s
            polling-unit register on the IReV portal ({s.wards.toLocaleString()} wards, {s.lgas} LGAs, {s.senatorial}{" "}
            Senate districts, {s.federal} federal constituencies), compiled by{" "}
            <a className="underline" href="https://github.com/Emeka-Onwuepe/Polling_Units_in_Nigeria">
              Emeka Onwuepe
            </a>
            . LGA locations for &quot;use my location&quot; come from{" "}
            <a className="underline" href="https://openadmindata.org/ng/">
              Open Admin Data
            </a>{" "}
            (CC BY 4.0), and only suggest nearby LGAs. You choose.
          </p>
          <p className="text-muted mt-2">
            <strong className="text-ink">Known gap:</strong> INEC doesn&apos;t publish which wards make up each State
            House of Assembly constituency. We match them to LGAs by name, so when an LGA has two or more state
            constituencies we show all of them.
          </p>
        </div>
        <div>
          <h3 className="font-semibold">What we leave out</h3>
          <p className="text-muted">
            Religion, ethnicity, and any claim without a source. Background and track records are added only with a link
            to an official record, court document or reputable report.
          </p>
        </div>
      </section>

      <section id="privacy" className="mt-10 space-y-2">
        <h2 className="display-tight text-2xl">What we log</h2>
        <p className="text-muted">
          If a search finds nothing, we store the words you typed and the day so we can add what voters are looking for.
          We do not store your IP address, cookies or device details in that log. Your picks and comparison stay in this
          browser.
        </p>
      </section>

      <section id="affidavits" className="mt-10 space-y-2">
        <h2 className="display-tight text-2xl">Affidavits and personal particulars</h2>
        <p className="text-muted">
          Candidates submit a sworn affidavit and personal particulars to INEC with their nomination. As of November
          2026, INEC has not put the 2027 forms online; it has published the summary lists we use. The Electoral Act
          requires INEC to display the particulars for public inspection, usually at its office in each constituency.
          When INEC publishes them online, or a reader sends us a verified copy, we will link them from each
          candidate&apos;s page.
        </p>
      </section>

      <section id="photos" className="mt-10 space-y-2">
        <h2 className="display-tight text-2xl">Party logos and candidate photos</h2>
        <p className="text-muted">
          Party logos come from each party&apos;s profile on INEC&apos;s website. INEC doesn&apos;t publish candidate
          photos. Where a candidate has an X account we can tie to them (a verified account, or the one their Wikidata
          entry lists), we show the profile picture they chose, credited to that account; it isn&apos;t freely licensed,
          and we change or remove it if the campaign asks. Otherwise we only show a photo when it is freely licensed on
          Wikimedia Commons and the person on Wikidata is verifiably the same candidate: a Nigerian whose name matches,
          whose date of birth agrees with the age INEC printed (or whose party matches when no birth date is recorded),
          and with no other person passing the same checks. Every photo is credited to its author and licence.
          Candidates without a verified photo show none rather than a guess.
        </p>
      </section>

      <section id="parties" className="mt-10">
        <h2 className="display-tight text-2xl">Registered parties</h2>
        <p className="mt-1 text-muted">
          INEC&apos;s register of {Object.keys(ALL_PARTIES).length} political parties, which is where the full names on
          this site come from.
        </p>
        <ul className="mt-4 grid gap-x-6 sm:grid-cols-2">
          {Object.entries(ALL_PARTIES)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([code, name]) => (
              <li key={code} className="flex items-center gap-3 border-b border-rule py-2.5 text-sm">
                <span className="mono w-14 shrink-0 rounded border-[1.5px] border-ink px-1.5 py-0.5 text-center text-xs font-medium">
                  {code}
                </span>
                <span>{name}</span>
              </li>
            ))}
        </ul>
      </section>

      <section id="corrections" className="mt-10 sheet p-5">
        <h2 className="display-tight text-2xl">Corrections and additions</h2>
        <p className="mt-2 text-muted">
          Every page has a &quot;Report a correction&quot; link. Reports are public, need a source, and a person reviews
          each one before anything changes on the site.
        </p>
        <a
          className="mt-3 inline-flex h-11 items-center rounded-md bg-green px-4 text-sm font-semibold text-green-ink"
          href={`${REPO}/issues/new?labels=correction&title=Correction`}
        >
          Report a correction
        </a>
      </section>

      <section id="privacy" className="mt-10 space-y-2">
        <h2 className="display-tight text-2xl">What we record about you</h2>
        <p className="text-muted">
          Nothing that identifies you. Your picks are saved only in your own browser. When a search finds nothing, we
          keep the words you typed and the day, so we can add what people look for. No IP address, account, cookie or
          device details go with it.
        </p>
      </section>
    </div>
  );
}
