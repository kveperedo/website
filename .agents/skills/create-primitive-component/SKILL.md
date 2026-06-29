---
name: create-primitive-component
description: Creation of primitive components under `src/components`. Use whenever the user wants to create, add, or build any new reusable UI element — buttons, links, inputs, text fields, selects, checkboxes, modals, or similar — even if they don't use the words "primitive" or "component". Covers both simple single-element components and compound components (e.g. TextField = Label + Input + FieldError).
---

# Directory Structure

Each component lives in its own subdirectory under `src/components/<component-name>/`. The files within follow this layout:

```
src/components/button/
  button.tsx               # component implementation
  button.styles.ts         # tailwind-variants styles (if the component has variants)
  button.shared.styles.ts  # shared style constants (only if styles are reused by other components)
  index.ts                 # re-exports from button.tsx and (if present) button.styles.ts
```

Do NOT create a barrel file at `src/components/index.ts`. Each component folder has its own `index.ts`.

# File Names

All files use kebab-case matching the component name: `icon-button.tsx`, `icon-button.styles.ts`, etc.

# Exports

All exports must be named exports — no default exports.

Each component folder's `index.ts` re-exports from the component file and, if a styles file exists, the styles file:

```ts
// With a styles file:
export * from "./button";
export * from "./button.styles";

// Without a styles file (inline cn() approach):
export * from "./button";
```

# Types

Use the `type` keyword for props, not `interface`.

Props must extend the corresponding react-aria-components type. Always `Omit` `"className"` from the base type and re-add it typed to `AriaXxxProps["className"]` — this preserves support for the render-prop form of `className` that react-aria-components uses:

```ts
export type ButtonProps = Omit<AriaButtonProps, "className" | "isPending"> &
  ButtonVariants & {
    className?: AriaButtonProps["className"];
    isLoading?: boolean;
  };
```

# Styles

**Choosing an approach:**
- Use **`tailwind-variants`** when the component has 2+ visual variants on any dimension (e.g. `variant`, `size`), or when its base styles will be shared with another component. Define styles in a `<name>.styles.ts` file.
- Use **inline `cn()`** for simple components with no variant logic.

**`tailwind-variants` example:**

```ts
import { type VariantProps, tv } from "tailwind-variants";

export const buttonStyles = tv({
  base: "...",
  variants: { variant: { ... }, size: { ... } },
  defaultVariants: { variant: "secondary", size: "md" },
});

export type ButtonVariants = VariantProps<typeof buttonStyles>;
```

When base styles or variant maps are shared between components (e.g. `Button` and `IconButton` share the same base classes and color variants), extract them into a `<name>.shared.styles.ts` file and import from there.

Use `cn()` from `#/lib/cn.ts` for conditional class names.

# className Handling

Use `composeRenderProps` from `react-aria-components` when merging the variant styles with a `className` prop. This correctly handles both string and render-prop forms:

```ts
className={composeRenderProps(className, (value) =>
  cn(buttonStyles({ size, variant }), value),
)}
```

# State-Based Styling

react-aria-components exposes component states via `data-*` attributes (`data-hovered`, `data-pressed`, `data-focus-visible`, `data-invalid`, `data-disabled`, etc.). Use these in Tailwind for state styling rather than pseudo-classes where react-aria manages the state:

```ts
"data-hovered:bg-indigo-800 data-pressed:scale-95 data-focus-visible:ring-2 data-invalid:border-red-500"
```

# Component Implementation

Base every primitive on the corresponding `react-aria-components` component. Mirror its API naming conventions (e.g. `isPending`, `isDisabled`). Use the `react-aria` MCP server for documentation when you need to look up props, slots, or render-prop signatures.

## Simple components

For a single-element primitive with no compound structure, implement it directly:

```tsx
import {
  Link as AriaLink,
  composeRenderProps,
  type LinkProps as AriaLinkProps,
} from "react-aria-components";

import { cn } from "#/lib/cn";

export type LinkProps = Omit<AriaLinkProps, "className"> & {
  className?: AriaLinkProps["className"];
};

export const Link = ({ className, ...props }: LinkProps) => (
  <AriaLink
    {...props}
    className={composeRenderProps(className, (value) =>
      cn("underline data-hovered:text-indigo-400", value),
    )}
  />
);
```

## Components with loading state

The `isLoading` / spinner pattern is specific to action components like `Button` and `IconButton` — not a universal primitive pattern. Only add it when the component triggers an async action. Map `isLoading` → `isPending` on the underlying AriaButton so react-aria handles the pending state correctly.

Reference implementation (`button.tsx`):

```tsx
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
```

## Compound components

Some react-aria primitives compose multiple sub-elements (e.g. `TextField` = `Label` + `Input` + `FieldError` + `Text`). Implement these in a single `<name>.tsx` file and export each part as a named export from that file:

```tsx
// text-field.tsx
export { Label } from "react-aria-components";

export type TextFieldProps = Omit<AriaTextFieldProps, "className"> & {
  className?: AriaTextFieldProps["className"];
};

export const TextField = ({ className, ...props }: TextFieldProps) => (
  <AriaTextField
    {...props}
    className={composeRenderProps(className, (value) => cn("flex flex-col gap-1", value))}
  />
);

export const TextFieldInput = ({ className, ...props }: InputProps) => (
  <Input
    {...props}
    className={composeRenderProps(className, (value) => cn("rounded border bg-neutral-900 px-3 py-2", value))}
  />
);

export const TextFieldError = (props: TextProps) => (
  <FieldError {...props} className={cn("text-sm text-red-400", props.className)} />
);
```

Consumers compose them like: `<TextField><Label /><TextFieldInput /><TextFieldError /></TextField>`.

# Design

Match the dark theme already established in the app: neutral-900/950 backgrounds, neon accents (pink, fuchsia, indigo). Refer to `src/components/button/button.shared.styles.ts` for the established color token conventions.
