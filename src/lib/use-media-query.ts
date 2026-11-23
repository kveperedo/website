"use client";

import { useEffect, useState } from "react";

// Keep in sync with Tailwind's default theme; styles.css sets no breakpoint overrides.
export const TAILWIND_BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
} as const;

export type TailwindBreakpoint = keyof typeof TAILWIND_BREAKPOINTS;

export function useBreakpoint(breakpoint: TailwindBreakpoint) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(`(min-width: ${TAILWIND_BREAKPOINTS[breakpoint]}px)`);
        const sync = () => setMatches(mediaQuery.matches);

        sync();
        mediaQuery.addEventListener("change", sync);
        return () => mediaQuery.removeEventListener("change", sync);
    }, [breakpoint]);

    return matches;
}
