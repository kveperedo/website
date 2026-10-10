import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { Progress } from "@/components/ui/progress";

// MIN_VISIBLE_MS is timed from when the bar appears, not from when loading started.
const LOADING_DELAY_MS = 100;
const MIN_VISIBLE_MS = 300;

function RouteProgress() {
  const isLoading = useRouterState({ select: (state) => state.isLoading });
  const [isVisible, setIsVisible] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    // Hold the bar across overlapping navigations rather than restarting the delay.
    if (isLoading && isVisible) {
      return;
    }

    if (!isLoading && !isVisible) {
      return;
    }

    if (isLoading) {
      const showTimer = setTimeout(() => {
        shownAt.current = performance.now();
        setIsVisible(true);
      }, LOADING_DELAY_MS);

      return () => clearTimeout(showTimer);
    }

    const hideTimer = setTimeout(
      () => setIsVisible(false),
      Math.max(MIN_VISIBLE_MS - (performance.now() - shownAt.current), 0),
    );

    return () => clearTimeout(hideTimer);
  }, [isLoading, isVisible]);

  return (
    <>
      <div role="status" className="sr-only">
        {isVisible ? "Loading page" : null}
      </div>
      {isVisible && (
        // `!` on the width beats the inline 100% `ProgressIndicator` sets when indeterminate.
        <Progress
          aria-hidden="true"
          isIndeterminate
          className="fixed inset-x-0 top-0 z-50 block **:data-[slot=progress-indicator]:w-1/3! **:data-[slot=progress-indicator]:animate-route-loading **:data-[slot=progress-indicator]:bg-progress-sweep *:data-[slot=progress-track]:h-0.5 *:data-[slot=progress-track]:bg-primary/15"
        />
      )}
    </>
  );
}

export { RouteProgress };
