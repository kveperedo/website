"use client";

import { useServerFn } from "@tanstack/react-start";
import { ArrowUpIcon } from "lucide-react";
import { useState } from "react";

import type { TransactionItemAIType } from "#/schema/transaction";

import { parseTransactionWithAIFn } from "#/utils/transactions.function";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type TransactionInputProps = {
  onParsed: (transactions: Array<TransactionItemAIType>) => void;
};

function TransactionInput({ onParsed }: TransactionInputProps) {
  const parseTransactionWithAI = useServerFn(parseTransactionWithAIFn);

  const [inputText, setInputText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleParse = async () => {
    if (!inputText.trim()) {
      return;
    }
    setIsParsing(true);
    setError(null);
    try {
      const result = await parseTransactionWithAI({ data: inputText });
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
          className="max-h-40 min-h-10 resize-none overflow-y-auto py-3.5 pr-10"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your transaction..."
          disabled={isParsing}
        />
        <Button
          size="icon-sm"
          className="absolute right-2.25 bottom-2.25 size-9 md:right-1.75 md:bottom-1.75 md:size-8"
          onClick={handleParse}
          disabled={!inputText.trim() || isParsing}
        >
          {isParsing ? <Spinner /> : <ArrowUpIcon />}
        </Button>
      </div>
    </div>
  );
}

export { TransactionInput };
