"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MapPoint, MapStatePath } from "@/lib/types";

type Props = {
  paths: MapStatePath[];
  points?: MapPoint[];
  viewBox: string;
  title: string;
  description: string;
  /** Highlight one point, for example the LGA a voter is looking at. */
  selected?: string;
  compact?: boolean;
};

export default function GeoMap({ paths, points = [], viewBox, title, description, selected, compact = false }: Props) {
  const router = useRouter();
  const [active, setActive] = useState<string | null>(selected ?? null);
  const activePoint = points.find((p) => p.id === active);
  const activePath = paths.find((p) => p.slug === active);
  const activeLabel = activePoint
    ? `${activePoint.label}${activePoint.count ? ` · ${activePoint.count} wards` : ""}`
    : activePath
      ? `${activePath.name}${activePath.count ? ` · ${activePath.count} LGAs` : ""}`
      : null;

  const [, , viewWidth, viewHeight] = viewBox.split(" ").map(Number);
  const scale = Math.max(viewWidth, viewHeight) / 100;
  const dotRadius = (compact ? 1.35 : 1.05) * scale;
  const dotActive = 1.75 * scale;
  const hitRadius = 2.6 * scale;
  const haloRadius = 3 * scale;

  const reset = () => setActive(selected ?? null);
  const go = (href: string) => router.push(href);
  const onKey = (event: React.KeyboardEvent, href: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      go(href);
    }
  };

  return (
    <figure className="sheet relative overflow-hidden p-4 sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <figcaption className="min-w-0">
          <p className="label text-green">{title}</p>
          <p className="mt-1 max-w-[38ch] text-sm text-muted">{description}</p>
        </figcaption>
        <p className="mono shrink-0 text-xs text-muted">
          {points.length ? `${points.length} LGAs` : `${paths.length} states`}
        </p>
      </div>

      <div className={`relative mt-3 w-full ${compact ? "aspect-[16/9]" : "aspect-[5/4]"}`}>
        <svg
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={`${title}. ${description}`}
          className="h-full w-full overflow-visible"
        >
          {paths.map((p) => {
            const on = active === p.slug || selected === p.slug;
            const shape = (
              <path
                key={p.slug}
                d={p.d}
                fill={on ? "var(--green)" : "var(--green-soft)"}
                fillOpacity={on ? 0.5 : 0.7}
                stroke={on ? "var(--green)" : "var(--rule)"}
                strokeWidth={(on ? 0.5 : 0.25) * scale}
                fillRule="evenodd"
                className="motion-safe:transition-[fill,fill-opacity] motion-safe:duration-150"
              />
            );
            return p.href ? (
              <g
                key={p.slug}
                role="link"
                tabIndex={0}
                aria-label={`${p.name}${p.count ? `, ${p.count} LGAs` : ""}`}
                onMouseEnter={() => setActive(p.slug)}
                onMouseLeave={reset}
                onFocus={() => setActive(p.slug)}
                onBlur={reset}
                onClick={() => go(p.href!)}
                onKeyDown={(event) => onKey(event, p.href!)}
                className="cursor-pointer outline-none"
              >
                {shape}
              </g>
            ) : (
              <g key={p.slug}>{shape}</g>
            );
          })}

          {points.map((p) => {
            const on = active === p.id || selected === p.id;
            return (
              <g
                key={p.id}
                role="link"
                tabIndex={0}
                aria-label={`${p.label}${p.count ? `, ${p.count} wards` : ""}`}
                onMouseEnter={() => setActive(p.id)}
                onMouseLeave={reset}
                onFocus={() => setActive(p.id)}
                onBlur={reset}
                onClick={() => go(p.href)}
                onKeyDown={(event) => onKey(event, p.href)}
                className="cursor-pointer outline-none"
              >
                <circle cx={p.x} cy={p.y} r={hitRadius} fill="transparent" />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={on ? dotActive : dotRadius}
                  fill={on ? "var(--violet)" : "var(--green)"}
                  fillOpacity={on ? 1 : 0.9}
                  stroke={selected === p.id ? "var(--paper)" : "none"}
                  strokeWidth={selected === p.id ? 0.55 * scale : 0}
                  className="motion-safe:transition-[r,fill] motion-safe:duration-150"
                />
                {on && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={haloRadius}
                    fill="none"
                    stroke="var(--violet)"
                    strokeWidth={0.35 * scale}
                    strokeOpacity="0.6"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {activeLabel && (
          <p className="pointer-events-none absolute left-2 top-2 max-w-[80%] truncate rounded bg-ink px-2 py-1 text-xs text-paper shadow-sm">
            {activeLabel}
          </p>
        )}
      </div>

      <p className="mt-2 text-xs text-muted">
        {points.length
          ? "Hover an LGA to see its name. Click to open it."
          : "Hover a state to see its name. Click to open it."}{" "}
        Boundaries: geoBoundaries / GRID3, CC BY 4.0.
      </p>
    </figure>
  );
}
