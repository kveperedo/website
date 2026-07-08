import type { LinkProps } from "@tanstack/react-router";

import { Link, useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  variant?: "label" | "icon";
  className?: string;
  to?: LinkProps["to"];
  search?: LinkProps["search"];
};

function BackButton({ variant = "label", className, to, search }: BackButtonProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const handleClick = () => {
    if (canGoBack) {
      router.history.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size={variant === "icon" ? "icon" : "default"}
      aria-label="Go back"
      className={cn("self-start", className)}
      {...(to
        ? { nativeButton: false, render: <Link to={to} search={search} /> }
        : { onClick: handleClick })}
    >
      <ArrowLeftIcon />
      {variant === "label" && "Back"}
    </Button>
  );
}

export { BackButton };
