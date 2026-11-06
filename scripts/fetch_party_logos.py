"""Download each registered party's logo from its INEC profile page.

Writes public/parties/{code}.webp (128px, transparent where the source allows) and
data/party_logos.json mapping code -> {file, source}. Parties without a logo on INEC's
site are left out, and the site falls back to the plain party box for them.
"""
import io, json, re, time, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
UA = "Mozilla/5.0 (compatible; KnowYourBallotBot/1.0; +https://github.com/Ay7ot/knowyourballot-ng)"
BASE = "https://inecnigeria.org"
SLUGS = {
    "A": "accord-a", "AA": "action-alliance-aa", "ADP": "action-democratic-party-adp", "APP": "action-peoples-party-app",
    "AAC": "african-action-congress-aac", "ADC": "african-democratic-congress-adc", "APC": "all-progressives-congress-apc",
    "APGA": "all-progressives-grand-alliance-apga", "APM": "allied-peoples-movement-apm", "BP": "boot-party-bp",
    "DLA": "democratic-leadership-alliance-dla", "LP": "labour-party-lp", "NDP": "national-democratic-party",
    "NRM": "national-rescue-movement-nrm", "NNPP": "new-nigeria-peoples-party-nnpp", "NDC": "nigeria-democratic-congress",
    "PDP": "peoples-democratic-party-pdp", "PRP": "peoples-redemption-party-prp", "SDP": "social-democratic-party-sdp",
    "YPP": "young-progressive-party-ypp", "YP": "youth-party-yp", "ZLP": "zenith-labour-party-zlp",
}
LOGO = re.compile(r"""["'(]([^"'()\s]*_logo\.[\w-]+\.(?:png|jpe?g|webp|svg))""", re.I)


def get(url: str) -> bytes:
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA}), timeout=60) as r:
                return r.read()
        except Exception as e:  # noqa: BLE001
            if attempt == 2:
                raise
            print(f"  retry {url}: {e}")
            time.sleep(3 * (attempt + 1))
    raise RuntimeError


def main():
    out_dir = ROOT / "public" / "parties"
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = ROOT / "data" / "party_logos.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    for code, slug in SLUGS.items():
        page_url = f"{BASE}/parties/{slug}"
        try:
            html = get(page_url).decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            print(f"{code}: page failed ({e}); keeping previous logo if any")
            continue
        found = list(dict.fromkeys(LOGO.findall(html)))
        hits = [m for m in found if slug in m] or (found if len(found) == 1 else [])
        if not hits:
            print(f"{code}: no logo on INEC profile")
            manifest.pop(code, None)
            (out_dir / f"{code.lower()}.webp").unlink(missing_ok=True)
            continue
        src = hits[0] if hits[0].startswith("http") else BASE + ("" if hits[0].startswith("/") else "/") + hits[0]
        try:
            img = Image.open(io.BytesIO(get(src)))
            img = img.convert("RGBA")
            img.thumbnail((128, 128), Image.LANCZOS)
            img.save(out_dir / f"{code.lower()}.webp", "WEBP", quality=88)
        except Exception as e:  # noqa: BLE001
            print(f"{code}: image failed ({e})")
            continue
        manifest[code] = {"file": f"/parties/{code.lower()}.webp", "source": src, "page": page_url}
        print(f"{code}: {src}")
    manifest_path.write_text(json.dumps(dict(sorted(manifest.items())), indent=2) + "\n")
    print(f"{len(manifest)} of {len(SLUGS)} parties have logos")


if __name__ == "__main__":
    main()
