type CurrencyFormatOptions = {
  compact?: boolean;
  sign?: "positive" | "negative";
};

const standardCurrencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  currencyDisplay: "narrowSymbol",
  notation: "compact",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatCurrency(
  amount: number,
  { compact = false, sign }: CurrencyFormatOptions = {},
) {
  const formatter = compact ? compactCurrencyFormatter : standardCurrencyFormatter;

  if (!sign || amount === 0 || !Number.isFinite(amount)) {
    return formatter.format(amount === 0 ? 0 : amount);
  }

  return `${sign === "positive" ? "+" : "-"}${formatter.format(Math.abs(amount))}`;
}
