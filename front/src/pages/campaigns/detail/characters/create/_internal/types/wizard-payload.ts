import type {
  Ability,
  CharacterChoice,
  ClassKey,
  FinalizeCharacterDto,
  PreviewCharacterSheetDto,
} from "@donjon-dragon/shared";
import {
  ABILITIES,
  availableScores,
  isFullyAssigned,
  type WizardDraft,
} from "./wizard-draft";

/** Un score neutre tant que rien n'est réparti : l'aperçu doit répondre. */
const UNASSIGNED_SCORE = 10;

function baseScoresOf(
  draft: WizardDraft,
  rollTotals: readonly number[],
): Record<Ability, number> {
  if (draft.abilityMethod === "pointBuy") return { ...draft.pointBuyScores };
  const available = availableScores(draft, rollTotals);

  return Object.fromEntries(
    ABILITIES.map((ability) => {
      const slot = draft.assignment[ability];

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
function choicesOf(draft: WizardDraft): CharacterChoice[] {
  return [
    ...speciesChoices(draft),
    ...classChoices(draft),
    ...magicInitiateChoice(draft),
    ...skilledChoice(draft),
  ];
}

function speciesChoices(draft: WizardDraft): CharacterChoice[] {
  if (!draft.speciesKey) return [];

  return [
    {
      source: { type: "species", key: draft.speciesKey },
      skills: draft.speciesSkills,
      ...(draft.speciesFeat ? { originFeat: draft.speciesFeat } : {}),
    },
  ];
}

function classChoices(draft: WizardDraft): CharacterChoice[] {
  if (!draft.classKey) return [];

  return [
    {
      source: { type: "class", key: draft.classKey },
      skills: draft.classSkills,
      expertise: draft.expertise,
      spells: draft.classSpells,
    },
  ];
}

/** Initié à la magie porte sa liste, sa caractéristique et ses sorts. */
function magicInitiateChoice(draft: WizardDraft): CharacterChoice[] {
  if (!draft.spellcastingAbility || !draft.spellList) return [];

  return [
    {
      source: { type: "feat", key: "magic-initiate" },
      spellcastingAbility: draft.spellcastingAbility,
      spellList: draft.spellList as ClassKey,
      spells: draft.featSpells,
    },
  ];
}

function skilledChoice(draft: WizardDraft): CharacterChoice[] {
  if (draft.featSkills.length === 0 && draft.featTools.length === 0) return [];

  return [
    {
      source: { type: "feat", key: "skilled" },
      skills: draft.featSkills,
      tools: draft.featTools,
    },
  ];
}

export function toPreviewPayload(
  draft: WizardDraft,
  rollTotals: readonly number[],
): PreviewCharacterSheetDto | null {
  if (!draft.speciesKey || !draft.classKey || !draft.backgroundKey) return null;

  return {
    speciesKey: draft.speciesKey,
    lineageKey: draft.lineageKey,
    classKey: draft.classKey,
    backgroundKey: draft.backgroundKey,
    abilityMethod: draft.abilityMethod,
    base: baseScoresOf(draft, rollTotals),
    backgroundBonuses: draft.backgroundBonuses,
    choices: choicesOf(draft),
    equipment: { armorKey: draft.armorKey, shield: draft.shield, items: [], gold: 0 },
  };
}

export function toFinalizePayload(
  draft: WizardDraft,
  rollTotals: readonly number[],
  name: string,
): FinalizeCharacterDto | null {
  const preview = toPreviewPayload(draft, rollTotals);
  if (!preview || !isFullyAssigned(draft)) return null;

  return { ...preview, name };
}
