import type {
  Ability,
  CharacterChoice,
  ClassKey,
  DndCatalog,
  FinalizeCharacterDto,
} from "@donjon-dragon/shared";
import {
  ABILITIES,
  availableScores,
  isFullyAssigned,
  type CharacterComposition,
} from "./character-composition";
import { grantedGold, grantedItems } from "./starting-equipment";

/** Un score neutre tant que rien n'est réparti : l'aperçu doit répondre. */
const UNASSIGNED_SCORE = 10;

function baseScoresOf(composition: CharacterComposition): Record<Ability, number> {
  if (composition.abilityMethod === "pointBuy") return { ...composition.pointBuyScores };
  const available = availableScores(composition);

  return Object.fromEntries(
    ABILITIES.map((ability) => {
      const slot = composition.assignment[ability];

      return [
        ability,
        slot === undefined ? UNASSIGNED_SCORE : available[slot] ?? UNASSIGNED_SCORE,
      ];
    }),
  ) as Record<Ability, number>;
}

/**
 * Les choix, regroupés par provenance. Le back en a besoin pour savoir quoi
 * retirer si la source disparaît, et pour vérifier que chaque source a bien fait
 * choisir ce qu'elle devait.
 */
function choicesOf(composition: CharacterComposition): CharacterChoice[] {
  return [
    ...speciesChoices(composition),
    ...classChoices(composition),
    ...magicInitiateChoice(composition),
    ...skilledChoice(composition),
  ];
}

function speciesChoices(composition: CharacterComposition): CharacterChoice[] {
  if (!composition.speciesKey) return [];

  return [
    {
      source: { type: "species", key: composition.speciesKey },
      skills: composition.speciesSkills,
      ...(composition.speciesFeat ? { originFeat: composition.speciesFeat } : {}),
    },
  ];
}

function classChoices(composition: CharacterComposition): CharacterChoice[] {
  if (!composition.classKey) return [];

  return [
    {
      source: { type: "class", key: composition.classKey },
      skills: composition.classSkills,
      expertise: composition.expertise,
      spells: [...composition.classCantrips, ...composition.classSpells],
      ...(composition.fightingStyle ? { fightingStyle: composition.fightingStyle } : {}),
      ...(composition.classOrder ? { classOrder: composition.classOrder } : {}),
    },
  ];
}

/** Initié à la magie porte sa liste, sa caractéristique et ses sorts. */
function magicInitiateChoice(composition: CharacterComposition): CharacterChoice[] {
  if (!composition.spellcastingAbility || !composition.spellList) return [];

  return [
    {
      source: { type: "feat", key: "magic-initiate" },
      spellcastingAbility: composition.spellcastingAbility,
      spellList: composition.spellList as ClassKey,
      spells: [...composition.featCantrips, ...composition.featSpells],
    },
  ];
}

function skilledChoice(composition: CharacterComposition): CharacterChoice[] {
  if (composition.featSkills.length === 0 && composition.featTools.length === 0) return [];

  return [
    {
      source: { type: "feat", key: "skilled" },
      skills: composition.featSkills,
      tools: composition.featTools,
    },
  ];
}

/**
 * L'équipement envoyé au back. `items` et `gold` ne sont pas saisis : ils se
 * recalculent depuis les options retenues, pour que la composition n'ait qu'une
 * seule source de vérité — le choix, pas sa conséquence.
 */
function equipmentOf(
  catalog: DndCatalog,
  composition: CharacterComposition,
): FinalizeCharacterDto["equipment"] {
  return {
    armorKey: composition.armorKey,
    shield: composition.shield,
    items: grantedItems(catalog, composition),
    gold: grantedGold(catalog, composition),
    classOptionId: composition.classEquipmentOptionId,
    backgroundOptionId: composition.backgroundEquipmentOptionId,
  };
}

export function toPreviewPayload(
  catalog: DndCatalog,
  composition: CharacterComposition,
): Omit<FinalizeCharacterDto, "name" | "abilityRoll"> | null {
  if (!composition.speciesKey || !composition.classKey || !composition.backgroundKey) {
    return null;
  }

  return {
    speciesKey: composition.speciesKey,
    lineageKey: composition.lineageKey,
    classKey: composition.classKey,
    backgroundKey: composition.backgroundKey,
    abilityMethod: composition.abilityMethod,
    base: baseScoresOf(composition),
    backgroundBonuses: composition.backgroundBonuses,
    choices: choicesOf(composition),
    equipment: equipmentOf(catalog, composition),
  };
}

export function toFinalizePayload(
  catalog: DndCatalog,
  composition: CharacterComposition,
): FinalizeCharacterDto | null {
  const preview = toPreviewPayload(catalog, composition);
  if (!preview || !isFullyAssigned(composition)) return null;

  return { ...preview, name: composition.name, abilityRoll: composition.abilityRoll };
}
