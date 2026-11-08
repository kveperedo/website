"use client";

import { useRouter, useRouterState } from "@tanstack/react-router";
import {
  CalendarClockIcon,
  LayoutDashboardIcon,
  PlusIcon,
  ReceiptTextIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import type { ParsedTransaction } from "@/app/finance/transactions/transactions.schema";

import { AppContainer, type AppContainerProps } from "@/components/app-container";
import { Button, TanstackLinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TransactionInput } from "./transaction-input";

const ROUTE_DETAILS = {
  "/finances": { icon: LayoutDashboardIcon, label: "Dashboard" },
  "/finances/transactions": { icon: ReceiptTextIcon, label: "Transactions" },
  "/finances/scheduled": { icon: CalendarClockIcon, label: "Scheduled" },
} as const;

export type FinanceContainerProps = AppContainerProps;

const FinanceContainerRoot = ({ header, footer, children }: FinanceContainerProps) => {
  return (
    <AppContainer header={header} footer={footer}>
      {children}
    </AppContainer>
  );
};

const FinanceContainerFooter = () => {
  const router = useRouter();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const composerToggleRef = useRef<HTMLButtonElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const handleParsed = (transactions: Array<ParsedTransaction>) => {
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
            onEmptyBackspace={() => {
              setIsComposerOpen(false);
              // The focused input unmounts on close; hand focus back to the toggle.
              composerToggleRef.current?.focus();
            }}
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
            ref={composerToggleRef}
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
