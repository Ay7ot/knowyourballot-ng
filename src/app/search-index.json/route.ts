import { ballot, geo, getState, lgaHref, getLgaById, OFFICE_LABEL, partyName, getRace } from "@/lib/data";
import type { SearchEntry } from "@/lib/types";

export const dynamic = "force-static";

export function GET() {
  const out: SearchEntry[] = [];
  const st = (code: string) => getState(code)!;
  for (const s of geo.states) out.push({ t: "s", n: s.name, x: `${s.zone} · State`, h: `/state/${s.slug}` });
  for (const l of geo.lgas) out.push({ t: "l", n: l.name, x: `LGA · ${st(l.state).short}`, h: lgaHref(l) });
  for (const w of geo.wards) {
    const l = getLgaById(w.lga)!;
    out.push({ t: "w", n: w.name, x: `Ward · ${l.name}, ${st(l.state).short}`, h: `${lgaHref(l)}?ward=${w.id.split("-")[2]}` });
  }
  for (const d of geo.senatorial)
    out.push({ t: "d", n: d.name === "FCT" ? "FCT Senatorial District" : d.name, x: `Senate district · ${st(d.state).short}`, h: `/race/sen--${d.id}` });
  for (const d of geo.federal)
    out.push({ t: "f", n: d.name, x: `Federal constituency · ${st(d.state).short}`, h: `/race/rep--${d.id}` });
  for (const a of ballot.assembly)
    out.push({ t: "a", n: a.name, x: `State constituency · ${st(a.state).short}`, h: `/race/sha--${a.id}` });
  for (const c of ballot.candidates) {
    const race = getRace(c.race)!;
    out.push({
      t: "c",
      n: c.name,
      x: `${partyName(c.party) ? c.party : c.party} · ${OFFICE_LABEL[c.office]}, ${race.name}`,
      h: `/candidate/${c.id}`,
    });
  }
  return Response.json(out, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}
