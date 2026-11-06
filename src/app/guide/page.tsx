import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import VotingDay from "@/components/VotingDay";
import { Thumbprint } from "@/components/picks";
import { ELECTIONS, OFFICE_INFO, OFFICE_LABEL } from "@/lib/data";
import { Crumbs } from "@/components/ui";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = pageMeta({
  title: "Voting-day guide",
  description: "What you vote for in 2027, what to bring, how voting works at your polling unit, and what candidates' qualifications mean.",
  path: "/guide",
  og: { k: "Nigeria 2027", t: "Voting-day guide", s: "What to bring, how voting works at your polling unit, and what the qualifications mean." },
});

const QUALS: [string, string, string][] = [
  ["FSLC", "First School Leaving Certificate", "Primary school"],
  ["SSCE, WAEC, NECO, GCE", "Senior school certificates from the West African or National Examinations Council", "Secondary school"],
  ["OND, HND", "Ordinary and Higher National Diploma, from a polytechnic", "Diploma"],
  ["NCE", "Nigeria Certificate in Education, from a college of education", "Diploma"],
  ["B.Sc, B.A, B.Eng, LLB, MBBS", "First university degrees. LLB is a law degree", "University degree"],
  ["BL", "Barrister at Law, from the Nigerian Law School. Needed to practise law", "University degree"],
  ["PGD, M.Sc, M.A, MBA, MPA, LLM", "Postgraduate diplomas and master's degrees", "Postgraduate"],
  ["PhD", "Doctorate", "Doctorate"],
];

export default function Guide() {
  const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return (
    <div className="mx-auto max-w-4xl py-8" style={gutter}>
      <Crumbs items={[{ href: "/", label: "Home" }, { label: "Voting-day guide" }]} />
      <h1 className="display mt-5 text-4xl sm:text-5xl">Voting in 2027, step by step</h1>
      <p className="mt-3 max-w-[60ch] text-lg text-muted">
        What&apos;s on your ballot, what to bring, and what happens at the polling unit. Based on INEC&apos;s own voter education material.
      </p>

      <nav aria-label="On this page" className="mt-6 flex flex-wrap gap-2 text-sm">
        {[["#offices", "What you vote for"], ["#day", "On the day"], ["#qualifications", "Reading qualifications"], ["#check", "Before you go"]].map(([h, t]) => (
          <a key={h} href={h} className="rounded-md border border-rule bg-sheet px-3 py-2 font-medium hover:border-green">{t}</a>
        ))}
      </nav>

      <section id="offices" className="mt-12 scroll-mt-24">
        <h2 className="display-tight text-2xl">What you vote for</h2>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {ELECTIONS.map((e) => (
            <article key={e.date} className="sheet overflow-hidden">
              <header className="sheet-band px-5 pb-4 pt-5">
                <p className="label text-green">{e.label}</p>
                <p className="display-tight mt-1 text-xl">{fmt(e.date)}</p>
              </header>
              <ul className="divide-y divide-rule">
                {e.offices.map((o) => (
                  <li key={o} className="grid grid-cols-[auto_1fr] gap-4 px-5 py-4">
                    <Thumbprint className="mt-0.5 h-6 w-6 text-violet/70" />
                    <div>
                      <h3 className="font-semibold">{OFFICE_LABEL[o]}</h3>
                      <p className="mt-0.5 text-sm text-muted">{OFFICE_INFO[o].what}</p>
                      <p className="mono mt-1 text-xs text-muted">{OFFICE_INFO[o].term} · {OFFICE_INFO[o].seats}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="day" className="mt-12 scroll-mt-24">
        <VotingDay />
      </section>

      <section id="qualifications" className="mt-12 scroll-mt-24">
        <h2 className="display-tight text-2xl">Reading a candidate&apos;s qualifications</h2>
        <p className="mt-1 max-w-[62ch] text-muted">
          INEC prints qualifications as candidates wrote them, often as abbreviations. We show that text exactly, and next to it our reading of
          the highest level it mentions. The constitution&apos;s minimum for every office on this ballot is a school certificate or its equivalent.
        </p>
        <div className="sheet mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="sheet-band">
                <th className="label px-5 py-3 text-muted">You&apos;ll see</th>
                <th className="label px-5 py-3 text-muted">It means</th>
                <th className="label px-5 py-3 text-muted">We file it as</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {QUALS.map(([k, v, l]) => (
                <tr key={k} className="align-top">
                  <td className="mono px-5 py-3 font-medium">{k}</td>
                  <td className="px-5 py-3">{v}</td>
                  <td className="px-5 py-3 text-muted">{l}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="check" className="mt-12 scroll-mt-24">
        <h2 className="display-tight text-2xl">Before you go</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ["Find your polling unit code", "It's printed on your PVC. Enter it on our home page to see your exact ballot."],
            ["Check you're registered", "INEC's voter verification portal confirms your registration and polling unit."],
            ["Decide before the queue", "Mark your picks here. They stay on your phone and nobody else can see them."],
          ].map(([t, d], i) => (
            <li key={t} className="sheet p-5">
              <span className="mono text-sm text-green">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-1 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6">
          <Link prefetch={false} href="/" className="inline-flex h-12 items-center rounded-md bg-green px-5 font-semibold text-green-ink">Find your ballot</Link>
        </p>
      </section>
    </div>
  );
}
