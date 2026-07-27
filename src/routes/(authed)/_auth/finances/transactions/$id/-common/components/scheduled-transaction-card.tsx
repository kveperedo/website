import { format, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Route } from "../..";

export const ScheduledTransactionCard = () => {
  const { transaction } = Route.useLoaderData();
  // We know that there is a template here
  const template = transaction.template!;

  const recurrence =
    template.dayOfMonth > 28
      ? `Every ${format(new Date(2000, 0, template.dayOfMonth), "do")} (last day in shorter months)`
      : `Every ${format(new Date(2000, 0, template.dayOfMonth), "do")}`;
  const endCondition = template.endDate
    ? `Until ${format(parseISO(template.endDate), "MMM d, yyyy")}`
    : template.maxOccurrences
      ? `${template._count.transactions}/${template.maxOccurrences} occurrences`
      : "No end";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarClock size={16} />
            Recurring schedule
          </CardTitle>
          <Badge variant={template.isActive ? "secondary" : "outline"}>
            {template.isActive ? "Scheduled" : "Paused"}
          </Badge>
        </div>
        <CardDescription>
          {recurrence} | {endCondition}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
