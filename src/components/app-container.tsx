"use client";

import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export type AppContainerClassNames = {
  root?: string;
  header?: string;
  main?: string;
  footer?: string;
};

export type AppContainerProps = PropsWithChildren<{
  header?: React.ReactNode;
  footer?: React.ReactNode;
  classNames?: AppContainerClassNames;
}>;

export const AppContainer = ({ header, footer, classNames, children }: AppContainerProps) => {
  return (
    <div
      className={cn(
        "relative min-h-dvh",
        footer &&
          "pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(4rem+env(safe-area-inset-bottom))]",
        classNames?.root,
      )}
    >
      {header && (
        <header
          className={cn(
            "sticky top-0 z-30 border-b border-border bg-background/85 p-4 backdrop-blur",
            classNames?.header,
          )}
        >
          <div className="container mx-auto flex flex-col">{header}</div>
        </header>
      )}

      <main className={cn("flex flex-col", classNames?.main)}>{children}</main>

      {footer && (
        <footer
          className={cn(
            "fixed inset-x-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-2 rounded-none border border-border bg-background/90 shadow-xl backdrop-blur sm:inset-x-0 sm:bottom-0 sm:block sm:border-0 sm:border-t sm:pb-[env(safe-area-inset-bottom)] sm:shadow-none",
            classNames?.footer,
          )}
        >
          {footer}
        </footer>
      )}
    </div>
  );
};
