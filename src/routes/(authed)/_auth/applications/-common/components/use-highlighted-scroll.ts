"use client";

import { useEffect, useRef } from "react";

/** Scrolls the element into view briefly when an optimistic update highlights its row. */
export const useHighlightedScroll = (active: boolean) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) {
      rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [active]);

  return rootRef;
};
