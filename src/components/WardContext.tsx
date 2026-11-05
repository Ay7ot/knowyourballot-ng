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
    <div className="rounded-2xl border border-line bg-surface p-4">
      {fed && split && <style>{`[data-fed]:not([data-fed="${CSS.escape(fed)}"]){display:none}`}</style>}
      <label htmlFor="ward" className="text-sm font-medium">
        Your ward {split ? <span className="text-warn-ink">(needed for this LGA)</span> : <span className="text-muted font-normal">(optional)</span>}
      </label>
      <select
        id="ward"
        value={ward?.code ?? ""}
        onChange={(e) => pick(e.target.value)}
        className="mt-2 block w-full h-11 rounded-xl border border-line bg-bg px-3"
      >
        <option value="">Choose your ward…</option>
        {wards.map((w) => (
          <option key={w.code} value={w.code}>
            {w.name}
          </option>
        ))}
      </select>
      {pu && (
        <p className="mt-3 text-sm">
          <span className="text-muted">Polling unit</span> <span className="tabular font-medium">{pu}</span>
          {puName && <span className="block text-muted capitalize">{puName}</span>}
        </p>
      )}
      {split && !fed && (
        <p className="mt-3 text-sm text-warn-ink">Parts of this LGA vote in different federal constituencies. Choose your ward to see the right one.</p>
      )}
    </div>
  );
}
