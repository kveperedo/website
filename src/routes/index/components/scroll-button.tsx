import clsx from "clsx";

type ScrollButtonProps = {
  href: string;
  className?: string;
  direction?: "up" | "down";
  disableBounce?: boolean;
};

export const ScrollButton = ({
  href,
  className,
  direction = "down",
  disableBounce,
}: ScrollButtonProps) => {
  const handleClick = () => {
    const section = document.querySelector(href);

    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    // TODO: Replace with RAC Button
    <button
      onClick={handleClick}
      className={clsx(
        "cursor-pointer",
        direction === "up" && "rotate-180",

        className,
      )}
      aria-label="scroll-down"
    >
      <svg
        className={clsx("h-6 w-6 text-neutral-100", !disableBounce && "animate-bounce")}
        xmlns="http:www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
        ></path>
      </svg>
    </button>
  );
};
