"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type WardOpt = { code: string; name: string; federal: string[] };

/**
 * Reads ?ward=, ?pu= and ?fed= from the URL. Shows the voter's ward/polling unit and, where an LGA is split
 * between federal constituencies, hides the constituency that isn't theirs.
 */
export default function WardContext({ stateCode, lgaCode, wards, split }: { stateCode: string; lgaCode: string; wards: WardOpt[]; split: boolean }) {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const wardCode = params.get("ward");
  const pu = params.get("pu");
  const ward = wards.find((w) => w.code === wardCode);
  const fed = params.get("fed") ?? (ward && ward.federal.length === 1 ? ward.federal[0] : null);
  const [puName, setPuName] = useState<string | null>(null);

  useEffect(() => {
    setPuName(null);
    if (!pu) return;
    const [s, l, w, p] = pu.split("/");
    if (s !== stateCode || l !== lgaCode) return;
    fetch(`/data/pu/${s}.json`)
      .then((r) => r.json())
      .then((m: Record<string, string[]>) => setPuName(m[`${l}/${w}/${p}`]?.[0] ?? null))
      .catch(() => {});
  }, [pu, stateCode, lgaCode]);

  function pick(code: string) {
    const q = new URLSearchParams();
    if (code) q.set("ward", code);
    router.replace(q.size ? `${path}?${q}` : path, { scroll: false });
  }

  return (
    <div className="sheet grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start">
      <div>
      {fed && split && <style>{`[data-fed]:not([data-fed="${CSS.escape(fed)}"]){display:none}`}</style>}
      <label htmlFor="ward" className="text-sm font-semibold">
        Your ward {split ? <span className="text-amber-ink">(needed for this LGA)</span> : <span className="text-muted font-normal">(optional)</span>}
      </label>
      <select
        id="ward"
        value={ward?.code ?? ""}
        onChange={(e) => pick(e.target.value)}
        className="mt-2 block h-12 w-full rounded-md border-2 border-ink bg-sheet px-3"
      >
        <option value="">Choose your ward…</option>
        {wards.map((w) => (
          <option key={w.code} value={w.code}>
            {w.name}
          </option>
        ))}
      </select>
      </div>
      <div className="text-sm">
        {pu ? (
          <div className="rounded-md border-2 border-dashed border-violet bg-violet-soft px-3 py-2">
            <p className="label text-[0.65rem] text-violet">Your polling unit</p>
            <p className="mono text-base font-medium">{pu}</p>
            {puName && <p className="capitalize text-muted">{puName.toLowerCase()}</p>}
          </div>
        ) : split && !fed ? (
          <p className="rounded-md bg-amber-soft px-3 py-2 text-amber-ink">Parts of this LGA vote in different federal constituencies. Until you choose a ward we show both.</p>
        ) : ward ? (
          <p className="text-muted">Showing the ballot for <strong className="text-ink">{ward.name}</strong> ward.</p>
        ) : (
          <p className="text-muted">Tip: entering the full polling unit code from your card on the home page fills this in for you.</p>
        )}
      </div>
    </div>
  );
}
