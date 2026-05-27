import { createFileRoute } from "@tanstack/react-router";

import { FadeIn } from "./-components/fade-in";
import { LinkButtons } from "./-components/link-buttons";
import { ScrollButton } from "./-components/scroll-button";
import { META, SECTION_IDS } from "./-constants";
import { InfoSection } from "./-sections/info";
import { IntroductionSection } from "./-sections/introduction";
import { ProjectsSection } from "./-sections/projects";
import { SummarySection } from "./-sections/summary";

export const Route = createFileRoute("/(index)/")({
  head: () => ({ meta: META }),
  component: Index,
});

function Index() {
  return (
    <main className="relative">
      <FadeIn />
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
