import { createFileRoute } from "@tanstack/react-router";

import { MacSetup } from "./-sections/mac-setup";

export const Route = createFileRoute("/(index)/config/")({
  component: ConfigRoute,
});

function ConfigRoute() {
  return (
    <main className="relative min-h-screen">
      <div className="relative container mx-auto px-8 py-16">
        <div className="mb-8">
          <h1 className="mb-4 font-mono text-5xl font-medium text-neutral-50 md:text-6xl">
            mac setup guide
          </h1>
          <p className="max-w-2xl text-lg text-neutral-400">
            My personal reference for setting up a new macOS machine, including apps, tools, and
            system preferences I rely on.
          </p>
        </div>

        <div className="relative">
          <MacSetup />
        </div>
      </div>
    </main>
  );
}
