import type { ComputedCharacter, ResolvedSkill } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { formatValue } from "./character-vitals.view";

interface CharacterSkillsViewProps {
  sheet: ComputedCharacter;
  labels: Partial<Record<string, string>>;
}

/** Les 18 compétences, toujours les 18 : une fiche montre aussi ce qu'on ne maîtrise pas. */
export function CharacterSkillsView({ sheet, labels }: CharacterSkillsViewProps) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Perception passive {sheet.passivePerception} · Bonus de maîtrise{" "}
        {formatValue(sheet.proficiencyBonus, true)}
      </p>
      <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
        {sheet.skills.map((skill) => (
          <SkillRow key={skill.skill} skill={skill} labels={labels} />
        ))}
      </div>
    </div>
  );
}

interface SkillRowProps {
  skill: ResolvedSkill;
  labels: Partial<Record<string, string>>;
}

function SkillRow({ skill, labels }: SkillRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 rounded px-2 py-1 text-sm odd:bg-muted/40">
      <span className={skill.proficient ? "font-medium" : "text-muted-foreground"}>
        {labels[skill.skill] ?? skill.skill}
      </span>
      <span className="flex items-center gap-1">
        {skill.expert ? <Badge variant="secondary">Expertise</Badge> : null}
        <span className="tabular-nums">{formatValue(skill.modifier, true)}</span>
      </span>
    </div>
  );
}
