import localFont from "next/font/local";
// Fonts are instanced and subset from @fontsource (OFL) to the axes and Latin glyphs we use; see scripts/subset_fonts.py.

// Self-hosted, preloaded, with metric-matched fallbacks so text doesn't jump when fonts arrive.
export const archivo = localFont({
  src: "../fonts/archivo-display.woff2",
  weight: "600 800",
  declarations: [{ prop: "font-stretch", value: "100% 118%" }],
  // Display face only: if it misses the first paint, keep the fallback rather than reflowing headings.
  display: "optional",
  variable: "--font-archivo",
  fallback: ["Arial Narrow", "Helvetica Neue", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const atkinson = localFont({
  src: "../fonts/atkinson-body.woff2",
  weight: "400 700",
  display: "swap",
  variable: "--font-atkinson",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const plexMono = localFont({
  src: [
    { path: "../fonts/plex-mono-400.woff2", weight: "400" },
    { path: "../fonts/plex-mono-500.woff2", weight: "500" },
  ],
  display: "swap",
  preload: false,
  variable: "--font-plex",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  adjustFontFallback: false,
});
