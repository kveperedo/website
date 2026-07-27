import type { RegisteredRouter } from "@tanstack/react-router";
import type { RouteToPath } from "@tanstack/router-core";

import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { TransactionItemAISchema } from "@/schema/transaction";

import { TransactionForm } from "./-common/components/transaction-form";

type AppRoutePath = RouteToPath<RegisteredRouter>;

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "Finances | Kevin Von Erich Peredo" },
];

export const Route = createFileRoute("/(authed)/_auth/finances/transactions/new/")({
  head: () => ({ meta: META }),
  validateSearch: z.object({
    transactions: z.array(TransactionItemAISchema),
    returnTo: z.string().optional() as z.ZodType<AppRoutePath | undefined>,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { transactions } = Route.useSearch();

  return (
    <main className="relative flex h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="container mx-auto flex h-full max-w-lg flex-col items-center justify-center px-4 py-8 md:max-w-xl lg:max-w-2xl">
          {transactions.length > 0 && <TransactionForm initialTransactions={transactions} />}
        </div>
      </div>
    </main>
  );
}
