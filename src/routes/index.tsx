import { createFileRoute } from "@tanstack/react-router";

import { Background } from "./index/components/background";
import { LinkButtons } from "./index/components/link-buttons";
import { ScrollButton } from "./index/components/scroll-button";
import { SECTION_IDS } from "./index/constants";
import { InfoSection } from "./index/sections/info";
import { IntroductionSection } from "./index/sections/introduction";
import { ProjectsSection } from "./index/sections/projects";
import { SummarySection } from "./index/sections/summary";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="relative">
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
