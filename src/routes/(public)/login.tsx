import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { loginFn } from "#/utils/auth.functions";
import { BackButton } from "@/components/back-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const META: Array<React.JSX.IntrinsicElements["meta"]> = [
  { title: "Login | Kevin Von Erich Peredo" },
];

export const Route = createFileRoute("/(public)/login")({
  head: () => ({ meta: META }),
  component: RouteComponent,
});

function RouteComponent() {
  const login = useServerFn(loginFn);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <div className="flex w-full max-w-md flex-col gap-6">
          <BackButton to="/" />
          <p className="text-sm text-muted-foreground">
            Enter the admin password to manage the site.
          </p>
          <Card className="flex flex-col gap-5 p-6">
            <form
              onSubmit={async (event) => {
                event.preventDefault();

                const formData = new FormData(event.currentTarget);
                const password = formData.get("password")?.toString() ?? "";
                if (!password.trim()) {
                  setError("Please enter a password.");
                  return;
                }

                setIsLoading(true);

                try {
                  await login({ data: password });
                } catch (err) {
                  console.error(err);
                  setError("Invalid password. Please try again.");
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              <input hidden name="username" defaultValue="username" autoComplete="username" />
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="password" className="text-sm tracking-wide text-foreground">
                    Password
                  </FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter password"
                    autoFocus
                    onChange={() => setError(null)}
                  />
                  <FieldError>{error}</FieldError>
                </Field>
              </FieldGroup>

              <Button type="submit" disabled={isLoading} className="mt-7 w-full">
                {isLoading && <Spinner data-icon="inline-start" />}
                Continue
              </Button>
            </form>
          </Card>
        </div>
      </section>
    </main>
  );
}
