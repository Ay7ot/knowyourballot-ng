import test from "node:test";
import assert from "node:assert/strict";
import { computeListFit } from "../src/lib/list-position.ts";

test("opens below when there is room", () => {
  assert.deepEqual(computeListFit(380, 436, 0, 700, 56), { above: false, maxHeight: 244 });
});

test("flips above when a phone keyboard leaves no room below", () => {
  assert.deepEqual(computeListFit(250, 306, 0, 320, 0), { above: true, maxHeight: 230 });
});

test("stays below when the visual viewport is panned", () => {
  assert.deepEqual(computeListFit(250, 306, 200, 300, 0), { above: false, maxHeight: 174 });
});

test("flips above without going under the sticky header", () => {
  assert.deepEqual(computeListFit(250, 306, 0, 400, 56), { above: true, maxHeight: 174 });
});

test("hides the list when its input is off screen", () => {
  assert.deepEqual(computeListFit(700, 756, 0, 500, 0), { above: false, maxHeight: 0 });
});

test("never returns a negative height", () => {
  assert.deepEqual(computeListFit(5, 61, 0, 40, 0), { above: false, maxHeight: 0 });
});
