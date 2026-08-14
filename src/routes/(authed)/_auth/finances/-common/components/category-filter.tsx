import { ChevronDownIcon } from "lucide-react";
import { useMemo } from "react";

import type { TransactionCategory } from "@/generated/prisma/enums";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { CATEGORY_CHART_COLORS, CATEGORY_LABELS, CATEGORIES } from "../constants";

type CategoryFilterProps = {
  selectedCategories: Array<TransactionCategory>;
  onSelectionChange: (categories: Array<TransactionCategory>) => void;
  isDisabled?: boolean;
  label?: string;
  showSelectAll?: boolean;
};

export function CategoryFilter({
  selectedCategories,
  onSelectionChange,
  isDisabled = false,
  label = "Categories",
  showSelectAll = true,
}: CategoryFilterProps) {
  const selectedKeys = useMemo(() => new Set(selectedCategories), [selectedCategories]);
  const areAllCategoriesSelected = selectedCategories.length === CATEGORIES.length;
  const areNoCategoriesSelected = selectedCategories.length === 0;

  return (
    <DropdownMenuTrigger>
      <Button variant="outline" size="sm" className="gap-1.5" isDisabled={isDisabled}>
        <span>{label}</span>
        <ChevronDownIcon data-icon="inline-end" />
      </Button>
      <DropdownMenu className="w-48" placement="bottom end">
        <DropdownMenuGroup aria-label="Category filter actions">
          <DropdownMenuItem
            isDisabled={areNoCategoriesSelected}
            onAction={() => onSelectionChange([])}
          >
            Deselect all
          </DropdownMenuItem>
          {showSelectAll && (
            <DropdownMenuItem
              isDisabled={areAllCategoriesSelected}
              onAction={() => onSelectionChange(CATEGORIES.map((category) => category.value))}
            >
              Select all
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={(keys) => {
            if (keys === "all") {
              onSelectionChange(CATEGORIES.map((category) => category.value));
              return;
            }
            onSelectionChange(
              CATEGORIES.filter((category) => keys.has(category.value)).map(
                (category) => category.value,
              ),
            );
          }}
        >
          <DropdownMenuLabel>Filter categories</DropdownMenuLabel>
          {CATEGORIES.map((category) => (
            <DropdownMenuItem
              id={category.value}
              key={category.value}
              textValue={CATEGORY_LABELS[category.value]}
              shouldCloseOnSelect={false}
            >
              <span
                className="mr-2 inline-block size-2 shrink-0 rounded-none"
                style={{ backgroundColor: CATEGORY_CHART_COLORS[category.value] }}
              />
              {CATEGORY_LABELS[category.value]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  );
}
