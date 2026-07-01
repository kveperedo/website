import type { LinkProps } from "@tanstack/react-router";

import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type BackButtonProps = Pick<LinkProps, "params" | "to" | "search"> & {
  variant?: "label" | "icon";
};

function BackButton({ variant = "label", ...props }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size={variant === "icon" ? "icon" : "sm"}
      nativeButton={false}
      render={<Link {...props} />}
      aria-label="Go back"
      className="self-start"
    >
      <ArrowLeftIcon />
      {variant === "label" && "Back"}
    </Button>
  );
}

export { BackButton };
