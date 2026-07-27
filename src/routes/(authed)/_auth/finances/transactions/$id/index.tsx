import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getTransactionByIdFn } from "@/utils/transactions.function";

import { EditTransactionForm } from "./-common/components/edit-transaction-form";

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
  const search = Route.useSearch();

  return (
    <main className="relative flex h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="container mx-auto flex h-full max-w-lg flex-col items-center justify-center px-4 py-8 md:max-w-xl lg:max-w-2xl">
          <EditTransactionForm
            backTo="/finances/transactions"
            backSearch={{ year: search.year, month: search.month, q: search.q || undefined }}
          />
        </div>
      </div>
    </main>
  );
}
