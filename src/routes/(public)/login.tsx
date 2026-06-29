import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { loginFn } from "#/utils/auth.functions";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/(public)/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const login = useServerFn(loginFn);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded border border-border bg-card p-8 md:p-10">
          <h1 className="mt-3 font-mono text-4xl text-foreground md:text-5xl">login</h1>
          <p className="mt-3  text-sm leading-relaxed text-muted-foreground">
            Enter your password to continue.
          </p>

          <form
            className="mt-7"
            onSubmit={async (event) => {
              event.preventDefault();

              const formData = new FormData(event.currentTarget);
              const password = formData.get("password")?.toString() ?? "";

              setIsLoading(true);

              try {
                await login({ data: password });
              } catch (error) {
                console.error(error);
                setError("Invalid password. Please try again.");
              } finally {
                setIsLoading(false);
              }
            }}
          >
            <input hidden name="username" defaultValue="username" autoComplete="username" />
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password" className=" text-sm tracking-wide text-foreground">
                  Password
                </FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  className="h-auto rounded border border-input bg-background px-4 py-3  text-sm tracking-wide text-foreground"
                  onChange={() => setError(null)}
                />
                {error && <p className="mt-2  text-sm text-destructive">{error}</p>}
              </Field>
            </FieldGroup>

            <Button variant="secondary" type="submit" disabled={isLoading} className="mt-5 w-full ">
              {isLoading && <Spinner data-icon="inline-start" />}
              Continue
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
