import { cn } from "@/shared/utils/utils";
import { Diamond } from "@/shared/components/molecules/diamond";

interface ChoiceOption {
  /** Sans abréviation, la vignette n'a pas de losange : l'alignement, par exemple. */
  abbr?: string;
  label: string;
}

/** `preview` montre l'option ailleurs, au survol ou au focus, sans la retenir. */
interface ChoiceActions {
  select: () => void;
  preview?: () => void;
}

interface ChoiceTileProps {
  option: ChoiceOption;
  state?: "idle" | "selected";
  actions: ChoiceActions;
}

/**
 * Vignette de choix : un losange de deux lettres, un libellé, une sélection
 * dorée. C'est un choix unique parmi d'autres, d'où le rôle `radio`.
 */
function ChoiceTile({ option, state = "idle", actions }: ChoiceTileProps) {
  const selected = state === "selected";

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      {...choiceHandlers(actions)}
      className={cn(
        "selectable flex flex-col items-center justify-center gap-[9px] px-2 pt-[15px] pb-[13px]",
        selected && "selectable-on"
      )}
    >
      <TileBadge abbr={option.abbr} selected={selected} />
      <TileLabel label={option.label} state={state} />
    </button>
  );
}

/** Survol et focus clavier prévisualisent : le clavier doit voir ce que voit la souris. */
function choiceHandlers(actions: ChoiceActions) {
  return { onClick: actions.select, onMouseEnter: actions.preview, onFocus: actions.preview };
}

function TileBadge({ abbr, selected }: { abbr?: string; selected: boolean }) {
  if (!abbr) return null;

  return (
    <Diamond size="badge" tone={selected ? "active" : "idle"}>
      {abbr}
    </Diamond>
  );
}

function TileLabel({ label, state }: { label: string; state: string }) {
  return (
    <span
      className={cn(
        "font-display text-note/[1.35] tracking-name text-center",
        state === "selected" ? "text-gold-selected" : "text-ink-idle"
      )}
    >
      {label}
    </span>
  );
}

export { ChoiceTile, choiceHandlers };
export type { ChoiceActions, ChoiceOption };
