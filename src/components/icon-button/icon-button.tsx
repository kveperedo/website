import { LoaderCircle } from "lucide-react";
import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";

import { cn } from "#/lib/cn";

import { iconButtonStyles, type IconButtonVariants } from "./icon-button.styles";

export type IconButtonProps = Omit<AriaButtonProps, "className" | "isPending"> &
  IconButtonVariants & {
    "aria-label": string;
    className?: AriaButtonProps["className"];
    isLoading?: boolean;
  };

export const IconButton = (props: IconButtonProps) => {
  const { className, isLoading, size, variant, children, ...buttonProps } = props;

  return (
    <AriaButton
      {...buttonProps}
      isPending={isLoading}
      className={composeRenderProps(className, (value) =>
        cn(iconButtonStyles({ size, variant }), value),
      )}
    >
      {(renderProps) => (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            </div>
          )}
          <span aria-hidden="true" className={cn("inline-flex", isLoading && "opacity-0")}>
            {typeof children === "function" ? children(renderProps) : children}
          </span>
        </>
      )}
    </AriaButton>
  );
};
