"use client";

import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { ArrowUpIcon } from "lucide-react";
import { useState } from "react";

import type { TransactionItemAIType } from "@/schema/transaction";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { parseTransactionWithAIFn } from "@/utils/transactions.function";

type TransactionInputProps = {
  autoFocus?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  onParsed: (transactions: Array<TransactionItemAIType>) => void;
};

function TransactionInput({ autoFocus, onParsed, onValueChange, value }: TransactionInputProps) {
  const parseTransactionWithAI = useServerFn(parseTransactionWithAIFn);

  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!value.trim()) {
      return;
    }
    setIsParsing(true);
    setError(null);
    try {
      const result = await parseTransactionWithAI({
        data: { text: value, localDate: format(new Date(), "yyyy-MM-dd") },
      });
      onParsed(result);
    } catch {
      setError("Failed to parse transactions. Please try again.");
      setIsParsing(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="relative">
        <Textarea
          rows={1}
          autoFocus={autoFocus}
          className="max-h-40 min-h-10 resize-none overflow-y-auto border-none py-3.5 pr-10"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="Add transaction..."
          disabled={isParsing}
        />
        <Button
          size="icon-sm"
          data-testid="parse-transaction"
          className="absolute right-2.25 bottom-2.25 size-9 md:right-1.75 md:bottom-1.75 md:size-8"
          onPress={handleParse}
          isDisabled={!value.trim() || isParsing}
        >
          {isParsing ? <Spinner /> : <ArrowUpIcon />}
        </Button>
      </div>
    </div>
  );
}

export { TransactionInput };
