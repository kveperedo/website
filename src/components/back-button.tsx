import type { LinkProps } from "@tanstack/react-router";

import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type BackButtonProps = Pick<LinkProps, "params" | "to" | "search">;

function BackButton({ to, params, search }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      render={<Link to={to} params={params} search={search} />}
      aria-label="Go back"
      className="self-start"
    >
      <ArrowLeftIcon />
      Back
    </Button>
  );
}

export { BackButton };
