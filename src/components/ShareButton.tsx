"use client";
import { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
  const [done, setDone] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, text: "See who's on your 2027 ballot", url });
      else {
        await navigator.clipboard.writeText(url);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }
    } catch {}
  }
  return (
    <button type="button" onClick={share} className="inline-flex items-center gap-2 h-11 rounded-md border-2 border-ink bg-sheet px-4 text-sm font-semibold hover:bg-green-soft">
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4"><path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>
      {done ? "Link copied" : "Share"}
    </button>
  );
}
