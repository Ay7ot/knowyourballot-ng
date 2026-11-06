"use client";
import { useState } from "react";

const LEVELS = [
  ["", "Any qualification"],
  ["degree+", "Degree or higher"],
  ["diploma+", "Diploma or higher"],
] as const;
const ORDER = ["primary", "secondary", "other", "diploma", "degree", "postgraduate", "doctorate"];

/** Narrows a race's rows without re-rendering them: writes a scoped style rule. */
export default function RaceFilter({ scope }: { scope: string }) {
  const [gender, setGender] = useState("");
  const [level, setLevel] = useState("");
  const hide: string[] = [];
  if (gender) hide.push(`[data-scope="${scope}"] [data-row]:not([data-gender="${gender}"])`);
  if (level) {
    const min = ORDER.indexOf(level === "degree+" ? "degree" : "diploma");
    const keep = ORDER.slice(min);
    hide.push(`[data-scope="${scope}"] [data-row]${keep.map((k) => `:not([data-level="${k}"])`).join("")}`);
  }
  const sel = "h-9 rounded-md border border-rule bg-sheet px-2 text-sm";
  return (
    <div className="flex flex-wrap gap-2">
      {hide.length > 0 && <style>{`${hide.join(",")}{display:none}`}</style>}
      <label className="sr-only" htmlFor={`${scope}-g`}>Gender</label>
      <select id={`${scope}-g`} value={gender} onChange={(e) => setGender(e.target.value)} className={sel}>
        <option value="">Anyone</option>
        <option value="Female">Women</option>
        <option value="Male">Men</option>
      </select>
      <label className="sr-only" htmlFor={`${scope}-l`}>Qualification</label>
      <select id={`${scope}-l`} value={level} onChange={(e) => setLevel(e.target.value)} className={sel}>
        {LEVELS.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}
