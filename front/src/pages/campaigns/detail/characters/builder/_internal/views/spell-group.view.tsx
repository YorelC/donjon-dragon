import type { CatalogSpell } from "@donjon-dragon/shared";
import {
  SelectableRow,
  type SelectableRowState,
} from "@/shared/components/molecules/selectable-row";
import { spellsTakenElsewhere, type SpellSource } from "../types/chosen-spells";
import { ChoiceListHeaderView } from "./choice-list-header.view";

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
      <TakenSpellsNote spells={spells} selection={selection} />
    </div>
  );
}

/**
 * Un bouton désactivé ne reçoit pas le survol : la raison d'un sort grisé ne
 * peut pas vivre dans une infobulle. Elle s'écrit sous le groupe.
 */
function TakenSpellsNote({ spells, selection }: Omit<SpellGroupProps, "title" | "limit">) {
  const taken = spells.filter((spell) => selection.unavailable.includes(spell.key));
  const conflicts = taken.filter((spell) => selection.selected.includes(spell.key));
  const greyed = taken.filter((spell) => !selection.selected.includes(spell.key));

  return (
    <>
      {conflicts.length > 0 ? (
        <p className="fine-print px-1 text-destructive">
          À retirer, déjà connu par ailleurs : {namesOf(conflicts)}.
        </p>
      ) : null}
      {greyed.length > 0 ? (
        <p className="fine-print px-1">
          Déjà connus, choisis ailleurs ou accordés par l’espèce ou la classe : {namesOf(greyed)}.
        </p>
      ) : null}
    </>
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

function namesOf(spells: readonly CatalogSpell[]): string {
  return spells.map((spell) => spell.name).join(", ");
}

function toggle(selected: readonly string[], key: string): string[] {
  return selected.includes(key)
    ? selected.filter((entry) => entry !== key)
    : [...selected, key];
}

export function selectionOf(
  source: SpellSource,
  selected: readonly string[],
  onChange: (keys: string[]) => void,
): SpellSelection {
  return { selected, unavailable: spellsTakenElsewhere(source, selected), onChange };
}

/** La même sélection, qui montre en plus chaque sort survolé dans la fiche détaillée. */
export function previewing(selection: SpellSelection, onPreview: (key: string) => void): SpellSelection {
  return { ...selection, onPreview };
}
