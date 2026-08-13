import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getCurrentUserFn } from "@/app/auth/functions";
import { cacheControl } from "@/app/infra/cache-control";

export const Route = createFileRoute("/(authed)/_auth")({
  headers: () => cacheControl("no-store"),
  beforeLoad: async () => {
    const user = await getCurrentUserFn();

    if (!user) {
      throw redirect({
        to: "/login",
        headers: await cacheControl("no-store"),
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
