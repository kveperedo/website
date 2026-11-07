import { EyeIcon, EyeOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type AmountsVisibilityToggleProps = {
  hideAmounts: boolean;
  onToggle: () => void;
  isPending: boolean;
};

export function AmountsVisibilityToggle({
  hideAmounts,
  onToggle,
  isPending,
}: AmountsVisibilityToggleProps) {
  const Icon = hideAmounts ? EyeOffIcon : EyeIcon;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onPress={onToggle}
      isDisabled={isPending}
      aria-label={hideAmounts ? "Show amounts" : "Hide amounts"}
      data-testid="amounts-visibility-toggle"
    >
      <Icon />
    </Button>
  );
}
