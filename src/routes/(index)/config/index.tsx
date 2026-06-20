import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { iconButtonStyles } from "#/components/icon-button";

import { MacSetup } from "./-sections/mac-setup";

export const Route = createFileRoute("/(index)/config/")({
  component: ConfigRoute,
});

function ConfigRoute() {
  return (
    <main className="relative min-h-screen">
      <div className="relative container mx-auto px-8 py-16">
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <Link
              to="/"
              className={iconButtonStyles({ variant: "tertiary", size: "sm" })}
              aria-label="Go back to home"
            >
              <ArrowLeftIcon />
            </Link>
            <h1 className="font-mono text-5xl font-medium text-neutral-50 md:text-6xl">
              mac setup guide
            </h1>
          </div>
          <p className="max-w-2xl font-serif text-lg leading-loose text-neutral-400">
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
