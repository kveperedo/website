import { useRouter } from "@tanstack/react-router";
import { format } from "date-fns";
import { CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";

import { CATEGORY_COLORS, CATEGORY_LABELS, TRANSACTION_TYPE_COLORS } from "../constants";

export type TransactionRow = {
  id: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  category: string | null;
  transactedAt: Date;
  templateId: string | null;
};

type TransactionTableProps = {
  transactions: Array<TransactionRow>;
  label: string;
};

export const TransactionTable = ({ transactions, label }: TransactionTableProps) => {
  const router = useRouter();

  const handleRowClick = (id: string) => {
    router.navigate({ to: "/finances/transactions/$id", params: { id } });
  };

  return (
    <table className="w-full table-fixed font-mono text-sm" aria-label={label}>
      <colgroup>
        <col />
        <col className="w-28" />
      </colgroup>
      <thead className="sr-only">
        <tr>
          <th scope="col">Description</th>
          <th scope="col">Amount</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t, i) => (
          <tr
            key={t.id}
            data-transaction-id={t.id}
            className={cn(
              "border-l-2",
              t.category
                ? CATEGORY_COLORS[t.category as keyof typeof CATEGORY_COLORS]?.border
                : "border-l-transparent",
              i % 2 === 0 && "bg-muted/30",
              "cursor-pointer hover:bg-muted/50",
            )}
            onClick={() => handleRowClick(t.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleRowClick(t.id);
              }
            }}
            tabIndex={0}
            role="link"
          >
            <td className="pr-4 pl-2 text-foreground">
              <div className="flex min-h-10 items-center gap-3 py-1">
                <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                  {format(t.transactedAt, "dd")}
                </span>
                <div className={cn("flex min-w-0 flex-col", !t.category && "justify-center")}>
                  <span className="flex min-w-0 items-center gap-1 leading-5">
                    <span className="min-w-0 flex-1 truncate">{t.description}</span>
                    {t.templateId && (
                      <span
                        role="img"
                        aria-label="Scheduled transaction"
                        title="Scheduled transaction"
                      >
                        <CalendarClock aria-hidden className="size-3 text-muted-foreground" />
                      </span>
                    )}
                  </span>
                  {t.category && (
                    <span className="text-xxs/3 text-muted-foreground">
                      {CATEGORY_LABELS[t.category as keyof typeof CATEGORY_LABELS]}
                    </span>
                  )}
                </div>
              </div>
            </td>
            <td
              className={cn(
                "py-0.5 pr-4 text-right text-xs font-medium whitespace-nowrap",
                t.type === "income"
                  ? TRANSACTION_TYPE_COLORS.income
                  : TRANSACTION_TYPE_COLORS.expense,
              )}
            >
              {t.type === "income" ? "+" : "-"}₱
              {t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
