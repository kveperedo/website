import { useRouter } from "@tanstack/react-router";

import { cn } from "@/lib/utils";

import { CATEGORY_COLORS, CATEGORY_LABELS, TRANSACTION_TYPE_COLORS } from "../constants";

export type TransactionRow = {
  id: string;
  description: string;
  amount: number;
  type: "expense" | "income";
  category: string | null;
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
    <table className="w-full font-mono text-sm" aria-label={label}>
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
            <td className="px-4 text-foreground">
              <div className={cn("flex min-h-10 flex-col py-1", !t.category && "justify-center")}>
                <span className="leading-5">{t.description}</span>
                {t.category && (
                  <span className="text-[10px]/3 text-muted-foreground">
                    {CATEGORY_LABELS[t.category as keyof typeof CATEGORY_LABELS]}
                  </span>
                )}
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
