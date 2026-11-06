"use client";
import { useState } from "react";
import { Segmented } from "./controls";

const LEVELS = [
  ["", "Any schooling"],
  ["diploma+", "Diploma+"],
  ["degree+", "Degree+"],
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
  return (
    <div className="flex flex-wrap gap-2">
      {hide.length > 0 && <style>{`${hide.join(",")}{display:none}`}</style>}
      <Segmented label="Gender" value={gender} onChange={setGender} options={[{ value: "", label: "Anyone" }, { value: "Female", label: "Women" }, { value: "Male", label: "Men" }]} />
      <Segmented label="Qualification" value={level} onChange={setLevel} options={LEVELS.map(([value, label]) => ({ value, label }))} />
    </div>
  );
}
