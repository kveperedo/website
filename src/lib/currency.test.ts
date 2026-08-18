import { describe, expect, it } from "vitest";

import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  it("formats standard peso amounts with two decimal places", () => {
    expect(formatCurrency(1234.5)).toBe("₱1,234.50");
  });

  it("formats typed transaction amounts with explicit signs", () => {
    expect(formatCurrency(1234.5, { sign: "positive" })).toBe("+₱1,234.50");
    expect(formatCurrency(1234.5, { sign: "negative" })).toBe("-₱1,234.50");
  });

  it("formats zero without a sign", () => {
    expect(formatCurrency(-0, { sign: "negative" })).toBe("₱0.00");
  });

  it("preserves a natural negative value without an explicit sign", () => {
    expect(formatCurrency(-1234.5)).toBe("-₱1,234.50");
  });

  it("formats compact peso values with up to one fractional digit", () => {
    expect(formatCurrency(950, { compact: true })).toBe("₱950");
    expect(formatCurrency(12500, { compact: true })).toBe("₱12.5K");
    expect(formatCurrency(1000000, { compact: true })).toBe("₱1M");
    expect(formatCurrency(12500, { compact: true, sign: "positive" })).toBe("+₱12.5K");
  });
});
