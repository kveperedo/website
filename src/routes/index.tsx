import { createFileRoute } from "@tanstack/react-router";

import { Background } from "./index/components/background";
import { InfoSection } from "./index/sections/info";
import { IntroductionSection } from "./index/sections/introduction";
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
      </div>
    </main>
  );
}
