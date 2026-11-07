import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));
const exists = (path) => existsSync(new URL(path, root));

const ballot = read("data/ballot.json");
const geo = read("data/geo.json");
const parties = read("data/parties.json");
const photos = read("data/candidate_photos.json");
const official = read("data/official_photos.json");
const logos = read("data/party_logos.json");
const snapshot = read("tests/fixtures/data-ids.json");

const unique = (values) => new Set(values).size === values.length;

test("ballot has every office and plausible counts", () => {
  for (const office of ["presidential", "senate", "reps", "governorship", "assembly"]) {
    assert.equal(ballot.offices[office]?.status, "loaded", `${office} is not loaded`);
  }
  assert.ok(ballot.candidates.length >= 15_000, "candidate count fell below 15,000");
  assert.ok(ballot.races.length >= 1_400, "race count fell below 1,400");
  assert.match(ballot.generatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
});

test("race and candidate ids are unique", () => {
  assert.ok(unique(ballot.races.map((r) => r.id)), "duplicate race id");
  assert.ok(unique(ballot.candidates.map((c) => c.id)), "duplicate candidate id");
  assert.ok(unique(ballot.assembly.map((a) => a.id)), "duplicate assembly constituency id");
});

test("every relationship resolves", () => {
  const raceIds = new Set(ballot.races.map((r) => r.id));
  const candidateIds = new Set(ballot.candidates.map((c) => c.id));
  for (const c of ballot.candidates) {
    assert.ok(raceIds.has(c.race), `${c.id} points at missing race ${c.race}`);
  }
  for (const r of ballot.races) {
    for (const id of r.candidates) {
      assert.ok(candidateIds.has(id), `${r.id} points at missing candidate ${id}`);
    }
  }
});

test("every candidate has an INEC source and a known party", () => {
  for (const c of ballot.candidates) {
    assert.ok(c.source?.url, `${c.id} has no source url`);
    assert.ok(Number.isInteger(c.source.page) && c.source.page > 0, `${c.id} has no source page`);
    assert.match(c.source.url, /^https:\/\/(www\.)?inecnigeria\.org\//, `${c.id} has a non-INEC source`);
    assert.doesNotMatch(c.party, /\s/, `${c.id} has an unnormalised party code "${c.party}"`);
    assert.ok(parties[c.party], `${c.id} has unknown party ${c.party}`);
  }
});

test("geography relationships resolve", () => {
  const lgaIds = new Set(geo.lgas.map((l) => l.id));
  const districtIds = new Set([...geo.senatorial, ...geo.federal].map((d) => d.id));
  assert.equal(geo.states.length, 37);
  assert.equal(geo.lgas.length, 774);
  assert.ok(unique(geo.lgas.map((l) => l.id)), "duplicate LGA id");
  assert.ok(unique(geo.wards.map((w) => w.id)), "duplicate ward id");
  for (const lga of geo.lgas) {
    assert.ok(districtIds.has(lga.senatorial), `${lga.id} has missing senate district`);
    assert.ok(lga.federal.length > 0, `${lga.id} has no federal constituency`);
    for (const id of lga.federal) {
      assert.ok(districtIds.has(id), `${lga.id} has missing federal district ${id}`);
    }
  }
  for (const ward of geo.wards) {
    assert.ok(lgaIds.has(ward.lga), `${ward.id} has missing LGA ${ward.lga}`);
  }
  for (const d of [...geo.senatorial, ...geo.federal]) {
    for (const id of d.lgas) {
      assert.ok(lgaIds.has(id), `${d.id} has missing LGA ${id}`);
    }
  }
});

test("assembly constituencies and races agree", () => {
  const assemblyIds = new Set(ballot.assembly.map((a) => a.id));
  const stateCodes = new Set(geo.states.map((s) => s.code));
  const lgaIds = new Set(geo.lgas.map((l) => l.id));
  for (const a of ballot.assembly) {
    assert.ok(stateCodes.has(a.state), `${a.id} has unknown state ${a.state}`);
    for (const id of a.lgas) {
      assert.ok(lgaIds.has(id), `${a.id} has missing LGA ${id}`);
    }
  }
  for (const r of ballot.races.filter((r) => r.office === "assembly")) {
    const district = r.id.replace(/^sha--/, "");
    assert.ok(assemblyIds.has(district), `${r.id} has no assembly constituency`);
  }
  assert.equal(ballot.unmatched.length, 0, "unmatched rows need review");
});

test("photo and logo files exist", () => {
  for (const [id, photo] of Object.entries(photos.photos)) {
    assert.ok(exists(`public${photo.file}`), `missing photo ${photo.file} for ${id}`);
    const candidate = ballot.candidates.find((c) => c.id === id);
    if (candidate) assert.equal(photo.name, candidate.name, `${id} photo name mismatch`);
  }
  for (const [id, photo] of Object.entries(official)) {
    assert.ok(exists(`public${photo.file}`), `missing official photo ${photo.file} for ${id}`);
    const candidate = ballot.candidates.find((c) => c.id === id);
    if (candidate) assert.equal(photo.name, candidate.name, `${id} official photo name mismatch`);
  }
  for (const [code, logo] of Object.entries(logos)) {
    assert.ok(exists(`public${logo.file}`), `missing logo ${logo.file} for ${code}`);
  }
});

test("no stable id was removed", () => {
  const currentRaces = new Set(ballot.races.map((r) => r.id));
  const currentStates = new Set(geo.states.map((s) => s.slug));
  const currentLgas = new Set(geo.lgas.map((l) => l.id));
  const currentDistricts = new Set([...geo.senatorial, ...geo.federal].map((d) => d.id));
  const cases = [
    ["races", currentRaces, snapshot.races],
    ["states", currentStates, snapshot.states],
    ["lgas", currentLgas, snapshot.lgas],
    ["districts", currentDistricts, snapshot.districts],
  ];
  for (const [name, current, previous] of cases) {
    const removed = previous.filter((id) => !current.has(id));
    assert.deepEqual(
      removed,
      [],
      `${name} removed: ${removed.join(", ")}. Review the rename, then run npm run snapshot:ids.`,
    );
  }
});
