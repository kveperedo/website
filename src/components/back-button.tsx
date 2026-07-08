import type { LinkProps } from "@tanstack/react-router";

import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BackButtonProps = {
  variant?: "label" | "icon";
  className?: string;
  fallbackTo?: LinkProps["to"];
  fallbackSearch?: LinkProps["search"];
};

function BackButton({ variant = "label", className, fallbackTo, fallbackSearch }: BackButtonProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const handleClick = () => {
    if (canGoBack) {
      router.history.back();
    } else if (fallbackTo) {
      router.navigate({ to: fallbackTo, search: fallbackSearch });
    }
  };

  return (
    <Button
      variant="ghost"
      size={variant === "icon" ? "icon" : "default"}
      onClick={handleClick}
      aria-label="Go back"
      className={cn("self-start", className)}
    >
      <ArrowLeftIcon />
      {variant === "label" && "Back"}
    </Button>
  );
}

export { BackButton };
