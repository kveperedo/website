import clsx from "clsx";

type LinkButtonsProps = {
  className?: string;
};

const iconClassName = "h-6 w-6 text-neutral-50 opacity-50 transition-opacity hover:opacity-100";

export const LinkButtons = ({ className }: LinkButtonsProps) => {
  return (
    <div className={clsx("flex gap-6", className)}>
      <a
        className="cursor-pointer"
        target="_blank"
        rel="noreferrer"
        href="mailto:kveperedo@gmail.com"
        aria-label="Email link"
      >
        <svg
          className={iconClassName}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
        </svg>
      </a>

      <a
        className="cursor-pointer"
        target="_blank"
        rel="noreferrer"
        href="https://github.com/kveperedo"
        aria-label="Github link"
      >
        <svg
          className={iconClassName}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 0C5.37 0 0 5.37 0 12C0 17.31 3.435 21.795 8.205 23.385C8.805 23.49 9.03 23.13 9.03 22.815C9.03 22.53 9.015 21.585 9.015 20.58C6 21.135 5.22 19.845 4.98 19.17C4.845 18.825 4.26 17.76 3.75 17.475C3.33 17.25 2.73 16.695 3.735 16.68C4.68 16.665 5.355 17.55 5.58 17.91C6.66 19.725 8.385 19.215 9.075 18.9C9.18 18.12 9.495 17.595 9.84 17.295C7.17 16.995 4.38 15.96 4.38 11.37C4.38 10.065 4.845 8.985 5.61 8.145C5.49 7.845 5.07 6.615 5.73 4.965C5.73 4.965 6.735 4.65 9.03 6.195C9.99 5.925 11.01 5.79 12.03 5.79C13.05 5.79 14.07 5.925 15.03 6.195C17.325 4.635 18.33 4.965 18.33 4.965C18.99 6.615 18.57 7.845 18.45 8.145C19.215 8.985 19.68 10.05 19.68 11.37C19.68 15.975 16.875 16.995 14.205 17.295C14.64 17.67 15.015 18.39 15.015 19.515C15.015 21.12 15 22.41 15 22.815C15 23.13 15.225 23.505 15.825 23.385C18.2072 22.5807 20.2772 21.0497 21.7437 19.0074C23.2101 16.965 23.9993 14.5143 24 12C24 5.37 18.63 0 12 0Z"
            fill="currentColor"
          ></path>
        </svg>
      </a>

      <a
        className="cursor-pointer"
        target="_blank"
        rel="noreferrer"
        href="https://www.linkedin.com/in/kveperedo/"
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
          ></path>
          <path
            d="M9.23722 8.85493V20.9939H13.0062V14.9909C13.0062 13.4069 13.3042 11.8729 15.2682 11.8729C17.2052 11.8729 17.2292 13.6839 17.2292 15.0909V20.9949H21.0002V14.3379C21.0002 11.0679 20.2962 8.55493 16.4742 8.55493C14.6392 8.55493 13.4092 9.56193 12.9062 10.5149H12.8552V8.85493H9.23722ZM3.09521 8.85493H6.87021V20.9939H3.09521V8.85493Z"
            fill="currentColor"
          ></path>
        </svg>
      </a>
    </div>
  );
};
