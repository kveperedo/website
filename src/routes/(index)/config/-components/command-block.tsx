import { Copy, Check } from "lucide-react";
import { useState } from "react";

import { cn } from "#/lib/cn";

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
        "relative mb-4 w-full overflow-hidden rounded border border-neutral-700 bg-neutral-950",
        className,
      )}
    >
      <div className="flex items-center justify-between bg-neutral-900/50 px-4 py-2">
        <span className="font-serif text-xs text-neutral-500">{language}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
          aria-label="Copy command"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3">
        <code className="font-code text-sm text-neutral-300">{command}</code>
      </pre>
    </div>
  );
};
