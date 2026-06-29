import { Badge } from "@/components/ui/badge";

type SetupRootProps = {
  id?: string;
  title: string;
  children?: React.ReactNode;
};

const SetupRoot = ({ id, title, children }: SetupRootProps) => {
  return (
    <div
      id={id}
      className="flex w-full flex-col rounded-none border border-border bg-card p-6 shadow-xl backdrop-blur md:p-7"
    >
      <Badge variant="secondary" className="mb-4 self-start lowercase">
        {title}
      </Badge>
      <div className="space-y-2.5">{children}</div>
    </div>
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
      <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
      <div className="min-w-0 flex-1">
        <span className="text-sm leading-relaxed font-medium tracking-wide text-foreground">
          {label}
        </span>
        {children && (
          <div className="mt-1.5 space-y-1.5 border-l border-border pl-3">{children}</div>
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
