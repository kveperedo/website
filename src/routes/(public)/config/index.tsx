import { createFileRoute } from "@tanstack/react-router";

import { cacheControl } from "@/app/infra/cache/cache-control";
import { AppContainer } from "@/components/app-container";
import { AppHeader } from "@/components/app-header";
import { BreadcrumbItem, BreadcrumbPage, TanstackBreadcrumbLink } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PUBLIC_CACHE_CONTROL } from "../-common/constants";
import { SETUP_SECTIONS } from "./-common/constants";
import { ApplicationsSetup, CliToolsSetup } from "./-common/sections/mac-setup";

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
    headers: () => cacheControl(PUBLIC_CACHE_CONTROL),
    head: () => ({ meta: META }),
    component: ConfigRoute,
});

function ConfigRoute() {
    return (
        <AppContainer
            header={
                <AppHeader>
                    <BreadcrumbItem>
                        <TanstackBreadcrumbLink to="/">Home</TanstackBreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Config</BreadcrumbPage>
                    </BreadcrumbItem>
                </AppHeader>
            }
        >
            <div className="container mx-auto flex flex-col gap-4 p-4 lg:px-0">
                <h1 className="sr-only">mac setup</h1>
                <p className="text-xs text-muted-foreground">
                    My personal reference for setting up a new macOS machine. Hand the prompts to
                    your agent, or expand the exact commands if you're doing it by hand.
                </p>

                <Tabs defaultSelectedKey="cli-tools" className="flex flex-col gap-4">
                    <TabsList
                        variant="line"
                        aria-label="Setup sections"
                        className="w-full justify-start gap-6 border-b border-subtle"
                    >
                        {SETUP_SECTIONS.map((section) => (
                            <TabsTrigger
                                key={section.id}
                                id={section.id}
                                className="flex-none px-1 text-sm after:bg-primary"
                            >
                                {section.title}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent id="cli-tools" className="flex flex-col gap-4">
                        <CliToolsSetup />
                    </TabsContent>
                    <TabsContent id="applications" className="flex flex-col gap-4">
                        <ApplicationsSetup />
                    </TabsContent>
                </Tabs>
            </div>
        </AppContainer>
    );
}
