import { readFileSync, writeFileSync } from "node:fs";

/**
 * Convert the geoBoundaries Nigeria ADM1 polygons into a compact SVG path file.
 * Source: geoBoundaries, GRID3, CC BY 4.0.
 * Download the simplified GeoJSON first, then run:
 *   node scripts/build_map.mjs /tmp/nga-states.geojson
 */
const source = process.argv[2] ?? "/tmp/nga-states.geojson";
const boundaries = JSON.parse(readFileSync(source, "utf8"));
const geo = JSON.parse(readFileSync(new URL("../data/geo.json", import.meta.url), "utf8"));

const counts = new Map();
for (const lga of geo.lgas) counts.set(lga.state, (counts.get(lga.state) ?? 0) + 1);

function slugName(name) {
  if (/federal capital territory/i.test(name)) return "fct";
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const rings = [];
for (const feature of boundaries.features) {
  const geometry = feature.geometry;
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const polygon of polygons) for (const ring of polygon) rings.push(ring);
}

const lons = rings.flatMap((ring) => ring.map(([lon]) => lon));
const lats = rings.flatMap((ring) => ring.map(([, lat]) => lat));
const minLon = Math.min(...lons);
const maxLon = Math.max(...lons);
const minLat = Math.min(...lats);
const maxLat = Math.max(...lats);
const meanLat = (((minLat + maxLat) / 2) * Math.PI) / 180;
const xSpan = (maxLon - minLon) * Math.cos(meanLat);
const ySpan = maxLat - minLat;
const width = 100;
const height = (width * ySpan) / xSpan;

const project = ([lon, lat]) => [((lon - minLon) / xSpan) * width, ((maxLat - lat) / ySpan) * height];

function distanceToSegment(point, start, end) {
  const [x, y] = point;
  const [x1, y1] = start;
  const [x2, y2] = end;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function simplify(points, tolerance) {
  if (points.length <= 2) return points;
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const distance = distanceToSegment(points[i], points[0], points[points.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance <= tolerance) return [points[0], points[points.length - 1]];
  return [...simplify(points.slice(0, index + 1), tolerance), ...simplify(points.slice(index), tolerance).slice(1)];
}

function pathForRing(ring, tolerance) {
  const projected = ring.map(project);
  const simplified = simplify(projected, tolerance);
  const points = simplified.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`);
  return `M${points.join("L")}Z`;
}

const states = boundaries.features
  .map((feature) => {
    const name = feature.properties.shapeName;
    const slug = slugName(name);
    const state = geo.states.find((s) => s.slug === slug);
    if (!state) throw new Error(`No state for ${name} (${slug})`);
    const geometry = feature.geometry;
    const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    const path = polygons.flatMap((polygon) => polygon.map((ring) => pathForRing(ring, 0.12))).join("");
    const projected = [];
    for (const polygon of polygons)
      for (const ring of polygon) for (const point of ring) projected.push(project(point));
    const xs = projected.map(([x]) => x);
    const ys = projected.map(([, y]) => y);
    const pad = 0.8;
    const minX = Math.max(0, Math.min(...xs) - pad);
    const minY = Math.max(0, Math.min(...ys) - pad);
    const maxX = Math.min(width, Math.max(...xs) + pad);
    const maxY = Math.min(height, Math.max(...ys) + pad);
    return {
      slug,
      name: state.name,
      d: path,
      bbox: [minX, minY, maxX - minX, maxY - minY],
      count: counts.get(state.code) ?? 0,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

const output = {
  source: "geoBoundaries NGA ADM1 (GRID3), CC BY 4.0",
  viewBox: [0, 0, width, height],
  bounds: { minLon, minLat, maxLon, maxLat },
  states,
};

writeFileSync(new URL("../data/nigeria-map.json", import.meta.url), `${JSON.stringify(output)}\n`);
console.log(
  `wrote data/nigeria-map.json: ${states.length} states, ${(JSON.stringify(output).length / 1024).toFixed(1)} KB`,
);
