import { NextResponse } from "next/server";
import { getCandidate, toTrayDetails } from "@/lib/data";

/**
 * Facts and policy for the two or three candidates in the compare tray.
 * Pages ship only slim candidate rows, so the heavy fields are fetched here
 * when the dialog opens instead of being repeated in every LGA and race page.
 */
export const runtime = "nodejs";

const MAX_IDS = 10;

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);

  const details: Record<string, ReturnType<typeof toTrayDetails>> = {};
  for (const id of ids) {
    const candidate = getCandidate(id);
    if (candidate) details[id] = toTrayDetails(candidate);
  }

  return NextResponse.json(details, {
    headers: {
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
