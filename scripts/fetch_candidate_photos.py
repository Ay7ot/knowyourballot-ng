"""Find freely licensed photos of candidates on Wikidata/Wikimedia Commons, and keep only verified matches.

A Wikidata person is accepted for a candidate only if ALL of these hold:
  1. human (P31=Q5) with Nigerian citizenship (P27=Q1033), found by searching the candidate's name;
  2. at least two of the candidate's name words appear in the person's Wikidata label or aliases;
  3. EITHER their date of birth (P569) gives an age within 1 year of the age INEC printed,
     OR (no birth date on Wikidata) one of their parties (P102) is the candidate's party;
  4. exactly one Wikidata person passes 1-3 (ambiguous names are skipped);
  5. the image (P18) on Commons carries a free licence (CC0, public domain, CC BY, CC BY-SA).
Accepted photos go to public/candidates/{id}.webp with the author, licence and evidence in
data/candidate_photos.json, which the site shows as a credit line.
"""
import io, json, re, sys, time, unicodedata, urllib.parse, urllib.request
from datetime import date
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
UA = "KnowYourBallotNG/1.0 (https://github.com/Ay7ot/knowyourballot-ng; civic voter-information site)"
WD = "https://www.wikidata.org/w/api.php"
COMMONS = "https://commons.wikimedia.org/w/api.php"
OFFICES = set((sys.argv[1] if len(sys.argv) > 1 else "president,governor,senate").split(","))
AGE_REF = date(2026, 10, 1)  # INEC printed ages at nomination, autumn 2026
RECHECK_DAYS = 14
FREE = re.compile(r"^(cc0|cc[- ]by(-sa)?[- ]?\d|public domain|pd)", re.I)
NONFREE = re.compile(r"\b(nc|nd)\b|non-?commercial|no ?deriv", re.I)
STOP = {"alhaji", "chief", "dr", "engr", "prof", "hon", "barr", "mrs", "mr", "sen", "otunba", "arc", "pharm", "rev", "pastor", "mallam", "comrade", "amb"}


def api(base: str, **params) -> dict:
    params.setdefault("format", "json")
    url = f"{base}?{urllib.parse.urlencode(params)}"
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise
            time.sleep(2 ** attempt * 2)
            print(f"  retry {e}")
    return {}


def toks(s: str) -> set[str]:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return {t for t in re.split(r"[^a-z]+", s) if len(t) > 1 and t not in STOP}


def claim_ids(ent: dict, prop: str) -> list[str]:
    out = []
    for c in ent.get("claims", {}).get(prop, []):
        v = c.get("mainsnak", {}).get("datavalue", {}).get("value")
        if isinstance(v, dict) and "id" in v:
            out.append(v["id"])
        elif isinstance(v, str):
            out.append(v)
    return out


def birth_year(ent: dict) -> int | None:
    for c in ent.get("claims", {}).get("P569", []):
        t = c.get("mainsnak", {}).get("datavalue", {}).get("value", {}).get("time")
        if t:
            return int(t[1:5])
    return None


_party_labels: dict[str, set[str]] = {}


def party_names(qids: list[str]) -> set[str]:
    need = [q for q in qids if q not in _party_labels]
    if need:
        res = api(WD, action="wbgetentities", ids="|".join(need[:50]), props="labels|aliases", languages="en")
        for q, e in res.get("entities", {}).items():
            names = {e.get("labels", {}).get("en", {}).get("value", "")}
            names |= {a["value"] for a in e.get("aliases", {}).get("en", [])}
            _party_labels[q] = {n.lower() for n in names if n}
    return set().union(*(_party_labels.get(q, set()) for q in qids)) if qids else set()


def find_person(name: str, age: int | None, party: str, party_full: str | None) -> tuple[dict | None, str]:
    words = toks(name)
    if len(words) < 2:
        return None, "name too short to match safely"
    hits = api(WD, action="query", list="search", srlimit=8, srsearch=f"{' '.join(sorted(words))} haswbstatement:P31=Q5 haswbstatement:P27=Q1033")
    ids = [h["title"] for h in hits.get("query", {}).get("search", [])]
    if not ids:
        return None, "no Nigerian person on Wikidata with this name"
    ents = api(WD, action="wbgetentities", ids="|".join(ids), props="labels|aliases|claims|sitelinks", languages="en").get("entities", {})
    passing = []
    for q, e in ents.items():
        label = e.get("labels", {}).get("en", {}).get("value", "")
        names = [label] + [a["value"] for a in e.get("aliases", {}).get("en", [])]
        overlap = max((len(words & toks(n)) for n in names), default=0)
        if overlap < 2:
            continue
        by = birth_year(e)
        evidence = None
        if by and age:
            wd_age = AGE_REF.year - by
            if abs(wd_age - age) <= 1 or abs(wd_age - 1 - age) <= 1:
                evidence = f"born {by}, INEC age {age}"
            else:
                continue
        else:
            pn = party_names(claim_ids(e, "P102"))
            if party.lower() in pn or (party_full and party_full.lower() in pn):
                evidence = f"party on Wikidata matches {party}"
        if evidence:
            passing.append((q, e, label, evidence))
    if len(passing) != 1:
        return None, "no verified match" if not passing else f"ambiguous: {', '.join(p[0] for p in passing)}"
    q, e, label, evidence = passing[0]
    imgs = claim_ids(e, "P18")
    if not imgs:
        return None, f"{q} ({label}) has no photo on Wikidata"
    return {"qid": q, "label": label, "evidence": evidence, "image": imgs[0], "wiki": e.get("sitelinks", {}).get("enwiki", {}).get("title")}, "ok"


