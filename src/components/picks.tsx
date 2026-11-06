"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * The voter's own marks, kept only in this browser. A pick is one candidate per race;
 * compare is a short list of candidates to see side by side.
 */
type State = { picks: Record<string, string>; compare: string[] };
const KEY = "kyb:picks:v1";
let state: State = { picks: {}, compare: [] };
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...state, picks: JSON.parse(raw).picks ?? {} };
  } catch {}
}
function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ picks: state.picks }));
  } catch {}
}
function set(next: State) {
  state = next;
  save();
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  load();
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      loaded = false;
      load();
      listeners.forEach((x) => x());
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}
const EMPTY: State = { picks: {}, compare: [] };

export function useBallotState() {
  const s = useSyncExternalStore(subscribe, () => (load(), state), () => EMPTY);
  return {
    ...s,
    togglePick(race: string, cand: string) {
      const picks = { ...state.picks };
      if (picks[race] === cand) delete picks[race];
      else picks[race] = cand;
      set({ ...state, picks });
    },
    toggleCompare(cand: string) {
      const has = state.compare.includes(cand);
      const compare = has ? state.compare.filter((c) => c !== cand) : [...state.compare, cand].slice(-3);
      set({ ...state, compare });
    },
    clearCompare() {
      set({ ...state, compare: [] });
    },
  };
}

/** Thumbprint mark, drawn as concentric ridges. */
export function Thumbprint({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M20 4c-8.8 0-16 7.4-16 17v8c0 8 7 15 16 15s16-7 16-15v-8C36 11.4 28.8 4 20 4Z" opacity=".35" />
        <path d="M20 10c-6 0-11 5-11 11.5v6.5c0 6 5 11 11 11" />
        <path d="M20 16c-3 0-6 2.6-6 6v6c0 3.5 2.6 6 6 6s6-2.6 6-6" />
        <path d="M20 22v6" />
        <path d="M31 21.5c0-6.5-5-11.5-11-11.5" />
        <path d="M31 25v3c0 3.5-1.6 6.6-4 8.6" />
        <path d="M26 22c0-3.3-2.7-6-6-6" />
      </g>
    </svg>
  );
}

export function PickButton({ race, cand, name }: { race: string; cand: string; name: string }) {
  const { picks, togglePick } = useBallotState();
  const on = picks[race] === cand;
  return (
    <button
      type="button"
      onClick={() => togglePick(race, cand)}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} as your pick` : `Mark ${name} as your pick`}
      title={on ? "Your pick. Tap to remove." : "Mark as your pick (saved only on this device)"}
      className={`grid h-12 w-12 place-items-center rounded-md transition-colors ${on ? "text-violet bg-violet-soft" : "text-muted/45 hover:text-violet/70 hover:bg-violet-soft/60"}`}
    >
      <Thumbprint className={`h-9 w-9 ${on ? "ink-in" : ""}`} />
    </button>
  );
}

export function CompareToggle({ cand }: { cand: string }) {
  const { compare, toggleCompare } = useBallotState();
  const on = compare.includes(cand);
  return (
    <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted select-none">
      <input type="checkbox" checked={on} onChange={() => toggleCompare(cand)} className="h-4 w-4 accent-[var(--green)]" />
      Compare
    </label>
  );
}

/** Keeps compare scoped to the page it was started on. */
export function ResetCompareOnMount() {
  const { clearCompare } = useBallotState();
  useEffect(() => {
    clearCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
