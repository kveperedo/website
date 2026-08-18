import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const LOADING_DELAY_MS = 200;

function RouteProgress() {
  const isLoading = useRouterState({ select: (state) => state.status === "pending" });
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShow(true), LOADING_DELAY_MS);
      return () => clearTimeout(timer);
    }
    setShow(false);
  }, [isLoading]);

  if (!show) {
    return null;
  }

  return (
    <Progress
      aria-label="Loading page"
      isIndeterminate
      className={({ isIndeterminate }) =>
        cn(
          "fixed inset-x-0 top-0 z-50 block *:data-[slot=progress-track]:h-px *:data-[slot=progress-track]:bg-border/50",
          isIndeterminate &&
            "**:data-[slot=progress-indicator]:w-2/3! **:data-[slot=progress-indicator]:animate-[route-loading_1s_ease-in-out_infinite]",
        )
      }
    />
  );
}

export { RouteProgress };
