"use client";

import type { TransactionCategory } from "@/generated/prisma/enums";

import { ToggleGroup } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

import { CATEGORIES, CATEGORY_CHART_COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from "../constants";
import { CategoryToggleGroupItem } from "./category-toggle";

const ALL_CATEGORY_VALUES = CATEGORIES.map(({ value }) => value);

type CategoryTogglesProps = {
    selectedCategories: Array<TransactionCategory>;
    onSelectionChange: (categories: Array<TransactionCategory>) => void;
    label?: string;
};

export function CategoryToggles({
    selectedCategories,
    onSelectionChange,
    label = "Categories",
}: CategoryTogglesProps) {
    const selectedKeys = selectedCategories.length === 0 ? ALL_CATEGORY_VALUES : selectedCategories;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <ToggleGroup
                selectionMode="multiple"
                selectedKeys={selectedKeys}
                onSelectionChange={(keys) =>
                    onSelectionChange(
                        keys.size === ALL_CATEGORY_VALUES.length
                            ? []
                            : CATEGORIES.filter(({ value }) => keys.has(value)).map(
                                  ({ value }) => value,
                              ),
                    )
                }
                variant="outline"
                className="flex flex-wrap gap-2"
                aria-label={label}
            >
                {CATEGORIES.map(({ value }) => (
                    <CategoryToggleGroupItem
                        key={value}
                        id={value}
                        colors={CATEGORY_COLORS[value]}
                        variant="outline"
                    >
                        <span
                            aria-hidden
                            className={cn(
                                "size-1.5 shrink-0 rounded-none",
                                !selectedKeys.includes(value) && "opacity-40",
                            )}
                            style={{ backgroundColor: CATEGORY_CHART_COLORS[value] }}
                        />
                        {CATEGORY_LABELS[value]}
                    </CategoryToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
    );
}
