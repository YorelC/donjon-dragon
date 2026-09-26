import { useId } from "react";
import { cn } from "@/shared/utils/utils";
import { Diamond } from "@/shared/components/molecules/diamond";
import {
  choiceHandlers,
  type ChoiceActions,
} from "@/shared/components/molecules/choice-tile";

interface SelectableEntry {
  /** Identifiant DOM facultatif, quand un parcours doit cibler une ligne précise. */
  id?: string;
  name: string;
  meta: string;
  tag: string;
}

/**
 * `locked` : indisponible, la raison s'écrit ailleurs. `conflict` : retenue
 * alors qu'elle ne devrait pas l'être — elle reste cliquable pour la retirer.
 */
type SelectableRowState = "idle" | "selected" | "locked" | "conflict";

const ROW_TONES: Record<SelectableRowState, string> = {
  idle: "",
  selected: "selectable-on",
  locked: "cursor-not-allowed opacity-50 hover:border-gold/14",
  conflict: "border-destructive/60 hover:border-destructive/80",
};

const ROW_LAYOUT =
  "selectable grid w-full grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-2.5 px-[11px] py-2.5 text-left";

interface SelectableRowProps {
  entry: SelectableEntry;
  state?: SelectableRowState;
  actions: ChoiceActions;
}

/**
 * Ligne sélectionnable : case losange, nom et sous-ligne, étiquette de droite.
 * Le nom accessible est le nom seul ; sous-ligne et étiquette le décrivent.
 */
function SelectableRow({ entry, state = "idle", actions }: SelectableRowProps) {
  const ids = { name: useId(), details: useId() };
  const retained = state === "selected" || state === "conflict";

  return (
    <button
      id={entry.id}
      type="button"
      aria-pressed={retained}
      aria-labelledby={ids.name}
      aria-describedby={ids.details}
      disabled={state === "locked"}
      {...choiceHandlers(actions)}
      className={cn(ROW_LAYOUT, ROW_TONES[state])}
    >
      <Diamond tone={retained ? "filled" : "idle"} />
      <RowIdentity entry={entry} retained={retained} ids={ids} />
      <RowTag tag={entry.tag} retained={retained} />
    </button>
  );
}

interface RowIdentityProps {
  entry: SelectableEntry;
  retained: boolean;
  ids: { name: string; details: string };
}

function RowIdentity({ entry, retained, ids }: RowIdentityProps) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span
        id={ids.name}
        className={cn("text-body/[1.35]", retained ? "text-gold-selected" : "text-ink-idle")}
      >
        {entry.name}
      </span>
      <span id={ids.details} className={cn("meta-line", retained && "text-gold/72")}>
        {entry.meta}
      </span>
    </span>
  );
}

function RowTag({ tag, retained }: { tag: string; retained: boolean }) {
  return (
    <span className={cn("font-display text-note", retained ? "text-gold-value" : "text-ink-faint")}>
      {tag}
    </span>
  );
}

export { SelectableRow };
export type { SelectableEntry, SelectableRowState };
