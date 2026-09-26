import { useClassSpells } from "@/shared/queries/use-dnd-catalog";
import type { CatalogSpell } from "@donjon-dragon/shared";
import type { SpellsStep } from "../views/spells-step.view";
import {
  classCantripsOf,
  classPreparedQuotaOf,
  featSpellcastingOf,
  spellbookSizeOf,
  type StepContext,
} from "../types/builder-lookups";

export function useSpellsStep(context: StepContext | null): SpellsStep {
  const classSpells = useClassSpells(context?.composition.classKey ?? null);
  const featSpells = useClassSpells(context?.composition.spellList ?? null);
  const tomeQueries = useTomeSpellLists();
  const featChoice = context ? featSpellcastingOf(context) : undefined;
  const lists = tomeQueries.map((query) => query.data);

  return {
    classSpells: classSpells.data ?? null,
    classCantripsKnown: context ? classCantripsOf(context) : 0,
    classSpellsPrepared: context ? classPreparedQuotaOf(context) : 0,
    spellbookSize: context ? spellbookSizeOf(context) : 0,
    featSpells: featSpells.data ?? null,
    featCantripsKnown: featChoice?.cantripsKnown ?? 0,
    featSpellsPrepared: featChoice?.spellsPrepared ?? 0,
    featSpellLists: spellListsOf(lists),
    tomeSpells: tomeSpellsOf(lists),
    isLoading: [classSpells, featSpells, ...tomeQueries]
      .some((query) => query.isLoading),
  };
}

function useTomeSpellLists() {
  const cleric = useClassSpells("cleric");
  const druid = useClassSpells("druid");
  const wizard = useClassSpells("wizard");
  return [cleric, druid, wizard];
}

function spellListsOf(lists: Array<ReturnType<typeof useClassSpells>["data"]>) {
  return Object.fromEntries(lists.filter(Boolean).map((list) => [list!.classKey, list]));
}

function tomeSpellsOf(lists: Array<ReturnType<typeof useClassSpells>["data"]>) {
  const cantrips = uniqueSpells(lists.flatMap((list) => list?.cantrips ?? []));
  const rituals = uniqueSpells(lists.flatMap((list) => list?.level1.filter((spell) => spell.ritual) ?? []));
  return { cantrips, rituals };
}

function uniqueSpells(spells: CatalogSpell[]): CatalogSpell[] {
  return [...new Map(spells.map((spell) => [spell.key, spell])).values()];
}
