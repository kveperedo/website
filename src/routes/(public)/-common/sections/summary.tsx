import { ScrollButton } from "../components/scroll-button";
import { SECTION_IDS } from "../constants";

const SUMMARY =
  "Senior Frontend Engineer with 6+ years of experience building scalable, high-performance web applications using React, Next.js, and TypeScript. Strong expertise in designing reusable component libraries, optimizing frontend architecture, and improving developer experience through modern tooling and state management. Experienced in collaborating with designers and cross-functional teams to deliver accessible, responsive, and user-focused interfaces. Proven ability to mentor engineers, lead frontend initiatives, and drive complex technical projects from concept to production.";

export const SummarySection = () => {
  return (
    <section
      id={SECTION_IDS.SUMMARY}
      className="relative flex flex-col items-center justify-center gap-16 px-8 py-16 md:h-screen"
    >
      <h1 className="text-center text-base leading-loose text-foreground md:text-lg md:leading-[2.5] lg:text-xl lg:leading-[2.5]">
        {SUMMARY}
      </h1>

      <ScrollButton
        className="mt-4 md:absolute md:bottom-0 md:mt-0 md:mb-9"
        href={`#${SECTION_IDS.INFO}`}
      />
    </section>
  );
};
