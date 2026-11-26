import { CopyBlock } from "./copy-block";

type PromptBlockProps = {
    prompt: string;
    className?: string;
};

export const PromptBlock = ({ prompt, className }: PromptBlockProps) => {
    return (
        <CopyBlock
            label="agent prompt"
            content={prompt}
            copyLabel="Copy prompt"
            wrap
            className={className}
        />
    );
};
