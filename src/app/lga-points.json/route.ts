import { geo, getState, lgaHref } from "@/lib/data";

export const dynamic = "force-static";

/** Compact LGA list for "use my location" and polling-unit lookups. */
export function GET() {
  return Response.json(
    geo.lgas.map((l) => ({ id: l.id, n: l.name, s: getState(l.state)!.short, h: lgaHref(l), lat: l.lat ?? null, lon: l.lon ?? null })),
    { headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
