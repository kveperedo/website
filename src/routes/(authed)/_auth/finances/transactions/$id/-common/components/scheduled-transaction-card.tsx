import { format, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Route } from "../..";

export const ScheduledTransactionCard = () => {
  const { transaction } = Route.useLoaderData();
  // We know that there is a template here
  const template = transaction.template!;

  const getRecurrence = () => {
    if (template.dayOfMonth > 28) {
      return `Every ${format(new Date(2000, 0, template.dayOfMonth), "do")} (last day in shorter months)`;
    }
    return `Every ${format(new Date(2000, 0, template.dayOfMonth), "do")}`;
  };
  const recurrence = getRecurrence();
  const getEndCondition = () => {
    if (template.endDate) {
      return `Until ${format(parseISO(template.endDate), "MMM d, yyyy")}`;
    }
    if (template.maxOccurrences) {
      return `${template._count.transactions}/${template.maxOccurrences} occurrences`;
    }
    return "No end";
  };
  const endCondition = getEndCondition();

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
        <CardDescription>
          {recurrence} | {endCondition}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
