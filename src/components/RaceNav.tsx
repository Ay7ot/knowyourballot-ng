"use client";

import { useEffect, useRef, useState } from "react";
import { useBallotState, Thumbprint } from "./picks";

export type NavRace = { id: string; short: string; fed?: string };

/**
 * Phones and tablets: a sticky strip of the races on this ballot, under the site header.
 * Shows where you are on a long page and which races you've marked; tap to jump.
 */
export default function RaceNav({ races }: { races: NavRace[] }) {
  const { picks } = useBallotState();
  const [active, setActive] = useState<string | null>(null);
  const strip = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const els = races.map((r) => document.getElementById(r.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const seen = new Map<string, boolean>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.isIntersecting);
        const first = els.find((el) => seen.get(el.id));
        if (first) setActive(first.id);
      },
      // A band across the upper part of the screen, below the sticky bars.
      { rootMargin: "-120px 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [races]);

  // Keep the active chip in view inside the strip without moving the page.
  useEffect(() => {
    const ol = strip.current;
    const chip = active ? ol?.querySelector<HTMLElement>(`[data-chip="${CSS.escape(active)}"]`) : null;
    if (!ol || !chip) return;
    const left = chip.offsetLeft - ol.clientWidth / 2 + chip.offsetWidth / 2;
    ol.scrollTo({ left, behavior: "smooth" });
  }, [active]);

  return (
    <nav aria-label="Races on this ballot" className="no-print sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-30 border-b border-rule bg-paper sm:top-[calc(4rem+env(safe-area-inset-top,0px))] lg:hidden">
      <ol ref={strip} className="mx-auto flex max-w-5xl gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {races.map((r) => {
          const on = active === r.id;
          const marked = !!picks[r.id];
          return (
            <li key={r.id} data-fed={r.fed} data-chip={r.id} className="shrink-0">
              <a
                href={`#${r.id}`}
                aria-current={on ? "location" : undefined}
                className={`flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-sm font-medium transition-colors ${
                  on ? "border-ink bg-ink text-paper" : "border-rule bg-sheet text-ink hover:border-green"
                }`}
              >
                <Thumbprint className={`h-4 w-4 ${marked ? (on ? "text-violet-soft" : "text-violet") : "opacity-40"}`} />
                {r.short}
                {marked && <span className="sr-only"> (marked)</span>}
              </a>
            </li>
          );
        })}
        <li className="shrink-0">
          <a href="#my-ballot" className="flex h-9 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium text-violet underline-offset-2 hover:underline">
            My ballot
          </a>
        </li>
      </ol>
    </nav>
  );
}
