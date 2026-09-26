import type { SkillName } from "@donjon-dragon/shared";
import {
  SelectableRow,
  type SelectableRowState,
} from "@/shared/components/molecules/selectable-row";
import { ChoiceListHeaderView } from "./choice-list-header.view";

/**
 * Une compétence déjà acquise, et par quoi. Une maîtrise ne s'obtient pas deux
 * fois : la reprendre ferait perdre un choix, et le joueur doit voir pourquoi
 * elle est barrée.
 */
export interface KnownSkill {
  skill: SkillName;
  source: string;
}

export interface SkillPicker {
  count: number;
  options: readonly SkillName[];
  selected: readonly SkillName[];
  labels: Partial<Record<SkillName, string>>;
  alreadyKnown: readonly KnownSkill[];
  onChange: (skills: SkillName[]) => void;
  /** Montre la compétence dans la fiche détaillée, au survol ou au focus. */
  onPreview?: (skill: SkillName) => void;
}

export function SkillPickerView({ picker }: { picker: SkillPicker }) {
  if (picker.count === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <ChoiceListHeaderView
        header={{ label: "Compétences disponibles", chosen: picker.selected.length, total: picker.count }}
      />
      {picker.options.map((skill) => (
        <SkillRow key={skill} skill={skill} picker={picker} />
      ))}
    </div>
  );
}

function SkillRow({ skill, picker }: { skill: SkillName; picker: SkillPicker }) {
  const known = picker.alreadyKnown.find((entry) => entry.skill === skill);

  return (
    <SelectableRow
      entry={{ name: picker.labels[skill] ?? skill, meta: known ? `Déjà acquise · ${known.source}` : "", tag: "" }}
      state={skillStateOf(skill, picker)}
      actions={{
        select: () => picker.onChange(toggle(picker.selected, skill)),
        preview: () => picker.onPreview?.(skill),
      }}
    />
  );
}

function skillStateOf(skill: SkillName, picker: SkillPicker): SelectableRowState {
  if (picker.alreadyKnown.some((entry) => entry.skill === skill)) return "locked";
  if (picker.selected.includes(skill)) return "selected";

  return picker.selected.length >= picker.count ? "locked" : "idle";
}

function toggle(selected: readonly SkillName[], skill: SkillName): SkillName[] {
  return selected.includes(skill)
    ? selected.filter((entry) => entry !== skill)
    : [...selected, skill];
}
