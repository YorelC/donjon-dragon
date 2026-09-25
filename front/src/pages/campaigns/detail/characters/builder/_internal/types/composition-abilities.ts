import type { DndCatalog, SkillName } from "@donjon-dragon/shared";
import { POINT_BUY_COSTS, STANDARD_ARRAY } from "@donjon-dragon/shared";
import { ABILITIES, type CharacterComposition } from "./character-composition";

export function allSkillsOf(catalog: DndCatalog): SkillName[] {
  return Object.keys(catalog.skillLabels) as SkillName[];
}

export function availableScoresOf(composition: CharacterComposition): readonly number[] {
  return composition.abilityMethod === "roll"
    ? composition.abilityRoll?.totals ?? []
    : STANDARD_ARRAY;
}

export function pointBuySpent(composition: CharacterComposition): number {
  return ABILITIES.reduce(
    (total, ability) => total + (POINT_BUY_COSTS[composition.pointBuyScores[ability]] ?? 0),
    0,
  );
}

export function isFullyAssigned(composition: CharacterComposition): boolean {
  if (composition.abilityMethod === "pointBuy") return true;
  return ABILITIES.every((ability) => composition.assignment[ability] !== undefined);
}
