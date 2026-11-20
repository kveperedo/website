import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";

import {
  getTransactionByIdFn,
  updateTransactionFn,
} from "@/app/finance/transactions/transactions.functions";
import { AppHeader } from "@/components/app-header";
import { BreadcrumbItem, BreadcrumbPage, TanstackBreadcrumbLink } from "@/components/ui/breadcrumb";
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

    if (!transaction) {
      throw redirect({ to: "/finances/transactions" });
    }

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
  const { transaction } = Route.useLoaderData();
  const updateTransaction = useServerFn(updateTransactionFn);
  const [isSaving, setIsSaving] = useState(false);

  const handleBack = () => {
    router.navigate({
      to: "/finances/transactions",
      search: (current) => ({ ...current }),
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
      classNames={{ root: "flex flex-col lg:h-dvh lg:overflow-hidden", main: "min-h-0 flex-1" }}
      header={
        <AppHeader>
          <BreadcrumbItem>
            <TanstackBreadcrumbLink to="/">Home</TanstackBreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <TanstackBreadcrumbLink to="/finances">Finances</TanstackBreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Transaction</BreadcrumbPage>
          </BreadcrumbItem>
        </AppHeader>
      }
    >
      <div className="mx-auto flex h-full w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 p-4 sm:px-0">
        <h1 className="sr-only">Edit transaction</h1>
        <EditTransactionForm
          onSubmit={handleSubmit}
          actions={
            <>
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
            </>
          }
        />
      </div>
    </FinanceContainer.Root>
  );
}
