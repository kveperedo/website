import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

type Frame = [boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean];

const frames: Array<Frame> = [
  [true, true, false, false, false, false, false, false, false],
  [false, true, true, false, false, false, false, false, false],
  [false, false, true, false, false, true, false, false, false],
  [false, false, false, false, false, true, false, false, true],
  [false, false, false, false, false, false, false, true, true],
  [false, false, false, false, false, false, true, true, false],
  [false, false, false, true, false, false, true, false, false],
  [true, false, false, true, false, false, false, false, false],
];

const dotPositions = [
  { cx: 1.5, cy: 1.5 },
  { cx: 4.5, cy: 1.5 },
  { cx: 7.5, cy: 1.5 },
  { cx: 1.5, cy: 4.5 },
  { cx: 4.5, cy: 4.5 },
  { cx: 7.5, cy: 4.5 },
  { cx: 1.5, cy: 7.5 },
  { cx: 4.5, cy: 7.5 },
  { cx: 7.5, cy: 7.5 },
];

function BrailleSpinner({ frame }: { frame: number }) {
  const active = frames[frame];
  return (
    <svg className="size-4" viewBox="0 0 9 9" fill="none">
      {dotPositions.map(({ cx, cy }, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="1"
          className="fill-primary transition-opacity duration-100"
          style={{ opacity: active[i] ? 1 : 0.15 }}
        />
      ))}
    </svg>
  );
}

function LoadingDots() {
  const isLoading = useRouterState({ select: (state) => state.status === "pending" });
  const [show, setShow] = useState(false);
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setShow(true), 200);
      return () => clearTimeout(timer);
    }
    setShow(false);
    setFrame(0);
  }, [isLoading]);

  useEffect(() => {
    if (!show) {
      return;
    }
    const id = setInterval(() => setFrame((i) => (i + 1) % frames.length), 80);
    return () => clearInterval(id);
  }, [show]);

  if (!show) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-50">
      <span className="flex size-12 items-center justify-center bg-card shadow-lg">
        <BrailleSpinner frame={frame} />
      </span>
    </div>
  );
}

export { LoadingDots };
