import { cn } from "#/lib/cn";

import { Tag } from "./tag";

type Date = {
  month: string;
  year: number;
};

type TimelineProps = {
  className?: string;
  startDate: Date;
  endDate?: Date | string;
  title: string;
  titleExtension?: string;
  subtitle: string;
  tags?: string[];
  content?: string[];
  stickyDots?: boolean;
};

export const Timeline = ({
  className,
  content,
  subtitle,
  title,
  titleExtension,
  tags,
  startDate,
  endDate,
  stickyDots = true,
}: TimelineProps) => {
  const isEndDateObject = endDate && typeof endDate === "object";

  const renderLeftEndDate = () => {
    if (!endDate) {
      return null;
    }

    if (isEndDateObject) {
      return (
        <>
          <span className="text-2xl">-</span>
          <span className="mb-1 text-2xl font-semibold text-neutral-200">{endDate.month}</span>
          <span className="font-medium text-neutral-300">{endDate.year}</span>
        </>
      );
    }

    return (
      <>
        <span className="text-2xl">-</span>
        <span className="text-2xl font-semibold whitespace-pre text-neutral-200">{endDate}</span>
      </>
    );
  };

  const renderTitleEndDate = () => {
    if (!endDate) {
      return null;
    }

    if (isEndDateObject) {
      return ` - ${endDate.month} ${endDate.year}`;
    }

    return ` - ${endDate}`;
  };

  return (
    <div className={cn("flex", className)}>
      <div
        className={cn(
          "mr-10 hidden w-12 flex-col items-end pt-16 md:flex",
          stickyDots && "md:pt-19",
        )}
      >
        <span className="mb-1 text-2xl font-semibold text-neutral-200">{startDate.month}</span>
        <span className="font-medium text-neutral-300">{startDate.year}</span>
        {renderLeftEndDate()}
      </div>
      <div className="relative flex-1 border-l-2 border-neutral-500 px-8 py-16 pr-0 md:px-10 md:pr-8">
        <div
          className={cn(
            "flex h-3 w-3 ",
            stickyDots
              ? "sticky top-2.25 -ml-9.75 md:top-5.25 md:-ml-11.75"
              : "absolute top-13 -left-1.75",
          )}
        >
          <span className="absolute top-4.5 -z-10 h-full w-full animate-ping rounded-full bg-neutral-400/50 md:top-5.25" />
          <span className="absolute top-4.5 h-full w-full rounded-full bg-neutral-50 md:top-5.25" />
        </div>

        <span className="text-neutral-300 md:hidden">
          <>
            {startDate.month} {startDate.year}
            {renderTitleEndDate()}
          </>
        </span>

        <h3 className="mb-1 text-2xl">
          <span className="font-bold">{title}</span>
          {titleExtension}
        </h3>

        <h5 className="font-medium text-neutral-200">{subtitle}</h5>

        {tags && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tags.map((label) => (
              <Tag key={label}>{label}</Tag>
            ))}
          </div>
        )}
        {content && (
          <ul className="mt-6 flex w-auto list-inside list-disc flex-col gap-3 rounded-2xl border-2 border-neutral-800 bg-neutral-900/40 p-6 shadow-xl backdrop-blur md:list-outside lg:w-216">
            {content.map((detail) => (
              <li
                key={detail}
                className="leading-loose font-medium tracking-wide text-neutral-200 md:ml-6"
              >
                {detail}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
