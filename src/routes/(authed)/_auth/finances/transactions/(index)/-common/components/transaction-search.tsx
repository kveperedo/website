import { useRouter } from "@tanstack/react-router";
import { SearchIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Route } from "../..";

const SEARCH_DEBOUNCE_MS = 250;

type TransactionSearchProps = {
    autoFocus?: boolean;
    onOpenChange?: (isOpen: boolean) => void;
    onClose?: () => void;
};

export function TransactionSearch({
    autoFocus = false,
    onOpenChange,
    onClose,
}: TransactionSearchProps) {
    const { year, month, monthLabel } = Route.useLoaderData();
    const search = Route.useSearch();
    const router = useRouter();
    const [inputValue, setInputValue] = useState(search.q ?? "");
    const submittedQueryRef = useRef(search.q);

    const debouncedNavigate = useDebouncedCallback((q?: string) => {
        submittedQueryRef.current = q;
        void router.navigate({
            to: "/finances/transactions",
            search: (current) => ({
                ...current,
                year: current.year ?? year,
                month: current.month ?? month,
                q,
            }),
            replace: true,
        });
    }, SEARCH_DEBOUNCE_MS);

    useEffect(() => {
        if (search.q !== submittedQueryRef.current) {
            submittedQueryRef.current = search.q;
            setInputValue(search.q ?? "");
            onOpenChange?.(Boolean(search.q));
        }
    }, [search.q, onOpenChange]);

    useEffect(() => () => debouncedNavigate.cancel(), [debouncedNavigate]);

    return (
        <div className="relative">
            <SearchIcon
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                id="transaction-search"
                autoFocus={autoFocus}
                className="pr-10 pl-9"
                value={inputValue}
                onChange={(event) => {
                    const q = event.target.value;
                    setInputValue(q);
                    debouncedNavigate(q.trim() || undefined);
                }}
                onKeyDown={(event) => {
                    if (event.key === "Enter") {
                        debouncedNavigate.flush();
                    }
                    if (event.key === "Escape") {
                        event.preventDefault();
                        debouncedNavigate.cancel();
                        setInputValue(search.q ?? "");
                        if (!search.q) {
                            onClose?.();
                        }
                    }
                }}
                placeholder={`Search ${monthLabel} transactions`}
                aria-label={`Search ${monthLabel} transactions`}
            />
            {inputValue && (
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onPress={() => {
                        debouncedNavigate.cancel();
                        submittedQueryRef.current = undefined;
                        setInputValue("");
                        onClose?.();
                        void router.navigate({
                            to: "/finances/transactions",
                            search: (current) => ({
                                ...current,
                                year: current.year ?? year,
                                month: current.month ?? month,
                                q: undefined,
                            }),
                            replace: true,
                        });
                    }}
                    className="absolute inset-y-0 right-1 my-auto text-muted-foreground"
                    aria-label="Clear search"
                >
                    <X className="size-4" />
                </Button>
            )}
        </div>
    );
}
