"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { GLOSSARY } from "@/lib/civics";

/**
 * An election word with a tap-to-open definition. Works with touch, mouse and keyboard;
 * closes on Escape, outside tap, or tapping the word again.
 */
export default function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const t = GLOSSARY.find((g) => g.id === id);
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);

  // Keep the card on screen: nudge it left if it would run off the right edge.
  useLayoutEffect(() => {
    const el = tip.current;
    if (!open || !el) return;
    el.style.transform = "";
    const r = el.getBoundingClientRect();
    const over = r.right - (window.innerWidth - 12);
    const under = 12 - r.left;
    if (over > 0) el.style.transform = `translateX(${-Math.min(over, r.left - 12)}px)`;
    else if (under > 0) el.style.transform = `translateX(${under}px)`;
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  if (!t) return <>{children}</>;
  return (
    <span ref={wrap} className="relative inline">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={tipId}
        onClick={() => setOpen((o) => !o)}
        className="cursor-help underline decoration-dotted decoration-2 underline-offset-[3px] hover:text-ink"
      >
        {children ?? t.term}
      </button>
      {open && (
        <span
          id={tipId}
          ref={tip}
          role="note"
          className="absolute left-0 top-full z-30 mt-2 block w-[min(18rem,80vw)] rounded-md border border-rule bg-sheet p-3 text-left text-sm font-normal normal-case tracking-normal text-ink shadow-xl"
        >
          <strong className="block font-semibold">{t.term}</strong>
          {t.short}
          <a href={`/who-decides#${t.id}`} className="mt-1 block text-green underline">
            All election words
          </a>
        </span>
      )}
    </span>
  );
}
