import { createFileRoute } from "@tanstack/react-router";

import { Background } from "./index/components/background";
import { IntroductionSection } from "./index/sections/introduction";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="relative">
      <Background />
      <div className="relative container mx-auto">
        <IntroductionSection />
      </div>
    </main>
  );
}
