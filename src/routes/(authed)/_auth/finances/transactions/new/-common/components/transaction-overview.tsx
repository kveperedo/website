import { PlusIcon } from "lucide-react";
import { Button, ListBox, ListBoxItem } from "react-aria-components";
import { useFormContext, useWatch } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { TransactionFormData } from "../../../../-common/transaction-form-schema";

const TransactionOverviewItem = ({ itemId, index }: { itemId: string; index: number }) => {
    const { control } = useFormContext<TransactionFormData>();
    const description = useWatch({ control, name: `transactions.${index}.description` });
    const amount = useWatch({ control, name: `transactions.${index}.amount` });
    const type = useWatch({ control, name: `transactions.${index}.type` });

    return (
        <ListBoxItem
            id={itemId}
            textValue={description || "Untitled transaction"}
            className="flex cursor-pointer items-center gap-3 border-b border-subtle p-3 text-xs outline-none last:border-b-0 hover:bg-muted/50 focus-visible:bg-muted data-selected:bg-muted"
        >
            <span className="w-4 shrink-0 font-mono text-muted-foreground">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-foreground">
                {description || "Untitled transaction"}
            </span>
            <span
                className={cn(
                    "shrink-0 font-mono",
                    type === "income" ? "text-emerald-400" : "text-foreground",
                )}
            >
                {type === "income" ? "+" : "-"}₱
                {(amount ?? 0).toLocaleString("en-PH", {
                    maximumFractionDigits: 2,
                })}
            </span>
        </ListBoxItem>
    );
};

type TransactionOverviewProps = {
    fields: Array<{ id: string }>;
    activeIndex: number;
    onSelect: (index: number) => void;
    onAdd: () => void;
};

export const TransactionOverview = ({
    fields,
    activeIndex,
    onSelect,
    onAdd,
}: TransactionOverviewProps) => (
    <div className="hidden lg:block lg:w-xs lg:shrink-0">
        <Card variant="flat" className="flex h-full min-h-0 flex-col lg:border-0">
            <CardHeader variant="flat">
                <CardTitle variant="flat">All transactions</CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
                <ListBox
                    aria-label="All transactions"
                    selectionMode="single"
                    disallowEmptySelection
                    selectedKeys={new Set([fields[activeIndex]?.id ?? ""])}
                    onSelectionChange={(keys) => {
                        if (keys === "all") {
                            return;
                        }
                        const [key] = keys;
                        const selectedIndex = fields.findIndex((field) => field.id === key);
                        if (selectedIndex !== -1) {
                            onSelect(selectedIndex);
                        }
                    }}
                    className="max-h-72 min-h-0 flex-1 overflow-y-auto outline-none"
                >
                    {fields.map((field, index) => (
                        <TransactionOverviewItem key={field.id} itemId={field.id} index={index} />
                    ))}
                </ListBox>
                <Button
                    onPress={onAdd}
                    className="flex w-full shrink-0 items-center gap-2 border-t border-subtle p-3 text-left text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                    <PlusIcon className="size-3.5" />
                    Add transaction
                </Button>
            </CardContent>
        </Card>
    </div>
);
