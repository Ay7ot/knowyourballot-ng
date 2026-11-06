"use client";

/**
 * Our own form controls, so every page looks the same on every phone. Native elements
 * underneath (for keyboards, screen readers and the phone's own picker), our styling on top.
 */

const chevron =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%237d8883' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 8 5 5 5-5'/%3E%3C/svg%3E\")";

/** A dropdown that keeps the phone's native picker but drops the browser's look. */
export function Select({
  id,
  value,
  onChange,
  options,
  size = "md",
  className = "",
  label,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  size?: "sm" | "md";
  className?: string;
  label?: string;
}) {
  return (
    <select
      id={id}
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ backgroundImage: chevron, backgroundRepeat: "no-repeat", backgroundPosition: "right 0.6rem center", backgroundSize: "1.1rem" }}
      className={`control block w-full appearance-none rounded-lg border-2 border-rule bg-sheet pr-9 font-medium text-ink transition-colors hover:border-ink ${
        size === "sm" ? "h-10 pl-3 text-sm" : "h-12 pl-3.5"
      } ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** A row of pill buttons for picking one of a few options. */
export function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-rule bg-paper p-0.5">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={`control h-8 whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors ${on ? "bg-ink text-paper" : "text-muted hover:text-ink"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** A checkbox drawn by us: square box, green fill and a white tick when on. */
export function Check({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <label className="group inline-flex min-h-8 cursor-pointer select-none items-center gap-2 text-sm text-muted hover:text-ink">
      <span className="relative grid h-5 w-5 place-items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="control peer absolute inset-0 m-0 h-5 w-5 cursor-pointer appearance-none rounded-[5px] border-2 border-rule bg-sheet transition-colors checked:border-green checked:bg-green group-hover:border-ink checked:group-hover:border-green"
        />
        <svg viewBox="0 0 16 16" aria-hidden className="pointer-events-none relative h-3.5 w-3.5 text-green-ink opacity-0 peer-checked:opacity-100">
          <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children}
    </label>
  );
}
