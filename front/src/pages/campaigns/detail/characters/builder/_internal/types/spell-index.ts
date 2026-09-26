import type { CatalogSpell } from "@donjon-dragon/shared";
import type { SpellsStep } from "../views/spells-step.view";

/** Toutes les fiches de sort chargées, par clé : classe, don, grimoire de Pacte. */
export function spellIndexOf(spells: SpellsStep): Map<string, CatalogSpell> {
  const lists = [spells.classSpells, spells.featSpells, ...Object.values(spells.featSpellLists)];
  const listed = lists.flatMap((list) => (list ? [...list.cantrips, ...list.level1] : []));
  const all = [...listed, ...spells.tomeSpells.cantrips, ...spells.tomeSpells.rituals];

  return new Map(all.map((spell) => [spell.key, spell]));
}
