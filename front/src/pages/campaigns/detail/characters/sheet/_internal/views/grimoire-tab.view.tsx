import type { ComputedCharacter, ResolvedSpellcasting } from "@donjon-dragon/shared";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { ABILITY_LABELS, SPELL_STATUS } from "../constants/sheet-labels";
import { formatSigned } from "../utils/sheet-format";
import { SpellGroupView, type SpellGroup } from "./spell-group.view";

/** Les sorts connus. École, portée et description n'existent pas encore côté API. */
export function GrimoireTabView({ sheet }: { sheet: ComputedCharacter }) {
  return (
    <div className="sheet-tab-split">
      <div className="flex min-w-0 flex-col gap-[22px]">
        {sheet.spellcasting.map((entry) => (
          <SpellcastingSection key={entry.origin} entry={entry} />
        ))}
      </div>
      <aside className="sheet-aside gap-3.5">
        {sheet.spellcasting.map((entry) => (
          <CastingStats key={entry.origin} entry={entry} />
        ))}
        <Spellbook names={sheet.spellbook.map((spell) => spell.name)} />
      </aside>
    </div>
  );
}

function SpellcastingSection({ entry }: { entry: ResolvedSpellcasting }) {
  return (
    <section className="flex flex-col gap-4">
      <span className="eyebrow">{entry.origin}</span>
      {toSpellGroups(entry).map((group) => (
        <SpellGroupView key={group.label} group={group} />
      ))}
    </section>
  );
}

function CastingStats({ entry }: { entry: ResolvedSpellcasting }) {
  return (
    <div className="panel-inset grid grid-cols-3 p-0">
      <CastingCell label="Caractéristique" value={ABILITY_LABELS[entry.ability]} />
      <CastingCell label="DD des sorts" value={String(entry.saveDc)} />
      <CastingCell label="Attaque" value={formatSigned(entry.attackBonus)} />
    </div>
  );
}

function CastingCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 border-l border-gold/10 px-2.5 pt-[9px] pb-2.5 first:border-l-0">
      <span className="text-center font-display text-[8.5px]/[1.3] tracking-label text-gold/72 uppercase">
        {label}
      </span>
      <span className="font-display text-[15px] text-gold-title">{value}</span>
    </div>
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
