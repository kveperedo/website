import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { MacSetup } from "./-sections/mac-setup";

export const Route = createFileRoute("/(public)/config/")({
  component: ConfigRoute,
});

function ConfigRoute() {
  return (
    <main className="relative min-h-screen">
      <div className="relative container mx-auto px-8 py-16">
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link to="/" />}
              aria-label="Go back to home"
            >
              <ArrowLeftIcon />
            </Button>
            <h1 className="font-mono text-5xl font-medium text-foreground md:text-6xl">
              mac setup guide
            </h1>
          </div>
          <p className="max-w-2xl text-lg leading-loose text-muted-foreground">
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
