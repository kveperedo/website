import clsx from "clsx";
import { useEffect, useState } from "react";

export const FadeIn = () => {
  const [loadingState, setLoadingState] = useState<"visible" | "fading" | "hidden">("visible");

  useEffect(() => {
    let cancelled = false;

    const startFadeOut = () => {
      if (cancelled) {
        return;
      }

      setLoadingState((state) => (state === "visible" ? "fading" : state));
    };

    const fallbackTimer = window.setTimeout(startFadeOut, 4000);

    if (document.fonts?.ready) {
      document.fonts.ready.then(startFadeOut).catch(startFadeOut);
    } else {
      startFadeOut();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (loadingState === "hidden") {
    return null;
  }

  return (
    <div
      id="loading"
      aria-hidden="true"
      className={clsx(
        "fixed inset-0 z-50 flex h-screen w-screen items-start justify-center bg-black transition-opacity duration-500",
        loadingState === "visible" ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onTransitionEnd={() => {
        if (loadingState === "fading") {
          setLoadingState("hidden");
        }
      }}
    />
  );
};
