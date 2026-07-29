import type { RegisteredRouter } from "@tanstack/react-router";
import type { RouteToPath } from "@tanstack/router-core";

import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TransactionItemAISchema } from "@/schema/transaction";
import { createTransactionsFn } from "@/utils/transactions.function";

import type { TransactionFormData } from "../../-common/transaction-form-schema";

import { FinanceContainer } from "../../-common/components/finance-container";
import {
  FORM_ID,
  TransactionForm,
  type NewTransactionInput,
} from "./-common/components/transaction-form";

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
  const router = useRouter();
  const { transactions, returnTo } = Route.useSearch();
  const createTransactions = useServerFn(createTransactionsFn);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (data: TransactionFormData) => {
    if (data.transactions.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      await createTransactions({
        data: data.transactions.map((transaction) => {
          const transactionInput: NewTransactionInput = {
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category: transaction.type === "income" ? null : transaction.category,
            transactedAt: new Date(transaction.transactedAt),
          };

          if (transaction.scheduleEnabled) {
            const { schedule } = transaction;

            transactionInput.schedule = {
              dayOfMonth: schedule.dayOfMonth!,
              endDate: schedule.endType === "date" ? (schedule.endDate ?? null) : null,
              maxOccurrences:
                schedule.endType === "count" ? (schedule.maxOccurrences ?? null) : null,
            };
          }

          return transactionInput;
        }),
      });
      router.navigate({ to: returnTo ?? "/finances" });
    } catch {
      // TODO: Add snackbar for error
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.navigate({ to: returnTo ?? "/finances" });
  };

  return (
    <FinanceContainer.Root
      footer={
        <div className="container mx-auto flex h-16 items-center justify-end gap-4 px-4">
          <Button variant="secondary" className="flex-1 sm:flex-none" onPress={handleBack}>
            Cancel
          </Button>
          <Button
            className="flex-1 sm:flex-none"
            type="submit"
            form={FORM_ID}
            isDisabled={isSaving}
          >
            {isSaving && <Spinner data-icon="inline-start" />}
            Save {transactions.length > 1 ? "Transactions" : "Transaction"}
          </Button>
        </div>
      }
    >
      <div className="container mx-auto flex h-full flex-1 flex-col items-center justify-center p-6 sm:px-4 sm:py-8">
        {transactions.length > 0 && (
          <TransactionForm transactions={transactions} onSubmit={handleSubmit} />
        )}
      </div>
    </FinanceContainer.Root>
  );
}
