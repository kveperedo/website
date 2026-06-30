import type { TransactionCategory } from "#/generated/prisma/enums";

export type CategoryColor = {
  bg: string;
  text: string;
  selectedBg: string;
  selectedText: string;
};

export const CATEGORIES: Array<{ value: TransactionCategory; label: string }> = [
  { value: "food_drinks", label: "Food & Drinks" },
  { value: "groceries_household", label: "Groceries & Household" },
  { value: "transportation", label: "Transport" },
  { value: "bills_utilities", label: "Bills & Utilities" },
  { value: "health_wellness", label: "Health" },
  { value: "hobbies_lifestyle", label: "Hobbies & Lifestyle" },
  { value: "financial", label: "Financial" },
];

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  food_drinks: "Food & Drinks",
  groceries_household: "Groceries",
  transportation: "Transport",
  bills_utilities: "Bills",
  health_wellness: "Health",
  hobbies_lifestyle: "Hobbies",
  financial: "Financial",
};

export const CATEGORY_COLORS: Record<string, CategoryColor> = {
  food_drinks: {
    bg: "bg-orange-500/10",
    text: "text-orange-400/70",
    selectedBg: "bg-orange-500/30",
    selectedText: "text-orange-300",
  },
  groceries_household: {
    bg: "bg-teal-500/10",
    text: "text-teal-400/70",
    selectedBg: "bg-teal-500/30",
    selectedText: "text-teal-300",
  },
  transportation: {
    bg: "bg-blue-500/10",
    text: "text-blue-400/70",
    selectedBg: "bg-blue-500/30",
    selectedText: "text-blue-300",
  },
  bills_utilities: {
    bg: "bg-rose-500/10",
    text: "text-rose-400/70",
    selectedBg: "bg-rose-500/30",
    selectedText: "text-rose-300",
  },
  health_wellness: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400/70",
    selectedBg: "bg-emerald-500/30",
    selectedText: "text-emerald-300",
  },
  hobbies_lifestyle: {
    bg: "bg-violet-500/10",
    text: "text-violet-400/70",
    selectedBg: "bg-violet-500/30",
    selectedText: "text-violet-300",
  },
  financial: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400/70",
    selectedBg: "bg-yellow-500/30",
    selectedText: "text-yellow-300",
  },
  "": {
    bg: "bg-muted",
    text: "text-muted-foreground",
    selectedBg: "bg-muted",
    selectedText: "text-foreground",
  },
};
