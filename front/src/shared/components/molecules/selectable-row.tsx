import { cn } from "@/shared/utils/utils";
import { Diamond } from "@/shared/components/molecules/diamond";

interface SelectableEntry {
  name: string;
  meta: string;
  tag: string;
}

interface SelectableRowProps {
  entry: SelectableEntry;
  state?: "idle" | "selected";
  onSelect?: () => void;
}

/** Ligne sélectionnable : case losange, nom et sous-ligne, étiquette de droite. */
function SelectableRow({ entry, state = "idle", onSelect }: SelectableRowProps) {
  const selected = state === "selected";

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "selectable grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-2.5 px-[11px] py-2.5 text-left",
        selected && "selectable-on"
      )}
    >
      <Diamond tone={selected ? "filled" : "idle"} />
      <RowIdentity entry={entry} state={state} />
      <RowTag tag={entry.tag} state={state} />
    </button>
  );
}

function RowIdentity({
  entry,
  state,
}: {
  entry: SelectableEntry;
  state: string;
}) {
  const selected = state === "selected";

  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <RowName name={entry.name} selected={selected} />
      <RowMeta meta={entry.meta} selected={selected} />
    </span>
  );
}

function RowName({ name, selected }: { name: string; selected: boolean }) {
  return (
    <span
      className={cn(
        "text-body/[1.35]",
        selected ? "text-gold-selected" : "text-ink-idle"
      )}
    >
      {name}
    </span>
  );
}

function RowMeta({ meta, selected }: { meta: string; selected: boolean }) {
  return (
    <span className={cn("meta-line", selected && "text-gold/72")}>{meta}</span>
  );
}

function RowTag({ tag, state }: { tag: string; state: string }) {
  return (
    <span
      className={cn(
        "font-display text-note",
        state === "selected" ? "text-gold-value" : "text-ink-faint"
      )}
    >
      {tag}
    </span>
  );
}

export { SelectableRow };
export type { SelectableEntry };
