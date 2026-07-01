import { createFileRoute } from "@tanstack/react-router";

import { BackButton } from "@/components/back-button";

import { MacSetup } from "./-sections/mac-setup";

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "Config | Kevin Von Erich Peredo" },
  { property: "og:url", content: "https://www.kevinperedo.com/config" },
  { property: "og:type", content: "website" },
  { property: "og:title", content: "mac setup guide | Kevin Von Erich Peredo" },
  {
    property: "og:description",
    content:
      "Personal reference for setting up a new macOS machine, including apps, tools, and system preferences.",
  },
  { property: "og:image", content: "/og-image.png" },
  { name: "twitter:card", content: "summary_large_image" },
  { property: "twitter:domain", content: "kevinperedo.com" },
  { property: "twitter:url", content: "https://www.kevinperedo.com/config" },
  { name: "twitter:title", content: "mac setup guide | Kevin Von Erich Peredo" },
  {
    name: "twitter:description",
    content:
      "Personal reference for setting up a new macOS machine, including apps, tools, and system preferences.",
  },
  { name: "twitter:image", content: "/og-image.png" },
];

export const Route = createFileRoute("/(public)/config/")({
  head: () => ({ meta: META }),
  component: ConfigRoute,
});

function ConfigRoute() {
  return (
    <main className="relative min-h-screen">
      <div className="relative container mx-auto px-8 py-12">
        <div className="mb-10">
          <BackButton to="/" />

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            My personal reference for setting up a new macOS machine, including apps, tools, and
            system preferences I rely on.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <a
              href="#applications"
              className="font-mono text-xs text-muted-foreground underline-offset-4 transition-all duration-500 hover:text-foreground hover:underline"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#applications")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Applications
            </a>
            <span className="text-muted-foreground/40">·</span>
            <a
              href="#config"
              className="font-mono text-xs text-muted-foreground underline-offset-4 transition-all duration-500 hover:text-foreground hover:underline"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#config")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Config
            </a>
          </div>
        </div>

        <div className="relative">
          <MacSetup />
        </div>
      </div>
    </main>
  );
}
