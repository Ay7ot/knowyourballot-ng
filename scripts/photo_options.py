"""List freely licensed Commons photos of one person, for a human to pick the best.

Usage: photo_options.py <candidate id> <Commons category, e.g. "Peter Obi"> [extra search words]
Writes review/<candidate id>/options.json and numbered 320px thumbnails.
"""
import io, json, re, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from fetch_candidate_photos import api, COMMONS, FREE, NONFREE, UA  # noqa: E402
import urllib.request

pid, cat = sys.argv[1], sys.argv[2]
extra = " ".join(sys.argv[3:]) or cat
out = Path(__file__).resolve().parent.parent / "review" / pid
out.mkdir(parents=True, exist_ok=True)

titles: list[str] = []
res = api(COMMONS, action="query", list="categorymembers", cmtitle=f"Category:{cat}", cmtype="file", cmlimit=100)
titles += [m["title"] for m in res.get("query", {}).get("categorymembers", [])]
res = api(COMMONS, action="query", list="search", srnamespace=6, srlimit=50, srsearch=f'"{extra}" filetype:bitmap')
titles += [m["title"] for m in res.get("query", {}).get("search", []) if m["title"] not in titles]

options = []
for i in range(0, len(titles), 40):
    res = api(COMMONS, action="query", titles="|".join(titles[i:i + 40]), prop="imageinfo|categories", cllimit=50,
              iiprop="url|size|extmetadata", iiurlwidth=320)
    for p in res.get("query", {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [None])[0]
        if not ii:
            continue
        meta = ii.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        if not FREE.search(lic) or NONFREE.search(lic):
            continue
        cats = [c["title"].removeprefix("Category:") for c in p.get("categories", [])]
        options.append({
            "file": p["title"].removeprefix("File:"), "width": ii.get("width"), "height": ii.get("height"),
            "license": lic, "artist": re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", ""))[:100],
            "date": re.sub(r"<[^>]+>", "", meta.get("DateTimeOriginal", {}).get("value", ""))[:40],
            "description": re.sub(r"<[^>]+>", "", meta.get("ImageDescription", {}).get("value", ""))[:200],
            "inCategory": cat in cats, "thumb": ii.get("thumburl"),
        })
options.sort(key=lambda o: (not o["inCategory"], -(o["width"] or 0) * (o["height"] or 0)))
for n, o in enumerate(options[:30], 1):
    o["n"] = n
    try:
        with urllib.request.urlopen(urllib.request.Request(o["thumb"], headers={"User-Agent": UA}), timeout=60) as r:
            Image.open(io.BytesIO(r.read())).convert("RGB").save(out / f"{n:02d}.jpg", quality=85)
    except Exception as e:  # noqa: BLE001
        o["error"] = str(e)
(out / "options.json").write_text(json.dumps(options[:30], indent=1, ensure_ascii=False))
print(f"{len(options)} free images; saved {min(30, len(options))}")
