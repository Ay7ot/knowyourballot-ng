"""Dump raw table cells and word positions from a few INEC PDFs, to tune the parser."""
import glob, hashlib, json, os, sys
import pdfplumber

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
want = sys.argv[1:]
out = {}
for f in glob.glob(os.path.join(ROOT, ".cache", "inec", "*.pdf")):
    pass
cands = json.load(open(os.path.join(ROOT, "data", "candidates", "presidential.json")))["documents"]
urls = [cands[0]["url"]]
for o in ("governorship", "senate", "reps", "assembly"):
    urls.append(json.load(open(os.path.join(ROOT, "data", "candidates", f"{o}.json")))["documents"][0]["url"])
for url in urls:
    fn = os.path.join(ROOT, ".cache", "inec", hashlib.sha1(url.encode()).hexdigest() + ".pdf")
    with pdfplumber.open(fn) as pdf:
        p = pdf.pages[0]
        t = p.find_tables()
        out[url] = {
            "pages": len(pdf.pages),
            "tables": [[[c for c in row] for row in tb.extract()[:5]] for tb in t],
            "rows": [[list(c) if c else None for c in r.cells] for r in (t[0].rows[:4] if t else [])],
            "words": [{k: w[k] for k in ("text", "x0", "top", "upright")} for w in p.extract_words(extra_attrs=["upright"])[:160]],
            "chars_nonupright": "".join(c["text"] for c in p.chars if not c.get("upright", True))[:200],
        }
json.dump(out, open(os.path.join(ROOT, "data", "candidates", "_debug.json"), "w"), indent=1)
