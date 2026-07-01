import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CommandBlockProps = {
  command: string;
  language?: string;
  className?: string;
};

export const CommandBlock = ({ command, language = "bash", className }: CommandBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative mb-1 w-full overflow-hidden rounded-none border border-border bg-background shadow-xl backdrop-blur",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{language}</span>
        <Button variant="ghost" size="xs" onClick={handleCopy} aria-label="Copy command">
          {copied ? (
            <>
              <Check />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy />
              <span>Copy</span>
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto px-4 py-3">
        <code className="font-mono text-sm text-foreground">{command}</code>
      </pre>
    </div>
  );
};
