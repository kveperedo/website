import { Badge } from "@/components/ui/badge";

type SetupRootProps = {
  title: string;
  children?: React.ReactNode;
};

const SetupRoot = ({ title, children }: SetupRootProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-xl backdrop-blur transition-colors duration-500 hover:border-border hover:bg-card/60 md:p-8">
      <Badge variant="secondary" className="mb-5 self-start lowercase">
        {title}
      </Badge>
      <div className="space-y-3">{children}</div>
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
      className="text-muted-foreground underline decoration-border underline-offset-4 transition-all duration-500 hover:text-primary hover:decoration-primary/50"
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
    <div className="flex gap-3">
      <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
      <div className="min-w-0 flex-1">
        <span className="leading-loose font-medium tracking-wide text-foreground">{label}</span>
        {children && <div className="mt-2 space-y-2 border-l border-border pl-4">{children}</div>}
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
