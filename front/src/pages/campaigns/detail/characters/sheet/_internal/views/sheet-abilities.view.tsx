import type { Ability, ComputedCharacter } from "@donjon-dragon/shared";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import { ABILITIES, ABILITY_LABELS } from "../constants/sheet-labels";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { formatSigned } from "../utils/sheet-format";
import { SheetSkillsView } from "./sheet-skills.view";

const PROFICIENT_SAVE_LABEL = "Sauvegarde maîtrisée";

/**
 * La colonne des jets : caractéristiques et leurs sauvegardes, puis les 18
 * compétences. C'est d'ici qu'on lancera un test (SF-005).
 */
export function SheetAbilitiesPanelView({ model }: { model: CharacterSheetModel }) {
  return (
    <section className="panel flex flex-col gap-4 px-4 py-5">
      <SectionHeading label="Caractéristiques" />
      <div className="grid grid-cols-2 gap-2">
        {ABILITIES.map((ability) => (
          <AbilityCard key={ability} ability={ability} sheet={model.sheet} />
        ))}
      </div>
      <SheetSkillsView sheet={model.sheet} labels={model.labels.skills} />
    </section>
  );
}

interface AbilityCardProps {
  ability: Ability;
  sheet: ComputedCharacter;
}

/** Le nom seul sur sa ligne : « Constitution » ne pousse jamais le modificateur hors du cadre. */
function AbilityCard({ ability, sheet }: AbilityCardProps) {
  const { score, modifier } = sheet.abilities[ability];

  return (
    <div className="flex min-w-0 flex-col border border-gold/16 bg-surface">
      <div className="flex flex-col gap-1 px-3 pt-2.5 pb-2">
        <span className="truncate font-display text-overline tracking-label text-gold-dim uppercase">
          {ABILITY_LABELS[ability]}
        </span>
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-display text-[26px]/[1] font-semibold text-gold-value">
            {formatSigned(modifier)}
          </span>
          <span className="text-meta tracking-meta text-ink-faint">{score}</span>
        </span>
      </div>
      <SaveLine ability={ability} sheet={sheet} />
    </div>
  );
}

function SaveLine({ ability, sheet }: AbilityCardProps) {
  const { proficient, modifier } = sheet.savingThrows[ability];

  return (
    <div className="flex items-center justify-between gap-2 border-t border-gold/12 px-3 py-1.5 text-meta">
      <span className={cn("flex items-center gap-1.5", proficient ? "text-gold-selected" : "text-ink-meta")}>
        <SaveMark proficient={proficient} />
        Sauvegarde
      </span>
      <span className={cn("font-display", proficient ? "text-gold-value" : "text-ink-faint")}>
        {formatSigned(modifier)}
      </span>
    </div>
  );
}

function SaveMark({ proficient }: { proficient: boolean }) {
  if (!proficient) return <Diamond size="tick" tone="idle" />;

  return (
    <span role="img" aria-label={PROFICIENT_SAVE_LABEL} className="flex">
      <Diamond size="tick" tone="filled" />
    </span>
  );
}
