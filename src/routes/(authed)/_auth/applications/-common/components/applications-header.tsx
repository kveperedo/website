import type { ReactNode } from "react";

import { BackButton } from "@/components/back-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  TanstackBreadcrumbLink,
} from "@/components/ui/breadcrumb";

type ApplicationsHeaderProps = {
  current: "active" | "closed";
  children?: ReactNode;
};

export const ApplicationsHeader = ({ current, children }: ApplicationsHeaderProps) => {
  const backTo = current === "active" ? "/" : "/applications";

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <BackButton to={backTo} variant="icon" />
        <Breadcrumb>
          <BreadcrumbList className="font-heading text-sm font-medium">
            <BreadcrumbItem>
              <TanstackBreadcrumbLink to="/">Home</TanstackBreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>Applications</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {children}
    </div>
  );
};
