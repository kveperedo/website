"use client";

import { ToggleButton as TogglePrimitive, type ToggleButtonProps } from "react-aria-components";

import { cn } from "@/lib/utils";

import type { CategoryColor } from "../constants";

function CategoryToggleGroupItem({
  className,
  colors,
  children,
  ...props
}: ToggleButtonProps & { colors: CategoryColor }) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={(state) =>
        cn(
          "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-none px-2.5 text-xs font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          state.isSelected ? [colors.selectedBg, colors.selectedText] : [colors.bg, colors.text],
          typeof className === "function" ? className(state) : className,
        )
      }
      {...props}
    >
      {children}
    </TogglePrimitive>
  );
}

export { CategoryToggleGroupItem };
