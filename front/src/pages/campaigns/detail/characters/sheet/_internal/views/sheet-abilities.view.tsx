import type { Ability, ComputedCharacter } from "@donjon-dragon/shared";
import { cn } from "@/shared/utils/utils";
import { ABILITIES, ABILITY_SHORT_LABELS } from "../constants/sheet-labels";
import { formatSigned } from "../utils/sheet-format";

const PROFICIENT_SAVE_LABEL = "Sauvegarde maîtrisée";

/** Les six caractéristiques : le modificateur se lit d'abord, le score en dessous. */
export function SheetAbilitiesView({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <div className="grid grid-cols-6 gap-1 border-y border-gold/16 px-1 py-3">
      {ABILITIES.map((ability) => (
        <AbilityColumn key={ability} ability={ability} sheet={sheet} />
      ))}
    </div>
  );
}

interface AbilityColumnProps {
  ability: Ability;
  sheet: ComputedCharacter;
}

function AbilityColumn({ ability, sheet }: AbilityColumnProps) {
  const { score, modifier } = sheet.abilities[ability];

  return (
    <div className="flex flex-col items-center gap-0.5">
      <SaveStar proficient={sheet.savingThrows[ability].proficient} />
      <span className="font-display text-overline tracking-value text-ink-meta uppercase">
        {ABILITY_SHORT_LABELS[ability]}
      </span>
      <span className="font-display text-[28px]/[1.1] font-semibold text-gold-value">
        {formatSigned(modifier)}
      </span>
      <span className="text-overline tracking-meta text-ink-faint">{score}</span>
    </div>
  );
}

/** L'étoile garde sa place même absente : les six colonnes restent alignées. */
function SaveStar({ proficient }: { proficient: boolean }) {
  return (
    <span
      role={proficient ? "img" : undefined}
      aria-label={proficient ? PROFICIENT_SAVE_LABEL : undefined}
      aria-hidden={proficient ? undefined : true}
      className={cn("text-[9px] text-gold", !proficient && "invisible")}
    >
      ★
    </span>
  );
}
