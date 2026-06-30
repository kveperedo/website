import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { ParsedTransaction } from "#/utils/transactions.server";

import { createTransactionsFn } from "#/utils/transactions.function";

import { TransactionForm } from "./-components/transaction-form";
import { TransactionInput } from "./-components/transaction-input";

type Mode = "idle" | "parsing" | "reviewing" | "saving";

export const Route = createFileRoute("/(authed)/_auth/finances/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const createTransactions = useServerFn(createTransactionsFn);

  const [mode, setMode] = useState<Mode>("idle");
  const [form, setForm] = useState<Array<ParsedTransaction>>([]);
  const [error, setError] = useState<string | null>(null);

  const handleParsed = (transactions: Array<ParsedTransaction>) => {
    setForm(transactions);
    setMode("reviewing");
  };

  const handleSave = async (transactions: Array<ParsedTransaction>) => {
    if (!transactions.length) {
      return;
    }
    setMode("saving");
    setError(null);
    try {
      await createTransactions({ data: transactions });
      router.navigate({ to: "/finances" });
    } catch {
      setError("Failed to save transactions. Please try again.");
      setMode("reviewing");
    }
  };

  return (
    <main className="relative flex h-dvh flex-col bg-background bg-scanlines">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="container mx-auto flex h-full max-w-lg flex-col items-center justify-center px-4 py-8 md:max-w-xl lg:max-w-2xl">
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {mode === "idle" || mode === "parsing" ? (
            <TransactionInput onParsed={handleParsed} />
          ) : (
            form.length > 0 && (
              <TransactionForm
                initialTransactions={form}
                onSave={handleSave}
                onCancel={() => setMode("idle")}
                mode={mode}
              />
            )
          )}
        </div>
      </div>
    </main>
  );
}
