import { type VariantProps, tv } from "tailwind-variants";

export const buttonStyles = tv({
  base: "inline-flex cursor-pointer items-center justify-center rounded border font-serif font-medium tracking-wider text-neutral-50 transition-all duration-500 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50",
  variants: {
    variant: {
      primary:
        "border-indigo-800/40 bg-indigo-900 text-indigo-50 hover:border-indigo-400/60 hover:bg-indigo-800 focus-visible:ring-indigo-400/70",
      secondary: "border-neutral-800 bg-neutral-900/40 text-neutral-50 hover:border-neutral-500",
      tertiary: "border-neutral-700/0 bg-transparent text-neutral-300 hover:border-neutral-700 hover:text-neutral-50",
    },
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
