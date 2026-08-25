import { cn } from "@/shared/utils/utils";
import { Diamond } from "@/shared/components/molecules/diamond";

interface ChoiceOption {
  abbr: string;
  label: string;
}

interface ChoiceTileProps {
  option: ChoiceOption;
  state?: "idle" | "selected";
  onSelect?: () => void;
}

/** Vignette de choix : un losange de deux lettres, un libellé, une sélection dorée. */
function ChoiceTile({ option, state = "idle", onSelect }: ChoiceTileProps) {
  const selected = state === "selected";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "selectable flex flex-col items-center gap-[9px] px-2 pt-[15px] pb-[13px]",
        selected && "selectable-on"
      )}
    >
      <Diamond size="badge" tone={selected ? "active" : "idle"}>
        {option.abbr}
      </Diamond>
      <TileLabel label={option.label} state={state} />
    </button>
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

export { ChoiceTile };
export type { ChoiceOption };
