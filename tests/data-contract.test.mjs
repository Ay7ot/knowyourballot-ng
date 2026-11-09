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
const platforms = read("data/platforms.json");
const map = read("data/nigeria-map.json");
const snapshot = read("tests/fixtures/data-ids.json");

const candidateIds = new Set(ballot.candidates.map((c) => c.id));
const principalId = (id) => (id.endsWith("--mate") ? id.slice(0, -6) : id);

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

test("photo, logo and platform keys belong to live candidates", () => {
  for (const [id, photo] of Object.entries(photos.photos)) {
    const principal = principalId(id);
    assert.ok(candidateIds.has(principal), `photo for missing candidate ${id}`);
    assert.ok(exists(`public${photo.file}`), `missing photo ${photo.file} for ${id}`);
    const candidate = ballot.candidates.find((c) => c.id === principal);
    const person = id.endsWith("--mate") ? candidate?.runningMate : candidate;
    if (person) assert.equal(photo.name, person.name, `${id} photo name mismatch`);
  }
  for (const [id, photo] of Object.entries(official)) {
    assert.ok(candidateIds.has(id), `official photo for missing candidate ${id}`);
    assert.ok(exists(`public${photo.file}`), `missing official photo ${photo.file} for ${id}`);
    const candidate = ballot.candidates.find((c) => c.id === id);
    if (candidate) assert.equal(photo.name, candidate.name, `${id} official photo name mismatch`);
  }
  for (const [code, logo] of Object.entries(logos)) {
    assert.ok(exists(`public${logo.file}`), `missing logo ${logo.file} for ${code}`);
  }
  for (const id of Object.keys(platforms.candidates)) {
    assert.ok(candidateIds.has(id), `platform for missing candidate ${id}`);
  }
});

test("map data covers every state", () => {
  assert.equal(map.viewBox.length, 4);
  assert.equal(map.states.length, 37);
  assert.ok(unique(map.states.map((s) => s.slug)), "duplicate map state");
  for (const state of geo.states) {
    const path = map.states.find((s) => s.slug === state.slug);
    assert.ok(path, `missing map path for ${state.slug}`);
    assert.ok(path.d.startsWith("M"), `bad path for ${state.slug}`);
    assert.equal(path.bbox.length, 4, `bad bbox for ${state.slug}`);
  }
});

test("every platform pledge has a resolvable source", () => {
  const groups = {
    ...Object.fromEntries(Object.entries(platforms.candidates).map(([id, platform]) => [`candidate ${id}`, platform])),
    ...Object.fromEntries(
      Object.entries(platforms.parties ?? {}).map(([code, platform]) => [`party ${code}`, platform]),
    ),
  };
  for (const [who, platform] of Object.entries(groups)) {
    assert.ok(["manifesto", "pledges", "awaiting"].includes(platform.status), `${who} has an unknown status`);
    if (platform.status === "pledges") {
      assert.ok(platform.pledges.length > 0, `${who} is pledges-only but has no pledges`);
      assert.equal(platform.document, null, `${who} is pledges-only but links a document`);
    }
    if (platform.status === "awaiting") {
      assert.equal(platform.pledges.length, 0, `${who} is awaiting a manifesto but has pledges`);
      assert.equal(platform.document, null, `${who} is awaiting a manifesto but links a document`);
    }
    if (platform.status === "manifesto" && !platform.document) {
      assert.ok(platform.pledges.length > 0, `${who} has a manifesto with no document and no pledges`);
    }
    if (platform.document) {
      assert.match(platform.document, /^https:\/\//, `${who} has a non-https document link`);
      assert.ok(
        ["full", "abridged", "website"].includes(platform.documentKind),
        `${who} does not say what its document link is (full, abridged or website)`,
      );
    }
    if (platform.documentPages !== undefined) {
      assert.ok(
        Number.isInteger(platform.documentPages) && platform.documentPages > 0,
        `${who} has an invalid document page count`,
      );
      assert.equal(platform.documentKind, "full", `${who} has a page count but is not marked as the full document`);
    }
    for (const noteSource of platform.noteSrc ?? []) {
      assert.ok(platforms.sources[noteSource], `${who} references missing note source ${noteSource}`);
    }
    for (const pledge of platform.pledges) {
      assert.ok(pledge.topic, `${who} has a pledge without a topic`);
      assert.ok(platforms.topics.includes(pledge.topic), `${who} has an unknown topic ${pledge.topic}`);
      assert.ok(pledge.text, `${who} has a pledge without text`);
      assert.ok(pledge.src.length > 0, `${who} has a pledge without a source`);
      if (pledge.page !== undefined) {
        assert.ok(Number.isInteger(pledge.page) && pledge.page > 0, `${who} has an invalid source page`);
        assert.equal(
          pledge.src.length,
          1,
          `${who} has a page number with multiple sources; the page cannot be attributed to one source`,
        );
      }
      for (const source of pledge.src) {
        assert.ok(platforms.sources[source], `${who} references missing source ${source}`);
      }
    }
  }
});

test("every platform URL is https", () => {
  for (const [id, source] of Object.entries(platforms.sources)) {
    assert.match(source.url, /^https:\/\//, `source ${id} is not https`);
  }
  for (const [id, platform] of Object.entries({
    ...platforms.candidates,
    ...Object.fromEntries(Object.entries(platforms.parties ?? {}).map(([code, p]) => [`party ${code}`, p])),
  })) {
    if (platform.document) assert.match(platform.document, /^https:\/\//, `${id} has a non-https document link`);
  }
});

test("the APC presidential manifesto is recorded with its document", () => {
  const apc = platforms.candidates["president--apc"];
  assert.ok(apc, "missing APC platform");
  assert.equal(apc.status, "manifesto");
  assert.equal(apc.documentKind, "full");
  assert.ok(apc.document?.startsWith("https://"), "APC manifesto has no document link");
  assert.equal(apc.documentPages, 109, "APC manifesto page count is wrong");
  assert.equal(apc.pledges.length, 17, "APC manifesto pledge count changed");
  assert.ok(
    apc.pledges.every((pledge) => Number.isInteger(pledge.page) && pledge.page > 0),
    "an APC pledge has no page reference",
  );
  const pages = new Set(apc.pledges.map((pledge) => pledge.page));
  for (const page of [18, 31, 49, 50, 79, 92, 94]) {
    assert.ok(pages.has(page), `APC manifesto has no commitment on page ${page}`);
  }
  const housing = apc.pledges.find((pledge) => pledge.text.startsWith("Deliver 154,800 housing units"));
  assert.equal(housing?.page, 49, "the housing dashboard commitment must cite p.49");
});

test("zero-pledge and abridged records have honest states", () => {
  const kwara = platforms.candidates["gov--kwara--pdp"];
  assert.equal(kwara.status, "awaiting");
  assert.equal(kwara.pledges.length, 0);
  const oyo = platforms.candidates["gov--oyo--apm"];
  assert.equal(oyo.status, "manifesto");
  assert.equal(oyo.documentKind, "abridged");
  assert.equal(oyo.pledges.length, 0);
});

test("no stable id was removed", () => {
  const currentCandidates = new Set(ballot.candidates.map((c) => c.id));
  const currentRaces = new Set(ballot.races.map((r) => r.id));
  const currentStates = new Set(geo.states.map((s) => s.slug));
  const currentLgas = new Set(geo.lgas.map((l) => l.id));
  const currentDistricts = new Set([...geo.senatorial, ...geo.federal].map((d) => d.id));
  const cases = [
    ["candidates", currentCandidates, snapshot.candidates],
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
