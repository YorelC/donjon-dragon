import { cn } from "@/shared/utils/utils";
import type { TakenSpellLine, TakenSpellNotes } from "../types/taken-spell-notes";

/**
 * Un bouton désactivé ne reçoit pas le survol : la raison d'un sort grisé ne
 * peut pas vivre dans une infobulle. Elle s'écrit sous le groupe, source nommée.
 */
export function TakenSpellsNoteView({ notes }: { notes: TakenSpellNotes }) {
  return (
    <>
      {notes.conflicts.map((line) => (
        <TakenSpellLineView key={line.reason} line={line} tone="conflict" />
      ))}
      {notes.unavailable.map((line) => (
        <TakenSpellLineView key={line.reason} line={line} tone="unavailable" />
      ))}
    </>
  );
}

const LINE_TONES = {
  conflict: "text-destructive",
  unavailable: "",
} as const;

interface TakenSpellLineViewProps {
  line: TakenSpellLine;
  tone: keyof typeof LINE_TONES;
}

function TakenSpellLineView({ line, tone }: TakenSpellLineViewProps) {
  return (
    <p className={cn("fine-print px-1", LINE_TONES[tone])}>
      {line.reason} : {line.names}.
    </p>
  );
}
