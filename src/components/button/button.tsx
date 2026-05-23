import {
  Button as AriaButton,
  composeRenderProps,
  type ButtonProps as AriaButtonProps,
} from "react-aria-components";

import { cn } from "#/lib/cn";

import { buttonStyles, type ButtonVariants } from "./button.styles";

export type ButtonProps = Omit<AriaButtonProps, "className"> &
  ButtonVariants & {
    className?: AriaButtonProps["className"];
  };

export const Button = (props: ButtonProps) => {
  const { className, size, variant, ...buttonProps } = props;

  return (
    <AriaButton
      {...buttonProps}
      className={composeRenderProps(className, (value) =>
        cn(buttonStyles({ size, variant }), value),
      )}
    />
  );
};
