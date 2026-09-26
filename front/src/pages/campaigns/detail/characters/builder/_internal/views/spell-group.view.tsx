import type { CatalogSpell } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { spellsTakenElsewhere, type SpellSource } from "../types/chosen-spells";

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
}

export function SpellGroup({ title, spells, limit, selection }: SpellGroupProps) {
  if (limit === 0 || spells.length === 0) return null;
  const chosen = spells.filter((spell) => selection.selected.includes(spell.key));
  const full = chosen.length >= limit;

  return (
    <div className="grid gap-2">
      <h3 className="section-title text-sm">
        {title} <Badge variant="outline">{chosen.length} / {limit}</Badge>
      </h3>
      <div className="flex flex-wrap gap-2">
        {spells.map((spell) => (
          <SpellToggle
            key={spell.key}
            spell={spell}
            lock={lockOf(spell.key, selection, full)}
            selection={selection}
          />
        ))}
      </div>
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
        <p className="text-xs text-destructive">
          À retirer, déjà connu par ailleurs : {namesOf(conflicts)}.
        </p>
      ) : null}
      {greyed.length > 0 ? (
        <p className="text-xs text-muted-foreground">
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

const LOCKED: readonly SpellLock[] = ["full", "taken"];

interface SpellToggleProps {
  spell: CatalogSpell;
  lock: SpellLock;
  selection: SpellSelection;
}

function SpellToggle({ spell, lock, selection }: SpellToggleProps) {
  const chosen = selection.selected.includes(spell.key);

  return (
    <Button
      type="button"
      size="sm"
      variant={lock === "conflict" ? "destructive" : chosen ? "default" : "outline"}
      aria-pressed={chosen}
      disabled={LOCKED.includes(lock)}
      title={spell.description}
      onClick={() => selection.onChange(toggle(selection.selected, spell.key))}
    >
      {spell.name}
    </Button>
  );
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
