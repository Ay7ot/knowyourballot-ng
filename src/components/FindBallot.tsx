"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type Fuse from "fuse.js";
import type { SearchEntry } from "@/lib/types";
import type { QuickEntry } from "@/lib/data";

type LgaPoint = { id: string; n: string; s: string; h: string; lat: number | null; lon: number | null };

const TYPE_LABEL: Record<SearchEntry["t"], string> = {
  s: "State",
  l: "LGA",
  w: "Ward",
  d: "Senate",
  f: "Reps",
  a: "Assembly",
  c: "Candidate",
};
const PU_RE = /^\s*(\d{1,2})\s*[\/\-. ]\s*(\d{1,2})\s*[\/\-. ]\s*(\d{1,2})\s*[\/\-. ]\s*(\d{1,3})\s*$/;

type Index = { fuse: Fuse<SearchEntry>; data: SearchEntry[]; folded: string[] };
const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ");
let indexPromise: Promise<Index> | null = null;
function loadIndex() {
  indexPromise ??= Promise.all([fetch("/search-index.json").then((r) => r.json()), import("fuse.js")]).then(([data, mod]) => ({
    data: data as SearchEntry[],
    folded: (data as SearchEntry[]).map((e) => ` ${fold(e.n)} `),
    fuse: new mod.default<SearchEntry>(data as SearchEntry[], {
        keys: [
          { name: "n", weight: 3 },
          { name: "x", weight: 1 },
        ],
        threshold: 0.32,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
  }));
  return indexPromise;
}
// Words that carry no meaning for matching ("who is running for president" -> "running president").
const STOP = new Set("a an and are be can do does for from how i in is it me my of on or the to what which who will with nigeria nigerian 2027 about tell show find see party parties".split(" "));
type Row = { n: string; x: string; h: string; label: string };
function matchQuick(quick: QuickEntry[], q: string): Row[] {
  const words = fold(q).split(" ").filter((w) => w.length > 1 && !STOP.has(w));
  if (!words.length) return [];
  const scored = quick.map((e) => {
    const name = fold(e.n).split(" ");
    const keys = fold(`${e.n} ${e.k}`).split(" ");
    let score = 0;
    for (const w of words) {
      const hit = (k: string) => (w.length < 3 ? k === w : k.startsWith(w) || (k.length >= 4 && w.startsWith(k)));
      if (name.some(hit)) score += 2;
      else if (keys.some(hit)) score += 1;
    }
    return { e, score: score / words.length };
  });
  return scored
    .filter((r) => r.score >= 0.5)
    .sort((a, b) => b.score - a.score)
    .map(({ e }) => ({ n: e.n, x: e.x, h: e.h, label: e.g }));
}

let pointsPromise: Promise<LgaPoint[]> | null = null;
const loadPoints = (): Promise<LgaPoint[]> => (pointsPromise ??= fetch("/lga-points.json").then((r) => r.json() as Promise<LgaPoint[]>));

export default function FindBallot({ autoFocus = false, quick = [] }: { autoFocus?: boolean; quick?: QuickEntry[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [fuse, setFuse] = useState<Index | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [near, setNear] = useState<LgaPoint[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Autofocus shouldn't pull the (large) search index before the voter shows intent.
  const autoFocused = useRef(false);

  const warm = useCallback(() => {
    if (fuse || loading) return;
    setLoading(true);
    loadIndex()
      .then(setFuse)
      .catch(() => setMsg("Search couldn't load. Check your connection and try again."))
      .finally(() => setLoading(false));
  }, [fuse, loading]);

  useEffect(() => {
    if (autoFocus && window.matchMedia("(min-width: 768px)").matches) {
      autoFocused.current = true;
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const pu = PU_RE.exec(q);
  const answers = useMemo(() => (q.trim().length < 2 || pu ? [] : matchQuick(quick, q)), [quick, q, pu]);
  const found = useMemo(() => {
    if (!fuse || q.trim().length < 2 || pu) return [];
    const order: Record<SearchEntry["t"], number> = { l: 0, s: 1, w: 2, c: 3, f: 4, d: 5, a: 6 };
    // Every typed word appears in the name, in any order ("peter obi" finds "OBI PETER GREGORY").
    const words = fold(q).split(" ").filter(Boolean);
    const exact: SearchEntry[] = [];
    for (let i = 0; i < fuse.data.length && exact.length < 40; i++) {
      const f = fuse.folded[i];
      if (words.every((w) => f.includes(` ${w}`))) exact.push(fuse.data[i]);
    }
    exact.sort((a, b) => order[a.t] - order[b.t] || a.n.length - b.n.length);
    const fuzzy = fuse.fuse
      .search(q.trim(), { limit: 30 })
      .sort((a, b) => (a.score! - b.score!) * 4 + (order[a.item.t] - order[b.item.t]) * 0.02)
      .map((r) => r.item);
    const seen = new Set<string>();
    return [...exact, ...fuzzy].filter((e) => !seen.has(e.h) && seen.add(e.h)).slice(0, 8);
  }, [fuse, q, pu]);
  // Tell us (words only) when a finished search finds nothing, once per query.
  const reported = useRef(new Set<string>());
  useEffect(() => {
    const term = q.trim().toLowerCase();
    if (!fuse || pu || term.length < 3 || answers.length || found.length || reported.current.has(term) || reported.current.size >= 20) return;
    const t = setTimeout(() => {
      reported.current.add(term);
      const body = JSON.stringify({ q: term });
      try {
        if (!navigator.sendBeacon?.("/api/search-miss", new Blob([body], { type: "application/json" })))
          fetch("/api/search-miss", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
      } catch {}
    }, 1500);
    return () => clearTimeout(t);
  }, [q, fuse, pu, answers.length, found.length]);

  const results: Row[] = useMemo(() => {
    const places = found.map((e) => ({ n: e.n, x: e.x, h: e.h, label: TYPE_LABEL[e.t] }));
    const top = answers.slice(0, places.length ? 3 : 6);
    return [...top, ...places].slice(0, 9);
  }, [answers, found]);

  async function lookupPu(m: RegExpExecArray) {
    const [s, l, w, p] = m.slice(1).map((x, i) => x.padStart(i === 3 ? 3 : 2, "0"));
    setMsg("Looking up your polling unit…");
    try {
      const [units, points] = await Promise.all([
        fetch(`/data/pu/${s}.json`).then((r) => (r.ok ? r.json() : Promise.reject())),
        loadPoints(),
      ]);
      const unit = (units as Record<string, string[]>)[`${l}/${w}/${p}`];
      const lga = points.find((x) => x.id === `${s}-${l}`);
      if (!lga) throw new Error();
      const params = new URLSearchParams({ ward: w });
      if (unit) params.set("pu", `${s}/${l}/${w}/${p}`);
      if (unit?.[1]) params.set("fed", unit[1]);
      router.push(`${lga.h}?${params}`);
      setMsg(unit ? null : "We couldn't find that exact polling unit, so we've opened your ward instead.");
    } catch {
      setMsg("That code doesn't match a polling unit. It's printed on your voter's card as four numbers, like 24/14/05/012.");
    }
  }

  function locate() {
    if (!navigator.geolocation) return setMsg("Your browser can't share your location. Search for your LGA instead.");
    setLocating(true);
    setMsg(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const pts = (await loadPoints()).filter((p) => p.lat != null);
        const { latitude: a, longitude: b } = pos.coords;
        const d = (p: LgaPoint) => (p.lat! - a) ** 2 + ((p.lon! - b) * Math.cos((a * Math.PI) / 180)) ** 2;
        setNear(pts.sort((x, y) => d(x) - d(y)).slice(0, 4));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setMsg("We couldn't get your location. Search for your LGA or ward instead.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  }

  function go(e: Row) {
    setOpen(false);
    router.push(e.h);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (pu) lookupPu(pu);
      else if (results[active]) go(results[active]);
    } else if (e.key === "Escape") setOpen(false);
  }

  const showList = open && q.trim().length >= 2;

  return (
    <div className="w-full">
      <div className="relative">
        <label htmlFor="find" className="label mb-2 block text-ink">
          Find your ballot
        </label>
        <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-4 bottom-[18px] h-5 w-5 text-muted">
          <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
        </svg>
        <input
          id="find"
          ref={inputRef}
          type="search"
          inputMode="search"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls="find-list"
          aria-activedescendant={showList && results[active] ? `opt-${active}` : undefined}
          placeholder="Your LGA, a name, a party or a question"
          className="w-full h-14 rounded-md border-2 border-ink bg-sheet pl-12 pr-4 text-[1.05rem] outline-none placeholder:text-muted focus:border-green focus:ring-4 focus:ring-green/20"
          value={q}
          onFocus={() => {
            if (autoFocused.current) autoFocused.current = false;
            else warm();
            setOpen(true);
          }}
          onPointerDown={warm}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
            setMsg(null);
            warm();
          }}
          onKeyDown={onKey}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {showList && (
          <ul id="find-list" role="listbox" className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-rule bg-sheet shadow-xl">
            {pu ? (
              <li>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => lookupPu(pu)} className="w-full text-left px-4 py-3 bg-green-soft">
                  <div className="font-medium">Find polling unit {pu.slice(1).join("/")}</div>
                  <div className="text-sm text-muted">Open the ballot for this polling unit</div>
                </button>
              </li>
            ) : results.length === 0 && loading && !fuse ? (
              <li className="px-4 py-3 text-sm text-muted">Loading places and candidates…</li>
            ) : results.length === 0 ? (
              <li className="px-4 py-3 text-sm text-muted">
                Nothing matched &ldquo;{q.trim()}&rdquo;. Try your LGA or ward (like <em>Ikeja</em>), a candidate&apos;s name, a party (like <em>APC</em>), an office (like <em>Senate</em>), or a question like <em>when is the election</em>.
              </li>
            ) : (
              results.map((r, i) => (
                <li key={r.h + i} id={`opt-${i}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${i === active ? "bg-green-soft" : ""}`}
                  >
                    <span className="label w-16 shrink-0 text-[0.62rem] text-muted sm:w-20">{r.label}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.n}</span>
                      <span className="line-clamp-2 block text-sm text-muted">{r.x}</span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {quick.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Try</span>
          {["When is the election?", "Presidential", "APC", "Fuel and power"].map((ex) => (
            <button
              key={ex}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQ(ex);
                setActive(0);
                setOpen(true);
                warm();
                inputRef.current?.focus();
              }}
              className="min-h-9 rounded-full border border-rule bg-sheet px-3 font-medium hover:border-green hover:bg-green-soft"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <button type="button" onClick={locate} className="inline-flex items-center gap-1.5 font-medium text-green hover:underline disabled:opacity-60" disabled={locating}>
          <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="none" stroke="currentColor" strokeWidth="2" d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z M12 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          </svg>
          {locating ? "Finding you…" : "Use my location"}
        </button>
        <span className="text-muted">
          Have your voter&apos;s card? Its code, like <span className="mono">24/14/05/012</span>, finds your exact ballot.
        </span>
      </div>

      {msg && <p role="status" className="mt-3 text-sm rounded-md bg-amber-soft text-amber-ink px-3 py-2">{msg}</p>}

      {near && (
        <div className="mt-4 rounded-lg border border-rule bg-sheet p-4">
          <p className="text-sm text-muted">
            Your location is closest to these LGAs. Pick the one you <strong>registered to vote in</strong>, which may not be where you are now.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {near.map((p) => (
              <button key={p.id} type="button" onClick={() => router.push(p.h)} className="rounded-md border border-rule bg-sheet px-3 py-1.5 text-sm hover:border-green hover:bg-green-soft">
                {p.n}, <span className="text-muted">{p.s}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
