import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import type { ParsedTransaction } from "#/utils/transactions.server";

import { createTransactionFn } from "#/utils/transactions.function";

import { TransactionForm } from "./-components/transaction-form";
import { TransactionInput } from "./-components/transaction-input";

type Mode = "idle" | "parsing" | "reviewing" | "saving";

export const Route = createFileRoute("/(authed)/_auth/finances/new")({
  component: RouteComponent,
});

function RouteComponent() {
  const router = useRouter();
  const createTransaction = useServerFn(createTransactionFn);

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
      await Promise.all(transactions.map((t) => createTransaction({ data: t })));
      router.navigate({ to: "/finances" });
    } catch {
      setError("Failed to save transactions. Please try again.");
      setMode("reviewing");
    }
  };

  return (
    <main className="relative flex h-dvh flex-col bg-background bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_3px)]">
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
