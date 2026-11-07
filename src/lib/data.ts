import "server-only";
import { GLOSSARY, ISSUES } from "./civics";
import { INDICATORS } from "./economy";
import geoJson from "@data/geo.json";
import ballotJson from "@data/ballot.json";
import partiesJson from "@data/parties.json";
import photoJson from "@data/candidate_photos.json";
import officialPhotoJson from "@data/official_photos.json";
import platformJson from "@data/platforms.json";
import logoJson from "@data/party_logos.json";
import nigeriaMap from "@data/nigeria-map.json";
import type { Ballot, BallotSection, Candidate, Geo, Lga, MapPoint, MapStatePath, Race, State, Office } from "./types";

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
  {
    date: "2027-01-16",
    label: "Presidential & National Assembly",
    offices: ["president", "senate", "rep"] as Office[],
  },
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

const MAP = nigeriaMap as unknown as {
  viewBox: [number, number, number, number];
  bounds: { minLon: number; minLat: number; maxLon: number; maxLat: number };
  states: { slug: string; name: string; d: string; bbox: [number, number, number, number]; count: number }[];
};

function project(lon: number, lat: number): [number, number] {
  const { minLon, minLat, maxLat } = MAP.bounds;
  const meanLat = (((minLat + maxLat) / 2) * Math.PI) / 180;
  const xSpan = (MAP.bounds.maxLon - minLon) * Math.cos(meanLat);
  const ySpan = maxLat - minLat;
  const [, , width, height] = MAP.viewBox;
  return [((lon - minLon) / xSpan) * width, ((maxLat - lat) / ySpan) * height];
}

export const nationalMapViewBox = MAP.viewBox.join(" ");

export function nationalMapPaths(): MapStatePath[] {
  return MAP.states.map((s) => ({ ...s, href: `/state/${s.slug}` }));
}

export function stateMapPath(slug: string): MapStatePath | undefined {
  const s = MAP.states.find((state) => state.slug === slug);
  return s ? { ...s, href: undefined } : undefined;
}

export function stateMapViewBox(slug: string): string {
  const s = MAP.states.find((state) => state.slug === slug);
  if (!s) return nationalMapViewBox;
  const [x, y, w, h] = s.bbox;
  const pad = 1;
  return `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`;
}

/** LGAs with a centroid, projected onto the same map as the state boundaries. */
export function lgaMapPoints(stateCode: string): MapPoint[] {
  return geo.lgas
    .filter((l) => l.state === stateCode && typeof l.lat === "number" && typeof l.lon === "number")
    .map((l) => {
      const [x, y] = project(l.lon as number, l.lat as number);
      return {
        id: l.id,
        label: l.name,
        href: lgaHref(l),
        x,
        y,
        count: geo.wards.filter((w) => w.lga === l.id).length,
      };
    });
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
      contests: districts.map((d) => ({
        districtId: d.id,
        districtName: d.name,
        race: raceById.get(d.raceId) ?? null,
      })),
    });

  sec("president", [{ id: "NG", name: "Nigeria", raceId: "president" }]);
  const sen = senById.get(lga.senatorial)!;
  sec("senate", [{ id: sen.id, name: sen.name, raceId: `sen--${sen.id}` }]);
  sec(
    "rep",
    lga.federal.map((f) => ({ id: f, name: fedById.get(f)!.name, raceId: `rep--${f}` })),
    lga.federal.length > 1
      ? "This LGA is split between two federal constituencies. Pick your ward to see which one is yours."
      : undefined,
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
    policy: trayPolicy(c),
  };
}

const LOGOS = logoJson as Record<string, { file: string; source: string }>;
/** INEC's logo for a party, downloaded by scripts/fetch_party_logos.py. Null when INEC shows none. */
export function partyLogo(code: string): string | null {
  return LOGOS[code]?.file ?? null;
}

/** A freely licensed photo from Wikimedia Commons, matched to the candidate on Wikidata. */
export type CommonsPhoto = {
  kind: "commons";
  file: string;
  wikidata: string;
  wikidataLabel: string;
  evidence: string;
  commons: string;
  license: string;
  licenseUrl: string | null;
  artist: string;
};
/** The candidate's own profile picture from an account tied to them (scripts/fetch_official_photos.py). Not freely licensed. */
export type OfficialPhoto = { kind: "official"; file: string; x: string; why: string; source: string; fetched: string };
export type Photo = CommonsPhoto | OfficialPhoto;
const PHOTOS = (photoJson as unknown as { photos: Record<string, Omit<CommonsPhoto, "kind"> & { name: string }> })
  .photos;
const OFFICIAL = officialPhotoJson as unknown as Record<string, Omit<OfficialPhoto, "kind"> & { name: string }>;
/** The candidate's own official photo if we have one, else a verified, freely licensed one; only while the same person holds the slot. */
export function candidatePhoto(id: string, name: string): Photo | null {
  const o = OFFICIAL[id];
  if (o && o.name === name) return { ...o, kind: "official" };
  const p = PHOTOS[id];
  return p && p.name === name ? { ...p, kind: "commons" } : null;
}

