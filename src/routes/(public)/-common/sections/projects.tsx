import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { SECTION_IDS } from "../constants";
import { GithubIcon } from "../icons/github-icon";

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
      <h1 className="mr-auto mb-20 font-heading text-4xl font-medium">Projects</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {PROJECTS.map(({ name, summary, date, githubLink, technologies, link }) => (
          <Card key={name} className="w-full p-6 md:p-8">
            <div className="flex items-center justify-between">
              <h4 className="mb-1 font-heading text-2xl font-semibold text-foreground">{name}</h4>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  nativeButton={false}
                  render={<a href={githubLink} target="_blank" rel="noreferrer" />}
                >
                  <GithubIcon className="size-4" />
                </Button>
                {link && (
                  <Button
                    size="icon"
                    variant="ghost"
                    nativeButton={false}
                    render={<a href={link} target="_blank" rel="noreferrer" />}
                  >
                    <ExternalLink className="size-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="mb-4 font-mono text-sm text-muted-foreground">{date}</p>
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {technologies.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>

            <p className="mt-auto text-sm text-muted-foreground">{summary}</p>
          </Card>
        ))}
      </div>
    </section>
  );
};
