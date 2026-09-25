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
    ...backgroundChoices(composition),
    ...magicInitiateChoices(composition),
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
  return [{
    source: { type: "class", key: composition.classKey },
    ...classChoiceDetails(composition),
  }];
}

function classChoiceDetails(composition: CharacterComposition) {
  return {
      skills: composition.classSkills,
      expertise: composition.expertise,
      tools: composition.classTools,
      languages: composition.classLanguage ? [composition.classLanguage] : [],
      spells: [...composition.classCantrips, ...composition.classSpells],
      weaponMasteries: composition.weaponMasteries,
      ...(composition.fightingStyle ? { fightingStyle: composition.fightingStyle } : {}),
      ...(composition.classOrder ? { classOrder: composition.classOrder } : {}),
      ...(composition.invocation ? { invocation: composition.invocation } : {}),
      ...(composition.invocationSpells.length > 0
        ? { invocationSpells: composition.invocationSpells }
        : {}),
      ...(composition.familiarForm ? { familiarForm: composition.familiarForm } : {}),
      ...(composition.pactWeaponKey ? { pactWeaponKey: composition.pactWeaponKey } : {}),
      ...(composition.spellbook.length > 0 ? { spellbook: composition.spellbook } : {}),
  };
}

function backgroundChoices(composition: CharacterComposition): CharacterChoice[] {
  if (!composition.backgroundKey || !composition.backgroundTool) return [];

  return [{
    source: { type: "background", key: composition.backgroundKey },
    tools: [composition.backgroundTool],
  }];
}

/** Initié à la magie porte sa liste, sa caractéristique et ses sorts. */
function magicInitiateChoices(composition: CharacterComposition): CharacterChoice[] {
  if (composition.magicInitiateChoices.length > 0) return sourcedMagicChoices(composition);
  return legacyMagicChoice(composition);
}

function sourcedMagicChoices(composition: CharacterComposition): CharacterChoice[] {
  return composition.magicInitiateChoices.flatMap((choice) => {
    if (!choice.spellcastingAbility || !choice.spellList) return [];
    return [{
      source: {
        type: "feat",
        key: "magic-initiate",
        grantedBy: choice.grantedBy,
      },
      spellcastingAbility: choice.spellcastingAbility,
      spellList: choice.spellList,
      spells: [...choice.cantrips, ...choice.spells],
    }];
  });
}

function legacyMagicChoice(composition: CharacterComposition): CharacterChoice[] {
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