export type PlatformSource = { outlet: string; date: string; title: string; url: string };
export type Pledge = { topic: string; text: string; src: string[] };
export type Platform = {
  status: "manifesto" | "pledges";
  title: string | null;
  unveiled: string | null;
  document: string | null;
  note: string;
  noteSrc?: string[];
  pledges: Pledge[];
};
export const PLATFORMS = platformJson as unknown as {
  checked: string;
  topics: string[];
  sources: Record<string, PlatformSource>;
  candidates: Record<string, Platform>;
};
export const platformFor = (id: string): Platform | null =>
  (PLATFORMS.candidates as Record<string, Platform>)[id] ?? null;
export const partyPlatform = (code: string): Platform | null =>
  (PLATFORMS as unknown as { parties?: Record<string, Platform> }).parties?.[code] ?? null;

export type TrayPledge = { topic: string; text: string; source: { label: string; url: string } | null };
export type TrayPolicy = {
  kind: "manifesto" | "pledges" | "party" | "none";
  title: string | null;
  pledges: TrayPledge[];
  note: string;
  noteSource: { label: string; url: string } | null;
};

const sourceLink = (ids: string[]): { label: string; url: string } | null => {
  const source = ids.map((id) => PLATFORMS.sources[id]).find(Boolean);
  if (!source) return null;
  const date =
    source.date.length === 7 ? new Date(`${source.date}-15T12:00:00Z`) : new Date(`${source.date}T12:00:00Z`);
  const formatted = Number.isNaN(date.getTime())
    ? source.date
    : date.toLocaleDateString(
        "en-NG",
        source.date.length === 7
          ? { month: "short", year: "numeric" }
          : { day: "numeric", month: "short", year: "numeric" },
      );
  return { label: `${source.outlet.split(" (")[0]}, ${formatted}`, url: source.url };
};

const trayPledges = (pledges: Pledge[]): TrayPledge[] =>
  pledges.map((p) => ({ topic: p.topic, text: p.text, source: sourceLink(p.src) }));

/** A compact policy summary for the side-by-side compare dialog. */
export function trayPolicy(c: Candidate): TrayPolicy {
  const own = platformFor(c.id);
  if (own)
    return {
      kind: own.status,
      title: own.title,
      pledges: trayPledges(own.pledges),
      note: own.note,
      noteSource: sourceLink(own.noteSrc ?? []),
    };
  const party = partyPlatform(c.party);
  if (party)
    return {
      kind: "party",
      title: party.title,
      pledges: trayPledges(party.pledges),
      note: party.note,
      noteSource: sourceLink(party.noteSrc ?? []),
    };
  return {
    kind: "none",
    title: null,
    pledges: [],
    note: "No published manifesto, pledges or party platform found yet.",
    noteSource: null,
  };
}

/**
 * Plain-language answers for the search box: offices, parties, election dates, how to
 * vote and promise topics. Small enough to ship with the page, so they show instantly
 * while the big place/candidate index is still loading. `k` holds the words people type.
 */
