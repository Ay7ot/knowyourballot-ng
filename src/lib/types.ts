export type Office = "president" | "senate" | "rep" | "governor" | "assembly";

export interface State {
  code: string;
  slug: string;
  name: string;
  short: string;
  zone: string;
  governorship: boolean;
  assembly: boolean;
}
export interface Lga {
  id: string;
  state: string;
  name: string;
  slug: string;
  senatorial: string;
  federal: string[];
  lat?: number;
  lon?: number;
}
export interface Ward {
  id: string;
  lga: string;
  name: string;
  federal: string[];
}
export interface District {
  id: string;
  state: string;
  name: string;
  lgas: string[];
}
export interface Geo {
  states: State[];
  lgas: Lga[];
  wards: Ward[];
  senatorial: District[];
  federal: District[];
}

export interface Person {
  name: string;
  age: number | null;
  gender: "Male" | "Female" | null;
  pwd: string | null;
  qualifications: string | null;
}
export interface Candidate extends Person {
  id: string;
  race: string;
  office: Office;
  party: string;
  remarks: string | null;
  runningMate?: Person;
  source: { url: string; page: number };
}
export interface Race {
  id: string;
  office: Office;
  name: string;
  state: string | null;
  district: string | null;
  candidates: string[];
}
export interface SourceDoc {
  url: string;
  sha256?: string;
  rows?: number;
  error?: string;
}
export interface Ballot {
  generatedAt: string | null;
  offices: Record<"presidential" | "senate" | "reps" | "governorship" | "assembly", { status: "pending" | "loaded"; documents: SourceDoc[] }>;
  races: Race[];
  candidates: Candidate[];
  assembly: District[];
  unmatched: { office: string; reason: string; row: Record<string, unknown> }[];
}

export interface BallotSection {
  office: Office;
  status: "pending" | "loaded";
  note?: string;
  contests: { districtId: string; districtName: string; race: Race | null }[];
}

export interface SearchEntry {
  /** type: s=state l=lga w=ward d=senate district f=fed constituency a=assembly constituency c=candidate */
  t: "s" | "l" | "w" | "d" | "f" | "a" | "c";
  n: string; // label
  x: string; // context line
  h: string; // href
}
