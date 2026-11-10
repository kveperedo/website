type ApplicationNotesProps = {
  notes: string | null;
};

export const ApplicationNotes = ({ notes }: ApplicationNotesProps) => {
  if (!notes?.trim()) {
    return null;
  }

  return (
    <div className="mx-2 mt-3 border-l-2 border-border/60 bg-muted/10 px-3 py-1.5 text-xs leading-relaxed break-words whitespace-pre-wrap text-muted-foreground">
      {notes}
    </div>
  );
};
