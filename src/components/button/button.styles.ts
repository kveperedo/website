import { type VariantProps, tv } from "tailwind-variants";

import { buttonBaseStyles, buttonVariantStyles } from "./button.shared.styles";

export const buttonStyles = tv({
  base: buttonBaseStyles,
  variants: {
    variant: buttonVariantStyles,
    size: {
      sm: "px-6 py-2",
      md: "px-10 py-4",
      lg: "px-12 py-5",
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});

export type ButtonVariants = VariantProps<typeof buttonStyles>;
