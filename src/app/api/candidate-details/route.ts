import { NextResponse } from "next/server";
import { getCandidate, toTrayDetails } from "@/lib/data";

/**
 * Facts and policy for the two or three candidates in the compare tray.
 * Pages ship only slim candidate rows, so the heavy fields are fetched here
 * when the dialog opens instead of being repeated in every LGA and race page.
 */
export const runtime = "nodejs";

const MAX_IDS = 10;
const CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

export async function GET(request: Request) {
  const requested = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const ids = [...new Set(requested)];

  if (ids.length > MAX_IDS) {
    return NextResponse.json({ error: "too_many_ids" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const details: Record<string, ReturnType<typeof toTrayDetails>> = Object.create(null);
  const missing: string[] = [];
  for (const id of ids) {
    const candidate = getCandidate(id);
    if (candidate) details[id] = toTrayDetails(candidate);
    else missing.push(id);
  }

  return NextResponse.json({ details, missing }, { headers: { "Cache-Control": CACHE } });
}
