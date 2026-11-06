import type { Metadata, Viewport } from "next";
import { pageMeta } from "@/lib/seo";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { archivo, atkinson, plexMono } from "./fonts";
import "./globals.css";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://knowyourballot-ng.vercel.app"),
  title: { default: "Know Your Ballot · Nigeria 2027", template: "%s · Know Your Ballot" },
  description:
    "Every candidate on your 2027 ballot, from President to State Assembly, straight from INEC's lists. Find yours with your polling unit code, LGA or ward.",
  ...pageMeta({
    description:
      "Every candidate on your 2027 ballot, from President to State Assembly, straight from INEC's lists. Find yours with your polling unit code, LGA or ward.",
    path: "/",
  }),
  applicationName: "Know Your Ballot",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef1ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1312" },
  ],
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${archivo.variable} ${atkinson.variable} ${plexMono.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-sheet focus:px-3 focus:py-2">
          Skip to content
        </a>
        <SiteHeader />
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
                See a mistake? <Link prefetch={false} className="underline" href="/data#corrections">Send a correction with a source</Link>. A person reviews every one.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
