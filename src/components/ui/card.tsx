import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group/card flex flex-col rounded-none border bg-card text-xs/relaxed text-card-foreground [--card-spacing:--spacing(4)] has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none",
  {
    variants: {
      variant: {
        default: "gap-(--card-spacing) border-border py-(--card-spacing) shadow-xl backdrop-blur",
        flat: "gap-0 border-subtle py-0 shadow-none",
      },
      size: {
        default: "",
        sm: "[--card-spacing:--spacing(3)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const cardHeaderVariants = cva(
  "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-none has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto]",
  {
    variants: {
      variant: {
        default: "px-(--card-spacing) [.border-b]:pb-(--card-spacing)",
        flat: "flex items-center border-b border-subtle p-3",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const cardTitleVariants = cva("", {
  variants: {
    variant: {
      default: "text-sm font-medium group-data-[size=sm]/card:text-sm",
      flat: "text-xs/7 font-medium text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Card({
  className,
  variant = "default",
  size = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant}
      data-size={size}
      className={cn(cardVariants({ variant, size, className }))}
      {...props}
    />
  );
}

function CardHeader({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardHeaderVariants>) {
  return (
    <div
      data-slot="card-header"
      data-variant={variant}
      className={cn(cardHeaderVariants({ variant, className }))}
      {...props}
    />
  );
}

function CardTitle({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardTitleVariants>) {
  return (
    <div
      data-slot="card-title"
      data-variant={variant}
      className={cn(cardTitleVariants({ variant, className }))}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-xs/relaxed text-muted-foreground", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("px-(--card-spacing)", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center rounded-none border-t p-(--card-spacing)", className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
