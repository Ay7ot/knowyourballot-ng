#!/usr/bin/env python3
"""Build the electoral geography used by the site.

Input:  data/raw/Nigeria_polling_units.csv.gz  (INEC IReV polling-unit register,
        compiled by github.com/Emeka-Onwuepe/Polling_Units_in_Nigeria)
        data/raw/lga_centroids.json            (LGA centroids, openadmindata.org, CC-BY-4.0)
Output: data/geo.json                          (states, LGAs, wards, senatorial districts,
                                                federal constituencies)
        public/data/pu/<state_code>.json       (polling unit code -> [ward, location])
"""
import csv, gzip, json, re, os, collections, difflib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw")

ZONES = {
    "North Central": ["benue", "kogi", "kwara", "nasarawa", "niger", "plateau", "fct"],
    "North East": ["adamawa", "bauchi", "borno", "gombe", "taraba", "yobe"],
    "North West": ["jigawa", "kaduna", "kano", "katsina", "kebbi", "sokoto", "zamfara"],
    "South East": ["abia", "anambra", "ebonyi", "enugu", "imo"],
    "South South": ["akwa ibom", "bayelsa", "cross river", "delta", "edo", "rivers"],
    "South West": ["ekiti", "lagos", "ogun", "ondo", "osun", "oyo"],
}
# States whose governorship elections are off-cycle and NOT on the Feb 2027 ballot.
OFF_CYCLE_GOV = {"anambra", "bayelsa", "edo", "ekiti", "imo", "kogi", "ondo", "osun"}

# Known typos in the source register.
FIXES = {
    "deltal": "delta", "ademawa": "adamawa", "nassarawa": "nasarawa", "nkokwa": "ndokwa",
}

ROMAN = {"i", "ii", "iii", "iv", "v", "vi"}
SMALL = {"and", "of"}


def fix(s):
    s = re.sub(r"\s+", " ", s.strip().lower())
    s = re.sub(r"\s*/\s*", "/", s)
    for a, b in FIXES.items():
        s = re.sub(rf"\b{a}\b", b, s)
    return s


