import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyBlockProps = {
    label: string;
    content: string;
    copyLabel: string;
    wrap?: boolean;
    className?: string;
};

export const CopyBlock = ({ label, content, copyLabel, wrap, className }: CopyBlockProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // TODO: surface clipboard failure (blocked by permissions or insecure context)
        }
    };

    return (
        <div
            className={cn(
                "relative w-full overflow-hidden rounded-none border border-border bg-background",
                className,
            )}
        >
            <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <Button variant="ghost" size="xs" onClick={handleCopy} aria-label={copyLabel}>
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
            <pre className={cn("overflow-x-auto px-4 py-3", wrap && "whitespace-pre-wrap")}>
                <code className="text-sm text-foreground">{content}</code>
            </pre>
        </div>
    );
};
