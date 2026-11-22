import { formatCurrency, type CurrencyFormatOptions } from "@/lib/currency";

type FormatAmountOptions = CurrencyFormatOptions & { hidden?: boolean };

/**
 * Formats currency, or masks every digit while hidden. Amounts render in a monospace
 * font and the mask keeps the character count identical, so toggling preserves width.
 */
export function formatAmount(
    amount: number,
    { hidden = false, ...options }: FormatAmountOptions = {},
) {
    const formatted = formatCurrency(amount, options);

    return hidden ? formatted.replace(/\d/g, "•") : formatted;
}
