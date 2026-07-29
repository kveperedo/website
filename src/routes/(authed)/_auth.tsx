import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getCurrentUserFn } from "@/utils/auth.functions";

export const Route = createFileRoute("/(authed)/_auth")({
  headers: () => ({ "Cache-Control": "no-store" }),
  beforeLoad: async () => {
    const user = await getCurrentUserFn();

    if (!user) {
      throw redirect({
        to: "/login",
        headers: { "Cache-Control": "no-store" },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
