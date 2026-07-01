import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";

import type { TransactionInputType } from "#/generated/zod/schemas";

import { TransactionItemAISchema } from "#/schema/transaction";
import { createTransactionsFn } from "#/utils/transactions.function";

import { TransactionForm } from "./-components/transaction-form";

type Mode = "idle" | "saving";

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "Finances | Kevin Von Erich Peredo" },
];

export const Route = createFileRoute("/(authed)/_auth/finances/new")({
  head: () => ({ meta: META }),
  validateSearch: z.object({
    transactions: z.array(TransactionItemAISchema),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const { transactions } = Route.useSearch();
  const createTransactions = useServerFn(createTransactionsFn);

  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (toSave: Array<TransactionInputType>) => {
    if (!toSave.length) {
      return;
    }
    setMode("saving");
    setError(null);
    try {
      await createTransactions({ data: toSave });
      router.navigate({ to: "/finances" });
    } catch {
      setError("Failed to save transactions. Please try again.");
      setMode("idle");
    }
  };

  return (
    <main className="relative flex h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="container mx-auto flex h-full max-w-lg flex-col items-center justify-center px-4 py-8 md:max-w-xl lg:max-w-2xl">
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {transactions.length > 0 && (
            <TransactionForm initialTransactions={transactions} onSave={handleSave} mode={mode} />
          )}
        </div>
      </div>
    </main>
  );
}
