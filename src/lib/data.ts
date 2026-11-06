import "server-only";
import geoJson from "@data/geo.json";
import ballotJson from "@data/ballot.json";
import partiesJson from "@data/parties.json";
import photoJson from "@data/candidate_photos.json";
import platformJson from "@data/platforms.json";
import logoJson from "@data/party_logos.json";
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

// INEC's register of 22 parties (inecnigeria.org/parties, checked 6 Nov 2026).
const PARTIES = partiesJson as Record<string, string>;
export const ALL_PARTIES = PARTIES;

export const LEVEL_LABEL: Record<string, string> = {
  doctorate: "Doctorate",
  postgraduate: "Postgraduate",
  degree: "University degree",
  diploma: "Diploma (OND, HND, NCE)",
  secondary: "Secondary school",
  primary: "Primary school",
  other: "Schools listed, level unclear",
};
export const LEVEL_SHORT: Record<string, string> = {
  doctorate: "PhD",
  postgraduate: "Postgrad",
  degree: "Degree",
  diploma: "Diploma",
  secondary: "Secondary",
  primary: "Primary",
  other: "Unclear",
};

/** What each seat does, in one or two sentences a first-time voter can use. */
export const OFFICE_INFO: Record<Office, { what: string; term: string; seats: string }> = {
  president: {
    what: "Leads the federal government and the armed forces, appoints ministers, and proposes the national budget.",
    term: "4-year term, two terms at most",
    seats: "1 seat for the whole country",
  },
  senate: {
    what: "Makes federal laws, approves the national budget, and confirms ministers and other top appointments.",
    term: "4-year term",
    seats: "109 seats: 3 per state, 1 for the FCT",
  },
  rep: {
    what: "Makes federal laws, approves the national budget, and represents your federal constituency in Abuja.",
    term: "4-year term",
    seats: "360 seats, shared by population",
  },
  governor: {
    what: "Runs your state government and its budget: state roads, schools, hospitals and security support.",
    term: "4-year term, two terms at most",
    seats: "1 per state",
  },
  assembly: {
    what: "Makes your state's laws, approves the state budget, and checks the governor's spending.",
    term: "4-year term",
    seats: "1 seat for your state constituency",
  },
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

/** Slim candidate record for client components (picks, compare). */
export function toTray(c: Candidate, raceLabel: string) {
  return {
    id: c.id,
    name: c.name,
    party: c.party,
    partyName: PARTIES[c.party] ?? null,
    logo: partyLogo(c.party),
    photo: candidatePhoto(c.id, c.name)?.file ?? null,
    age: c.age,
    gender: c.gender,
    level: c.level,
    qualifications: c.qualifications,
    mate: c.runningMate?.name ?? null,
    race: c.race,
    raceLabel,
  };
}

const LOGOS = logoJson as Record<string, { file: string; source: string }>;
/** INEC's logo for a party, downloaded by scripts/fetch_party_logos.py. Null when INEC shows none. */
export function partyLogo(code: string): string | null {
  return LOGOS[code]?.file ?? null;
}

export type Photo = { file: string; wikidata: string; wikidataLabel: string; evidence: string; commons: string; license: string; licenseUrl: string | null; artist: string };
const PHOTOS = (photoJson as unknown as { photos: Record<string, Photo & { name: string }> }).photos;
/** A verified, freely licensed photo (see scripts/fetch_candidate_photos.py), only while the same person holds the slot. */
export function candidatePhoto(id: string, name: string): Photo | null {
  const p = PHOTOS[id];
  return p && p.name === name ? p : null;
}

export type PlatformSource = { outlet: string; date: string; title: string; url: string };
export type Pledge = { topic: string; text: string; src: string[] };
export type Platform = { status: "manifesto" | "pledges"; title: string | null; unveiled: string | null; document: string | null; note: string; noteSrc?: string[]; pledges: Pledge[] };
export const PLATFORMS = platformJson as unknown as { checked: string; topics: string[]; sources: Record<string, PlatformSource>; candidates: Record<string, Platform> };
export const platformFor = (id: string): Platform | null => (PLATFORMS.candidates as Record<string, Platform>)[id] ?? null;
export const partyPlatform = (code: string): Platform | null => ((PLATFORMS as unknown as { parties?: Record<string, Platform> }).parties ?? {})[code] ?? null;
