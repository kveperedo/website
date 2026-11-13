import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getCurrentUserFn } from "@/app/auth/auth.functions";
import { cacheControl } from "@/app/infra/cache/cache-control";

export const Route = createFileRoute("/(authed)/_auth")({
  headers: () => cacheControl("no-store"),
  beforeLoad: async ({ location }) => {
    const user = await getCurrentUserFn();

    if (!user) {
      throw redirect({
        to: "/login",
        search: { from: location.href },
        headers: await cacheControl("no-store"),
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
