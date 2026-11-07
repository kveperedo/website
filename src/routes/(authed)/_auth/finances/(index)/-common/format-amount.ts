import { formatCurrency, type CurrencyFormatOptions } from "@/lib/currency";

type FormatAmountOptions = CurrencyFormatOptions & { hidden?: boolean };

/**
 * Formats currency, or masks every digit while hidden. The mask keeps each character in place,
 * and the summary card uses a monospaced font, so toggling never changes the layout.
 */
export function formatAmount(
  amount: number,
  { hidden = false, ...options }: FormatAmountOptions = {},
) {
  const formatted = formatCurrency(amount, options);

  return hidden ? formatted.replace(/\d/g, "•") : formatted;
}
