import { format, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Route } from "../..";

export const TemplateSummaryCard = () => {
  const { template } = Route.useLoaderData();

  const getEndCondition = () => {
    if (template.endDate) {
      return `Until ${format(parseISO(template.endDate), "MMM d, yyyy")}`;
    }
    if (template.maxOccurrences) {
      return `${template._count.transactions}/${template.maxOccurrences} occurrences`;
    }
    return `${template._count.transactions} occurrences`;
  };

  const STATUS_BADGE_MAP = {
    active: { variant: "secondary" as const, label: "Scheduled" },
    paused: { variant: "outline" as const, label: "Paused" },
    archived: { variant: "outline" as const, label: "Archived" },
  } satisfies Record<typeof template.status, { variant: "secondary" | "outline"; label: string }>;

  const { variant, label } = STATUS_BADGE_MAP[template.status];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock size={16} />
            Recurring schedule
          </CardTitle>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <CardDescription>{getEndCondition()}</CardDescription>
      </CardHeader>
    </Card>
  );
};
