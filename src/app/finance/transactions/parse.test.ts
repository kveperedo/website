import { describe, expect, it } from "vitest";

import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TRANSACTION_AMOUNT,
  ParsedTransactionSchema,
} from "@/schema/transaction";

import { parseTransactionTexts } from "./parse";

/** A Tuesday, so weekday-relative assertions are unambiguous. */
const TODAY = "2026-10-13";

/** A single entry goes through the same path as a batch, with nothing to inherit from. */
const parse = (text: string) => parseTransactionTexts([text], TODAY)[0];

describe("a single entry", () => {
  it("falls back to the reference date when no date is mentioned", () => {
    expect(parse("lunch at jollibee for 150")).toEqual({
      description: "lunch at jollibee",
      amount: 150,
      transactedAt: TODAY,
    });
  });

  it("resolves relative dates backwards, not forwards", () => {
    // chrono's `forwardDate` default turns every one of these into a future date.
    expect(parse("coffee 85 last monday").transactedAt).toBe("2026-10-12");
    expect(parse("grab 200 3 days ago").transactedAt).toBe("2026-10-10");
    expect(parse("netflix 149 in 2 days").transactedAt).toBe("2026-10-15");
    expect(parse("taxi 350 last friday 8pm").transactedAt).toBe("2026-10-09");
    expect(parse("swiping 450 on october 5").transactedAt).toBe("2026-10-05");
    expect(parse("Starbucks 320 Sept 12").transactedAt).toBe("2026-09-12");
  });

  it("resolves a time-of-day phrase without shifting the day", () => {
    expect(parse("mcdonalds 275 yesterday morning")).toEqual({
      description: "mcdonalds",
      amount: 275,
      transactedAt: "2026-10-12",
    });
  });

  it("reads an absolute date", () => {
    expect(parse("paid 500 for the electric bill 2026-09-01")).toEqual({
      description: "the electric bill",
      amount: 500,
      transactedAt: "2026-09-01",
    });
  });

  it("strips the date before looking for an amount, so its digits are never read as one", () => {
    expect(parse("swiping 450 on october 5").amount).toBe(450);
  });

  it.each([
    ["lunch at jollibee for 150", 150],
    ["jollibee 150", 150],
    ["₱1,200 groceries", 1200],
    ["150php load", 150],
    ["groceries 20.50", 20.5],
    ["$20 allowance", 20],
  ])("reads the amount in %j", (text, amount) => {
    expect(parse(text).amount).toBe(amount);
  });

  it("prefers a currency-marked number over a bare one", () => {
    expect(parse("grab 200 for the ₱150 fee").amount).toBe(150);
  });

  it("prefers a cued number over a bare one", () => {
    expect(parse("bought 3 apples 45").amount).toBe(45);
    expect(parse("taxi for 350").amount).toBe(350);
  });

  it("sweeps up the word that introduced the amount", () => {
    expect(parse("lunch at jollibee for 150").description).toBe("lunch at jollibee");
    expect(parse("₱150 groceries").description).toBe("groceries");
    // Stripping one cue exposes another, so it has to keep sweeping.
    expect(parse("paid for 500 groceries").description).toBe("groceries");
  });

  it("returns no amount when the entry has none", () => {
    expect(parse("lunch")).toEqual({
      description: "lunch",
      amount: null,
      transactedAt: TODAY,
    });
  });

  it.each([
    ["zero", "coffee 0"],
    ["one over the maximum", `taxi ${MAX_TRANSACTION_AMOUNT + 1}`],
    ["far over the maximum", "rent 1,000,000,000"],
  ])("returns no amount for %s rather than one the form would reject", (_label, text) => {
    // The batch travels through the URL, where `ParsedTransactionSchema` would reject it and
    // strand the user on an error page instead of the review form.
    const amount = parse(text).amount;

    expect(ParsedTransactionSchema.pick({ amount: true }).safeParse({ amount }).success).toBe(true);
    expect(amount).toBeNull();
  });

  it("accepts an amount right at the maximum", () => {
    const amount = parse(`rent ${MAX_TRANSACTION_AMOUNT}`).amount;

    expect(amount).toBe(MAX_TRANSACTION_AMOUNT);
  });

  it("reads a leading currency word as well as a symbol", () => {
    expect(parse("php 150 groceries")).toEqual({
      description: "groceries",
      amount: 150,
      transactedAt: TODAY,
    });
  });

  it("keeps the original text when stripping would leave nothing", () => {
    expect(parse("150").description).toBe("150");
  });

  it("never returns a description longer than the schema allows", () => {
    const description = parse("a".repeat(1000)).description;

    expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
  });
});

describe("several entries", () => {
  it("keeps input order", () => {
    const parsed = parseTransactionTexts(["jollibee 150", "grab 200", "coffee 85"], TODAY);

    expect(parsed.map((transaction) => transaction.amount)).toEqual([150, 200, 85]);
  });

  it("lets a dateless entry inherit the previous entry's date", () => {
    const parsed = parseTransactionTexts(["grab 200 yesterday", "coffee 85", "taxi 350"], TODAY);

    expect(parsed.map((transaction) => transaction.transactedAt)).toEqual([
      "2026-10-12",
      "2026-10-12",
      "2026-10-12",
    ]);
  });

  it("reads an explicit date as overriding the inherited one", () => {
    const parsed = parseTransactionTexts(["grab 200 yesterday", "taxi 350 last friday"], TODAY);

    expect(parsed.map((transaction) => transaction.transactedAt)).toEqual([
      "2026-10-12",
      "2026-10-09",
    ]);
  });

  it("returns an empty list for no input", () => {
    expect(parseTransactionTexts([], TODAY)).toEqual([]);
  });
});
