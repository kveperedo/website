import { createFileRoute } from "@tanstack/react-router";

import { getExpensesFn } from "#/utils/expenses.function";

export const Route = createFileRoute("/(authed)/_auth/finances/")({
  loader: async () => {
    const expenses = await getExpensesFn();

    return { expenses };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { expenses } = Route.useLoaderData();

  console.log(expenses);

  return <div>Hello "/_auth/finances/"!</div>;
}
