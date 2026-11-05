import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://knowyourballot-ng.vercel.app"),
  title: { default: "Know Your Ballot · Nigeria 2027", template: "%s · Know Your Ballot" },
  description:
    "Find every candidate on your 2027 ballot: President, Senate, House of Reps, Governor and State Assembly. Search by LGA, ward or polling unit. Data from INEC.",
  openGraph: {
    title: "Know Your Ballot · Nigeria 2027",
    description: "Every candidate on your 2027 ballot, from INEC's official lists. Search by LGA, ward or polling unit.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1412" },
  ],
};

function Mark() {
  return (
    <span aria-hidden className="inline-flex h-6 w-6 overflow-hidden rounded-md ring-1 ring-line">
      <span className="w-1/3 bg-brand" />
      <span className="w-1/3 bg-white" />
      <span className="w-1/3 bg-brand" />
    </span>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body className="min-h-dvh flex flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-surface px-3 py-2 rounded">
          Skip to content
        </a>
        <header className="border-b border-line bg-surface/80 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <Mark />
              <span className="whitespace-nowrap">Know Your Ballot</span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/state" className="px-3 py-2 rounded-lg hover:bg-brand-soft whitespace-nowrap">States</Link>
              <Link href="/data" className="px-3 py-2 rounded-lg hover:bg-brand-soft"><span className="sm:hidden">About</span><span className="hidden sm:inline">About the data</span></Link>
            </nav>
          </div>
        </header>
        <main id="main" className="flex-1">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-5xl px-4 py-8 text-sm text-muted space-y-2">
            <p>
              Independent and non-partisan. Candidate lists come from{" "}
              <a className="underline" href="https://www.inecnigeria.org/press/">INEC&apos;s published final lists</a>. Candidates
              are shown in the order INEC lists them, never ranked.
            </p>
            <p>
              Spotted a mistake? <Link className="underline" href="/data#corrections">Tell us</Link>. Not affiliated with INEC
              or any party.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
