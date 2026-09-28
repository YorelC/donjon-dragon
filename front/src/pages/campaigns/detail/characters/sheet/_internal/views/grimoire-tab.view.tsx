import type { ComputedCharacter, ResolvedSpellcasting } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { ABILITY_LABELS, SPELL_STATUS, type CastableSpell } from "../constants/sheet-labels";
import type { SelectionBinding } from "../types/selection-binding";
import { formatSigned } from "../utils/sheet-format";
import { SpellDetailAsideView } from "./spell-detail-aside.view";
import { SpellGroupView, type SpellGroup } from "./spell-group.view";

interface GrimoireTabViewProps {
  sheet: ComputedCharacter;
  selection: SelectionBinding<CastableSpell>;
}

/**
 * Une section par source de sorts, chacune avec sa caractéristique : deux sources
 * à la même caractéristique restent deux sections, la provenance est une règle
 * (B04-FIC-006).
 */
export function GrimoireTabView({ sheet, selection }: GrimoireTabViewProps) {
  return (
    <div className="sheet-tab-split">
      <div className="flex min-w-0 flex-col gap-[22px]">
        {sheet.spellcasting.map((entry) => (
          <SpellcastingSection key={entry.origin} entry={entry} selection={selection} />
        ))}
        <Spellbook names={sheet.spellbook.map((spell) => spell.name)} />
      </div>
      <SpellDetailAsideView spell={selection.shown} />
    </div>
  );
}

interface SpellcastingSectionProps {
  entry: ResolvedSpellcasting;
  selection: SelectionBinding<CastableSpell>;
}

function SpellcastingSection({ entry, selection }: SpellcastingSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <SourceHeading entry={entry} />
      {toSpellGroups(entry).map((group) => (
        <SpellGroupView key={group.label} group={group} selection={selection} />
      ))}
    </section>
  );
}

function SourceHeading({ entry }: { entry: ResolvedSpellcasting }) {
  return (
    <header className="flex flex-col gap-1.5">
      <span className="eyebrow">{entry.origin}</span>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-display text-sm tracking-meta text-gold-value">
          {ABILITY_LABELS[entry.ability]}
        </span>
        <CastingFact label="DD" value={String(entry.saveDc)} />
        <CastingFact label="Attaque" value={formatSigned(entry.attackBonus)} />
      </div>
    </header>
  );
}

function CastingFact({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="sheet-caption">{label}</span>
      <span className="font-display text-sm text-gold-title">{value}</span>
    </span>
  );
}

function Spellbook({ names }: { names: string[] }) {
  if (names.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      <SectionHeading label="Livre de sorts" />
      <p className="text-note/[1.7] text-ink-prose">{names.join(", ")}</p>
    </div>
  );
}

function toSpellGroups(entry: ResolvedSpellcasting): SpellGroup[] {
  const groups: SpellGroup[] = [
    { label: "Sorts mineurs", spells: entry.cantripsKnown, status: SPELL_STATUS.cantrip, slots: 0 },
    {
      label: "Niveau 1",
      spells: entry.spellsPrepared,
      status: SPELL_STATUS.prepared,
      slots: entry.level1Slots,
    },
  ];
  return groups.filter((group) => group.spells.length > 0 || group.slots > 0);
}
