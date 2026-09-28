import type { ComputedCharacter } from "@donjon-dragon/shared";
import { Button } from "@/shared/components/atoms/button";
import { Diamond } from "@/shared/components/molecules/diamond";
import type { PageBack } from "@/shared/components/molecules/page-header";
import { COMING_SOON } from "../constants/sheet-labels";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { formatMeters, formatSigned } from "../utils/sheet-format";
import { SheetIdentityView } from "./sheet-identity.view";

/** Les pas de dégâts et de soin qu'offrira la jauge. */
const DAMAGE_STEPS = [-5, -1] as const;
const HEALING_STEPS = [1, 5] as const;
const NO_TEMPORARY_HIT_POINTS = "—";
const FULL_GAUGE_PERCENT = 100;

/**
 * Le bandeau de la fiche : qui est le personnage, et ce qu'on consulte à chaque
 * tour. Tant que l'état d'aventure n'existe pas, les compteurs restent pleins et
 * leurs boutons se voient sans s'ouvrir.
 */
interface SheetHeaderViewProps {
  model: CharacterSheetModel;
  /** Le retour vit dans le bandeau : une ligne de moins au-dessus de la fiche. */
  back: PageBack;
}

export function SheetHeaderView({ model, back }: SheetHeaderViewProps) {
  return (
    <header className="panel flex flex-col gap-4 px-5 py-3 xl:flex-row xl:items-center xl:justify-between">
      <SheetIdentityView model={model} back={back} />
      <SheetStats sheet={model.sheet} />
    </header>
  );
}

function SheetStats({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <div className="flex flex-wrap items-stretch gap-2 xl:shrink-0 xl:flex-nowrap">
      <HitPointsGauge sheet={sheet} />
      <StatTile label="CA" value={String(sheet.armorClass.value)} />
      <StatTile label="Initiative" value={formatSigned(sheet.initiative.value)} />
      <StatTile label="Vitesse" value={formatMeters(sheet.speed.value)} />
      <StatTile label="Maîtrise" value={formatSigned(sheet.proficiencyBonus)} />
      <StatTile label="Dés de vie" value={formatHitDice(sheet)} note={`d${sheet.hitDie}`} />
      <HeroicInspiration />
    </div>
  );
}

function HitPointsGauge({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <div className="flex min-w-[200px] flex-col justify-center gap-1.5 border border-gold/40 bg-surface px-3.5 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="sheet-caption">Points de vie</span>
        <span className="font-display text-gold-title">
          <span className="text-[22px]">{sheet.currentHitPoints.value}</span>
          <span className="text-sm text-ink-meta"> / {sheet.maxHitPoints.value}</span>
        </span>
      </div>
      <GaugeBar current={sheet.currentHitPoints.value} max={sheet.maxHitPoints.value} />
      <HitPointControls />
    </div>
  );
}

function GaugeBar({ current, max }: { current: number; max: number }) {
  const percent = max > 0 ? (current / max) * FULL_GAUGE_PERCENT : 0;

  return (
    <div aria-hidden className="h-[3px] w-full bg-gold/14">
      <div className="h-full bg-gold/80" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** Soigner et blesser arrivent avec l'état d'aventure : les pas sont déjà à leur place. */
function HitPointControls() {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex gap-1">
        {DAMAGE_STEPS.map((step) => <HitPointStep key={step} step={step} />)}
      </span>
      <span className="text-meta tracking-meta text-ink-faint">
        Temp. {NO_TEMPORARY_HIT_POINTS}
      </span>
      <span className="flex gap-1">
        {HEALING_STEPS.map((step) => <HitPointStep key={step} step={step} />)}
      </span>
    </div>
  );
}

function HitPointStep({ step }: { step: number }) {
  const label = formatSigned(step);

  return (
    <Button variant="outline" size="icon-xs" disabled aria-label={`${label} PV`} title={COMING_SOON}>
      {label}
    </Button>
  );
}

interface StatTileProps {
  label: string;
  value: string;
  note?: string;
}

function StatTile({ label, value, note }: StatTileProps) {
  return (
    <div className="flex min-w-[68px] flex-col items-center justify-center gap-1.5 border border-gold/16 bg-surface px-2.5 py-2 text-center">
      <span className="sheet-caption">{label}</span>
      <span className="font-display text-[20px]/[1] text-gold-title">{value}</span>
      {note ? <span className="text-meta text-ink-faint">{note}</span> : null}
    </div>
  );
}

/** L'inspiration héroïque est binaire : un losange, allumé ou non (B04-RES-006). */
function HeroicInspiration() {
  return (
    <div
      aria-disabled
      title={COMING_SOON}
      className="flex min-w-[68px] flex-col items-center justify-center gap-2 border border-gold/16 bg-surface px-2.5 py-2"
    >
      <span className="sheet-caption">Inspiration</span>
      <Diamond size="box" tone="idle" />
      <span className="sr-only">aucune</span>
    </div>
  );
}

/** Un dé de vie par niveau, tous disponibles tant qu'aucun repos ne les dépense. */
function formatHitDice({ level }: ComputedCharacter): string {
  return `${level} / ${level}`;
}
