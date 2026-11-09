import { SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  APPLICATION_STATUS_DOT_STYLES,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_ORDER,
} from "../constants";

export const ApplicationStatusOptions = () => {
  return (
    <>
      {APPLICATION_STATUS_ORDER.map((status) => (
        <SelectItem key={status} id={status} textValue={APPLICATION_STATUS_LABELS[status]}>
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 self-center rounded-full",
              APPLICATION_STATUS_DOT_STYLES[status],
            )}
          />
          {APPLICATION_STATUS_LABELS[status]}
        </SelectItem>
      ))}
    </>
  );
};
