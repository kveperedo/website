import { createFileRoute } from "@tanstack/react-router";

import { Background } from "./components/background";
import { FadeIn } from "./components/fade-in";
import { LinkButtons } from "./components/link-buttons";
import { ScrollButton } from "./components/scroll-button";
import { SECTION_IDS } from "./constants";
import { InfoSection } from "./sections/info";
import { IntroductionSection } from "./sections/introduction";
import { ProjectsSection } from "./sections/projects";
import { SummarySection } from "./sections/summary";

export const Route = createFileRoute("/(index)/")({
  head: () => ({
    meta: [
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
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative">
      <FadeIn />
      <Background />
      <div className="relative container mx-auto">
        <IntroductionSection />
        <div className="h-10" />
        <SummarySection />
        <div className="h-10" />
        <InfoSection />
        <div className="h-10" />
        <ProjectsSection />
        <div className="h-10" />

        <footer className="my-16 flex flex-col items-center gap-8">
          <ScrollButton direction="up" href={`#${SECTION_IDS.INTRO}`} disableBounce />
          <span className="m-auto w-72 text-center font-mono text-neutral-200 hover:lowercase md:w-auto">
            built And desiGned by keVin von eRicH peRedo
          </span>
          <LinkButtons />
        </footer>
      </div>
    </main>
  );
}
