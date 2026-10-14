import { casual } from "chrono-node/en";

import type { ParsedTransaction } from "@/schema/transaction";

import { MAX_DESCRIPTION_LENGTH, MAX_TRANSACTION_AMOUNT } from "@/schema/transaction";

import { dateOnlyToDatabaseDate, formatLocal } from "../local-date";

/**
 * What the composer can work out on its own. `type` and `category` are the server's to decide, so
 * they are the only fields missing from a full `ParsedTransaction`.
 */
export type ParsedEntry = Omit<ParsedTransaction, "type" | "category">;

/** A number as users actually type one: `150`, `1,200`, `20.50`. */
const NUMBER = String.raw`\d[\d,]*(?:\.\d{1,2})?`;

/** Words that name a currency or introduce a price, as opposed to describing what was bought. */
const CURRENCY_WORDS = String.raw`(?:php|pesos?|usd|eur|gbp)`;
const PRICE_CUES = String.raw`(?:paid|spent|cost|costs|price|prices)`;
const AMOUNT_CUES = String.raw`(?:for|of|at|on|@|=|${PRICE_CUES})`;

const CURRENCY_PREFIXED = new RegExp(
  String.raw`(?:[₱$€£¥]\s*|\b${CURRENCY_WORDS}\b\s*)(${NUMBER})`,
  "i",
);
const CURRENCY_SUFFIXED = new RegExp(String.raw`(${NUMBER})\s*\b(?:php|pesos?)\b`, "i");
const CUED_AMOUNT = new RegExp(String.raw`\b${AMOUNT_CUES}\s+(${NUMBER})`, "i");
const ANY_NUMBER = new RegExp(NUMBER, "g");

/**
 * Removing an amount or a date leaves the word that introduced them behind — "for 150" becomes
 * "for". Both ends are swept so the card reads as a description rather than a fragment.
 */
const LEADING_NOISE = new RegExp(
  String.raw`^(?:[₱$€£¥]|${CURRENCY_WORDS}|${PRICE_CUES}|for|of|at|on)[\s:=@]+`,
  "i",
);
const TRAILING_NOISE = new RegExp(String.raw`[\s:=@]+(?:${AMOUNT_CUES})?$`, "i");

type AmountMatch = {
  value: number;
  index: number;
  length: number;
};

const toAmountMatch = (match: RegExpMatchArray, group: number): AmountMatch | null => {
  const digits = match[group];
  if (digits === undefined || match.index === undefined) {
    return null;
  }

  // `150php` puts the number first and `₱150` puts it last, so locate it rather than assume.
  return {
    value: Number(digits.replaceAll(",", "")),
    index: match.index + match[0].indexOf(digits),
    length: digits.length,
  };
};

/**
 * chrono has no number parser, so amounts are matched by hand. Preference order matters: an
 * explicit currency always wins, then a number introduced by a word that signals a price, then
 * the last bare number — amounts usually trail, so "bought 3 apples 45" costs 45, not 3.
 */
const findAmount = (text: string): AmountMatch | null => {
  for (const pattern of [CURRENCY_PREFIXED, CURRENCY_SUFFIXED, CUED_AMOUNT]) {
    const match = pattern.exec(text);
    if (match) {
      return toAmountMatch(match, 1);
    }
  }

  const last = [...text.matchAll(ANY_NUMBER)].at(-1);
  return last ? toAmountMatch(last, 0) : null;
};

const removeSpan = (text: string, index: number, length: number): string =>
  text.slice(0, index) + text.slice(index + length);

/** Bounded so a pathological entry can't spin the loop. */
const MAX_TIDY_PASSES = 3;

const tidy = (text: string): string => {
  const collapsed = text.replace(/\s+/g, " ").trim();
  let result = collapsed;

  // Removing one cue can expose another — "paid for 500" leaves "paid for" — so sweep until the
  // text stops shrinking rather than assuming a single pass is enough.
  for (let pass = 0; pass < MAX_TIDY_PASSES; pass += 1) {
    const next = result.replace(LEADING_NOISE, "").replace(TRAILING_NOISE, "").trim();
    if (next === result) {
      break;
    }
    result = next;
  }

  return result;
};

/**
 * `forwardDate` defaults to true, which resolves dates the user almost certainly meant in the
 * past: from a Tuesday, "last monday" becomes the *next* Monday and "Sept 12" becomes next year.
 * With it off, chrono reads "last"/past references as past. Results are read back through
 * `formatLocal`, not `toISOString`, so a result is always the user's calendar day and not the
 * UTC one.
 */
const parseEntry = (rawText: string, reference: Date, fallbackDate: string): ParsedEntry => {
  // A multi-line paste is read straight off the clipboard and so skips the input's own length
  // limit; clamping here keeps every result inside the schema whichever way the text arrived.
  const text = rawText.slice(0, MAX_DESCRIPTION_LENGTH);
  const [match] = casual.parse(text, reference, { forwardDate: false });

  const transactedAt = match ? formatLocal(match.start.date(), "yyyy-MM-dd") : fallbackDate;
  const withoutDate = match ? removeSpan(text, match.index, match.text.length) : text;

  const amount = findAmount(withoutDate);
  const remainder = amount ? removeSpan(withoutDate, amount.index, amount.length) : withoutDate;

  return {
    // Stripping can empty the text (an entry that was only a date and an amount), and a blank
    // card is harder to fix than a redundant one.
    description: tidy(remainder) || text.trim(),
    // A number the form would reject is worse than no number: the review form's own validation
    // asks for a replacement, and `ParsedTransactionSchema` would otherwise reject the whole
    // batch on the way to it.
    amount:
      amount && amount.value > 0 && amount.value <= MAX_TRANSACTION_AMOUNT ? amount.value : null,
    transactedAt,
  };
};

/** Entries without a date inherit the previous entry's date, falling back to the reference date. */
export const parseTransactionTexts = (
  items: Array<string>,
  referenceDate: string,
): Array<ParsedEntry> => {
  const reference = dateOnlyToDatabaseDate(referenceDate);
  let inherited = referenceDate;

  return items.map((item) => {
    const parsed = parseEntry(item, reference, inherited);
    inherited = parsed.transactedAt;

    return parsed;
  });
};
