"use client";

import { cva } from "class-variance-authority";
import { useMemo } from "react";
import { ToggleButton as TogglePrimitive, type ToggleButtonProps } from "react-aria-components";

import { cn } from "@/lib/utils";

import type { CategoryColor } from "../constants";

const createCategoryToggleVariants = (colors: CategoryColor) =>
    cva(
        "inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-none px-2.5 text-xs font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        {
            variants: {
                variant: {
                    filled: "",
                    outline: "gap-1.5 border border-subtle bg-muted/30 text-muted-foreground",
                },
                selected: {
                    true: "",
                    false: "",
                },
            },
            compoundVariants: [
                {
                    variant: "filled",
                    selected: true,
                    class: [colors.selectedBg, colors.selectedText],
                },
                {
                    variant: "filled",
                    selected: false,
                    class: [colors.bg, colors.text],
                },
                {
                    variant: "outline",
                    selected: true,
                    class: "text-foreground",
                },
            ],
            defaultVariants: {
                variant: "filled",
                selected: false,
            },
        },
    );

type CategoryToggleGroupItemProps = ToggleButtonProps & {
    colors: CategoryColor;
    variant?: "filled" | "outline";
};

function CategoryToggleGroupItem({
    className,
    colors,
    variant = "filled",
    children,
    ...props
}: CategoryToggleGroupItemProps) {
    const variants = useMemo(() => createCategoryToggleVariants(colors), [colors]);

    return (
        <TogglePrimitive
            data-slot="toggle-group-item"
            className={(state) =>
                cn(
                    variants({ variant, selected: state.isSelected }),
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
