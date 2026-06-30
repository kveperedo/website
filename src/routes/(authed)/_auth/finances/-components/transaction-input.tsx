"use client";

import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";

import type { ParsedTransaction } from "#/utils/transactions.server";

import { parseTransactionWithAIFn } from "#/utils/transactions.function";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

type TransactionInputProps = {
  onParsed: (transactions: Array<ParsedTransaction>) => void;
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
    <div className="flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        render={<Link to="/finances" />}
        aria-label="Go back to finances"
        className="self-start"
      >
        <ArrowLeftIcon />
        Back
      </Button>
      <p className="text-sm text-muted-foreground">
        Describe transactions in natural language — AI will parse amounts, dates, and categories.
      </p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card className="flex flex-col gap-5 p-6">
        <FieldGroup>
          <Field>
            <FieldLabel className="text-sm tracking-wide text-foreground">
              Describe your transaction
            </FieldLabel>
            <Textarea
              rows={6}
              className="min-h-30"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="e.g. 'lunch at jollibee for 150' or 'lunch 150 and grab home 200'"
              disabled={isParsing}
            />
          </Field>
        </FieldGroup>
        <Button
          size="lg"
          className="w-full"
          onClick={handleParse}
          disabled={!inputText.trim() || isParsing}
        >
          {isParsing && <Spinner data-icon="inline-start" />}
          Generate transactions
        </Button>
      </Card>
    </div>
  );
}

export { TransactionInput };
