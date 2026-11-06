#!/usr/bin/env python3
"""Download INEC's published 2027 candidate lists and turn them into JSON.

Runs in GitHub Actions (see .github/workflows/ingest.yml). It:
  1. reads the INEC press pages listed in data/sources.json and collects every PDF they link to,
  2. downloads each PDF into .cache/inec/ (sha256 recorded for provenance),
  3. parses the candidate tables with pdfplumber,
  4. writes data/candidates/<office>.json and data/candidates/_report.json.

Nothing here is typed in by hand: every candidate row comes from an INEC document,
and each row keeps the URL and page number it came from.
"""
import hashlib, html, json, os, re, sys, time, urllib.parse, urllib.request

import pdfplumber

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache", "inec")
OUT = os.path.join(ROOT, "data", "candidates")
UA = "KnowYourBallotNG/1.0 (+https://github.com/Ay7ot/knowyourballot-ng)"

HEADER_KEYS = {
    "sn": [r"^s/?n$", r"^s/?no\.?$", r"^serial"],
    "state": [r"^state$"],
    "constituency": [r"constituency", r"district"],
    "position": [r"^position", r"^office"],
    "name": [r"name"],
    "party": [r"^party", r"political party"],
    "pwd": [r"^pwd", r"disab"],
    "age": [r"^age"],
    "gender": [r"^gender", r"^sex"],
    "qualification": [r"qualif"],
    "remarks": [r"remark"],
}


def fetch(url, binary=False, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=90) as r:
                data = r.read()
                return data if binary else data.decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            if i == tries - 1:
                raise
            print(f"  retry {url}: {e}", file=sys.stderr)
            time.sleep(2 ** (i + 1))


def pdf_links(page_url):
    body = fetch(page_url)
    out = []
    for m in re.finditer(r'href="([^"]+\.pdf)"', body, re.I):
        href = html.unescape(m.group(1))
        out.append(urllib.parse.urljoin(page_url, href).replace(" ", "%20"))
    return list(dict.fromkeys(out))


def clean(s):
    if s is None:
        return ""
    return re.sub(r"\s+", " ", str(s).replace("\n", " ")).strip()


def map_header(row):
    cols = {}
    for i, cell in enumerate(row):
        c = clean(cell).lower()
        if not c:
            continue
        for key, pats in HEADER_KEYS.items():
            if key in cols:
                continue
            if any(re.search(p, c) for p in pats):
                # "NAME OF CANDIDATE" vs "STATE CONSTITUENCY": take first sensible match.
                if key == "name" and ("party" in c or "constituency" in c):
                    continue
                cols[key] = i
                break
    return cols if {"name", "party"} <= cols.keys() else None


