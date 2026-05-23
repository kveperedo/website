import { Link as AriaLink } from "react-aria-components";

import { buttonStyles } from "#/components/button/button.styles";

import { LinkButtons } from "../components/link-buttons";
import { ScrollButton } from "../components/scroll-button";
import { SECTION_IDS } from "../constants";

const NAME = "kevin von erich peredo";
const POSITION = "Senior Frontend Engineer";

export const IntroductionSection = () => {
  return (
    <main
      id={SECTION_IDS.INTRO}
      className="relative m-auto flex h-screen flex-col items-center justify-center gap-10"
    >
      <h1 className="text-center font-mono text-5xl text-neutral-50 md:text-6xl lg:text-8xl">
        {NAME}
      </h1>

      <h4 className="text-center font-serif text-2xl tracking-wide text-neutral-300 md:text-3xl lg:text-4xl">
        {POSITION}
      </h4>

      <AriaLink
        href="/resume.pdf"
        target="_blank"
        rel="noreferrer"
        className={buttonStyles({ variant: "secondary" })}
      >
        Resume
      </AriaLink>

      <LinkButtons />

      <ScrollButton
        className="mt-8 md:absolute md:bottom-0 md:mb-9"
        href={`#${SECTION_IDS.SUMMARY}`}
      />
    </main>
  );
};
