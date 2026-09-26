import type { CatalogSpell } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { spellsTakenElsewhere, type SpellSource } from "../types/chosen-spells";

const TAKEN_HINT = "Déjà connu : choisi ailleurs ou accordé par l’espèce ou la classe.";

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
    </div>
  );
}

type SpellLock = "free" | "full" | "taken";

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
      variant={chosen ? "default" : "outline"}
      aria-pressed={chosen}
      disabled={lock !== "free"}
      title={lock === "taken" ? `${TAKEN_HINT} ${spell.description}` : spell.description}
      onClick={() => selection.onChange(toggle(selection.selected, spell.key))}
    >
      {spell.name}
    </Button>
  );
}

function lockOf(key: string, selection: SpellSelection, full: boolean): SpellLock {
  if (selection.selected.includes(key)) return "free";
  if (selection.unavailable.includes(key)) return "taken";
  return full ? "full" : "free";
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
