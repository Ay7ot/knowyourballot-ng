import { timingSafeEqual } from "node:crypto";
import { list, put } from "@vercel/blob";

/**
 * Searches that found nothing, so we learn what voters look for. We keep only the
 * words typed (cleaned, at most 60 characters) and the day: no IP, no cookie, no device.
 * POST {q} records one miss. GET ?key=SEARCH_REPORT_KEY returns counts for the last 30 days.
 */
export const runtime = "nodejs";

const MAX_BODY_CHARS = 512;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT = 30;
const buckets = new Map<string, { count: number; reset: number }>();

const clean = (s: unknown) =>
  typeof s === "string"
    ? s
        .toLowerCase()
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N} '\-/.?]+/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 60)
    : "";

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const real = req.headers.get("x-real-ip");
  return (forwarded?.split(",")[0]?.trim() || real || "unknown").slice(0, 64);
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  if (buckets.size > 5_000) {
    for (const [key, bucket] of buckets) {
      if (bucket.reset <= now) buckets.delete(key);
    }
  }
  const bucket = buckets.get(ip);
  if (!bucket || bucket.reset <= now) {
    buckets.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  if (bucket.count >= RATE_LIMIT) return true;
  bucket.count += 1;
  return false;
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return new Response(null, { status: 403 });

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) return new Response(null, { status: 415 });

  const ip = clientIp(req);
  if (isRateLimited(ip)) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(RATE_WINDOW_MS / 1000)) },
    });
  }

  const body = await req.text();
  if (body.length > MAX_BODY_CHARS) return new Response(null, { status: 413 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) return new Response(null, { status: 204 });

  let q = "";
  try {
    q = clean(JSON.parse(body).q);
  } catch {
    q = "";
  }
  if (q.length < 3) return new Response(null, { status: 204 });

  const day = new Date().toISOString().slice(0, 10);
  const id = Math.random().toString(36).slice(2, 10);
  try {
    await put(`misses/${day}/${encodeURIComponent(q)}~${id}`, "1", {
      access: "private",
      addRandomSuffix: false,
      contentType: "text/plain",
    });
  } catch (error) {
    console.error("search-miss write failed", error);
  }
  return new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key") ?? "";
  const expected = process.env.SEARCH_REPORT_KEY ?? "";
  if (!expected || !safeEqual(key, expected)) return new Response("Not found", { status: 404 });

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
  const body =
    `Searches with no results, last 30 days (since ${since})\n\n` +
    (rows.length ? rows.map(([q, n]) => `${String(n).padStart(5)}  ${q}`).join("\n") : "None yet.");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
