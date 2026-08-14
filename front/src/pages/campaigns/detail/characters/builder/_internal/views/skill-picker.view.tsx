import type { SkillName } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";

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
}

interface SkillPickerViewProps {
  picker: SkillPicker;
}

export function SkillPickerView({ picker }: SkillPickerViewProps) {
  if (picker.count === 0) return null;

  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">
        Choisissez {picker.count} compétence{picker.count > 1 ? "s" : ""}.{" "}
        <Badge variant="outline">
          {picker.selected.length} / {picker.count}
        </Badge>
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {picker.options.map((skill) => (
          <SkillToggle key={skill} skill={skill} picker={picker} />
        ))}
      </div>
    </div>
  );
}

interface SkillToggleProps {
  skill: SkillName;
  picker: SkillPicker;
}

function SkillToggle({ skill, picker }: SkillToggleProps) {
  const chosen = picker.selected.includes(skill);
  const known = picker.alreadyKnown.find((entry) => entry.skill === skill);
  const full = picker.selected.length >= picker.count;

  return (
    <Button
      type="button"
      size="sm"
      className="justify-between"
      variant={chosen ? "default" : "outline"}
      disabled={Boolean(known) || (full && !chosen)}
      onClick={() => picker.onChange(toggle(picker.selected, skill))}
    >
      <span>{picker.labels[skill] ?? skill}</span>
      {known ? (
        <span className="ml-2 text-xs font-normal opacity-70">{known.source}</span>
      ) : null}
    </Button>
  );
}

function toggle(selected: readonly SkillName[], skill: SkillName): SkillName[] {
  return selected.includes(skill)
    ? selected.filter((entry) => entry !== skill)
    : [...selected, skill];
}
