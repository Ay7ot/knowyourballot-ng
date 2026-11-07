import assert from "node:assert/strict";
import { test } from "node:test";
import { formatPollingUnit, matchPollingUnit } from "../src/lib/polling-unit.ts";

test("accepts the separators people type", () => {
  const expected = ["24", "14", "05", "012"];
  for (const value of ["24/14/05/012", "24-14-05-012", "24.14.05.012", "24·14·05·012", "24 14 05 012"]) {
    assert.deepEqual(matchPollingUnit(value), expected, value);
  }
});

test("trims surrounding whitespace", () => {
  assert.deepEqual(matchPollingUnit("  24/14/05/012  "), ["24", "14", "05", "012"]);
});

test("rejects an incomplete code", () => {
  assert.equal(matchPollingUnit("24/14/05"), null);
});

test("formats a code with slashes", () => {
  assert.equal(formatPollingUnit(["24", "14", "05", "012"]), "24/14/05/012");
});
