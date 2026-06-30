import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  tags?: Array<string>;
  content?: Array<string>;
  stickyDots?: boolean;
  collapsible?: boolean;
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
  collapsible = false,
}: TimelineProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const isEndDateObject = endDate && typeof endDate === "object";

  const renderLeftEndDate = () => {
    if (!endDate) {
      return null;
    }

    if (isEndDateObject) {
      return (
        <>
          <span className="text-sm">-</span>
          <span className="mb-1 text-sm font-semibold text-foreground">{endDate.month}</span>
          <span className="font-medium text-muted-foreground">{endDate.year}</span>
        </>
      );
    }

    return (
      <>
        <span className="text-sm">-</span>
        <span className="text-sm font-semibold whitespace-pre text-foreground">{endDate}</span>
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
          "mr-10 hidden w-16 flex-col items-end md:flex",
          collapsible ? "pt-19" : "pt-16",
          stickyDots && !collapsible && "md:pt-19",
        )}
      >
        <span className="mb-1 text-sm font-semibold text-foreground">{startDate.month}</span>
        <span className="font-medium text-muted-foreground">{startDate.year}</span>
        {renderLeftEndDate()}
      </div>
      <div className="relative flex-1 border-l-2 border-muted px-8 py-16 pr-0 md:px-10 md:pr-8">
        <div
          className={cn(
            "flex h-3 w-3",
            collapsible
              ? "sticky top-11.25 -ml-9.75 md:top-5.25 md:-ml-11.75"
              : stickyDots
                ? "sticky top-2.25 -ml-9.75 md:top-5.25 md:-ml-11.75"
                : "absolute top-13 -left-1.75",
          )}
        >
          <span
            className={cn(
              "absolute -z-10 h-full w-full animate-ping rounded-full bg-muted-foreground/50",
              collapsible ? "top-11.25 md:top-5.25" : "top-4.5 md:top-5.25",
            )}
          />
          <span
            className={cn(
              "absolute h-full w-full rounded-full bg-foreground",
              collapsible ? "top-11.25 md:top-5.25" : "top-4.5 md:top-5.25",
            )}
          />
        </div>

        <span className="text-sm text-muted-foreground md:hidden">
          <>
            {startDate.month} {startDate.year}
            {renderTitleEndDate()}
          </>
        </span>

        <h3 className="mb-1 font-heading text-2xl">
          <span className="font-bold">{title}</span>
          {titleExtension}
        </h3>

        <h5 className="font-medium text-foreground">{subtitle}</h5>

        {tags && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tags.map((label) => (
              <Badge key={label} variant="secondary">
                {label}
              </Badge>
            ))}
          </div>
        )}

        {content && !collapsible && (
          <Card className="mt-6 py-0">
            <ul className="list-inside list-disc flex-col gap-3 p-6 md:list-outside">
              {content.map((detail) => (
                <li
                  key={detail}
                  className="text-sm leading-loose font-medium tracking-wide text-foreground md:ml-6"
                >
                  {detail}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {content && collapsible && (
          <Card className="mt-6 py-0">
            <ul className="flex list-inside list-disc flex-col gap-3 p-6 pb-0 md:list-outside">
              {content.slice(0, 2).map((detail) => (
                <li
                  key={detail}
                  className="text-sm leading-loose font-medium tracking-wide text-foreground md:ml-6"
                >
                  {detail}
                </li>
              ))}
              <div
                className={cn(
                  "grid transition-all duration-300",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="flex flex-col gap-3 overflow-hidden">
                  {content.slice(2).map((detail) => (
                    <li
                      key={detail}
                      className="text-sm leading-loose font-medium tracking-wide text-foreground md:ml-6"
                    >
                      {detail}
                    </li>
                  ))}
                </div>
              </div>
            </ul>

            {content.length > 2 && (
              <ButtonPrimitive
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex w-full cursor-pointer items-center justify-center gap-1 px-6 py-3 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                {isOpen ? "Show less" : "Show more"}
                <ChevronDownIcon
                  className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                />
              </ButtonPrimitive>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};
