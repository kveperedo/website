"use client";

import { useRouter, useRouterState } from "@tanstack/react-router";
import {
  CalendarClockIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ReceiptTextIcon,
  XIcon,
} from "lucide-react";
import { useState, type PropsWithChildren } from "react";

import type { TransactionItemAIType } from "@/schema/transaction";

import { Button, TanstackLinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TransactionInput } from "./transaction-input";

const ROUTE_DETAILS = {
  "/finances": { icon: LayoutDashboardIcon, label: "Dashboard" },
  "/finances/transactions": { icon: ReceiptTextIcon, label: "Transactions" },
  "/finances/scheduled": { icon: CalendarClockIcon, label: "Scheduled" },
} as const;

export type FinanceContainerProps = PropsWithChildren<{
  header?: React.ReactNode;
  footer?: React.ReactNode;
}>;

const FinanceContainerRoot = ({ header, footer, children }: FinanceContainerProps) => {
  return (
    <div
      className={cn(
        "relative min-h-dvh",
        header && "pt-14",
        footer &&
          "pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(4rem+env(safe-area-inset-bottom))]",
      )}
    >
      {header && (
        <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background/85 p-4 backdrop-blur">
          <div className="container mx-auto flex flex-col">{header}</div>
        </header>
      )}
      <main className="flex flex-col">{children}</main>
      {footer && (
        <footer className="fixed inset-x-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-30 flex flex-col gap-2 rounded-none border border-border bg-background/90 shadow-xl backdrop-blur sm:inset-x-0 sm:bottom-0 sm:block sm:border-0 sm:border-t sm:pb-[env(safe-area-inset-bottom)] sm:shadow-none">
          {footer}
        </footer>
      )}
    </div>
  );
};

const FinanceContainerFooter = () => {
  const router = useRouter();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const handleParsed = (transactions: Array<TransactionItemAIType>) => {
    setInputValue("");
    setIsComposerOpen(false);
    router.navigate({
      to: "/finances/transactions/new",
      search: { transactions, returnTo: pathname },
    });
  };

  return (
    <div className="container mx-auto flex flex-col">
      {isComposerOpen && (
        <div id="transaction-composer" className="flex w-full items-center gap-2 p-4">
          <TransactionInput
            autoFocus
            value={inputValue}
            onValueChange={setInputValue}
            onParsed={handleParsed}
          />
        </div>
      )}
      <nav aria-label="Finance navigation" className="flex h-16 items-stretch justify-center">
        {Object.entries(ROUTE_DETAILS).map(([to, route]) => {
          const Icon = route.icon;
          const isActive = pathname === to;

          return (
            <TanstackLinkButton
              key={to}
              to={to}
              variant="ghost"
              size="default"
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "h-full flex-1 flex-col gap-0.5 border-y-2 border-t-0 border-transparent px-0 pt-px text-muted-foreground hover:text-foreground active:not-aria-[haspopup]:translate-y-0 sm:flex-row sm:items-center sm:gap-2 sm:px-2",
                isActive && "border-b-primary text-foreground",
              )}
            >
              <Icon className="size-4" />
              <span className="text-[9px] sm:text-sm">{route.label}</span>
            </TanstackLinkButton>
          );
        })}

        <div className="flex size-16 shrink-0 items-center justify-center">
          <Button
            variant={isComposerOpen ? "secondary" : "default"}
            size="icon-lg"
            className="size-11 sm:size-9"
            onPress={() => setIsComposerOpen((prev) => !prev)}
            aria-controls="transaction-composer"
            aria-expanded={isComposerOpen}
            aria-label={isComposerOpen ? "Close transaction composer" : "Add transaction"}
          >
            {isComposerOpen ? <XIcon /> : <PlusIcon />}
          </Button>
        </div>
      </nav>
    </div>
  );
};

export const FinanceContainer = {
  Root: FinanceContainerRoot,
  Footer: FinanceContainerFooter,
};
