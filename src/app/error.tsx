"use client";

import Link from "next/link";
import { useEffect } from "react";
import { gutter } from "@/lib/gutter";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl py-16" style={gutter}>
      <p className="label text-green">Something went wrong</p>
      <h1 className="display mt-2 text-4xl">This page didn&apos;t load</h1>
      <p className="mt-2 text-muted">Try again, or search for your ballot from the home page.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper">
          Try again
        </button>
        <Link href="/" className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:bg-green-soft">
          Back to home
        </Link>
      </div>
    </div>
  );
}
