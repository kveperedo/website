import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { GithubIcon } from "../-icons/github-icon";

type LinkButtonsProps = {
  className?: string;
};

const iconClassName = "h-6 w-6 text-foreground opacity-50 transition-opacity hover:opacity-100";

export const LinkButtons = ({ className }: LinkButtonsProps) => {
  return (
    <div className={cn("flex gap-2", className)}>
      <Button
        variant="ghost"
        size="icon"
        render={<a href="mailto:contact@kevinperedo.com" target="_blank" rel="noreferrer" />}
        aria-label="Email link"
      >
        <svg
          className={iconClassName}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
        </svg>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        render={<a href="https://github.com/kveperedo" target="_blank" rel="noreferrer" />}
        aria-label="Github link"
      >
        <GithubIcon className={iconClassName} />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        render={
          <a href="https://www.linkedin.com/in/kveperedo/" target="_blank" rel="noreferrer" />
        }
        aria-label="LinkedIn link"
      >
        <svg
          className={iconClassName}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4.98292 7.19704C6.19132 7.19704 7.17092 6.21744 7.17092 5.00904C7.17092 3.80065 6.19132 2.82104 4.98292 2.82104C3.77452 2.82104 2.79492 3.80065 2.79492 5.00904C2.79492 6.21744 3.77452 7.19704 4.98292 7.19704Z"
            fill="currentColor"
          />
          <path
            d="M9.23722 8.85493V20.9939H13.0062V14.9909C13.0062 13.4069 13.3042 11.8729 15.2682 11.8729C17.2052 11.8729 17.2292 13.6839 17.2292 15.0909V20.9949H21.0002V14.3379C21.0002 11.0679 20.2962 8.55493 16.4742 8.55493C14.6392 8.55493 13.4092 9.56193 12.9062 10.5149H12.8552V8.85493H9.23722ZM3.09521 8.85493H6.87021V20.9939H3.09521V8.85493Z"
            fill="currentColor"
          />
        </svg>
      </Button>
    </div>
  );
};
