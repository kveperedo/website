import type { LinkProps } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";

import { BackButton } from "@/components/back-button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  TanstackBreadcrumbLink,
} from "@/components/ui/breadcrumb";

export type AppHeaderProps = PropsWithChildren<{
  /** Label for the current page, rendered as the final (non-link) crumb. */
  current: string;
  /** Back destination. Falls back to browser history when omitted. */
  backTo?: LinkProps["to"];
}>;

export const AppHeader = ({ current, backTo, children }: AppHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <BackButton to={backTo} variant="icon" />
        <Breadcrumb>
          <BreadcrumbList className="text-sm font-medium">
            <BreadcrumbItem>
              <TanstackBreadcrumbLink to="/">Home</TanstackBreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <BreadcrumbPage>{current}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {children}
    </div>
  );
};
