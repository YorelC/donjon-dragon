import {
  SelectableRow,
  type SelectableRowState,
} from "@/shared/components/molecules/selectable-row";
import { ChoiceListHeaderView } from "./choice-list-header.view";

export interface BoundedChoice {
  /** L'intitulé de la liste : « Langues disponibles », « Armes disponibles »… */
  heading?: string;
  count: number;
  options: readonly string[];
  labels: Partial<Record<string, string>>;
  selected: readonly string[];
  blocked: readonly string[];
  onChange: (selected: string[]) => void;
  /** Montre l'option dans la fiche détaillée, au survol ou au focus. */
  onPreview?: (option: string) => void;
}

const DEFAULT_HEADING = "Options disponibles";

export function BoundedChoiceStepView({ choice }: { choice: BoundedChoice }) {
  return (
    <div className="flex flex-col gap-1.5">
      <ChoiceListHeaderView
        header={{ label: choice.heading ?? DEFAULT_HEADING, chosen: choice.selected.length, total: choice.count }}
      />
      <BoundedChoiceOptionsView choice={choice} />
    </div>
  );
}

/** Les options et la raison de celles qui sont grisées, sans consigne ni compteur. */
export function BoundedChoiceOptionsView({ choice }: { choice: BoundedChoice }) {
  return (
    <>
      {choice.options.map((option) => (
        <BoundedChoiceRow key={option} option={option} choice={choice} />
      ))}
      <BlockedNote choice={choice} />
    </>
  );
}

/** Une ligne désactivée ne reçoit pas le survol : la raison s'écrit sous la liste. */
function BlockedNote({ choice }: { choice: BoundedChoice }) {
  const blocked = choice.options.filter((option) => choice.blocked.includes(option));
  if (blocked.length === 0) return null;

  return (
    <p className="fine-print px-1 pt-1">
      Déjà acquis par ailleurs : {blocked.map((option) => choice.labels[option] ?? option).join(", ")}.
    </p>
  );
}

function BoundedChoiceRow({ option, choice }: { option: string; choice: BoundedChoice }) {
  return (
    <SelectableRow
      entry={{ name: choice.labels[option] ?? option, meta: "", tag: "" }}
      state={optionStateOf(option, choice)}
      actions={{
        select: () => choice.onChange(toggle(choice.selected, option)),
        preview: () => choice.onPreview?.(option),
      }}
    />
  );
}

function optionStateOf(option: string, choice: BoundedChoice): SelectableRowState {
  if (choice.selected.includes(option)) return "selected";
  if (choice.blocked.includes(option)) return "locked";

  return choice.selected.length >= choice.count ? "locked" : "idle";
}

function toggle(selected: readonly string[], option: string): string[] {
  return selected.includes(option)
    ? selected.filter((entry) => entry !== option)
    : [...selected, option];
}
