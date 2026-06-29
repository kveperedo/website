import { Copy, Check } from "lucide-react";
import { useState } from "react";

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
        "relative mb-1 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2">
        <span className="font-code text-xs text-muted-foreground">{language}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-muted-foreground lowercase transition-all duration-500 hover:bg-muted hover:text-foreground"
          aria-label="Copy command"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3">
        <code className="font-code text-sm text-muted-foreground">{command}</code>
      </pre>
    </div>
  );
};
