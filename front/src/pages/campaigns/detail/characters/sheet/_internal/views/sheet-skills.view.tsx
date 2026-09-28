import type { ReactNode } from "react";
import type { ComputedCharacter, ResolvedSkill, SkillName } from "@donjon-dragon/shared";
import { Diamond } from "@/shared/components/molecules/diamond";
import { cn } from "@/shared/utils/utils";
import { formatSigned, toLabel } from "../utils/sheet-format";

interface SheetSkillsViewProps {
  sheet: ComputedCharacter;
  labels: Partial<Record<SkillName, string>>;
}

/** Les 18 compétences, toujours les 18 : une fiche montre aussi ce qu'on ne maîtrise pas. */
export function SheetSkillsView({ sheet, labels }: SheetSkillsViewProps) {
  return (
    <SheetBlock label="Compétences">
      <ul className="grid grid-flow-col grid-cols-2 grid-rows-9 gap-x-[18px] gap-y-[7px]">
        {sheet.skills.map((skill) => (
          <SkillLine key={skill.skill} skill={skill} label={toLabel(labels, skill.skill)} />
        ))}
      </ul>
    </SheetBlock>
  );
}

function SkillLine({ skill, label }: { skill: ResolvedSkill; label: string }) {
  return (
    <li className="sheet-pair" data-proficient={skill.proficient}>
      <span className={skill.proficient ? "text-gold-selected" : "text-ink-meta"}>{label}</span>
      <span className="flex items-center gap-1.5">
        <Diamond size="tick" tone={skill.proficient ? "filled" : "idle"} />
        <span className={cn("font-display", skill.proficient ? "text-gold-value" : "text-ink-faint")}>
          {formatSigned(skill.modifier)}
        </span>
      </span>
    </li>
  );
}

function SheetBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-gold/16 pt-4">
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}