def title(s):
    def word(w):
        if w in ROMAN:
            return w.upper()
        if w in SMALL:
            return w
        if w == "fct":
            return "FCT"
        return w[:1].upper() + w[1:]
    out = re.sub(r"[a-z0-9']+", lambda m: word(m.group(0)), s)
    return out[:1].upper() + out[1:]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def main():
    rows = list(csv.DictReader(gzip.open(os.path.join(RAW, "Nigeria_polling_units.csv.gz"), "rt")))
    states, lgas, wards = {}, {}, {}
    sen, fed = {}, {}
    pus = collections.defaultdict(dict)
    ward_reps = collections.defaultdict(set)

    for r in rows:
        st = fix(r["state"])
        sc = r["state_code"].zfill(2)
        lc, wc = r["lg_code"].zfill(2), r["ward_code"].zfill(2)
        lid, wid = f"{sc}-{lc}", f"{sc}-{lc}-{wc}"
        stn = "Federal Capital Territory" if st == "fct" else title(st)
        if sc not in states:
            zone = next(z for z, ss in ZONES.items() if st in ss)
            states[sc] = {
                "code": sc, "slug": "fct" if st == "fct" else slug(st), "name": stn,
                "short": "FCT" if st == "fct" else stn, "zone": zone,
                "governorship": st not in OFF_CYCLE_GOV and st != "fct",
                "assembly": st != "fct",
            }
        sslug = states[sc]["slug"]
        lname = re.sub(r"\s*\(lga:.*$", "", r["lg_des"]).strip()
        lname = title(fix(lname))
        wname = re.sub(r"\s*\(ward:.*$", "", r["ward_des"]).strip()
        wname = title(fix(wname))
        sname = title(fix(r["senatorial"]))
        if st == "fct":
            sname = "FCT"
        fname = title(fix(r["house_of_rep"]))
        sid = f"{sslug}--{slug(sname)}"
        fid = f"{sslug}--{slug(fname)}"
        sen.setdefault(sid, {"id": sid, "state": sc, "name": sname, "lgas": set()})["lgas"].add(lid)
        fed.setdefault(fid, {"id": fid, "state": sc, "name": fname, "lgas": set()})["lgas"].add(lid)
        lg = lgas.setdefault(lid, {"id": lid, "state": sc, "name": lname, "slug": slug(lname),
                                   "senatorial": sid, "federal": set()})
        lg["federal"].add(fid)
        wards.setdefault(wid, {"id": wid, "lga": lid, "name": wname})
        ward_reps[wid].add(fid)
        pcode = r["pu_code"].zfill(3)
        pus[sc][f"{lc}/{wc}/{pcode}"] = [wc, r["location"].strip(), fid]

    # Wards that straddle two federal constituencies keep a per-PU mapping; others don't need it.
    for wid, reps in ward_reps.items():
        wards[wid]["federal"] = sorted(reps)

    # Slug collisions inside a state (rare) get the LGA code appended.
    seen = collections.Counter((l["state"], l["slug"]) for l in lgas.values())
    for l in lgas.values():
        if seen[(l["state"], l["slug"])] > 1:
            l["slug"] = f"{l['slug']}-{l['id'].split('-')[1]}"

    cents = json.load(open(os.path.join(RAW, "lga_centroids.json")))
    cbystate = collections.defaultdict(list)
    for c in cents:
        stname = "fct" if c["state"].lower().startswith("federal") else c["state"].lower()
        cbystate[stname].append(c)
    missing = 0
    for l in lgas.values():
        st = states[l["state"]]
        key = "fct" if st["slug"] == "fct" else st["name"].lower()
        cands = cbystate.get(key, [])
        norm = lambda s: re.sub(r"[^a-z]", "", s.lower().replace("municipal area council", "municipal"))
        best = max(cands, key=lambda c: difflib.SequenceMatcher(None, norm(c["lga"]), norm(l["name"])).ratio(), default=None)
        if best and difflib.SequenceMatcher(None, norm(best["lga"]), norm(l["name"])).ratio() > 0.6:
            l["lat"], l["lon"] = round(best["lat"], 3), round(best["lon"], 3)
        else:
            missing += 1

    def fin(d):
        return {**d, "lgas": sorted(d["lgas"])}

    geo = {
        "states": sorted(states.values(), key=lambda s: s["name"]),
        "lgas": sorted(({**l, "federal": sorted(l["federal"])} for l in lgas.values()), key=lambda l: l["id"]),
        "wards": sorted(wards.values(), key=lambda w: w["id"]),
        "senatorial": sorted((fin(s) for s in sen.values()), key=lambda s: s["id"]),
        "federal": sorted((fin(f) for f in fed.values()), key=lambda f: f["id"]),
    }
    json.dump(geo, open(os.path.join(ROOT, "data", "geo.json"), "w"), separators=(",", ":"))
    os.makedirs(os.path.join(ROOT, "public", "data", "pu"), exist_ok=True)
    for sc, m in pus.items():
        # Only keep the federal constituency per PU for wards that are split.
        compact = {}
        for k, (wc, loc, fid) in m.items():
            lc = k.split("/")[0]
            wid = f"{sc}-{lc}-{wc}"
            compact[k] = [loc, fid] if len(ward_reps[wid]) > 1 else [loc]
        json.dump(compact, open(os.path.join(ROOT, "public", "data", "pu", f"{sc}.json"), "w"),
                  separators=(",", ":"), ensure_ascii=False)
    print(f"states={len(states)} lgas={len(lgas)} wards={len(wards)} senatorial={len(sen)} "
          f"federal={len(fed)} pus={sum(len(m) for m in pus.values())} lgas_without_centroid={missing}")


if __name__ == "__main__":
    main()
