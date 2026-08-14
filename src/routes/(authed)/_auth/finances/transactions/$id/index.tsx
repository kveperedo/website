import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";

import { getTransactionByIdFn, updateTransactionFn } from "@/app/finance/transactions/functions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TransactionCategorySchema } from "@/generated/zod/schemas/enums/TransactionCategory.schema";
import { TransactionTypeSchema } from "@/generated/zod/schemas/enums/TransactionType.schema";

import { FinanceContainer } from "../../-common/components/finance-container";
import {
  EditTransactionForm,
  FORM_ID,
  type EditFormData,
} from "./-common/components/edit-transaction-form";

const searchSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  q: z.string().optional(),
  type: TransactionTypeSchema.optional(),
  categories: z.array(TransactionCategorySchema).optional(),
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
  const router = useRouter();
  const search = Route.useSearch();
  const { transaction } = Route.useLoaderData();
  const updateTransaction = useServerFn(updateTransactionFn);
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    router.navigate({
      to: "/finances/transactions",
      search: {
        year: search.year,
        month: search.month,
        q: search.q || undefined,
        type: search.type,
        categories: search.categories,
      },
    });
  };

  const handleSubmit = async (updatedTransaction: EditFormData) => {
    setIsSaving(true);
    try {
      await updateTransaction({
        data: {
          id: transaction.id,
          data: {
            ...updatedTransaction,
            category: updatedTransaction.type === "income" ? null : updatedTransaction.category,
            transactedAt: new Date(updatedTransaction.transactedAt),
          },
        },
      });
      await router.invalidate();
    } finally {
      setIsSaving(false);
    }
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
            Save Changes
          </Button>
        </div>
      }
    >
      <div className="container mx-auto flex h-full flex-1 flex-col items-center justify-center p-4 sm:py-8">
        <EditTransactionForm onSubmit={handleSubmit} />
      </div>
    </FinanceContainer.Root>
  );
}
