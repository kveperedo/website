import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { getArchivedScheduledTransactionTemplatesFn } from "@/app/finance/scheduled-transactions/functions";
import { TanstackLinkButton } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

import { ScheduledTemplateListItem } from "../-common/components/scheduled-template-list-item";
import { FinanceContainer } from "../../-common/components/finance-container";

export const Route = createFileRoute("/(authed)/_auth/finances/scheduled/archived/")({
  loader: async () => {
    const templates = await getArchivedScheduledTransactionTemplatesFn();
    return { templates };
  },
  head: () => ({
    meta: [{ title: "Archived Schedules | Kevin Von Erich Peredo" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { templates } = Route.useLoaderData();
  const router = useRouter();
  const isEmpty = templates.length === 0;

  const handleRowClick = (id: string) => {
    router.navigate({
      to: "/finances/scheduled/$id",
      params: { id },
    });
  };

  return (
    <FinanceContainer.Root
      header={
        <div className="flex items-center gap-4">
          <TanstackLinkButton to="/finances/scheduled" variant="ghost" size="icon">
            <ArrowLeftIcon className="size-3.5" />
          </TanstackLinkButton>
          <h2 className="font-heading text-lg font-medium text-foreground">Archived Schedules</h2>
        </div>
      }
      footer={<FinanceContainer.Footer />}
    >
      <div className="container mx-auto flex flex-1 flex-col gap-2 px-4 py-4 sm:px-0">
        <Card className="flex min-w-0 flex-1 flex-col p-2">
          <CardContent className="flex flex-col gap-2 p-2">
            <CardTitle>Archived</CardTitle>
            {isEmpty ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No archived schedules.</EmptyTitle>
                  <EmptyDescription>
                    Archived schedules stay here for reference. They will not generate future
                    transactions.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="flex flex-col gap-2" aria-label="Archived scheduled transactions">
                {templates.map((template) => (
                  <ScheduledTemplateListItem
                    key={template.id}
                    template={template}
                    onClick={handleRowClick}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </FinanceContainer.Root>
  );
}