def strip_watermark(page):
    """INEC pages carry a large 'INEC' watermark whose letters leak into cells. Drop oversized chars."""
    sizes = sorted(c["size"] for c in page.chars)
    if not sizes:
        return page
    median = sizes[len(sizes) // 2]
    return page.filter(lambda o: o.get("object_type") != "char" or o.get("size", 0) <= median * 1.8)


def cell_lines(page, bbox):
    """Words inside a cell grouped into lines: [(top, text)]."""
    if not bbox:
        return []
    x0, top, x1, bottom = bbox
    words = page.crop((x0 + 0.5, top + 0.5, x1 - 0.5, bottom - 0.5), strict=False).extract_words(keep_blank_chars=False)
    lines = []
    for w in sorted(words, key=lambda w: (round(w["top"]), w["x0"])):
        if lines and abs(lines[-1][0] - w["top"]) < 3.5:
            lines[-1][1].append(w["text"])
        else:
            lines.append([w["top"], [w["text"]]])
    return [(t, " ".join(ws)) for t, ws in lines]


def split_two(lines):
    """Split a two-person cell (candidate + running mate) at the widest gap between lines.
    Lines of one entry sit ~15pt apart; the break between entries is wider (~19-20pt)."""
    if not lines:
        return "", ""
    if len(lines) == 1:
        return lines[0][1], ""
    gaps = [(lines[i + 1][0] - lines[i][0], i) for i in range(len(lines) - 1)]
    g, i = max(gaps)
    if len(lines) > 2 and g < 17:
        i = len(lines) // 2 - 1  # no clear paragraph break: fall back to halves
    return " ".join(t for _, t in lines[: i + 1]), " ".join(t for _, t in lines[i + 1:])


PAIR_FIELDS = ("name", "pwd", "age", "gender", "qualification", "state")


def parse_pdf(path, url, office):
    rows, header = [], None
    paired = office in ("presidential", "governorship")
    with pdfplumber.open(path) as pdf:
        for pno, raw_page in enumerate(pdf.pages, start=1):
            page = strip_watermark(raw_page)
            for tb in page.find_tables():
                data = tb.extract()
                for ri, raw in enumerate(data):
                    h = map_header(raw)
                    if h:
                        header = h
                        continue
                    if not header:
                        continue
                    get = lambda k: clean(raw[header[k]]) if k in header and header[k] < len(raw) else ""
                    name, party = get("name"), get("party")
                    if not name or not party or name.lower().startswith("name"):
                        continue
                    row = {
                        "sn": get("sn"), "state": get("state"), "constituency": get("constituency"),
                        "position": get("position"), "name": name, "party": party, "pwd": get("pwd"),
                        "age": get("age"), "gender": get("gender"), "qualification": get("qualification"),
                        "remarks": get("remarks"), "source": {"url": url, "page": pno},
                    }
                    if paired and ri < len(tb.rows):
                        cells = tb.rows[ri].cells
                        mate = {}
                        for k in PAIR_FIELDS:
                            if k in header and header[k] < len(cells):
                                a, b = split_two(cell_lines(page, cells[header[k]]))
                                row[k], mate[k] = a, b
                        row["position"] = "principal"
                        row["mate"] = mate
                    rows.append(row)
    last = {}
    for r in rows:
        for k in ("state", "constituency"):
            if r[k]:
                last[k] = r[k]
            elif k in last:
                r[k] = last[k]
    return rows


def main():
    sources = json.load(open(os.path.join(ROOT, "data", "sources.json")))
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    report = {"generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "offices": {}}

    for office, cfg in sources["offices"].items():
        urls = []
        for page in cfg.get("press_pages", []):
            try:
                found = pdf_links(page)
                print(f"[{office}] {page}: {len(found)} pdf links")
                urls += found
            except Exception as e:  # noqa: BLE001
                print(f"[{office}] could not read {page}: {e}", file=sys.stderr)
        fallback = cfg.get("fallback_documents", [])
        if not urls:
            urls, fallback = fallback, []
        urls = list(dict.fromkeys(urls))
        docs, rows = [], []
        for url in urls:
            fn = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + ".pdf")
            try:
                if not os.path.exists(fn):
                    data = fetch(url, binary=True)
                    open(fn, "wb").write(data)
                data = open(fn, "rb").read()
                if not data.startswith(b"%PDF"):
                    raise ValueError("not a PDF")
                got = parse_pdf(fn, url, office)
                docs.append({"url": url, "sha256": hashlib.sha256(data).hexdigest(), "rows": len(got)})
                rows += got
                print(f"[{office}] {url.rsplit('/', 1)[-1]}: {len(got)} rows")
            except Exception as e:  # noqa: BLE001
                docs.append({"url": url, "error": str(e)})
                print(f"[{office}] FAILED {url}: {e}", file=sys.stderr)
        # States missing from the per-state documents are filled from INEC's consolidated list.
        covered = {re.sub(r"[^a-z]", "", r["state"].lower()) for r in rows}
        for url in fallback:
            fn = os.path.join(CACHE, hashlib.sha1(url.encode()).hexdigest() + ".pdf")
            try:
                if not os.path.exists(fn):
                    open(fn, "wb").write(fetch(url, binary=True))
                data = open(fn, "rb").read()
                got = [r for r in parse_pdf(fn, url, office) if re.sub(r"[^a-z]", "", r["state"].lower()) not in covered]
                docs.append({"url": url, "sha256": hashlib.sha256(data).hexdigest(), "rows": len(got),
                             "note": "consolidated list, used only for states missing from the per-state documents"})
                rows += got
                print(f"[{office}] fallback {url.rsplit('/', 1)[-1]}: {len(got)} rows for uncovered states")
            except Exception as e:  # noqa: BLE001
                docs.append({"url": url, "error": str(e)})
        json.dump({"office": office, "documents": docs, "rows": rows},
                  open(os.path.join(OUT, f"{office}.json"), "w"), indent=1, ensure_ascii=False)
        report["offices"][office] = {"documents": len(docs), "rows": len(rows),
                                     "failed": [d["url"] for d in docs if "error" in d]}
    json.dump(report, open(os.path.join(OUT, "_report.json"), "w"), indent=1)
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main()
