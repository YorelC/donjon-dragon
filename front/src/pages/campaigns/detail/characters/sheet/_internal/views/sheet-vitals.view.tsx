import type { ComputedCharacter } from "@donjon-dragon/shared";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SIZE_LABELS } from "@/shared/constants/character-labels";
import { COMING_SOON } from "../constants/sheet-labels";
import { formatMeters, formatSigned } from "../utils/sheet-format";

const NO_TEMPORARY_HIT_POINTS = "—";

/**
 * Ce qui s'use en jouant, puis ce qui se lit. Tant que l'état d'aventure n'existe
 * pas, les compteurs restent pleins : PV au maximum, dés de vie tous disponibles.
 */
export function SheetVitalsView({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <>
      <SheetChips sheet={sheet} />
      <PlayState sheet={sheet} />
      <SheetStats sheet={sheet} />
    </>
  );
}

function SheetChips({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <SheetChip label="PV" value={formatHitPoints(sheet)} />
      <SheetChip label="Maîtrise" value={formatSigned(sheet.proficiencyBonus)} />
      <SheetChip label="CA" value={String(sheet.armorClass.value)} />
    </div>
  );
}

function SheetChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="sheet-chip">
      <span className="sheet-caption">{label}</span>
      <span className="font-display text-base text-gold-title">{value}</span>
    </div>
  );
}

function PlayState({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <div className="flex justify-between gap-2 border-t border-gold/16 pt-3.5">
      <SheetVital label="PV temporaires" value={NO_TEMPORARY_HIT_POINTS} />
      <SheetVital label="Dés de vie" value={formatHitDice(sheet)} />
      <HeroicInspiration />
    </div>
  );
}

/** L'inspiration héroïque est binaire : un losange, allumé ou non (B04-RES-006). */
function HeroicInspiration() {
  return (
    <div
      aria-disabled
      title={COMING_SOON}
      className="flex min-w-0 flex-col items-center gap-[5px] text-center"
    >
      <span className="sheet-caption">Inspiration</span>
      <Diamond size="box" tone="idle" />
      <span className="sr-only">aucune</span>
    </div>
  );
}

function SheetStats({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <div className="flex justify-between gap-2 border-t border-gold/16 pt-3.5">
      <SheetVital label="Vitesse" value={formatMeters(sheet.speed.value)} />
      <SheetVital label="Catégorie" value={SIZE_LABELS[sheet.size]} />
      <SheetVital label="Initiative" value={formatSigned(sheet.initiative.value)} />
    </div>
  );
}

function SheetVital({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[3px] text-center">
      <span className="sheet-caption">{label}</span>
      <span className="font-display text-sm text-gold-value">{value}</span>
    </div>
  );
}

function formatHitPoints(sheet: ComputedCharacter): string {
  return `${sheet.currentHitPoints.value} / ${sheet.maxHitPoints.value}`;
}

/** Un dé de vie par niveau, tous disponibles tant qu'aucun repos ne les dépense. */
function formatHitDice({ level, hitDie }: ComputedCharacter): string {
  return `${level} / ${level} · d${hitDie}`;
}
