import { timingSafeEqual } from "node:crypto";
import { list, put } from "@vercel/blob";

/**
 * Searches that found nothing, so we learn what voters look for. We keep only the
 * words typed (cleaned, at most 60 characters) and the day: no IP, no cookie, no device.
 * POST {q} records one miss. GET with `Authorization: Bearer SEARCH_REPORT_KEY`
 * (or `?key=`) returns counts for the last 30 days.
 */
export const runtime = "nodejs";

const MAX_BODY_BYTES = 512;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT = 30;
const buckets = new Map<string, { count: number; reset: number }>();

const clean = (s: unknown) => {
  if (typeof s !== "string") return "";
  const normalized = s
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} '\-/.?]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(normalized).slice(0, 60).join("");
};

function clientIp(req: Request): string {
  // Vercel sets x-real-ip. Prefer it over a client-supplied x-forwarded-for.
  const real = req.headers.get("x-real-ip");
  const forwarded = req.headers.get("x-forwarded-for");
  return (real || forwarded?.split(",")[0]?.trim() || "unknown").slice(0, 64);
}

function rateLimitReset(ip: string): number | null {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [key, bucket] of buckets) {
      if (bucket.reset <= now) buckets.delete(key);
    }
    while (buckets.size > 10_000) {
      const oldest = buckets.keys().next().value;
      if (!oldest) break;
      buckets.delete(oldest);
    }
  }
  const bucket = buckets.get(ip);
  if (!bucket || bucket.reset <= now) {
    buckets.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return null;
  }
  if (bucket.count >= RATE_LIMIT) return Math.max(1, Math.ceil((bucket.reset - now) / 1000));
  bucket.count += 1;
  return null;
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return true;
  try {
    const url = new URL(origin);
    const protocol = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "");
    return url.host === host && url.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}

function reportKey(req: Request): string {
  const auth = req.headers.get("authorization") ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return new URL(req.url).searchParams.get("key") ?? "";
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
  const retryAfter = rateLimitReset(ip);
  if (retryAfter !== null) {
    return new Response(null, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  const body = await req.text();
  if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

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
  const key = reportKey(req);
  const expected = process.env.SEARCH_REPORT_KEY ?? "";
  if (!expected || !safeEqual(key, expected)) return new Response("Not found", { status: 404 });

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const counts = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    let cursor: string | undefined;
    do {
      const page = await list({ prefix: `misses/${day}/`, cursor, limit: 1000 });
      for (const b of page.blobs) {
        const rest = b.pathname.split("/")[2];
        if (!rest) continue;
        const q = decodeURIComponent(rest.split("~")[0]);
        counts.set(q, (counts.get(q) ?? 0) + 1);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  }
  const rows = [...counts].sort((a, b) => b[1] - a[1]);
  const body =
    `Searches with no results, last 30 days (since ${since})\n\n` +
    (rows.length ? rows.map(([q, n]) => `${String(n).padStart(5)}  ${q}`).join("\n") : "None yet.");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