def commons_photo(filename: str) -> dict | None:
    res = api(COMMONS, action="query", titles=f"File:{filename}", prop="imageinfo", iiprop="url|extmetadata", iiurlwidth=320)
    for p in res.get("query", {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [None])[0]
        if not ii:
            return None
        meta = ii.get("extmetadata", {})
        lic = meta.get("LicenseShortName", {}).get("value", "")
        if not FREE.search(lic) or NONFREE.search(lic):
            return None
        artist = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", "")).strip() or "Unknown"
        return {"thumb": ii.get("thumburl") or ii["url"], "page": ii["descriptionurl"], "license": lic, "licenseUrl": meta.get("LicenseUrl", {}).get("value"), "artist": artist[:120]}
    return None


def main():
    ballot = json.loads((ROOT / "data" / "ballot.json").read_text())
    parties = json.loads((ROOT / "data" / "parties.json").read_text()) if (ROOT / "data" / "parties.json").exists() else {}
    path = ROOT / "data" / "candidate_photos.json"
    store = json.loads(path.read_text()) if path.exists() else {"photos": {}, "checked": {}}
    out_dir = ROOT / "public" / "candidates"
    out_dir.mkdir(parents=True, exist_ok=True)
    today = date.today()
    people = []
    for c in ballot["candidates"]:
        if c["office"] not in OFFICES:
            continue
        people.append((c["id"], c["name"], c["age"], c["party"]))
        if c.get("runningMate"):
            m = c["runningMate"]
            people.append((f"{c['id']}--mate", m["name"], m["age"], c["party"]))
    live = {p[0]: p[1] for p in people}
    # drop photos whose slot left the ballot or now holds a different person (substitutions)
    for pid in [k for k, v in store["photos"].items() if live.get(k) != v["name"]]:
        (out_dir / f"{pid}.webp").unlink(missing_ok=True)
        store["photos"].pop(pid)
        store["checked"].pop(pid, None)
    stats = {"ok": 0, "skip": 0, "miss": 0}
    for pid, name, age, party in people:
        last = store["checked"].get(pid)
        if pid in store["photos"] or (last and (today - date.fromisoformat(last)).days < RECHECK_DAYS):
            stats["skip"] += 1
            continue
        try:
            person, why = find_person(name, age, party, parties.get(party))
            photo = commons_photo(person["image"]) if person else None
            if person and not photo:
                why = f"{person['qid']}: photo licence not free"
            if photo:
                with urllib.request.urlopen(urllib.request.Request(photo["thumb"], headers={"User-Agent": UA}), timeout=60) as r:
                    img = Image.open(io.BytesIO(r.read())).convert("RGB")
                img.thumbnail((320, 320), Image.LANCZOS)
                img.save(out_dir / f"{pid}.webp", "WEBP", quality=82)
                store["photos"][pid] = {
                    "file": f"/candidates/{pid}.webp", "name": name, "wikidata": person["qid"], "wikidataLabel": person["label"],
                    "evidence": person["evidence"], "commons": photo["page"], "license": photo["license"],
                    "licenseUrl": photo["licenseUrl"], "artist": photo["artist"],
                }
                stats["ok"] += 1
                print(f"OK   {pid}: {name} -> {person['qid']} {person['label']} ({person['evidence']})")
            else:
                stats["miss"] += 1
                print(f"--   {pid}: {name}: {why}")
        except Exception as e:  # noqa: BLE001
            print(f"ERR  {pid}: {e}")
            continue
        store["checked"][pid] = today.isoformat()
        time.sleep(0.3)
    store["photos"] = dict(sorted(store["photos"].items()))
    store["checked"] = dict(sorted(store["checked"].items()))
    path.write_text(json.dumps(store, indent=1) + "\n")
    print(stats, f"{len(store['photos'])} photos on file")


if __name__ == "__main__":
    main()
