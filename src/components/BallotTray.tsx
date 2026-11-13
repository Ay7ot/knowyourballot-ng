"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useBallotState, Thumbprint } from "./picks";
import PartyMark from "./PartyMark";
import { manifestoUrl } from "@/lib/site";
import type { TrayPolicy } from "@/lib/data";

export type TrayCandidate = {
  id: string;
  name: string;
  party: string;
  partyName: string | null;
  logo: string | null;
  photo: string | null;
  race: string;
  raceLabel: string;
};

/** Facts and policy are fetched only for the two or three candidates being compared. */
export type TrayDetails = {
  age: number | null;
  gender: string | null;
  level: string | null;
  qualifications: string | null;
  mate: string | null;
  policy: TrayPolicy;
};

/**
 * Sticky bar at the bottom of a ballot or race page: how many races you've marked,
 * and the side-by-side comparison of up to three candidates.
 */
export default function BallotTray({
  candidates,
  races,
  levelLabels,
}: {
  candidates: TrayCandidate[];
  races: { id: string; label: string }[];
  levelLabels: Record<string, string>;
}) {
  const { picks, compare, toggleCompare, clearCompare } = useBallotState();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"policies" | "facts">("policies");
  const [details, setDetails] = useState<Record<string, TrayDetails>>({});
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const byId = new Map(candidates.map((c) => [c.id, c]));
  const marked = races.filter((r) => picks[r.id]).length;
  const cmp = compare.map((id) => byId.get(id)).filter(Boolean) as TrayCandidate[];
  const cmpKey = cmp.map((c) => c.id).join(",");

  useEffect(() => {
    if (!open || !cmpKey) return;
    let cancelled = false;
    setDetailsLoading(true);
    setDetailsError(false);
    fetch(`/api/candidate-details?ids=${encodeURIComponent(cmpKey)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: Record<string, TrayDetails>) => {
        if (!cancelled) setDetails((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {
        if (!cancelled) setDetailsError(true);
      })
      .finally(() => {
        if (!cancelled) setDetailsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, cmpKey]);

  const topics = useMemo(() => {
    const order = [
      "Economy",
      "Fuel and power",
      "Security",
      "Jobs",
      "Agriculture",
      "Education",
      "Health",
      "Infrastructure",
      "Governance",
    ];
    const set = new Set<string>();
    for (const id of cmpKey ? cmpKey.split(",") : []) {
      const policy = details[id]?.policy;
      if (policy) for (const pledge of policy.pledges) set.add(pledge.topic);
    }
    return [...set].sort((a, b) => {
      const left = order.indexOf(a);
      const right = order.indexOf(b);
      return (left === -1 ? 999 : left) - (right === -1 ? 999 : right) || a.localeCompare(b);
    });
  }, [cmpKey, details]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(() => {
    if (cmp.length === 0) setOpen(false);
  }, [cmp.length]);

  // Jump to the first race still unmarked that's showing (split LGAs hide the other Reps race).
  function goNext() {
    for (const r of races) {
      if (picks[r.id]) continue;
      const el = document.getElementById(r.id);
      if (el && el.offsetParent !== null) {
        el.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start",
        });
        el.querySelector<HTMLElement>("h1, h2, h3")?.focus({ preventScroll: true });
        return;
      }
    }
    document.getElementById("my-ballot")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const rows: [string, (c: TrayCandidate, d?: TrayDetails) => React.ReactNode][] = [
    ["Party", (c) => c.partyName ?? c.party],
    ["Race", (c) => c.raceLabel],
    ["Age", (_c, d) => (d ? (d.age ? `${d.age}` : "Not stated") : detailsError ? "Could not load" : "Loading…")],
    ["Gender", (_c, d) => (d ? (d.gender ?? "Not stated") : detailsError ? "Could not load" : "Loading…")],
    [
      "Highest qualification",
      (_c, d) => (d ? (d.level ? levelLabels[d.level] : "None listed") : detailsError ? "Could not load" : "Loading…"),
    ],
    [
      "As written by INEC",
      (_c, d) => (
        <span className="text-muted">
          {d ? (d.qualifications ?? "Nothing listed") : detailsError ? "Could not load" : "Loading…"}
        </span>
      ),
    ],
    ["Running mate", (_c, d) => (d ? (d.mate ?? "None for this seat") : detailsError ? "Could not load" : "Loading…")],
  ];

  return (
    <>
      <div
        className="no-print sticky bottom-0 z-20 mt-10 border-t border-rule bg-sheet/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div
          className="shell flex flex-wrap items-center justify-between gap-3 py-3"
          style={{
            paddingLeft: "max(16px, env(safe-area-inset-left, 0px))",
            paddingRight: "max(16px, env(safe-area-inset-right, 0px))",
          }}
        >
          <a href="#my-ballot" className="flex min-h-10 items-center gap-2 text-sm">
            <Thumbprint className={`h-7 w-7 ${marked ? "text-violet" : "text-muted"}`} />
            <span>
              <strong className="tabular">{marked}</strong> of <span className="tabular">{races.length}</span> races
              marked
            </span>
          </a>
          {cmp.length > 0 ? (
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearCompare} className="h-10 px-3 text-sm text-muted hover:text-ink">
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("policies");
                  setOpen(true);
                }}
                disabled={cmp.length < 2}
                className="h-10 rounded-md bg-green px-4 text-sm font-semibold text-green-ink disabled:opacity-50"
              >
                {cmp.length < 2 ? "Pick one more to compare" : `Compare ${cmp.length} side by side`}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className={`text-sm text-muted ${races.length > 1 ? "hidden md:inline" : ""}`}>
                Tick “Compare” on up to 3 candidates
              </span>
              {races.length < 2 ? null : marked < races.length ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="h-10 rounded-md border-2 border-green px-3 text-sm font-semibold text-green hover:bg-green-soft"
                >
                  {marked ? "Next unmarked race" : "Start marking"} <span aria-hidden>↓</span>
                </button>
              ) : (
                <a
                  href="#my-ballot"
                  className="inline-flex h-10 items-center rounded-md bg-violet px-3 text-sm font-semibold text-white"
                >
                  See my ballot
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(960px,calc(100vw-24px))] max-h-[88dvh] rounded-lg border border-rule bg-sheet p-0 text-ink backdrop:bg-black/50"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 className="display-tight text-xl">Side by side</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-10 rounded-md px-3 text-sm font-medium hover:bg-green-soft"
          >
            Close
          </button>
        </div>

        <div role="tablist" aria-label="Comparison view" className="flex gap-1 border-b border-rule px-4 py-2">
          <button
            type="button"
            role="tab"
            id="compare-tab-policies"
            aria-selected={tab === "policies"}
            aria-controls="compare-panel-policies"
            onClick={() => setTab("policies")}
            className={`h-9 rounded-full px-3 text-sm font-medium ${tab === "policies" ? "bg-ink text-paper" : "text-muted hover:bg-green-soft"}`}
          >
            Policies
          </button>
          <button
            type="button"
            role="tab"
            id="compare-tab-facts"
            aria-selected={tab === "facts"}
            aria-controls="compare-panel-facts"
            onClick={() => setTab("facts")}
            className={`h-9 rounded-full px-3 text-sm font-medium ${tab === "facts" ? "bg-ink text-paper" : "text-muted hover:bg-green-soft"}`}
          >
            Facts
          </button>
        </div>

        {tab === "policies" ? (
          <div
            id="compare-panel-policies"
            role="tabpanel"
            aria-labelledby="compare-tab-policies"
            className="max-h-[68dvh] overflow-auto"
          >
            <div className="grid gap-2 border-b border-rule px-4 py-3 sm:grid-cols-2 lg:grid-cols-3">
              {cmp.map((c) => {
                const policy = details[c.id]?.policy;
                return (
                  <div key={c.id} className="text-sm">
                    <p className="font-semibold">{c.name}</p>
                    {policy ? (
                      <>
                        <p className="text-xs text-muted">
                          {policy.kind === "manifesto"
                            ? policy.pledges.length
                              ? "Published manifesto."
                              : "Manifesto published, but no specific pledges extracted yet."
                            : policy.kind === "pledges"
                              ? policy.pledges.length
                                ? "Reported pledges, no full manifesto."
                                : "No manifesto or pledges extracted yet."
                              : policy.kind === "party"
                                ? policy.pledges.length
                                  ? "No personal manifesto. Party platform shown."
                                  : "No personal manifesto. Party platform has no extracted pledges."
                                : "No manifesto or pledges yet."}
                        </p>
                        {policy.title && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{policy.title}</p>}
                        {policy.kind !== "none" && policy.note && policy.noteSource && (
                          <p className="mt-1 text-xs text-muted">
                            {policy.note}{" "}
                            <a className="underline" href={policy.noteSource.url} target="_blank" rel="noreferrer">
                              {policy.noteSource.label}
                            </a>
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-muted">
                        {detailsError ? "Could not load policy." : "Loading policy…"}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {detailsLoading && cmp.some((c) => !details[c.id]) ? (
              <div className="px-4 py-6 text-sm text-muted">Loading policies…</div>
            ) : detailsError && cmp.some((c) => !details[c.id]) ? (
              <div className="px-4 py-6 text-sm text-muted">Could not load policies. Close and try again.</div>
            ) : topics.length === 0 ? (
              <div className="px-4 py-6 text-sm text-muted">
                No specific pledges have been extracted for these candidates yet. Check each status above, then ask the
                campaigns for the full documents.
                <ul className="mt-2 space-y-1">
                  {cmp.map((c) => (
                    <li key={c.id}>
                      <a className="underline" href={manifestoUrl(c.name, `/candidate/${c.id}`)}>
                        Ask {c.name} for their manifesto
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              topics.map((topic) => (
                <section key={topic} className="border-b border-rule px-4 py-4 last:border-0">
                  <h3 className="label text-[0.65rem] text-muted">{topic}</h3>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {cmp.map((c) => {
                      const policy = details[c.id]?.policy;
                      const pledge = policy?.pledges.find((p) => p.topic === topic);
                      return (
                        <div key={c.id} className="rounded-md border border-rule bg-paper p-3">
                          <p className="text-sm font-semibold">{c.name}</p>
                          {!policy ? (
                            <p className="mt-1 text-sm text-muted">
                              {detailsError ? "Could not load policy." : "Loading policy…"}
                            </p>
                          ) : pledge ? (
                            <>
                              <p className="mt-1 text-sm">{pledge.text}</p>
                              <p className="mt-1 text-xs text-muted">
                                {policy.kind === "party"
                                  ? "Party platform"
                                  : policy.kind === "pledges"
                                    ? "Reported pledge"
                                    : "Manifesto"}
                                {pledge.source && (
                                  <>
                                    {" · "}
                                    <a className="underline" href={pledge.source.url} target="_blank" rel="noreferrer">
                                      {pledge.source.label}
                                    </a>
                                  </>
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-muted">
                              {policy.kind === "none"
                                ? "No manifesto or party platform yet."
                                : policy.pledges.length === 0
                                  ? "No specific pledges extracted yet."
                                  : "No published position on this topic yet."}
                            </p>
                          )}
                          {policy && !pledge && (
                            <a
                              className="mt-2 inline-block text-xs underline"
                              href={manifestoUrl(c.name, `/candidate/${c.id}`)}
                              aria-label={`Ask ${c.name} for their manifesto`}
                            >
                              Ask the campaign
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            )}
            <p className="px-4 py-3 text-xs text-muted">
              Pledges are paraphrased neutrally from the linked sources. “Party platform” means no personal manifesto
              was found.
            </p>
          </div>
        ) : (
          <div
            id="compare-panel-facts"
            role="tabpanel"
            aria-labelledby="compare-tab-facts"
            className="max-h-[68dvh] overflow-auto"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ minWidth: 96 + cmp.length * 128 }}>
                <thead>
                  <tr className="border-b border-rule align-top">
                    <th className="w-24 px-4 py-4 sm:w-40 sm:px-5" />
                    {cmp.map((c) => (
                      <th key={c.id} className="px-3 py-4 font-normal sm:px-4">
                        <div className="flex items-end gap-2">
                          {c.photo && (
                            <img
                              src={c.photo}
                              alt=""
                              width={52}
                              height={64}
                              className="h-16 w-[3.25rem] rounded-sm object-cover"
                            />
                          )}
                          <PartyMark code={c.party} logo={c.logo} name={c.partyName} />
                        </div>
                        <Link
                          prefetch={false}
                          href={`/candidate/${c.id}`}
                          className="mt-2 block text-base font-semibold hover:underline"
                        >
                          {c.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggleCompare(c.id)}
                          className="mt-1 text-xs text-muted underline"
                        >
                          Remove
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, f]) => (
                    <tr key={label} className="border-b border-rule align-top last:border-0">
                      <th scope="row" className="label px-4 py-3 text-[0.65rem] text-muted sm:px-5">
                        {label}
                      </th>
                      {cmp.map((c) => (
                        <td key={c.id} className="break-words px-3 py-3 sm:px-4">
                          {f(c, details[c.id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-rule px-5 py-3 text-xs text-muted">
              Everything here is from INEC&apos;s published lists. &ldquo;Highest qualification&rdquo; is our reading of
              INEC&apos;s text.
            </p>
          </div>
        )}
      </dialog>
    </>
  );
}
