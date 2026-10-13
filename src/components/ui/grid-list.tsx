import type * as React from "react";

import {
  GridList as GridListPrimitive,
  GridListItem as GridListItemPrimitive,
  type GridListItemProps,
  type GridListProps,
} from "react-aria-components";

import { cn } from "@/lib/utils";

function GridList<T>({ className, ...props }: GridListProps<T>) {
  return (
    <GridListPrimitive
      data-slot="grid-list"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function GridListItem({ className, ...props }: GridListItemProps) {
  return (
    <GridListItemPrimitive
      data-slot="grid-list-item"
      className={cn("outline-none focus-visible:ring-1 focus-visible:ring-ring/50", className)}
      {...props}
    />
  );
}

function GridListCell({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="grid-list-cell" className={className} {...props} />;
}

export { GridList, GridListCell, GridListItem };
