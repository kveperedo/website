"use client";

import { SearchIcon, XIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CLOSED_SORT_LABELS, type ClosedSort } from "../constants";

type ClosedToolbarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  sort: ClosedSort;
  onSortChange: (sort: ClosedSort) => void;
};

export const ClosedToolbar = ({ query, onQueryChange, sort, onSortChange }: ClosedToolbarProps) => {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <InputGroup className="h-7 w-full border-border/60 sm:w-64">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search company or position"
          aria-label="Search closed applications"
          className="h-7 text-xs"
        />
        {query && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onPress={() => onQueryChange("")}
              aria-label="Clear search"
            >
              <XIcon className="size-3.5" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      <Select
        value={sort}
        onChange={(value) => {
          if (value == null) {
            return;
          }

          onSortChange(value as ClosedSort);
        }}
        aria-label="Sort closed applications"
        className="w-full sm:w-auto"
      >
        <SelectTrigger size="sm" className="w-full sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(CLOSED_SORT_LABELS) as Array<[ClosedSort, string]>).map(
            ([value, label]) => (
              <SelectItem key={value} id={value} textValue={label}>
                {label}
              </SelectItem>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
