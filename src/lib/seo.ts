import type { Metadata } from "next";

export const SITE_NAME = "Know Your Ballot";

/** A share image drawn by /og: kicker, title and one line under it. */
export const ogImage = (o: { k?: string; t?: string; s?: string } = {}) => {
  const q = new URLSearchParams();
  if (o.k) q.set("k", o.k);
  if (o.t) q.set("t", o.t);
  if (o.s) q.set("s", o.s);
  const qs = q.toString();
  return `/og${qs ? `?${qs}` : ""}`;
};

/**
 * Full metadata for a page. Next replaces (not merges) openGraph and twitter from the
 * layout, so every page sets all of it: title, description, canonical, OG and Twitter.
 */
export function pageMeta({
  title,
  description,
  path,
  og,
  type = "website",
}: {
  title?: string;
  description: string;
  path: string;
  og?: { k?: string; t?: string; s?: string };
  type?: "website" | "article" | "profile";
}): Metadata {
  const shareTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · Nigeria 2027`;
  const image = { url: ogImage(og ?? (title ? { t: title } : {})), width: 1200, height: 630, alt: shareTitle };
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: { title: shareTitle, description, url: path, siteName: SITE_NAME, locale: "en_NG", type, images: [image] },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [image.url] },
  };
}
