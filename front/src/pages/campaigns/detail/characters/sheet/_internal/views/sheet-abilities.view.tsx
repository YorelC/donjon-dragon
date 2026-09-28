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
 * Le bloc des jets, d'un seul regard : caractéristiques et sauvegardes dans une
 * colonne, les 18 compétences dans l'autre. C'est d'ici qu'on lancera un test
 * (SF-005) ; il tient sans défiler sur un écran d'ordinateur portable.
 */
export function SheetAbilitiesPanelView({ model }: { model: CharacterSheetModel }) {
  return (
    <section className="panel grid content-start gap-x-6 gap-y-5 px-5 py-3.5 sm:grid-cols-[minmax(0,210px)_minmax(0,1fr)] lg:min-h-0 lg:overflow-y-auto">
      <div className="flex flex-col gap-2.5">
        <SectionHeading label="Caractéristiques" />
        <div className="flex flex-col gap-1.5">
          {ABILITIES.map((ability) => (
            <AbilityCard key={ability} ability={ability} sheet={model.sheet} />
          ))}
        </div>
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
    <div className="flex min-w-0 items-center justify-between gap-3 border border-gold/16 bg-surface px-3 py-1.5">
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-display text-meta tracking-label text-gold-dim uppercase">
          {ABILITY_LABELS[ability]}
        </span>
        <span className="flex items-baseline gap-2">
          <span className="font-display text-[22px]/[1.15] font-semibold text-gold-value">
            {formatSigned(modifier)}
          </span>
          <span className="text-meta tracking-meta text-ink-faint">{score}</span>
        </span>
      </div>
      <SaveBadge ability={ability} sheet={sheet} />
    </div>
  );
}

function SaveBadge({ ability, sheet }: AbilityCardProps) {
  const { proficient, modifier } = sheet.savingThrows[ability];

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <span className="sheet-caption">Sauv.</span>
      <span className={cn("flex items-center gap-1.5 font-display text-sm", proficient ? "text-gold-value" : "text-ink-faint")}>
        <SaveMark proficient={proficient} />
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
