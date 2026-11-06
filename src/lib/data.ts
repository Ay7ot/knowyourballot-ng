import "server-only";
import geoJson from "@data/geo.json";
import ballotJson from "@data/ballot.json";
import type { Ballot, BallotSection, Candidate, Geo, Lga, Race, State, Office } from "./types";

export const geo = geoJson as unknown as Geo;
export const ballot = ballotJson as unknown as Ballot;

const stateByCode = new Map(geo.states.map((s) => [s.code, s]));
const stateBySlug = new Map(geo.states.map((s) => [s.slug, s]));
const lgaById = new Map(geo.lgas.map((l) => [l.id, l]));
const senById = new Map(geo.senatorial.map((d) => [d.id, d]));
const fedById = new Map(geo.federal.map((d) => [d.id, d]));
const raceById = new Map(ballot.races.map((r) => [r.id, r]));
const candById = new Map(ballot.candidates.map((c) => [c.id, c]));

export const ELECTIONS = [
  { date: "2027-01-16", label: "Presidential & National Assembly", offices: ["president", "senate", "rep"] as Office[] },
  { date: "2027-02-06", label: "Governorship & State Assembly", offices: ["governor", "assembly"] as Office[] },
];

export const OFFICE_LABEL: Record<Office, string> = {
  president: "President",
  senate: "Senate",
  rep: "House of Representatives",
  governor: "Governor",
  assembly: "State House of Assembly",
};

export const OFFICE_SOURCE_KEY: Record<Office, keyof Ballot["offices"]> = {
  president: "presidential",
  senate: "senate",
  rep: "reps",
  governor: "governorship",
  assembly: "assembly",
};

export function getState(slugOrCode: string): State | undefined {
  return stateBySlug.get(slugOrCode) ?? stateByCode.get(slugOrCode);
}
export function lgasOf(stateCode: string): Lga[] {
  return geo.lgas.filter((l) => l.state === stateCode).sort((a, b) => a.name.localeCompare(b.name));
}
export function getLga(stateSlug: string, lgaSlug: string) {
  const st = getState(stateSlug);
  if (!st) return undefined;
  const lga = geo.lgas.find((l) => l.state === st.code && l.slug === lgaSlug);
  return lga ? { state: st, lga } : undefined;
}
export const getLgaById = (id: string) => lgaById.get(id);
export const getSenatorial = (id: string) => senById.get(id);
export const getFederal = (id: string) => fedById.get(id);
export const getRace = (id: string) => raceById.get(id);
export const getCandidate = (id: string) => candById.get(id);
export function candidatesOf(race: Race): Candidate[] {
  return race.candidates.map((id) => candById.get(id)!).filter(Boolean);
}
export function wardsOf(lgaId: string) {
  return geo.wards.filter((w) => w.lga === lgaId).sort((a, b) => a.name.localeCompare(b.name));
}
export function officeStatus(office: Office) {
  return ballot.offices[OFFICE_SOURCE_KEY[office]]?.status ?? "pending";
}

export function lgaHref(lga: Lga) {
  return `/state/${stateByCode.get(lga.state)!.slug}/${lga.slug}`;
}

/** Every race a voter registered in this LGA votes in. `federal` narrows split LGAs. */
export function ballotForLga(lga: Lga): BallotSection[] {
  const st = stateByCode.get(lga.state)!;
  const sections: BallotSection[] = [];
  const sec = (office: Office, districts: { id: string; name: string; raceId: string }[], note?: string) =>
    sections.push({
      office,
      status: officeStatus(office),
      note,
      contests: districts.map((d) => ({ districtId: d.id, districtName: d.name, race: raceById.get(d.raceId) ?? null })),
    });

  sec("president", [{ id: "NG", name: "Nigeria", raceId: "president" }]);
  const sen = senById.get(lga.senatorial)!;
  sec("senate", [{ id: sen.id, name: sen.name, raceId: `sen--${sen.id}` }]);
  sec(
    "rep",
    lga.federal.map((f) => ({ id: f, name: fedById.get(f)!.name, raceId: `rep--${f}` })),
    lga.federal.length > 1 ? "This LGA is split between two federal constituencies. Pick your ward to see which one is yours." : undefined,
  );
  if (st.governorship) sec("governor", [{ id: st.code, name: st.short, raceId: `gov--${st.slug}` }]);
  if (st.assembly) {
    const consts = ballot.assembly.filter((a) => a.state === st.code && a.lgas.includes(lga.id));
    const stateHasAny = ballot.assembly.some((a) => a.state === st.code);
    sec(
      "assembly",
      consts.map((a) => ({ id: a.id, name: a.name, raceId: `sha--${a.id}` })),
      officeStatus("assembly") === "loaded" && !stateHasAny
        ? `INEC's published State Assembly list has no entries for ${st.short} yet. We'll add them as soon as INEC publishes them.`
        : consts.length > 1
        ? "Your LGA has more than one state constituency. INEC doesn't publish which wards make up each one, so check the name that matches your area, or look at your voter's card."
        : undefined,
    );
  }
  return sections;
}

export function partyName(code: string): string | undefined {
  return PARTIES[code];
}

// Only parties whose full names we're sure of. Others show the abbreviation INEC uses.
const PARTIES: Record<string, string> = {
  A: "Accord",
  AA: "Action Alliance",
  AAC: "African Action Congress",
  ADC: "African Democratic Congress",
  ADP: "Action Democratic Party",
  APC: "All Progressives Congress",
  APGA: "All Progressives Grand Alliance",
  APM: "Allied Peoples Movement",
  APP: "Action Peoples Party",
  BP: "Boot Party",
  LP: "Labour Party",
  NNPP: "New Nigeria Peoples Party",
  NRM: "National Rescue Movement",
  PDP: "Peoples Democratic Party",
  PRP: "Peoples Redemption Party",
  SDP: "Social Democratic Party",
  YPP: "Young Progressives Party",
  ZLP: "Zenith Labour Party",
  YP: "Youth Party",
};

export function stats() {
  return {
    states: geo.states.length,
    lgas: geo.lgas.length,
    wards: geo.wards.length,
    senatorial: geo.senatorial.length,
    federal: geo.federal.length,
    candidates: ballot.candidates.length,
    races: ballot.races.length,
  };
}
