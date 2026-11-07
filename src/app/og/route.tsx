import { ImageResponse } from "next/og";

/**
 * Share images (1200×630) drawn on request and cached at the edge: a ballot sheet with
 * a kicker, a title and one line under it. /og?k=Senate&t=Lagos%20West&s=15%20candidates
 */
export const runtime = "edge";

const clip = (v: string | null, n: number) => (v ?? "").replace(/\s+/g, " ").trim().slice(0, n);

const C = {
  paper: "#eef1ec",
  sheet: "#ffffff",
  ink: "#12171a",
  muted: "#56615c",
  rule: "#d5dbd5",
  green: "#0b6a46",
  greenSoft: "#dcebe2",
  violet: "#4b2d8a",
};

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const kicker = clip(p.get("k"), 48) || "Nigeria · 2027 general election";
  const title = clip(p.get("t"), 90) || "Know who's on your ballot before you thumbprint it.";
  const sub = clip(p.get("s"), 120) || "Every candidate, President to State Assembly, from INEC.";

  const [archivo, atkinson, atkinsonBold] = await Promise.all([
    fetch(new URL("./archivo-800.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./atkinson-400.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./atkinson-700.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
  ]);

  const titleSize = title.length > 60 ? 54 : title.length > 34 ? 64 : title.length > 20 ? 80 : 92;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: C.paper,
        padding: 48,
        fontFamily: "Atkinson",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: C.sheet,
          border: `2px solid ${C.rule}`,
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        <div style={{ height: 18, background: C.green, display: "flex" }} />
        <div style={{ flex: 1, display: "flex" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "44px 52px 36px" }}>
            <div
              style={{
                display: "flex",
                color: C.green,
                fontFamily: "Archivo",
                fontSize: 26,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              {kicker}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                color: C.ink,
                fontFamily: "Archivo",
                fontSize: titleSize,
                lineHeight: 1.04,
                letterSpacing: -1,
              }}
            >
              {title}
            </div>
            <div style={{ display: "flex", marginTop: 22, color: C.muted, fontSize: 32, lineHeight: 1.3 }}>{sub}</div>
            <div style={{ flex: 1, display: "flex" }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                borderTop: `2px dashed ${C.rule}`,
                paddingTop: 26,
              }}
            >
              <svg width="52" height="52" viewBox="0 0 32 32" aria-hidden="true">
                <rect x="3" y="13" width="26" height="16" rx="2" fill={C.green} />
                <rect x="9" y="12" width="14" height="2.5" rx="1" fill={C.sheet} />
                <path d="M11 3h10v10H11z" fill={C.sheet} stroke={C.ink} strokeWidth="1.6" />
                <path
                  d="M13.5 8.2l1.8 1.8 3.4-3.6"
                  fill="none"
                  stroke={C.violet}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 30, color: C.ink }}>
                Know Your&nbsp;<span style={{ color: C.green }}>Ballot</span>
              </div>
              <div style={{ flex: 1, display: "flex" }} />
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: C.muted }}>
                knowyourballot-ng.vercel.app
              </div>
            </div>
          </div>
          <div
            style={{
              width: 170,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderLeft: `2px dashed ${C.rule}`,
            }}
          >
            <svg width="104" height="124" viewBox="0 0 40 48" aria-hidden="true">
              <g fill="none" stroke={C.violet} strokeWidth="2.2" strokeLinecap="round">
                <path d="M20 4c-8.8 0-16 7.4-16 17v8c0 8 7 15 16 15s16-7 16-15v-8C36 11.4 28.8 4 20 4Z" opacity=".35" />
                <path d="M20 10c-6 0-11 5-11 11.5v6.5c0 6 5 11 11 11" />
                <path d="M20 16c-3 0-6 2.6-6 6v6c0 3.5 2.6 6 6 6s6-2.6 6-6" />
                <path d="M20 22v6" />
                <path d="M31 21.5c0-6.5-5-11.5-11-11.5" />
                <path d="M31 25v3c0 3.5-1.6 6.6-4 8.6" />
                <path d="M26 22c0-3.3-2.7-6-6-6" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: archivo, weight: 800, style: "normal" },
        { name: "Atkinson", data: atkinson, weight: 400, style: "normal" },
        { name: "Atkinson", data: atkinsonBold, weight: 700, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=604800" },
    },
  );
}
