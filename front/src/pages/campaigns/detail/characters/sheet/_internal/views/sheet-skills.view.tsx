import type { ComputedCharacter, ResolvedSkill, SkillName } from "@donjon-dragon/shared";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import { formatSigned, toLabel } from "../utils/sheet-format";

const FRENCH_LOCALE = "fr-FR";

interface SheetSkillsViewProps {
  sheet: ComputedCharacter;
  labels: Partial<Record<SkillName, string>>;
}

interface LabeledSkill {
  skill: ResolvedSkill;
  label: string;
}

/**
 * Les 18 compétences, toujours les 18 : une fiche montre aussi ce qu'on ne
 * maîtrise pas. Une seule colonne, dans l'ordre alphabétique de leur nom français.
 */
export function SheetSkillsView({ sheet, labels }: SheetSkillsViewProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <SectionHeading label="Compétences" />
      <ul className="sheet-skill-list">
        {toLabeledSkills(sheet.skills, labels).map((entry) => (
          <SkillLine key={entry.skill.skill} entry={entry} />
        ))}
      </ul>
    </div>
  );
}

function SkillLine({ entry }: { entry: LabeledSkill }) {
  const { skill, label } = entry;

  return (
    <li className="sheet-pair items-center px-1 leading-4.5" data-proficient={skill.proficient}>
      <span className={skill.proficient ? "text-gold-selected" : "text-ink-meta"}>{label}</span>
      <span className="flex items-center gap-2">
        <Diamond size="tick" tone={skill.proficient ? "filled" : "idle"} />
        <span className={cn("w-6 text-right font-display", skill.proficient ? "text-gold-value" : "text-ink-faint")}>
          {formatSigned(skill.modifier)}
        </span>
      </span>
    </li>
  );
}

function toLabeledSkills(
  skills: readonly ResolvedSkill[],
  labels: SheetSkillsViewProps["labels"],
): LabeledSkill[] {
  return skills
    .map((skill) => ({ skill, label: toLabel(labels, skill.skill) }))
    .sort((left, right) => left.label.localeCompare(right.label, FRENCH_LOCALE));
}
