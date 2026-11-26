import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SetupRootProps = {
    id?: string;
    title: string;
    children?: React.ReactNode;
};

const SetupRoot = ({ id, title, children }: SetupRootProps) => {
    return (
        <Card id={id} variant="flat" className="min-w-0 scroll-mt-20">
            <CardHeader variant="flat" className="justify-between gap-2">
                <CardTitle variant="flat">{title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-3">{children}</CardContent>
        </Card>
    );
};

type SetupLinkProps = React.ComponentProps<"a">;

const SetupLink = ({ href, children, ...props }: SetupLinkProps) => {
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground/50"
            {...props}
        >
            {children ?? href}
        </a>
    );
};

type SetupItemProps = {
    label: React.ReactNode;
    children?: React.ReactNode;
};

const SetupItem = ({ label, children }: SetupItemProps) => {
    return (
        <div className="flex gap-2.5">
            <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-muted-foreground" />
            <div className="min-w-0 flex-1">
                <span className="text-xs leading-relaxed tracking-wide text-foreground">
                    {label}
                </span>
                {children && (
                    <div className="mt-1.5 flex flex-col gap-1.5 border-l border-border pl-3">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

const SetupDash = () => {
    return <span className="text-muted-foreground">{" — "}</span>;
};

export const Setup = {
    Root: SetupRoot,
    Item: SetupItem,
    Link: SetupLink,
    Dash: SetupDash,
};
