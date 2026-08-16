import type { Ability, CharacterBuildDetailDto } from "@donjon-dragon/shared";
import { STANDARD_ARRAY } from "@donjon-dragon/shared";
import { ABILITIES, POINT_BUY_FLOOR, type CharacterComposition } from "./character-composition";

/** Le build déjà éclaté du personnage → la composition dont le wizard part pour l'édition. */
export function toComposition(dto: CharacterBuildDetailDto): CharacterComposition {
  return {
    ...coreFieldsOf(dto),
    ...choiceFieldsOf(dto),
    ...abilityFieldsOf(dto),
  };
}

function coreFieldsOf(dto: CharacterBuildDetailDto) {
  return {
    name: dto.name,
    speciesKey: dto.speciesKey,
    lineageKey: dto.lineageKey,
    lineageSpellcastingAbility: dto.lineageSpellcastingAbility,
    classKey: dto.classKey,
    backgroundKey: dto.backgroundKey,
    backgroundBonuses: dto.backgroundBonuses,
    classEquipmentOptionId: dto.classOptionId,
    backgroundEquipmentOptionId: dto.backgroundOptionId,
    armorKey: dto.armorKey,
    shield: dto.shield,
  };
}

function choiceFieldsOf(dto: CharacterBuildDetailDto) {
  return {
    speciesSkills: dto.speciesSkills,
    speciesFeat: dto.speciesFeat,
    classSkills: dto.classSkills,
    expertise: dto.expertise,
    classCantrips: dto.classCantrips,
    classSpells: dto.classSpells,
    fightingStyle: dto.fightingStyle,
    classOrder: dto.classOrder,
    featSkills: dto.featSkills,
    featTools: dto.featTools,
    spellcastingAbility: dto.spellcastingAbility,
    spellList: dto.spellList,
    featCantrips: dto.featCantrips,
    featSpells: dto.featSpells,
  };
}

function abilityFieldsOf(dto: CharacterBuildDetailDto) {
  return {
    abilityMethod: dto.abilityMethod,
    abilityRoll: dto.abilityRoll,
    assignment: assignmentOf(dto),
    pointBuyScores: pointBuyScoresOf(dto),
  };
}

function pointBuyScoresOf(dto: CharacterBuildDetailDto): Record<Ability, number> {
  if (dto.abilityMethod !== "pointBuy") {
    return Object.fromEntries(ABILITIES.map((ability) => [ability, POINT_BUY_FLOOR])) as Record<
      Ability,
      number
    >;
  }

  return { ...dto.base };
}

/**
 * Le rang de la valeur posée sur chaque caractéristique, pas sa valeur : deux
 * 14 dans un même tirage sont deux emplacements distincts. Reconstruit par
 * correspondance déterministe — premier emplacement libre dont la valeur
 * colle — dans l'ordre fixe de `ABILITIES`.
 */
function assignmentOf(dto: CharacterBuildDetailDto): Partial<Record<Ability, number>> {
  if (dto.abilityMethod === "pointBuy") return {};
  const available = dto.abilityMethod === "roll" ? dto.abilityRoll?.totals ?? [] : STANDARD_ARRAY;
  const used = new Set<number>();
  const assignment: Partial<Record<Ability, number>> = {};

  for (const ability of ABILITIES) {
    const slot = available.findIndex((value, index) => value === dto.base[ability] && !used.has(index));
    if (slot === -1) continue;
    used.add(slot);
    assignment[ability] = slot;
  }

  return assignment;
}
