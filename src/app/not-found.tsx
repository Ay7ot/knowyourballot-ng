import { quickEntries } from "@/lib/data";
import Link from "next/link";
import FindBallot from "@/components/FindBallot";
import { gutter } from "@/lib/gutter";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-16" style={gutter}>
      <p className="label text-green">Page not found</p>
      <h1 className="display mt-2 text-4xl">That page isn&apos;t on the ballot</h1>
      <p className="mt-2 text-muted">Search for your polling unit code, LGA, ward or a candidate instead.</p>
      <div className="mt-6">
        <FindBallot quick={quickEntries()} />
      </div>
      <p className="mt-6">
        <Link prefetch={false} className="underline" href="/">
          Back to home
        </Link>
      </p>
    </div>
  );
}
