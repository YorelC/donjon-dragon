import type { CatalogSpell } from "@donjon-dragon/shared";
import type { SpellOrigin, SpellOrigins } from "./spell-origins";

/** Une ligne de la note : sa raison, puis les sorts qu'elle concerne. */
export interface TakenSpellLine {
  reason: string;
  names: string;
}

export interface TakenSpellNotes {
  /** Cochés ici ET connus ailleurs : un brouillon antérieur à la règle, à corriger. */
  conflicts: TakenSpellLine[];
  /** Grisés : accordés, ou déjà choisis dans un autre groupe. */
  unavailable: TakenSpellLine[];
}

interface TakenSpellsInput {
  spells: readonly CatalogSpell[];
  selected: readonly string[];
  unavailable: readonly string[];
  origins: SpellOrigins;
}

const UNKNOWN_ORIGIN = "Déjà connu par ailleurs";

const REASONS: Record<SpellOrigin["kind"], string> = {
  granted: "Accordé par",
  chosen: "Déjà choisi dans",
};

const CONFLICT_REASONS: Record<SpellOrigin["kind"], string> = {
  granted: "À retirer, déjà accordé par",
  chosen: "À retirer, déjà choisi dans",
};

/**
 * La note sous un groupe de sorts : une ligne par source, pour que le joueur
 * sache QUI lui a pris le sort — « Accordé par Gnome des roches : Réparation ».
 */
export function takenSpellNotesOf(input: TakenSpellsInput): TakenSpellNotes {
  const taken = input.spells.filter((spell) => input.unavailable.includes(spell.key));
  const isSelected = (spell: CatalogSpell) => input.selected.includes(spell.key);

  return {
    conflicts: linesOf(taken.filter(isSelected), input.origins, CONFLICT_REASONS),
    unavailable: linesOf(taken.filter((spell) => !isSelected(spell)), input.origins, REASONS),
  };
}

function linesOf(
  spells: readonly CatalogSpell[],
  origins: SpellOrigins,
  reasons: Record<SpellOrigin["kind"], string>,
): TakenSpellLine[] {
  const byReason = new Map<string, string[]>();
  spells.forEach((spell) => {
    const reason = reasonOf(origins[spell.key], reasons);
    byReason.set(reason, [...(byReason.get(reason) ?? []), spell.name]);
  });

  return [...byReason].map(([reason, names]) => ({ reason, names: names.join(", ") }));
}

function reasonOf(origin: SpellOrigin | undefined, reasons: Record<SpellOrigin["kind"], string>): string {
  return origin ? `${reasons[origin.kind]} ${origin.label}` : UNKNOWN_ORIGIN;
}
