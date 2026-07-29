import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getIsE2EAvailableFn, resetTestDataFn, seedTestDataFn } from "@/utils/e2e.functions";

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "E2E Tools | Kevin Von Erich Peredo" },
];

export const Route = createFileRoute("/(authed)/_auth/e2e/")({
  head: () => ({ meta: META }),
  component: RouteComponent,
  loader: async () => {
    const isAvailable = await getIsE2EAvailableFn();
    return { isAvailable };
  },
});

function RouteComponent() {
  const { isAvailable } = Route.useLoaderData();
  const reset = useServerFn(resetTestDataFn);
  const seed = useServerFn(seedTestDataFn);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [pending, setPending] = useState<"reset" | "seed" | null>(null);
  const [openDialog, setOpenDialog] = useState<"reset" | "seed" | null>(null);

  if (!isAvailable) {
    return (
      <main className="container mx-auto flex min-h-dvh flex-col items-center justify-center px-8 py-16">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm text-muted-foreground">
              E2E database tools are not available in this environment.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleAction = async (action: "reset" | "seed") => {
    setPending(action);
    setStatus(null);
    try {
      if (action === "reset") {
        await reset();
        setStatus({ type: "success", message: "Database reset successfully." });
      } else {
        await seed();
        setStatus({ type: "success", message: "Database seeded successfully." });
      }
    } catch {
      setStatus({
        type: "error",
        message:
          action === "reset" ? "Failed to reset the database." : "Failed to seed the database.",
      });
    } finally {
      setPending(null);
      setOpenDialog(null);
    }
  };

  const dialogs = [
    {
      id: "reset" as const,
      triggerTestId: "reset-database",
      buttonVariant: "destructive" as const,
      buttonLabel: "Reset Database",
      title: "Reset Database",
      description: "This will delete all transactions. This action cannot be undone.",
      confirmTestId: "confirm-reset",
      confirmLabel: "Delete All",
      confirmingLabel: "Resetting...",
    },
    {
      id: "seed" as const,
      triggerTestId: "seed-database",
      buttonVariant: "default" as const,
      buttonLabel: "Seed Database",
      title: "Seed Database",
      description: "This will insert sample transactions for the current month.",
      confirmTestId: "confirm-seed",
      confirmLabel: "Insert Data",
      confirmingLabel: "Seeding...",
    },
  ];

  return (
    <main className="container mx-auto flex min-h-dvh flex-col items-center justify-center px-8 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>E2E Database Tools</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status && (
            <div
              className={cn(
                "rounded-none border px-3 py-2 font-mono text-xs",
                status.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-destructive/30 bg-destructive/10 text-destructive",
              )}
            >
              {status.message}
            </div>
          )}

          {dialogs.map((dialog) => (
            <AlertDialogTrigger
              key={dialog.id}
              isOpen={openDialog === dialog.id}
              onOpenChange={(open) => setOpenDialog(open ? dialog.id : null)}
            >
              <Button
                variant={dialog.buttonVariant}
                className="w-full"
                data-testid={dialog.triggerTestId}
              >
                {dialog.buttonLabel}
              </Button>
              <AlertDialog>
                <AlertDialogHeader>
                  <AlertDialogTitle>{dialog.title}</AlertDialogTitle>
                  <AlertDialogDescription>{dialog.description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    data-testid={dialog.confirmTestId}
                    isDisabled={pending === dialog.id}
                    onPress={() => handleAction(dialog.id)}
                  >
                    {pending === dialog.id ? dialog.confirmingLabel : dialog.confirmLabel}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialog>
            </AlertDialogTrigger>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
