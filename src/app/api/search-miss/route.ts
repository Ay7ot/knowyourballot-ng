import { list, put } from "@vercel/blob";

/**
 * Searches that found nothing, so we learn what voters look for. We keep only the
 * words typed (cleaned, at most 60 characters) and the day: no IP, no cookie, no device.
 * POST {q} records one miss. GET ?key=SEARCH_REPORT_KEY returns counts for the last 30 days.
 */
export const runtime = "nodejs";

const clean = (s: unknown) =>
  typeof s === "string"
    ? s.toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N} '\-/.?]+/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60)
    : "";

export async function POST(req: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return new Response(null, { status: 204 });
  let q = "";
  try {
    q = clean((await req.json()).q);
  } catch {}
  if (q.length < 3) return new Response(null, { status: 204 });
  const day = new Date().toISOString().slice(0, 10);
  const id = Math.random().toString(36).slice(2, 10);
  await put(`misses/${day}/${encodeURIComponent(q)}~${id}`, "1", { access: "private", addRandomSuffix: false, contentType: "text/plain" });
  return new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SEARCH_REPORT_KEY || key !== process.env.SEARCH_REPORT_KEY) return new Response("Not found", { status: 404 });
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "misses/", cursor, limit: 1000 });
    for (const b of page.blobs) {
      const [, day, rest] = b.pathname.split("/");
      if (!day || day < since || !rest) continue;
      const q = decodeURIComponent(rest.split("~")[0]);
      counts.set(q, (counts.get(q) ?? 0) + 1);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const rows = [...counts].sort((a, b) => b[1] - a[1]);
  const body = `Searches with no results, last 30 days (since ${since})\n\n` + (rows.length ? rows.map(([q, n]) => `${String(n).padStart(5)}  ${q}`).join("\n") : "None yet.");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
