export const REPO = "https://github.com/Ay7ot/knowyourballot-ng";

export function correctionUrl(subject: string, pageUrl: string) {
  const body = [
    `**Page:** ${pageUrl}`,
    "",
    "**What's wrong or missing?**",
    "",
    "",
    "**Source** (a link to INEC, a court judgment, an official record or a reputable news report; we can't publish unsourced claims):",
    "",
  ].join("\n");
  const q = new URLSearchParams({ title: `Correction: ${subject}`, body, labels: "correction" });
  return `${REPO}/issues/new?${q}`;
}
