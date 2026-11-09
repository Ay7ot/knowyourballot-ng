import Link from "next/link";
import { pageMeta } from "@/lib/seo";
import type { Metadata } from "next";
import { candidatesOf, getRace, PLATFORMS } from "@/lib/data";
import RacePromises from "@/components/RacePromises";
import { Crumbs } from "@/components/ui";
import { gutter } from "@/lib/gutter";

export const metadata: Metadata = pageMeta({
  title: "What the presidential candidates promise",
  description: "2027 presidential manifestos and campaign pledges, topic by topic, each linked to its source.",
  path: "/promises",
  og: {
    k: "President · 2027",
    t: "What the candidates promise",
    s: "Manifestos and campaign pledges, topic by topic, each linked to its source.",
  },
});

const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export default function PromisesPage() {
  const cands = candidatesOf(getRace("president")!);
  return (
    <div className="mx-auto max-w-6xl py-8" style={gutter}>
      <Crumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/race/president", label: "President of Nigeria" },
          { label: "Promises" },
        ]}
      />
      <h1 className="display mt-5 text-4xl sm:text-5xl">What the presidential candidates promise</h1>
      <p className="mt-3 max-w-[62ch] text-muted">
        Every pledge here links to the report it came from, and is paraphrased without judging it. Where a candidate has
        published a manifesto we say so; where they haven&apos;t, we use pledges reported from their campaign. Checked{" "}
        {day(PLATFORMS.checked)}.
      </p>

      <p className="mt-3 text-sm">
        <Link prefetch={false} href="/manifestos" className="font-medium text-green underline">
          See every manifesto and pledge we have found
        </Link>
        , or{" "}
        <Link prefetch={false} href="/economy" className="font-medium text-green underline">
          see where the economy stands now
        </Link>
        , in eight numbers, before you weigh these promises.
      </p>
      <h2 className="sr-only">Pledges by topic</h2>
      <div className="mt-8">
        <RacePromises cands={cands} />
      </div>
    </div>
  );
}
