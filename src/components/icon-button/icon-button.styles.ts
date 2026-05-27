import { type VariantProps, tv } from "tailwind-variants";

import { buttonBaseStyles, buttonVariantStyles } from "#/components/button/button.shared.styles";

export const iconButtonStyles = tv({
  base: buttonBaseStyles,
  variants: {
    variant: buttonVariantStyles,
    size: {
      sm: "h-9 w-9 [&_svg]:h-4 [&_svg]:w-4",
      md: "h-11 w-11 [&_svg]:h-5 [&_svg]:w-5",
      lg: "h-14 w-14 [&_svg]:h-6 [&_svg]:w-6",
    },
  },
  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});

export type IconButtonVariants = VariantProps<typeof iconButtonStyles>;
