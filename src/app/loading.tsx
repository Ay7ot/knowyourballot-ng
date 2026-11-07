import { gutter } from "@/lib/gutter";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl py-16" style={gutter} role="status" aria-live="polite">
      <p className="label text-green">Loading</p>
      <div className="mt-4 space-y-3 motion-safe:animate-pulse">
        <div className="h-9 w-2/3 rounded bg-rule" />
        <div className="h-4 w-full rounded bg-rule" />
        <div className="h-4 w-5/6 rounded bg-rule" />
      </div>
    </div>
  );
}
