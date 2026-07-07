import type { LinkProps } from "@tanstack/react-router";

import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = Pick<LinkProps, "params" | "to" | "search"> & {
  variant?: "label" | "icon";
  className?: string;
};

function BackButton({ variant = "label", className, ...props }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size={variant === "icon" ? "icon" : "default"}
      nativeButton={false}
      render={<Link {...props} />}
      aria-label="Go back"
      className={cn("self-start", className)}
    >
      <ArrowLeftIcon />
      {variant === "label" && "Back"}
    </Button>
  );
}

export { BackButton };
