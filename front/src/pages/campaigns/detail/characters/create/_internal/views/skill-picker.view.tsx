import type { SkillName } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";

export interface SkillPicker {
  count: number;
  options: readonly SkillName[];
  selected: readonly SkillName[];
  labels: Partial<Record<SkillName, string>>;
  /** Déjà maîtrisées par une autre source : les reprendre ne sert à rien. */
  alreadyKnown: readonly SkillName[];
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
      <div className="flex flex-wrap gap-2">
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
  const known = picker.alreadyKnown.includes(skill);
  const full = picker.selected.length >= picker.count;

  return (
    <Button
      type="button"
      size="sm"
      variant={chosen ? "default" : "outline"}
      disabled={known || (full && !chosen)}
      onClick={() => picker.onChange(toggle(picker.selected, skill))}
    >
      {picker.labels[skill] ?? skill}
      {known ? " (déjà acquise)" : ""}
    </Button>
  );
}

function toggle(selected: readonly SkillName[], skill: SkillName): SkillName[] {
  return selected.includes(skill)
    ? selected.filter((entry) => entry !== skill)
    : [...selected, skill];
}
