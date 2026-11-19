import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";

type ApplicationsHeaderProps = {
  view: "active" | "closed";
  children?: ReactNode;
};

export const ApplicationsHeader = ({ view, children }: ApplicationsHeaderProps) => {
  return (
    <AppHeader backTo={view === "active" ? "/" : "/applications"} current="Applications">
      {children}
    </AppHeader>
  );
};
