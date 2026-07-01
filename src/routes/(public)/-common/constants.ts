export const SECTION_IDS = {
  INTRO: "intro",
  PROJECTS: "projects",
  SUMMARY: "summary",
  INFO: "info",
} as const;

export const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "Portfolio | Kevin Von Erich Peredo" },
  { property: "og:url", content: "https://www.kevinperedo.com/" },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "Portfolio | Kevin Von Erich Peredo" },
  {
    property: "og:description",
    content: "A full-time software engineer working at Lexagle Inc. in the Philippines.",
  },
  { property: "og:image", content: "/og-image.png" },
  { name: "twitter:card", content: "summary_large_image" },
  { property: "twitter:domain", content: "kevinperedo.com" },
  { property: "twitter:url", content: "https://www.kevinperedo.com/" },
  { name: "twitter:title", content: "Portfolio | Kevin Von Erich Peredo" },
  {
    name: "twitter:description",
    content: "A full-time software engineer working at Lexagle Inc. in the Philippines.",
  },
  { name: "twitter:image", content: "/og-image.png" },
];
