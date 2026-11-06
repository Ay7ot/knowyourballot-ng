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

/** Prefilled issue for a candidate's campaign to send an official photo they hold the rights to. */
export function photoUrl(name: string, pageUrl: string) {
  const body = [
    `**Candidate:** ${name}`,
    `**Page:** ${pageUrl}`,
    "",
    "Attach the photo below (drag it into this box). It should be a recent, clear portrait.",
    "",
    "**Who are you?** (the candidate, or their campaign or party, with a way for us to confirm, such as an official campaign social media account)",
    "",
    "**I confirm we own this photo and allow Know Your Ballot to publish it:** yes / no",
    "",
  ].join("\n");
  const q = new URLSearchParams({ title: `Photo: ${name}`, body, labels: "photo" });
  return `${REPO}/issues/new?${q}`;
}

/** Prefilled issue for sending a candidate's manifesto or reported pledges, with a source. */
export function manifestoUrl(name: string, pageUrl: string) {
  const body = [
    `**Candidate:** ${name}`,
    `**Page:** ${pageUrl}`,
    "",
    "**Link to the manifesto, or to a news report of their pledges:**",
    "",
    "(We publish pledges only with a public source. A person reviews each one.)",
    "",
  ].join("\n");
  const q = new URLSearchParams({ title: `Manifesto: ${name}`, body, labels: "manifesto" });
  return `${REPO}/issues/new?${q}`;
}
