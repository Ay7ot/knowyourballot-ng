#!/usr/bin/env python3
"""Join INEC candidate rows (data/candidates/*.json) to the electoral map (data/geo.json).

Output: data/ballot.json, the single file the website reads.
Rows we cannot place on the map are kept in `unmatched` and shown on /data so nothing silently vanishes.
"""
import collections, difflib, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GEO = json.load(open(os.path.join(ROOT, "data", "geo.json")))
CAND_DIR = os.path.join(ROOT, "data", "candidates")

STATES = GEO["states"]
STATE_BY_KEY = {}
for s in STATES:
    for k in {s["name"], s["short"], s["slug"]}:
        STATE_BY_KEY[re.sub(r"[^a-z]", "", k.lower())] = s
for alias, slug in {"fct": "fct", "abuja": "fct", "federalcapitalterritory": "fct", "nassarawa": "nasarawa",
                    "akwaibom": "akwa-ibom", "crossriver": "cross-river"}.items():
    STATE_BY_KEY[alias] = next(s for s in STATES if s["slug"] == slug)

LGAS_BY_STATE = collections.defaultdict(list)
for l in GEO["lgas"]:
    LGAS_BY_STATE[l["state"]].append(l)


def norm(s):
    s = s.lower().replace("&", "/").replace(" and ", "/")
    s = re.sub(r"\b(federal|constituency|senatorial|district|zone|state)\b", " ", s)
    return re.sub(r"[^a-z0-9/ ]", "", re.sub(r"\s+", " ", s)).strip()


def tokens(s):
    return set(t for t in re.split(r"[/ ,\-]+", norm(s)) if t)


def find_state(name):
    return STATE_BY_KEY.get(re.sub(r"[^a-z]", "", name.lower()))


def best_match(name, options, key=lambda o: o["name"], cutoff=0.55):
    n = norm(name)
    tn = tokens(name)
    best, score = None, 0.0
    for o in options:
        on = norm(key(o))
        to = tokens(key(o))
        jac = len(tn & to) / max(1, len(tn | to))
        seq = difflib.SequenceMatcher(None, n, on).ratio()
        sc = max(jac, seq)
        if sc > score:
            best, score = o, sc
    return (best, score) if score >= cutoff else (None, score)


def title(s):
    s = clean_name(s)
    return " ".join(w if (len(w) <= 3 and w.isupper() and w in {"II", "III", "IV", "VI"}) else w.capitalize()
                    for w in s.split(" "))


def clean_name(s):
    return re.sub(r"\s+", " ", s).strip()


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def person(r):
    age = re.sub(r"[^0-9]", "", r.get("age", ""))
    g = r.get("gender", "").strip().upper()[:1]
    pwd = r.get("pwd", "").strip()
    return {
        "name": clean_name(r["name"]).title(),
        "age": int(age) if age and 18 <= int(age) <= 110 else None,
        "gender": {"M": "Male", "F": "Female"}.get(g),
        "pwd": None if pwd.lower() in {"", "none", "nil", "no", "n/a", "-"} else pwd,
        "qualifications": clean_name(r.get("qualification", "")) or None,
    }


def load(office):
    p = os.path.join(CAND_DIR, f"{office}.json")
    if not os.path.exists(p):
        return None
    return json.load(open(p))


