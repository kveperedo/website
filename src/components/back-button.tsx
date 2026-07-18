import type { LinkProps } from "@tanstack/react-router";

import { useCanGoBack, useRouter } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Link } from "@/components/link";
import { Button, buttonVariants } from "@/components/ui/button";
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

  const handlePress = () => {
    if (canGoBack) {
      router.history.back();
    }
  };

  if (to) {
    return (
      <Link
        to={to}
        search={search}
        className={buttonVariants({
          variant: "ghost",
          size: variant === "icon" ? "icon" : "default",
          className: cn("self-start", className),
        })}
      >
        <ArrowLeftIcon />
        {variant === "label" && "Back"}
      </Link>
    );
  }

  return (
    <Button
      variant="ghost"
      size={variant === "icon" ? "icon" : "default"}
      aria-label="Go back"
      className={cn("self-start", className)}
      onPress={handlePress}
    >
      <ArrowLeftIcon />
      {variant === "label" && "Back"}
    </Button>
  );
}

export { BackButton };
