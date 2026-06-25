import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Input, Label, TextField } from "react-aria-components";

import { Button } from "#/components/button";
import { loginFn } from "#/utils/auth.functions";

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
        <div className="w-full max-w-md rounded border border-neutral-800 bg-neutral-900/40 p-8 md:p-10">
          <h1 className="mt-3 font-mono text-4xl text-neutral-50 md:text-5xl">login</h1>
          <p className="mt-3 font-serif text-sm leading-relaxed text-neutral-300">
            Enter your password to continue.
          </p>

          <form
            className="mt-7 flex flex-col gap-5"
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
            <TextField name="password" type="password" isRequired>
              <Label className="mb-2 block font-serif text-sm tracking-wide text-neutral-200">
                Password
              </Label>
              <Input
                className="w-full rounded border border-neutral-800 bg-neutral-900 px-4 py-3 font-serif text-sm tracking-wide text-neutral-50 transition-all duration-500 outline-none placeholder:text-neutral-500 focus:border-neutral-500"
                autoComplete="current-password"
                placeholder="Enter password"
                onChange={() => setError(null)}
              />
              {error && <p className="mt-2 font-serif text-sm text-rose-300">{error}</p>}
            </TextField>

            <Button variant="primary" size="sm" type="submit" isLoading={isLoading}>
              Continue
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
