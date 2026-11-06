import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://knowyourballot-ng.vercel.app"),
  title: { default: "Know Your Ballot · Nigeria 2027", template: "%s · Know Your Ballot" },
  description:
    "Every candidate on your 2027 ballot, from President to State Assembly, straight from INEC's lists. Find yours with your polling unit code, LGA or ward.",
  openGraph: {
    title: "Know Your Ballot · Nigeria 2027",
    description: "Every candidate on your 2027 ballot, from INEC's official lists. Find yours in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1312" },
  ],
};


function Wordmark() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Know Your Ballot, home">
      {/* Ballot box with a folded ballot going in */}
      <svg viewBox="0 0 32 32" className="h-8 w-8 text-green" aria-hidden>
        <rect x="3" y="13" width="26" height="16" rx="2" fill="currentColor" />
        <rect x="9" y="12" width="14" height="2.5" rx="1" fill="var(--paper)" />
        <path d="M11 3h10v10H11z" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="1.6" />
        <path d="M13.5 8.2l1.8 1.8 3.4-3.6" fill="none" stroke="var(--violet)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="display text-[1.05rem] leading-none tracking-tight">
        Know Your <span className="text-green">Ballot</span>
      </span>
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-sheet focus:px-3 focus:py-2">
          Skip to content
        </a>
        <header className="no-print border-b border-rule bg-paper">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3" style={gutter}>
            <Wordmark />
            <nav aria-label="Main" className="-mx-2 flex items-center text-[0.95rem]">
              {[
                ["/guide", "Voting day"],
                ["/state", "States"],
                ["/data", "Sources"],
              ].map(([h, l]) => (
                <Link key={h} href={h} className="rounded-md px-2.5 py-2 font-medium text-muted hover:bg-green-soft hover:text-ink">
                  {l}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="no-print border-t border-rule">
          <div className="mx-auto grid max-w-5xl gap-6 py-10 text-sm text-muted sm:grid-cols-3" style={gutter}>
            <div className="space-y-2">
              <p className="label text-ink">Non-partisan</p>
              <p>Not affiliated with INEC or any party. Candidates appear in the order INEC lists them, and every party gets the same plain box.</p>
            </div>
            <div className="space-y-2">
              <p className="label text-ink">Sourced</p>
              <p>
                Candidate details come from <a className="underline" href="https://www.inecnigeria.org/press/">INEC&apos;s published lists</a>, checked daily. No religion, no rumours.
              </p>
            </div>
            <div className="space-y-2">
              <p className="label text-ink">Fix something</p>
              <p>
                See a mistake? <Link className="underline" href="/data#corrections">Send a correction with a source</Link>. A person reviews every one.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
