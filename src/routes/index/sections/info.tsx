import clsx from "clsx";

import { ScrollButton } from "../components/scroll-button";
import { Timeline } from "../components/timeline";
import { SECTION_IDS } from "../constants";

const EXPERIENCE: Array<{
  startDate: { month: string; year: number };
  endDate?: { month: string; year: number };
  position: string;
  company: string;
  location: string;
  technologies: Array<string>;
  details: Array<string>;
}> = [
  {
    startDate: { month: "Nov", year: 2023 },
    position: "Software Engineer Technical Lead",
    company: "Lexagle Inc.",
    location: "Makati City, Philippines",
    technologies: [
      "ReactJS",
      "Typescript",
      "Javascript",
      "Material UI",
      "Tailwind CSS",
      "HTML",
      "CSS",
      "Figma",
      "Git",
      "Kotlin",
      "Spring Boot",
      "PostgreSQL",
    ],
    details: [
      "Mentor and lead a team of developers through code reviews, architectural guidance, and frontend best practices; facilitate Agile sprint ceremonies including planning, stand-ups, reviews, and retrospectives",
      "Spearhead the upgrade of the company's tech stack, modernizing dependencies and libraries (React, state management, supporting tooling) to improve performance, maintainability, and access to new platform features",
      "Strongly collaborate with designers in the creation and rollout of a new internal component library using react-aria-components and Tailwind CSS, leading the transition from a legacy Material UI-based system",
      "Partner closely with designers to shape accessible, scalable UI components, providing technical feedback on UX decisions, feasibility, and accessibility best practices",
      "Architected a reusable React data grid framework with sorting and filtering capabilities, designed to integrate seamlessly with existing backend APIs",
      "Led the incremental migration from Redux Saga to Redux Toolkit, improving developer experience, reducing complexity, and enhancing application performance",
      "Provide frontend architectural guidance and technical support to cross-functional teams, helping align implementation with shared standards and best practices",
    ],
  },
  {
    startDate: { month: "May", year: 2021 },
    endDate: { month: "Nov", year: 2023 },
    position: "Junior Software Engineer",
    company: "Lexagle Inc.",
    location: "Makati City, Philippines",
    technologies: [
      "ReactJS",
      "Typescript",
      "Javascript",
      "Material UI",
      "HTML",
      "CSS",
      "Figma",
      "Git",
      "Kotlin",
      "Spring Boot",
      "PostgreSQL",
    ],
    details: [
      "Translated business requirements into functional, scalable frontend and backend features in collaboration with product managers and designers",
      "Contributed to the internal component library by building reusable components and custom hooks, implementing new features, and advising senior developers on implementation plans",
      "Conducted proof-of-concept (POC) evaluations of libraries for the company’s first component library and presented findings to senior engineers",
      "Helped migrate the main application from JavaScript to TypeScript, reducing runtime bugs, improving documentation, and enhancing maintainability",
      "Debugged, troubleshooted, and optimized code to enhance performance, stability, and user experience",
      "Reviewed code contributions, provided constructive feedback, and assisted teammates in resolving blocked tasks to maintain a high-quality codebase",
    ],
  },
  {
    startDate: { month: "Feb", year: 2020 },
    endDate: { month: "Apr", year: 2021 },
    position: "Software Engineer",
    company: "SQREEM Technologies Pte.",
    location: "Quezon City, Philippines",
    technologies: ["Javascript", "HTML", "CSS", "Figma", "Git"],
    details: [
      "Developed responsive, cross-browser web applications from detailed design wireframes with a focus on performance and accessibility",
      "Diagnosed and resolved frontend bugs, refactored legacy code, and optimized application performance",
      "Evaluated and integrated modern web technologies to improve code efficiency and accelerate feature delivery",
      "Contributed to the maintenance of proprietary and open-source web applications, ensuring compatibility with ongoing updates",
    ],
  },
];

const EDUCATION = {
  startDate: { month: "Aug", year: 2014 },
  endDate: { month: "May", year: 2019 },
  course: "BS Electronics Engineering",
  institution: "Saint Louis University",
  location: "Baguio City, Philippines",
  details: ["Dean's lister for a total of 8 semesters"] as Array<string>,
} as const;

const LICENSES_AND_CERTIFICATIONS: Array<{
  date: { month: string; year: number };
  name: string;
  issuer: string;
}> = [
  {
    date: { month: "May", year: 2026 },
    name: "The AI Engineer Path",
    issuer: "Scrimba",
  },
  {
    date: { month: "May", year: 2026 },
    name: "The Backend Developer Path",
    issuer: "Scrimba",
  },
  {
    date: { month: "Jul", year: 2021 },
    name: "Testing React with Jest and Testing Library",
    issuer: "Udemy",
  },
  {
    date: { month: "Sep", year: 2020 },
    name: "Modern React with Redux",
    issuer: "Udemy",
  },
  {
    date: { month: "Nov", year: 2019 },
    name: "Electronics Engineer and Electronics Technician",
    issuer: "Professional Regulation Commission",
  },
];

export const InfoSection = () => {
  return (
    <section
      id={SECTION_IDS.INFO}
      className="relative flex flex-col items-center justify-center px-8 py-16 pr-8 text-white"
    >
      <div>
        <h1 className="mr-auto mb-16 text-left text-4xl font-medium">Experience</h1>

        {EXPERIENCE.map(
          ({ position, company, details, location, startDate, endDate, technologies }) => (
            <Timeline
              key={company + position}
              startDate={startDate}
              endDate={endDate ?? "Present"}
              title={position}
              titleExtension={` at ${company}`}
              subtitle={location}
              tags={technologies}
              content={details}
            />
          ),
        )}

        <h1 className="my-16 mr-auto text-left text-4xl font-medium">Education</h1>

        <Timeline
          startDate={EDUCATION.startDate}
          endDate={EDUCATION.endDate}
          title={EDUCATION.course}
          titleExtension={` at ${EDUCATION.institution}`}
          subtitle={EDUCATION.location}
          content={EDUCATION.details}
        />

        <h1 className="my-16 mr-auto text-left text-4xl font-medium">Licenses & Certificates</h1>

        {LICENSES_AND_CERTIFICATIONS.map(({ name, issuer, date }, index) => {
          const isNotFirstItem = index !== 0;

          return (
            <Timeline
              key={name + issuer}
              className={clsx(isNotFirstItem && "-my-12")}
              startDate={date}
              title={name}
              subtitle={issuer}
              stickyDots={false}
            />
          );
        })}
      </div>

      <ScrollButton className="mt-32" href={`#${SECTION_IDS.PROJECTS}`} />
    </section>
  );
};
