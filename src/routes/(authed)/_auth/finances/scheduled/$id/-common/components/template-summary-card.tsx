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
        <CardDescription>{getEndCondition()}</CardDescription>
      </CardHeader>
    </Card>
  );
};
