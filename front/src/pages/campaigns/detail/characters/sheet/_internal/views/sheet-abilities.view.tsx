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
 * Le bloc des jets : les six caractéristiques en colonne, sauvegarde à côté, et
 * les 18 compétences dans la colonne voisine. C'est d'ici qu'on lancera un test
 * (SF-005).
 */
export function SheetAbilitiesPanelView({ model }: { model: CharacterSheetModel }) {
  return (
    <section className="panel grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-x-5 px-5 py-3 lg:min-h-0 lg:grid-rows-[minmax(0,1fr)] lg:overflow-y-auto">
      <div className="flex min-w-0 flex-col gap-2">
        <SectionHeading label="Caractéristiques" />
        <div className="sheet-ability-list">
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

/** Nom et score à gauche, modificateur en grand, sauvegarde dans sa propre case. */
function AbilityCard({ ability, sheet }: AbilityCardProps) {
  const { score, modifier } = sheet.abilities[ability];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_48px] border border-gold/16 bg-surface">
      <div className="flex min-w-0 items-center justify-between gap-2 px-2.5 py-1">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate font-display text-overline tracking-label text-gold-dim uppercase">
            {ABILITY_LABELS[ability]}
          </span>
          <span className="font-display text-sm text-ink-meta">{score}</span>
        </div>
        <span className="font-display text-[22px]/[1] font-semibold text-gold-value">
          {formatSigned(modifier)}
        </span>
      </div>
      <SaveCell ability={ability} sheet={sheet} />
    </div>
  );
}

function SaveCell({ ability, sheet }: AbilityCardProps) {
  const { proficient, modifier } = sheet.savingThrows[ability];

  return (
    <div className="flex flex-col items-center justify-center gap-1 border-l border-gold/12 px-1.5">
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
