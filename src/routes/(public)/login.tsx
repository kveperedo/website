import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";

import { loginFn } from "#/utils/auth.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
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
    <main className="relative min-h-screen overflow-hidden bg-background bg-scanlines">
      <section className="relative container mx-auto flex min-h-screen items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md p-8 md:p-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              render={<Link to="/" />}
              aria-label="Go back to home"
            >
              <ArrowLeftIcon />
            </Button>
            <h1 className="font-heading text-4xl font-medium text-foreground md:text-5xl">Login</h1>
          </div>

          <form
            className="mt-4"
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
      </section>
    </main>
  );
}
