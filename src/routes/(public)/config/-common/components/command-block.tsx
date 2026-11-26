import { CopyBlock } from "./copy-block";

type CommandBlockProps = {
    command: string;
    language?: string;
    className?: string;
};

export const CommandBlock = ({ command, language = "bash", className }: CommandBlockProps) => {
    return (
        <CopyBlock
            label={language}
            content={command}
            copyLabel="Copy command"
            className={className}
        />
    );
};
