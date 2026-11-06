"""Rebuild the self-hosted fonts in src/fonts from @fontsource (run after npm ci).

Instances the variable fonts to the weight/width ranges the CSS uses and subsets to
Latin, which cuts the critical font bytes by about 60%.
  pip install fonttools brotli && python scripts/subset_fonts.py
"""
import io
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# Body text gets Latin-1 plus common punctuation; headings and codes only need ASCII.
LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20A6,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD"
ASCII = "U+0020-007E,U+00A0,U+00B7,U+00D7,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20A6,U+2192"
NM = "node_modules/"


def build(src, dst, limits, unicodes):
    f = TTFont(src)
    if limits:
        f = instancer.instantiateVariableFont(f, limits)
    buf = io.BytesIO()
    f.flavor = None
    f.save(buf)
    buf.seek(0)
    f = TTFont(buf)
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["kern", "liga", "calt", "tnum", "lnum", "case", "ccmp", "locl", "mark", "mkmk"]
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=subset.parse_unicodes(unicodes))
    s.subset(f)
    f.flavor = "woff2"
    f.save(dst)


build(NM + "@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2", "src/fonts/archivo-display.woff2", {"wght": (600, 800), "wdth": (100, 118)}, ASCII)
build(NM + "@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2", "src/fonts/atkinson-body.woff2", {"wght": (400, 700)}, LATIN)
for w in (400, 500):
    build(NM + f"@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-{w}-normal.woff2", f"src/fonts/plex-mono-{w}.woff2", None, ASCII)
