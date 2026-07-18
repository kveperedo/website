import { getRouteApi } from "@tanstack/react-router";
import { BanknoteIcon, LogInIcon, SettingsIcon } from "lucide-react";

import { LinkButton, TanstackLinkButton } from "@/components/ui/button";

import { LinkButtons } from "../components/link-buttons";
import { ScrollButton } from "../components/scroll-button";
import { SECTION_IDS } from "../constants";

const NAME = "KEVIN VON ERICH PEREDO";
const POSITION = "Senior Frontend Engineer";

const routeApi = getRouteApi("/(public)/");

export const IntroductionSection = () => {
  const { isUserLoggedIn } = routeApi.useLoaderData();

  return (
    <section
      id={SECTION_IDS.INTRO}
      className="relative m-auto flex h-screen flex-col items-center justify-center gap-4"
    >
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <TanstackLinkButton to="/config" variant="ghost" size="sm">
          <SettingsIcon />
          Config
        </TanstackLinkButton>
        {isUserLoggedIn ? (
          <TanstackLinkButton to="/finances" variant="ghost" size="sm">
            <BanknoteIcon />
            Finances
          </TanstackLinkButton>
        ) : (
          <TanstackLinkButton to="/login" variant="ghost" size="sm">
            <LogInIcon />
            Login
          </TanstackLinkButton>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="mx-4 text-center font-heading text-5xl font-extralight tracking-wider text-foreground md:text-6xl lg:text-8xl">
          {NAME}
        </h1>

        <h4 className="text-center font-heading text-2xl text-muted-foreground md:text-3xl lg:text-4xl">
          {POSITION}
        </h4>

        <div className="mt-2 flex items-center gap-4">
          <LinkButton
            variant="default"
            size="xl"
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Resume
          </LinkButton>

          <LinkButtons />
        </div>
      </div>

      <ScrollButton
        className="mt-8 md:absolute md:bottom-0 md:mb-9"
        href={`#${SECTION_IDS.SUMMARY}`}
      />
    </section>
  );
};
