import type { PropsWithChildren, ReactNode } from "react";

import { Breadcrumb, BreadcrumbList } from "@/components/ui/breadcrumb";

export type AppHeaderProps = PropsWithChildren<{
  /** Trailing actions, rendered after the breadcrumbs. */
  trailingElement?: ReactNode;
}>;

export const AppHeader = ({ trailingElement, children }: AppHeaderProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <Breadcrumb>
        <BreadcrumbList className="text-sm font-medium">{children}</BreadcrumbList>
      </Breadcrumb>
      {trailingElement}
    </div>
  );
};
