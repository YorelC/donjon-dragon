import type { CharacterChoice, ClassKey } from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";

/**
 * Les choix, regroupés par provenance. Le back en a besoin pour savoir quoi
 * retirer si la source disparaît, et pour vérifier que chaque source a bien fait
 * choisir ce qu'elle devait.
 */
export function choicesOf(composition: CharacterComposition): CharacterChoice[] {
  return [
    ...speciesChoices(composition),
    ...lineageChoices(composition),
    ...classChoices(composition),
    ...magicInitiateChoice(composition),
    ...skilledChoice(composition),
  ];
}

/**
 * La caractéristique d'incantation du sort mineur de lignée. Elle est portée par
 * la lignée et non par l'espèce : c'est elle qui donne le sort.
 */
function lineageChoices(composition: CharacterComposition): CharacterChoice[] {
  if (!composition.lineageKey || !composition.lineageSpellcastingAbility) return [];

  return [
    {
      source: { type: "lineage", key: composition.lineageKey },
      spellcastingAbility: composition.lineageSpellcastingAbility,
    },
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
