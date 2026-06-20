import { Link, type LinkProps } from "react-aria-components";

type SetupRootProps = {
  title: string;
  children?: React.ReactNode;
};

const SetupRoot = ({ title, children }: SetupRootProps) => {
  return (
    <div className="flex flex-col rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 shadow-xl backdrop-blur transition-colors duration-500 hover:border-neutral-700 hover:bg-neutral-900/60 md:p-8">
      <span className="mb-5 inline-flex self-start rounded-full border border-neutral-700 bg-neutral-900 px-3 py-1 font-mono text-xs font-bold text-neutral-400 lowercase">
        {title}
      </span>
      <div className="space-y-3">{children}</div>
    </div>
  );
};

type SetupLinkProps = LinkProps;

const SetupLink = ({ href, children, ...props }: SetupLinkProps) => {
  return (
    <Link
      {...props}
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-neutral-300 underline decoration-neutral-700 underline-offset-4 transition-all duration-500 hover:text-indigo-400 hover:decoration-indigo-500/50"
    >
      {children ?? href}
    </Link>
  );
};

type SetupItemProps = {
  label: React.ReactNode;
  children?: React.ReactNode;
};

const SetupItem = ({ label, children }: SetupItemProps) => {
  return (
    <div className="flex gap-3">
      <span className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-600" />
      <div className="min-w-0 flex-1">
        <span className="leading-loose font-medium tracking-wide text-neutral-200">{label}</span>
        {children && (
          <div className="mt-2 space-y-2 border-l border-neutral-800 pl-4">{children}</div>
        )}
      </div>
    </div>
  );
};

const SetupDash = () => {
  return <span className="text-neutral-600">{" — "}</span>;
};

export const Setup = {
  Root: SetupRoot,
  Item: SetupItem,
  Link: SetupLink,
  Dash: SetupDash,
};
