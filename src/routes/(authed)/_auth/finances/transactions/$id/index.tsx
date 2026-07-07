import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";

import type { TransactionInputType } from "@/generated/zod/schemas";

import { EditTransactionForm } from "@/routes/(authed)/_auth/finances/-common/components/edit-transaction-form";
import {
  deleteTransactionFn,
  getTransactionByIdFn,
  updateTransactionFn,
} from "@/utils/transactions.function";

const searchSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/(authed)/_auth/finances/transactions/$id/")({
  validateSearch: searchSchema,
  loader: async ({ params }) => {
    const transaction = await getTransactionByIdFn({ data: params.id });
    return { transaction };
  },
  head: ({ loaderData }) => {
    const { transaction } = loaderData!;
    return {
      meta: [
        {
          title: `Edit ${transaction.description} | Kevin Von Erich Peredo`,
        },
      ],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { transaction } = Route.useLoaderData();
  const search = Route.useSearch();
  const router = useRouter();
  const update = useServerFn(updateTransactionFn);
  const remove = useServerFn(deleteTransactionFn);

  const [mode, setMode] = useState<"idle" | "saving" | "deleting">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (data: TransactionInputType) => {
    setMode("saving");
    setError(null);
    try {
      await update({ data: { id: transaction.id, data } });
      await router.invalidate();
    } catch {
      setError("Failed to update transaction. Please try again.");
    } finally {
      setMode("idle");
    }
  };

  const handleDelete = async () => {
    setMode("deleting");
    try {
      await remove({ data: transaction.id });
      router.navigate({
        to: "/finances/transactions",
        search: { year: search.year, month: search.month, q: search.q || undefined },
      });
    } catch {
      setError("Failed to delete transaction. Please try again.");
    } finally {
      setMode("idle");
    }
  };

  return (
    <main className="relative flex h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="container mx-auto flex h-full max-w-lg flex-col items-center justify-center px-4 py-8 md:max-w-xl lg:max-w-2xl">
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
          <EditTransactionForm
            transaction={transaction}
            onSave={handleSave}
            onDelete={handleDelete}
            mode={mode}
            backTo="/finances/transactions"
            backSearch={{ year: search.year, month: search.month, q: search.q || undefined }}
          />
        </div>
      </div>
    </main>
  );
}
