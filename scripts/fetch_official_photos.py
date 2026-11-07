"""Use a candidate's own profile picture from their official X (Twitter) account.

data/official_handles.json lists, per candidate id: the INEC name, the X handle, and how we know the
account is the candidate's own ("why"). Only accounts we can tie to the person go in that file, e.g. one
listed on their Wikidata entry (P2002), linked from their official website, or verified and widely cited.
These photos are NOT freely licensed: they're the campaign's own publicity image, shown with a credit for
voter information, and taken down if the candidate asks. Output: public/candidates/official/{id}.webp and
data/official_photos.json.
"""
import io, json, re, sys, time, urllib.request
from datetime import date
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
UA = "KnowYourBallotNG/1.0 (https://github.com/Ay7ot/knowyourballot-ng; civic voter-information site)"


def get(url: str) -> bytes:
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
        return r.read()


def wikidata_handles(qid: str) -> set[str]:
    """X usernames on the person's Wikidata entry (P2002)."""
    d = json.loads(get(f"https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P2002&entity={qid}"))
    return {c["mainsnak"]["datavalue"]["value"].lower() for c in d.get("claims", {}).get("P2002", []) if "datavalue" in c["mainsnak"]}


def avatar(handle: str) -> tuple[bytes, dict]:
    user = json.loads(get(f"https://api.fxtwitter.com/{handle}"))["user"]
    base = user["avatar_url"]
    for size in ("", "_400x400"):  # original upload first, then 400px
        url = re.sub(r"_(normal|bigger|mini|200x200|400x400)(\.\w+)$", rf"{size}\2", base)
        try:
            return get(url), {"avatar": url, "displayName": user.get("name"), "verified": bool((user.get("verification") or {}).get("verified"))}
        except Exception as e:
            print(f"  {url}: {e}")
    raise RuntimeError("no avatar")


def main():
    handles = json.loads((ROOT / "data/official_handles.json").read_text())
    out_path = ROOT / "data/official_photos.json"
    store = json.loads(out_path.read_text()) if out_path.exists() else {}
    out_dir = ROOT / "public/candidates/official"
    out_dir.mkdir(parents=True, exist_ok=True)
    for pid in [p for p in store if p not in handles]:
        (out_dir / f"{pid}.webp").unlink(missing_ok=True)
        store.pop(pid)
    for pid, h in handles.items():
        if h.get("wikidata"):
            listed = wikidata_handles(h["wikidata"])
            if h["x"].lower() not in listed:
                print(f"{pid}: @{h['x']} is not on Wikidata {h['wikidata']} (has {sorted(listed)}), skipped")
                continue
        try:
            raw, meta = avatar(h["x"])
        except Exception as e:
            print(f"{pid}: failed, keeping what we have ({e})")
            continue
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        print(f"{pid}: @{h['x']} {img.size} verified={meta['verified']} name={meta['displayName']!r}")
        img.thumbnail((480, 600))
        img.save(out_dir / f"{pid}.webp", "WEBP", quality=85)
        store[pid] = {"file": f"/candidates/official/{pid}.webp", "name": h["name"], "x": h["x"], "why": h["why"],
                      "source": f"https://x.com/{h['x']}", "fetched": date.today().isoformat(), **meta}
        time.sleep(1)
    out_path.write_text(json.dumps(dict(sorted(store.items())), indent=1, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
