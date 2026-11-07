"use client";
import { useEffect, useState } from "react";

const daysUntil = (iso: string) => Math.ceil((new Date(`${iso}T08:00:00+01:00`).getTime() - Date.now()) / 86_400_000);

export default function Countdown({ date }: { date: string }) {
  const [d, setD] = useState<number | null>(null);
  useEffect(() => setD(daysUntil(date)), [date]);
  // Reserve the width of the final text so nothing shifts when it fills in.
  if (d === null) return <span className="tabular invisible">00 days to go</span>;
  if (d < 0) return <span>Held</span>;
  if (d === 0) return <span>Today</span>;
  return (
    <span className="tabular">
      {d} {d === 1 ? "day" : "days"} to go
    </span>
  );
}
