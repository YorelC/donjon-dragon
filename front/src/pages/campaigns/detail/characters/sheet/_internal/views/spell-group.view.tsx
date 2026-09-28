import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/components/atoms/collapsible";
import { Diamond } from "@/shared/components/molecules/diamond";
import { GoldRule } from "@/shared/components/molecules/gold-rule";
import { cn } from "@/shared/utils/utils";
import { COMING_SOON, type CastableSpell } from "../constants/sheet-labels";
import type { SelectionBinding } from "../types/selection-binding";
import { toSpellStatus } from "../utils/spell-status";

export interface SpellGroup {
  label: string;
  spells: CastableSpell[];
  status: string;
  slots: number;
}

interface SpellGroupViewProps {
  group: SpellGroup;
  selection: SelectionBinding<CastableSpell>;
}

/** Un cercle de sorts : repliable, avec ses emplacements à droite de l'intitulé. */
export function SpellGroupView({ group, selection }: SpellGroupViewProps) {
  return (
    <Collapsible defaultOpen className="group/spells flex flex-col gap-[11px]">
      <CollapsibleTrigger className="flex cursor-pointer items-center gap-[11px] text-left">
        <span aria-hidden className="w-[9px] font-display text-sm text-gold/80 transition-transform group-data-[state=closed]/spells:-rotate-90">
          ▾
        </span>
        <span className="section-label">{group.label}</span>
        <GoldRule />
        <SlotPips count={group.slots} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="flex flex-col gap-[7px]">
          {group.spells.map((spell) => (
            <SpellRow
              key={spell.spellKey}
              spell={spell}
              fallback={group.status}
              selection={selection}
            />
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** Les emplacements se voient mais ne se cochent pas encore : l'état d'aventure n'existe pas. */
export function SlotPips({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span aria-disabled title={COMING_SOON} className="flex items-center gap-[5px]">
      <span className="sr-only">{count} emplacement(s)</span>
      {Array.from({ length: count }, (_, index) => (
        <SlotPip key={index} />
      ))}
    </span>
  );
}

function SlotPip() {
  return <span aria-hidden className="size-2.5 rotate-45 border border-arcane/90 bg-arcane/75" />;
}

interface SpellRowProps {
  spell: CastableSpell;
  fallback: string;
  selection: SelectionBinding<CastableSpell>;
}

function SpellRow({ spell, fallback, selection }: SpellRowProps) {
  const pinned = selection.pinned === spell;

  return (
    <li>
      <button
        type="button"
        aria-pressed={pinned}
        onMouseEnter={() => selection.onEnter(spell)}
        onMouseLeave={selection.onLeave}
        onFocus={() => selection.onEnter(spell)}
        onBlur={selection.onLeave}
        onClick={() => selection.onSelect(spell)}
        className={cn(
          "sheet-row grid w-full cursor-pointer grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2.5 py-[9px] text-left transition-colors hover:border-gold/40",
          pinned && "border-gold/70 bg-gold/[.06]",
        )}
      >
        <Diamond size="tick" tone="filled" />
        <span className="text-body/[1.3] text-foreground">{spell.name}</span>
        <span className="sheet-tag font-display">{toSpellStatus(spell, fallback)}</span>
      </button>
    </li>
  );
}
