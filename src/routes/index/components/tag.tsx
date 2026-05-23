type TagProps = {
  children: string;
};

export const Tag = ({ children }: TagProps) => {
  return (
    <span className="inline-flex rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-xs font-bold text-neutral-300">
      {children}
    </span>
  );
};
