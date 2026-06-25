import { Tag } from "../-components/tag";
import { SECTION_IDS } from "../-constants";
import { GithubIcon } from "../-icons/github-icon";

const PROJECTS: Array<{
  name: string;
  date: string;
  githubLink: string;
  link?: string;
  summary: string;
  technologies: Array<string>;
}> = [
  {
    name: "Astro Personal Portfolio",
    date: "March 2023",
    githubLink: "https://github.com/kveperedo/astro-portfolio",
    summary:
      "An Astro-based web portfolio deployed in Vercel designed to showcase my skills and projects. I migrated my portfolio from Next.js to Astro after realizing that my site is mostly static and I wanted to prioritize site performance by reducing the amount of JavaScript. To ensure that my portfolio design was sleek and modern, I used a clean typography and a restrained color palette to create an elegant, understated look.",
    technologies: ["Astro", "ReactJS", "Typescript", "Tailwind", "Zod", "Vercel", "Figma"],
  },
  {
    name: "NextJS Personal Portfolio",
    date: "June 2022",
    githubLink: "https://github.com/kveperedo/old-next-portfolio",
    summary:
      "A Next.js personal portfolio. I created this showcase my extensive range of projects, along with a comprehensive overview of my relevant skills, abilities, and information. I chose NextJS as the framework because of its features such as built-in SEO optimization, automatic image optimization, and server-side rendering.",
    technologies: [
      "NextJS",
      "ReactJS",
      "Typescript",
      "Vercel",
      "Framer Motion",
      "CSS Modules",
      "Figma",
    ],
  },
  {
    name: "Noterist",
    date: "Nov 2020",
    githubLink: "https://github.com/kveperedo/noterist",
    link: "https://kp-noterist.web.app",
    summary:
      "A note-taking app using React and Redux, designed in Figma, and deployed using Firebase. This is my first major personal project made in React after I finished the React and Redux course. Current features include a scratchpad for quick note-taking and a note section for more complicated formatting.",
    technologies: ["ReactJS", "Redux", "Firebase", "Javascript", "HTML", "CSS"],
  },
  {
    name: "Landslide Detection Interface",
    date: "May 2019",
    githubLink: "https://github.com/kveperedo/ProjectLandslide",
    summary:
      "A user interface for displaying landslide sensors data into graphs and text. Code base uses HTML, CSS and JavaScript (interface) and C/C++ (Arduino). This interface was primarily used for our thesis in the 5th year (ECE) and it served as a meaningful guide for the data from our landslide sensors.",
    technologies: ["Javascript", "HTML", "CSS"],
  },
];

export const ProjectsSection = () => {
  return (
    <section id={SECTION_IDS.PROJECTS} className="relative flex flex-col items-center px-8 py-16">
      <h1 className="mb-20 text-4xl font-medium">Projects</h1>

      <div className="flex flex-wrap justify-center gap-10">
        {PROJECTS.map(({ name, summary, date, githubLink, technologies, link }) => (
          <div
            key={name}
            className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-xl backdrop-blur transition-colors hover:border-neutral-700 hover:bg-neutral-900/60 md:w-lg md:p-8"
          >
            <div className="flex items-center justify-between">
              <h4 className="mb-1 text-2xl font-semibold text-neutral-50">{name}</h4>

              <div className="flex items-center gap-4">
                <a href={githubLink} target="_blank">
                  <GithubIcon className="h-6 w-6 text-neutral-400 transition-colors hover:text-neutral-200" />
                </a>
                {link && (
                  <a href={link} target="_blank">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke-width="1.5"
                      stroke="currentColor"
                      className="h-6 w-6 cursor-pointer text-neutral-400 transition-colors hover:text-neutral-200"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                      ></path>
                    </svg>
                  </a>
                )}
              </div>
            </div>
            <p className="mb-4 text-neutral-300">{date}</p>
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {technologies.map((label) => (
                <Tag key={label}>{label}</Tag>
              ))}
            </div>

            <p className="mt-auto leading-8 font-medium text-neutral-300">{summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
