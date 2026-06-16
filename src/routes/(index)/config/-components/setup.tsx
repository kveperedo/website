import { Link, type LinkProps } from "react-aria-components";

type SetupRootProps = {
  title: string;
  children?: React.ReactNode;
};

const SetupRoot = ({ title, children }: SetupRootProps) => {
  return (
    <div className="relative mb-8 flex gap-6">
      <div className="min-w-0 flex-1 pt-2">
        <h3 className="mb-2 font-serif text-lg font-medium text-neutral-50">{title}</h3>
        <ul className="list-disc space-y-2 py-2 pl-6 text-neutral-400">{children}</ul>
      </div>
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
      className="text-neutral-200 hover:text-neutral-50"
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
    <li>
      {label}
      {children && <ul className="list-disc space-y-2 pt-2 pl-6 text-neutral-400">{children}</ul>}
    </li>
  );
};

const SetupDash = () => {
  return <span className="text-neutral-300">{" — "}</span>;
};

export const Setup = {
  Root: SetupRoot,
  Item: SetupItem,
  Link: SetupLink,
  Dash: SetupDash,
};
