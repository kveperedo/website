import { describe, expect, it } from "vitest";

import { formatAmount } from "./format-amount";

describe("formatAmount", () => {
  it("formats currency when amounts are visible", () => {
    expect(formatAmount(1500)).toBe("₱1,500.00");
    expect(formatAmount(1500, { sign: "positive" })).toBe("+₱1,500.00");
    expect(formatAmount(1500, { compact: true })).toBe("₱1.5K");
  });

  it("masks every digit while hidden", () => {
    expect(formatAmount(1500, { hidden: true })).toBe("₱•,•••.••");
    expect(formatAmount(1234.56, { hidden: true, sign: "positive" })).toBe("+₱•,•••.••");
  });

  it("keeps the visible width identical", () => {
    expect(formatAmount(1500, { sign: "positive", hidden: true })).toHaveLength(
      formatAmount(1500, { sign: "positive" }).length,
    );
    expect(formatAmount(1234.56, { sign: "negative", hidden: true })).toHaveLength(
      formatAmount(1234.56, { sign: "negative" }).length,
    );
    expect(formatAmount(0, { compact: true, hidden: true })).toHaveLength(
      formatAmount(0, { compact: true }).length,
    );
  });
});
