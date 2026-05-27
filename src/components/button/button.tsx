import { LoaderCircle } from "lucide-react";
import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";

import { cn } from "#/lib/cn";

import { buttonStyles, type ButtonVariants } from "./button.styles";

export type ButtonProps = Omit<AriaButtonProps, "className" | "isPending"> &
  ButtonVariants & {
    className?: AriaButtonProps["className"];
    isLoading?: boolean;
  };

export const Button = (props: ButtonProps) => {
  const { className, isLoading, size, variant, children, ...buttonProps } = props;

  return (
    <AriaButton
      {...buttonProps}
      isPending={isLoading}
      className={composeRenderProps(className, (value) =>
        cn(buttonStyles({ size, variant }), value),
      )}
    >
      {(renderProps) => (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            </div>
          )}
          <span className={cn(isLoading && "opacity-0")}>
            {typeof children === "function" ? children(renderProps) : children}
          </span>
        </>
      )}
    </AriaButton>
  );
};
