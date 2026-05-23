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

      <a
        href="/resume.pdf"
        target="_blank"
        className="rounded border border-neutral-800 bg-neutral-900/40 px-10 py-4 font-serif font-medium tracking-wider text-neutral-50 transition-all duration-500 hover:border-neutral-500"
      >
        Resume
      </a>

      <LinkButtons />

      <ScrollButton
        className="mt-8 md:absolute md:bottom-0 md:mb-9"
        href={`#${SECTION_IDS.PROJECTS}`}
      />
    </main>
  );
};
