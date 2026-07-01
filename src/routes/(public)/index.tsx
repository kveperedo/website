import { createFileRoute } from "@tanstack/react-router";

import { getCurrentUserFn } from "#/utils/auth.functions";

import { FadeIn } from "./-common/components/fade-in";
import { LinkButtons } from "./-common/components/link-buttons";
import { ScrollButton } from "./-common/components/scroll-button";
import { META, SECTION_IDS } from "./-common/constants";
import { InfoSection } from "./-common/sections/info";
import { IntroductionSection } from "./-common/sections/introduction";
import { ProjectsSection } from "./-common/sections/projects";
import { SummarySection } from "./-common/sections/summary";

export const Route = createFileRoute("/(public)/")({
  head: () => ({ meta: META }),
  loader: async () => {
    const currentUser = await getCurrentUserFn();

    return { isUserLoggedIn: currentUser };
  },
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
          <ScrollButton direction="up" href={`#${SECTION_IDS.INTRO}`} />
          <LinkButtons />
        </footer>
      </div>
    </main>
  );
}
