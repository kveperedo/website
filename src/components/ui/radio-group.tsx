"use client";

import type { ReactNode } from "react";

import {
  RadioGroup as RadioGroupPrimitive,
  RadioField,
  RadioButton,
  type RadioGroupProps,
} from "react-aria-components";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  children,
  value,
  ...rest
}: {
  className?: string;
  children?: ReactNode;
  value: string;
  [key: string]: unknown;
}) {
  return (
    <RadioField value={value} {...rest}>
      <RadioButton
        className={cn(
          "group flex items-center gap-2 text-xs text-foreground data-disabled:opacity-50",
          className,
        )}
      >
        <span
          data-slot="radio-group-indicator"
          className={cn(
            "relative flex aspect-square size-4 shrink-0 items-center justify-center rounded-full border border-input outline-none group-focus-visible:border-ring group-focus-visible:ring-3 group-focus-visible:ring-ring/50 group-aria-invalid:border-destructive group-aria-invalid:ring-3 group-aria-invalid:ring-destructive/20 group-data-focus-visible:border-ring group-data-focus-visible:ring-3 group-data-focus-visible:ring-ring/50 group-data-invalid:border-destructive group-data-invalid:ring-3 group-data-invalid:ring-destructive/20 group-data-selected:border-primary group-data-selected:bg-primary group-data-selected:text-primary-foreground group-data-invalid:group-data-selected:border-primary group-data-disabled:cursor-not-allowed group-data-disabled:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 dark:bg-input/30 dark:group-aria-invalid:border-destructive/50 dark:group-aria-invalid:ring-destructive/40 dark:group-data-invalid:border-destructive/50 dark:group-data-invalid:ring-destructive/40 dark:group-data-selected:bg-primary",
          )}
        >
          <span className="hidden size-2 rounded-full bg-primary-foreground group-data-selected:block" />
        </span>
        {children}
      </RadioButton>
    </RadioField>
  );
}

export { RadioGroup, RadioGroupItem };
