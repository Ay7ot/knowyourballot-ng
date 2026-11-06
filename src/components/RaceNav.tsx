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
    // The active race is the last one whose top has scrolled up past the sticky bars.
    let raf = 0;
    const update = () => {
      raf = 0;
      let cur: string | null = null;
      for (const r of races) {
        const el = document.getElementById(r.id);
        if (!el || el.offsetParent === null) continue;
        if (el.getBoundingClientRect().top <= 160) cur = r.id;
      }
      setActive(cur);
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
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
