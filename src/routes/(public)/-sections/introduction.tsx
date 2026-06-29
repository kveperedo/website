import { getRouteApi, Link } from "@tanstack/react-router";
import { BanknoteIcon, SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { LinkButtons } from "../-components/link-buttons";
import { ScrollButton } from "../-components/scroll-button";
import { SECTION_IDS } from "../-constants";

const NAME = "kevin von erich peredo";
const POSITION = "Senior Frontend Engineer";

const routeApi = getRouteApi("/(public)/");

export const IntroductionSection = () => {
  const { isUserLoggedIn } = routeApi.useLoaderData();

  return (
    <main
      id={SECTION_IDS.INTRO}
      className="relative m-auto flex h-screen flex-col items-center justify-center gap-4"
    >
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <Button variant="ghost" size="sm" render={<Link to="/config" />}>
          <SettingsIcon className="size-4" />
          Config
        </Button>
        {isUserLoggedIn && (
          <Button variant="ghost" size="sm" render={<Link to="/finances" />}>
            <BanknoteIcon className="size-4" />
            Finances
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-center font-display text-5xl text-foreground md:text-6xl lg:text-8xl">
          {NAME}
        </h1>

        <h4 className="text-center font-mono text-2xl tracking-wide text-muted-foreground md:text-3xl lg:text-4xl">
          {POSITION}
        </h4>

        <div className="mt-2 flex items-center gap-4">
          <Button
            variant="default"
            size="xl"
            render={<a href="/resume.pdf" target="_blank" rel="noreferrer" />}
          >
            Resume
          </Button>

          <LinkButtons />
        </div>
      </div>

      <ScrollButton
        className="mt-8 md:absolute md:bottom-0 md:mb-9"
        href={`#${SECTION_IDS.SUMMARY}`}
      />
    </main>
  );
};
