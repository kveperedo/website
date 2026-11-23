import { format, parseISO } from "date-fns";
import { CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Card variant="flat" className="flex h-full flex-col gap-0 lg:border-0">
            <CardHeader variant="flat" className="justify-between gap-2">
                <CardTitle variant="flat" className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5" />
                    Recurring schedule
                </CardTitle>
                <Badge variant={variant}>{label}</Badge>
            </CardHeader>
            <CardContent className="p-3 font-mono text-xs text-muted-foreground">
                {getEndCondition()}
            </CardContent>
        </Card>
    );
};
