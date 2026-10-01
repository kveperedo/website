"use client";

import { useServerFn } from "@tanstack/react-start";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import type { TransactionItemAIType } from "@/schema/transaction";

import { todayDateOnly } from "@/app/finance/local-date";
import { parseTransactionWithAIFn } from "@/app/finance/transactions/functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type TransactionInputProps = {
  autoFocus?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onParsed: (transactions: Array<TransactionItemAIType>) => void;
  onEmptyBackspace?: () => void;
};

const splitEntries = (text: string): Array<string> =>
  text
    .split("\n")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

function TransactionInput({
  autoFocus,
  onEmptyBackspace,
  onParsed,
  onValueChange,
  value,
}: TransactionInputProps) {
  const parseTransactionWithAI = useServerFn(parseTransactionWithAIFn);

  const [entries, setEntries] = useState<Array<string>>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commitEntry = () => {
    const entry = value.trim();
    if (entry.length === 0) {
      return;
    }
    setEntries((prev) => [...prev, entry]);
    onValueChange("");
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, entryIndex) => entryIndex !== index));
  };

  const handleParse = async () => {
    const draft = value.trim();
    const items = draft.length > 0 ? [...entries, draft] : entries;
    if (items.length === 0) {
      return;
    }
    setIsParsing(true);
    setError(null);
    try {
      const result = await parseTransactionWithAI({
        data: { items, localDate: todayDateOnly() },
      });
      setEntries([]);
      onValueChange("");
      onParsed(result);
    } catch {
      setError("Failed to parse transactions. Please try again.");
      setIsParsing(false);
    }
  };

  const canSave = entries.length > 0 || value.trim().length > 0;

  return (
    <div className="flex w-full flex-col gap-4">
      {error && <FieldError>{error}</FieldError>}
      <div className="flex flex-col gap-2">
        <p
          id="transaction-queue-hint"
          aria-live="polite"
          className="font-mono text-xs text-muted-foreground"
        >
          {entries.length > 0
            ? `${entries.length} ${entries.length === 1 ? "entry" : "entries"} queued — press + to save`
            : "Press Enter to queue entries, + to save"}
        </p>
        {entries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entries.map((entry, index) => (
              <Badge
                key={`${index}-${entry}`}
                variant="secondary"
                className="h-auto max-w-full py-1 font-mono normal-case"
              >
                <span className="min-w-0 flex-1 break-words whitespace-normal">{entry}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Remove entry ${index + 1}`}
                  onPress={() => removeEntry(index)}
                  className="shrink-0"
                >
                  <XIcon className="size-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <Input
          autoFocus={autoFocus}
          aria-label="New transaction entry"
          aria-describedby="transaction-queue-hint"
          className="h-auto py-3.5 pr-12"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();

              if (value.trim().length === 0 && entries.length > 0) {
                void handleParse();
              } else {
                commitEntry();
              }
            } else if (e.key === "Backspace" && value === "" && !e.repeat) {
              // Ignore auto-repeat so holding Backspace to clear the draft can't
              // also wipe the queue and close the composer.
              if (entries.length > 0) {
                removeEntry(entries.length - 1);
              } else {
                onEmptyBackspace?.();
              }
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text.includes("\n")) {
              e.preventDefault();
              const next = splitEntries(text);
              if (next.length > 0) {
                setEntries((prev) => [...prev, ...next]);
              }
            }
          }}
          placeholder="Add transaction..."
          disabled={isParsing}
        />
        <Button
          variant="default"
          size="icon-sm"
          aria-label="Save transactions"
          data-testid="parse-transaction"
          className="absolute top-1/2 right-3 size-8 -translate-y-1/2"
          onPress={handleParse}
          isDisabled={!canSave || isParsing}
        >
          {isParsing ? <Spinner /> : <PlusIcon />}
        </Button>
      </div>
    </div>
  );
}

export { TransactionInput };
