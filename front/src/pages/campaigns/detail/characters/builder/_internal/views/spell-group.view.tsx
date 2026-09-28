import type { CatalogSpell } from "@donjon-dragon/shared";
import {
  SelectableRow,
  type SelectableRowState,
} from "@/shared/components/molecules/selectable-row";
import { spellsTakenElsewhere } from "../types/chosen-spells";
import {
  spellOriginsOf,
  type NamedSpellSource,
  type OwnSpells,
  type SpellOrigins,
} from "../types/spell-origins";
import { takenSpellNotesOf } from "../types/taken-spell-notes";
import { ChoiceListHeaderView } from "./choice-list-header.view";
import { TakenSpellsNoteView } from "./taken-spells-note.view";

interface SpellGroupProps {
  title: string;
  spells: readonly CatalogSpell[];
  limit: number;
  selection: SpellSelection;
}

/** Ce que le groupe a coché, ce que les autres groupes lui ont pris (B01-SOR-006). */
export interface SpellSelection {
  selected: readonly string[];
  unavailable: readonly string[];
  /** Ce qui a pris chaque sort indisponible, pour le nommer sous le groupe. */
  origins: SpellOrigins;
  onChange: (keys: string[]) => void;
  /** Montre le sort dans la fiche détaillée, au survol ou au focus. */
  onPreview?: (key: string) => void;
}

export function SpellGroup({ title, spells, limit, selection }: SpellGroupProps) {
  if (limit === 0 || spells.length === 0) return null;
  const chosen = spells.filter((spell) => selection.selected.includes(spell.key));
  const full = chosen.length >= limit;

  return (
    <div className="flex flex-col gap-1.5">
      <ChoiceListHeaderView header={{ label: title, chosen: chosen.length, total: limit }} />
      {spells.map((spell) => (
        <SpellToggle
          key={spell.key}
          spell={spell}
          lock={lockOf(spell.key, selection, full)}
          selection={selection}
        />
      ))}
      <TakenSpellsNoteView notes={takenSpellNotesOf({ spells, ...selection })} />
    </div>
  );
}

/**
 * `conflict` : coché ici ET connu ailleurs — un brouillon antérieur à la règle.
 * Il reste cliquable, pour que le joueur puisse le retirer.
 */
type SpellLock = "free" | "full" | "taken" | "conflict";

const ROW_STATES: Record<SpellLock, SelectableRowState> = {
  free: "idle",
  full: "locked",
  taken: "locked",
  conflict: "conflict",
};

const LEVEL_TAGS: Record<CatalogSpell["level"], string> = { 0: "Mineur", 1: "Niv. 1" };

interface SpellToggleProps {
  spell: CatalogSpell;
  lock: SpellLock;
  selection: SpellSelection;
}

function SpellToggle({ spell, lock, selection }: SpellToggleProps) {
  const chosen = selection.selected.includes(spell.key);

  return (
    <SelectableRow
      entry={{ name: spell.name, meta: spellMetaOf(spell), tag: LEVEL_TAGS[spell.level] }}
      state={chosen && lock === "free" ? "selected" : ROW_STATES[lock]}
      actions={{
        select: () => selection.onChange(toggle(selection.selected, spell.key)),
        preview: () => selection.onPreview?.(spell.key),
      }}
    />
  );
}

/** « Divination · 27 m · Action bonus · Concentration » : de quoi comparer sans ouvrir la fiche. */
function spellMetaOf(spell: CatalogSpell): string {
  return [
    spell.school,
    spell.range,
    spell.castingTime,
    spell.concentration ? "Concentration" : null,
    spell.ritual ? "Rituel" : null,
  ].filter(Boolean).join(" · ");
}

/** La première règle qui s'applique gagne ; aucune ne s'applique, le sort est libre. */
function lockOf(key: string, selection: SpellSelection, full: boolean): SpellLock {
  const chosen = selection.selected.includes(key);
  const taken = selection.unavailable.includes(key);
  const rules: readonly [boolean, SpellLock][] = [
    [chosen && taken, "conflict"],
    [chosen, "free"],
    [taken, "taken"],
    [full, "full"],
  ];

  return rules.find(([applies]) => applies)?.[1] ?? "free";
}

function toggle(selected: readonly string[], key: string): string[] {
  return selected.includes(key)
    ? selected.filter((entry) => entry !== key)
    : [...selected, key];
}

export function selectionOf(
  source: NamedSpellSource,
  own: OwnSpells,
  onChange: (keys: string[]) => void,
): SpellSelection {
  return {
    selected: own.keys,
    unavailable: spellsTakenElsewhere(source, own.keys),
    origins: spellOriginsOf(source, own),
    onChange,
  };
}

/** La même sélection, qui montre en plus chaque sort survolé dans la fiche détaillée. */
export function previewing(selection: SpellSelection, onPreview: (key: string) => void): SpellSelection {
  return { ...selection, onPreview };
}
