import Link from "next/link";
import FindBallot from "@/components/FindBallot";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted">Search for your LGA, ward or a candidate instead.</p>
      <div className="mt-6"><FindBallot /></div>
      <p className="mt-6"><Link className="underline" href="/">Back to home</Link></p>
    </div>
  );
}