def main():
    races, candidates, unmatched, offices, assembly_consts = {}, [], [], {}, {}

    def add_race(rid, office, name, state=None, district=None):
        races.setdefault(rid, {"id": rid, "office": office, "name": name, "state": state,
                               "district": district, "candidates": []})
        return races[rid]

    def add_candidate(race, row, mate=None):
        cid = f"{race['id']}--{slug(row['party'])}"
        n = 2
        while any(c["id"] == cid for c in candidates):
            cid = f"{race['id']}--{slug(row['party'])}-{n}"
            n += 1
        c = {"id": cid, "race": race["id"], "office": race["office"], "party": row["party"].strip().upper(),
             **person(row), "remarks": row.get("remarks") or None, "source": row["source"]}
        if mate:
            c["runningMate"] = person(mate)
        candidates.append(c)
        race["candidates"].append(cid)

    # ---- Presidential & governorship: pair principal with running mate ----
    for office, mate_re in (("presidential", r"vice"), ("governorship", r"deputy")):
        data = load(office)
        offices[office] = {"status": "pending" if not data else "loaded",
                           "documents": data["documents"] if data else []}
        if not data:
            continue
        groups = collections.OrderedDict()
        for r in data["rows"]:
            st = find_state(r["state"]) if office == "governorship" else None
            if office == "governorship" and not st:
                unmatched.append({"office": office, "reason": "unknown state", "row": r})
                continue
            key = (st["code"] if st else "NG", r["party"].strip().upper())
            groups.setdefault(key, []).append(r)
        for (sc, party), rs in groups.items():
            principal = next((r for r in rs if not re.search(mate_re, r.get("position", ""), re.I)), rs[0])
            mate = next((r for r in rs if r is not principal and re.search(mate_re, r.get("position", ""), re.I)), None)
            if office == "presidential":
                race = add_race("president", "president", "President of Nigeria")
            else:
                st = next(s for s in STATES if s["code"] == sc)
                race = add_race(f"gov--{st['slug']}", "governor", f"Governor of {st['short']}", state=sc)
            add_candidate(race, principal, mate)

    # ---- Senate & Reps: match the constituency to the map ----
    for office, layer, prefix, label in (("senate", "senatorial", "sen", "Senate"),
                                         ("reps", "federal", "rep", "House of Representatives")):
        data = load(office)
        offices[office] = {"status": "pending" if not data else "loaded",
                           "documents": data["documents"] if data else []}
        if not data:
            continue
        cache = {}
        for r in data["rows"]:
            st = find_state(r["state"])
            if not st:
                unmatched.append({"office": office, "reason": "unknown state", "row": r})
                continue
            key = (st["code"], r["constituency"])
            if key not in cache:
                opts = [d for d in GEO[layer] if d["state"] == st["code"]]
                if len(opts) == 1:
                    cache[key] = opts[0]
                else:
                    # Compare against both the district name and its LGA names.
                    def keyf(d):
                        names = [l["name"] for l in GEO["lgas"] if l["id"] in d["lgas"]]
                        return d["name"] + " " + "/".join(names)
                    m, _ = best_match(r["constituency"], opts)
                    if not m:
                        m, _ = best_match(r["constituency"], opts, key=keyf, cutoff=0.34)
                    cache[key] = m
            d = cache[key]
            if not d:
                unmatched.append({"office": office, "reason": "unknown constituency", "row": r})
                continue
            # Prefer INEC's own spelling of the constituency name.
            race = add_race(f"{prefix}--{d['id']}", office if office != "reps" else "rep",
                            title(r["constituency"]) if r["constituency"] else d["name"],
                            state=st["code"], district=d["id"])
            add_candidate(race, r)

    # ---- State Houses of Assembly: build constituencies from INEC's list, map to LGAs ----
    data = load("assembly")
    offices["assembly"] = {"status": "pending" if not data else "loaded",
                           "documents": data["documents"] if data else []}
    if data:
        for r in data["rows"]:
            st = find_state(r["state"])
            if not st or not r["constituency"]:
                unmatched.append({"office": "assembly", "reason": "unknown state/constituency", "row": r})
                continue
            cname = title(r["constituency"])
            aid = f"{st['slug']}--{slug(cname)}"
            if aid not in assembly_consts:
                base = re.sub(r"\b(i{1,3}|iv|v|vi{0,3}|[0-9]+|north|south|east|west|central)\b", " ",
                              cname.lower())
                m, _ = best_match(base, LGAS_BY_STATE[st["code"]], cutoff=0.6)
                if not m:
                    m, _ = best_match(cname, LGAS_BY_STATE[st["code"]], cutoff=0.6)
                assembly_consts[aid] = {"id": aid, "state": st["code"], "name": cname,
                                        "lgas": [m["id"]] if m else []}
            race = add_race(f"sha--{aid}", "assembly", cname, state=st["code"], district=aid)
            add_candidate(race, r)

    report = None
    rp = os.path.join(CAND_DIR, "_report.json")
    if os.path.exists(rp):
        report = json.load(open(rp))
    out = {
        "generatedAt": report["generated_at"] if report else None,
        "offices": offices,
        "races": list(races.values()),
        "candidates": candidates,
        "assembly": list(assembly_consts.values()),
        "unmatched": unmatched,
    }
    json.dump(out, open(os.path.join(ROOT, "data", "ballot.json"), "w"), separators=(",", ":"), ensure_ascii=False)
    print(f"races={len(races)} candidates={len(candidates)} assembly_constituencies={len(assembly_consts)} "
          f"unmatched={len(unmatched)} offices={ {k: v['status'] for k, v in offices.items()} }")


if __name__ == "__main__":
    main()
