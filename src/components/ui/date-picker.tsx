import { CalendarDate } from "@internationalized/date";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger } from "@/components/ui/popover";

function dateToCalendarDate(date: Date): CalendarDate {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function calendarDateToDate(calendarDate: CalendarDate): Date {
  return new Date(calendarDate.year, calendarDate.month - 1, calendarDate.day);
}

function DatePicker({
  "aria-label": ariaLabel,
  value,
  onChange,
}: {
  "aria-label"?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
      <Button variant="outline" aria-label={ariaLabel}>
        <CalendarIcon data-icon="inline-start" />
        {value ? format(value, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
      </Button>
      <Popover placement="bottom start" className="w-auto p-0">
        <Calendar
          value={value ? dateToCalendarDate(value) : undefined}
          onChange={(date) => {
            onChange?.(date ? calendarDateToDate(date as CalendarDate) : undefined);
            setOpen(false);
          }}
        />
      </Popover>
    </PopoverTrigger>
  );
}

export { DatePicker };
