import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (path) => JSON.parse(readFileSync(new URL(path, root), "utf8"));

const ballot = read("data/ballot.json");
const geo = read("data/geo.json");

const snapshot = {
  races: ballot.races.map((r) => r.id).sort(),
  states: geo.states.map((s) => s.slug).sort(),
  lgas: geo.lgas.map((l) => l.id).sort(),
  districts: [...geo.senatorial, ...geo.federal].map((d) => d.id).sort(),
};

mkdirSync(new URL("tests/fixtures/", root), { recursive: true });
writeFileSync(new URL("tests/fixtures/data-ids.json", root), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(
  `wrote tests/fixtures/data-ids.json: ${snapshot.races.length} races, ${snapshot.states.length} states, ` +
    `${snapshot.lgas.length} LGAs, ${snapshot.districts.length} districts`,
);