export type QuickEntry = { n: string; x: string; h: string; k: string; g: "Office" | "Party" | "Topic" | "Help" };
export function quickEntries(): QuickEntry[] {
  const pres = getRace("president");
  const presCands = pres ? candidatesOf(pres) : [];
  const day = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  const [fed, state] = ELECTIONS;
  const out: QuickEntry[] = [
    {
      g: "Office",
      n: "President of Nigeria",
      x: `${presCands.length} candidates · ${day(fed.date)}`,
      h: "/race/president",
      k: "president presidential presidency head of state commander in chief aso rock vice vp running mate national",
    },
    {
      g: "Office",
      n: "Senate",
      x: "Your senator depends on your LGA: type it to see your race",
      h: "/guide#offices",
      k: "senate senator senators senatorial district national assembly nass red chamber upper",
    },
    {
      g: "Office",
      n: "House of Representatives",
      x: "Your rep depends on your LGA or ward: type it to see your race",
      h: "/guide#offices",
      k: "house representatives reps rep honourable federal constituency national assembly nass green chamber lower",
    },
    {
      g: "Office",
      n: "Governor",
      x: `Pick your state to see its governorship race · ${day(state.date)}`,
      h: "/state",
      k: "governor governorship gubernatorial deputy governor state government",
    },
    {
      g: "Office",
      n: "State House of Assembly",
      x: "Your state lawmaker depends on your LGA: type it to see your race",
      h: "/guide#offices",
      k: "state house assembly sha state constituency lawmaker legislator house of assembly",
    },
    {
      g: "Help",
      n: "When is the election?",
      x: `President & National Assembly: ${day(fed.date)} · Governor & State Assembly: ${day(state.date)}`,
      h: "/guide#offices",
      k: "when date dates day election day timetable schedule january february 2027 countdown how long vote date",
    },
    {
      g: "Help",
      n: "How to vote on election day",
      x: "PVC, accreditation with BVAS, and casting your ballot",
      h: "/guide#day",
      k: "how vote voting process polling unit pvc voter card permanent bvas accreditation queue thumbprint ballot paper what to bring id register registration cvr",
    },
    {
      g: "Help",
      n: "Find your polling unit code",
      x: "It's on your voter's card: four numbers like 24/14/05/012",
      h: "/guide#day",
      k: "polling unit code pu number where do i vote voting centre location card",
    },
    {
      g: "Help",
      n: "What the qualifications mean",
      x: "FSLC, WASC, OND, HND, B.Sc and more, in plain words",
      h: "/guide#qualifications",
      k: "qualification qualifications education certificate degree school fslc wasc ssce ond hnd bsc phd masters educated",
    },
    {
      g: "Help",
      n: "Where the data comes from",
      x: "INEC's published lists, checked daily, and how to send a correction",
      h: "/data",
      k: "inec source sources data official list correction mistake wrong error report affidavit",
    },
    {
      g: "Topic",
      n: "What the presidential candidates promise",
      x: "Manifestos and reported pledges, topic by topic, with sources",
      h: "/promises",
      k: "promise promises manifesto manifestos pledge pledges plan plans agenda policy policies campaign",
    },
  ];
  const TOPIC_WORDS: Record<string, string> = {
    Economy:
      "economy economic inflation naira dollar exchange rate prices cost of living tax taxes debt budget gdp poverty money business investment",
    Jobs: "jobs job employment unemployment youth work wages salary minimum wage",
    "Fuel and power": "fuel petrol subsidy electricity power light nepa energy oil gas refinery",
    Security: "security insecurity bandits banditry kidnapping terrorism boko haram police army crime",
    Education: "education schools school university universities asuu teachers students fees",
    Health: "health hospital hospitals doctors healthcare medicine insurance",
    Infrastructure: "infrastructure roads road rail railway bridges transport housing",
    Agriculture: "agriculture farming farmers food prices food security herders",
    Governance: "governance corruption restructuring federalism power devolution justice courts",
  };
  for (const t of PLATFORMS.topics)
    out.push({
      g: "Topic",
      n: `Promises on ${t.toLowerCase()}`,
      x: "What the presidential candidates say, with sources",
      h: `/promises#topic-${t.toLowerCase().replace(/\W+/g, "-")}`,
      k: `${t.toLowerCase()} ${TOPIC_WORDS[t] ?? ""}`,
    });
  out.push({
    g: "Help",
    n: "Who decides what",
    x: "Which office controls fuel, the naira, roads, schools, hospitals and security",
    h: "/who-decides",
    k: "who decides controls responsible power powers federal state local government lga chairman job duties role constitution blame",
  });
  out.unshift({
    g: "Topic",
    n: "The economy in eight numbers",
    x: "Inflation, the naira, petrol, jobs, minimum wage, budget, debt and state allocations",
    h: "/economy",
    k: "economy economic numbers statistics data cost of living nbs cbn",
  });
  const EWORDS: Record<string, string> = {
    inflation: "inflation prices cost of living expensive food prices cpi",
    naira: "naira dollar exchange rate forex fx usd black market parallel",
    petrol: "petrol fuel pms pump price litre",
    jobs: "unemployment jobs jobless work employment",
    wage: "minimum wage salary pay workers",
    budget: "budget spending appropriation federal budget",
    debt: "debt borrowing loans owe",
    faac: "faac allocation allocations federation account states money",
  };
  for (const e of INDICATORS)
    out.push({
      g: "Topic",
      n: `${e.title}: ${e.value}`,
      x: `${e.asOf}. ${e.plain}`,
      h: `/economy#${e.id}`,
      k: `${EWORDS[e.id] ?? ""} economy now today current latest how much rate`,
    });
  for (const i of ISSUES)
    out.push({
      g: "Help",
      n: `Who controls ${i.issue.toLowerCase()}?`,
      x: `${i.who}.`,
      h: `/who-decides#issue-${i.id}`,
      k: `${i.words} who controls responsible decide`,
    });
  for (const t of GLOSSARY)
    out.push({
      g: "Help",
      n: t.term === t.term.toUpperCase() ? `What is ${t.term}?` : `What does “${t.term.toLowerCase()}” mean?`,
      x: t.short,
      h: `/who-decides#${t.id}`,
      k: `${t.term.toLowerCase()} ${t.words ?? ""} meaning mean definition`,
    });
  for (const [code, name] of Object.entries(ALL_PARTIES)) {
    const c = presCands.find((p) => p.party === code);
    out.push({
      g: "Party",
      n: `${name} (${code})`,
      x: c
        ? `Presidential candidate: ${c.name}. Type your LGA to see their local candidates`
        : "No presidential candidate. Type your LGA to see their local candidates",
      h: c ? `/candidate/${c.id}` : "/race/president",
      k: `${code.toLowerCase()} ${name.toLowerCase()} party`,
    });
  }
  return out;
}
