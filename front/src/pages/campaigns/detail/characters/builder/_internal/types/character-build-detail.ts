import type { Ability, CharacterBuildDetailDto, DndCatalog } from "@donjon-dragon/shared";
import { STANDARD_ARRAY } from "@donjon-dragon/shared";
import { ABILITIES, POINT_BUY_FLOOR, type CharacterComposition } from "./character-composition";

/** Le build déjà éclaté du personnage → la composition dont le wizard part pour l'édition. */
export function toComposition(
  dto: CharacterBuildDetailDto,
  catalog: DndCatalog,
): CharacterComposition {
  return {
    ...coreFieldsOf(dto),
    ...identityFieldsOf(dto),
    ...originFieldsOf(dto, catalog),
    ...choiceFieldsOf(dto),
    ...abilityFieldsOf(dto),
  };
}

/** L'état civil, figé à la création : il est relu, jamais recalculé. */
function identityFieldsOf(dto: CharacterBuildDetailDto) {
  return {
    alignment: dto.alignment,
    age: dto.age,
    heightCm: dto.heightCm,
    weightKg: dto.weightKg,
    description: dto.description,
  };
}

/**
 * La taille persistée ne devient un choix explicite que si l'espèce en offre
 * un. Sinon elle reste dérivée : la reprendre ferait ressurgir, par la porte de
 * derrière, la rémanence que `resolvedSizeOf` sert justement à empêcher.
 */
function originFieldsOf(dto: CharacterBuildDetailDto, catalog: DndCatalog) {
  const species = catalog.species.find((entry) => entry.key === dto.speciesKey);
  const isChosen = (species?.sizeOptions.length ?? 0) > 1;

  return {
    selectedSize: isChosen ? dto.size : null,
    standardLanguages: [...dto.standardLanguages],
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
    classChoiceItemKey: dto.classChoiceItemKey,
    backgroundChoiceItemKey: dto.backgroundChoiceItemKey,
    trinketId: dto.trinketId,
    armorKey: dto.armorKey,
    shield: dto.shield,
  };
}

function choiceFieldsOf(dto: CharacterBuildDetailDto) {
  return {
    speciesSkills: dto.speciesSkills,
    speciesFeat: dto.speciesFeat,
    ...classChoiceFieldsOf(dto),
    backgroundTool: dto.backgroundTool,
    ...featChoiceFieldsOf(dto),
  };
}

function classChoiceFieldsOf(dto: CharacterBuildDetailDto) {
  return {
    classSkills: dto.classSkills,
    expertise: dto.expertise,
    classCantrips: dto.classCantrips,
    classSpells: dto.classSpells,
    fightingStyle: dto.fightingStyle,
    classOrder: dto.classOrder,
    weaponMasteries: dto.weaponMasteries,
    classTools: dto.classTools,
    classLanguage: dto.classLanguage,
    invocation: dto.invocation,
    invocationSpells: dto.invocationSpells,
    familiarForm: dto.familiarForm,
    pactWeaponKey: dto.pactWeaponKey,
    spellbook: dto.spellbook,
  };
}

function featChoiceFieldsOf(dto: CharacterBuildDetailDto) {
  return {
    featSkills: dto.featSkills,
    featTools: dto.featTools,
    spellcastingAbility: dto.spellcastingAbility,
    spellList: dto.spellList,
    featCantrips: dto.featCantrips,
    featSpells: dto.featSpells,
    magicInitiateChoices: dto.magicInitiateChoices.flatMap((choice) => choice.grantedBy ? [{
      ...choice,
      grantedBy: { ...choice.grantedBy },
      cantrips: [...choice.cantrips],
      spells: [...choice.spells],
    }] : []),
  };
}

function abilityFieldsOf(dto: CharacterBuildDetailDto) {
  return {
    abilityMethod: dto.abilityMethod,
    abilityRoll: dto.abilityRoll,
    abilityRollId: null,
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
