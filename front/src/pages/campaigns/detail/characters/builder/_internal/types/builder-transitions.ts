import type { BackgroundKey, ClassKey, DndCatalog, SkillName } from "@donjon-dragon/shared";
import type { CharacterComposition } from "./character-composition";
import { grantedItems, SHIELD_ITEM_KEY } from "./starting-equipment";

export interface BuilderTransitionContext {
  catalog: DndCatalog;
  composition: CharacterComposition;
}

export function classChangePatch(
  classKey: ClassKey,
  context: BuilderTransitionContext,
): Partial<CharacterComposition> {
  if (classKey === context.composition.classKey) return {};
  const reset = resetClass(classKey);

  return { ...reset, ...retainedEquipment(context, reset) };
}

export function backgroundChangePatch(
  backgroundKey: BackgroundKey,
  context: BuilderTransitionContext,
): Partial<CharacterComposition> {
  if (backgroundKey === context.composition.backgroundKey) return {};
  const reset = resetBackground(backgroundKey, context);
  const filtered = filteredSkills(context, reset);

  return { ...reset, ...filtered, ...retainedEquipment(context, reset) };
}

export function retainedExpertise(
  expertise: readonly SkillName[],
  mastered: readonly SkillName[],
): SkillName[] {
  const allowed = new Set(mastered);

  return expertise.filter((skill) => allowed.has(skill));
}

function resetClass(classKey: ClassKey): Partial<CharacterComposition> {
  return {
    classKey, classSkills: [], expertise: [], classCantrips: [], classSpells: [],
    fightingStyle: null, classOrder: null, classEquipmentOptionId: null,
    classChoiceItemKey: null, weaponMasteries: [], classTools: [], classLanguage: null,
    invocation: null, invocationSpells: [], familiarForm: null, pactWeaponKey: null,
    spellbook: [],
  };
}

function resetBackground(
  backgroundKey: BackgroundKey,
  context: BuilderTransitionContext,
): Partial<CharacterComposition> {
  const resetFeat = featGrantChanged(backgroundKey, context) || speciesFeatConflicts(backgroundKey, context);

  return {
    backgroundKey, backgroundBonuses: {}, backgroundEquipmentOptionId: null,
    backgroundChoiceItemKey: null, backgroundTool: null,
    ...(resetFeat ? resetFeatFields(backgroundKey, context) : {}),
  };
}

function resetFeatFields(
  backgroundKey: BackgroundKey,
  context: BuilderTransitionContext,
): Partial<CharacterComposition> {
  const removeSpecies = speciesFeatConflicts(backgroundKey, context);
  return {
    ...(removeSpecies ? { speciesFeat: null } : {}),
    featSkills: [], featTools: [], spellcastingAbility: null, spellList: null,
    featCantrips: [], featSpells: [],
    magicInitiateChoices: [
      ...context.composition.magicInitiateChoices.filter((choice) =>
        choice.grantedBy.type !== "background"
        && (!removeSpecies || choice.grantedBy.type !== "species")),
      ...fixedListChoice(backgroundKey, context.catalog),
    ],
  };
}

/**
 * Le Sage, l'Acolyte et le Guide imposent la liste de leur Initié à la magie :
 * elle est retenue d'office, il ne reste que la caractéristique à choisir.
 */
function fixedListChoice(
  backgroundKey: BackgroundKey,
  catalog: DndCatalog,
): CharacterComposition["magicInitiateChoices"] {
  const spellList = catalog.backgrounds.find((entry) => entry.key === backgroundKey)
    ?.originFeatSpellList;
  if (!spellList) return [];

  return [{
    grantedBy: { type: "background", key: backgroundKey },
    spellList, spellcastingAbility: null, cantrips: [], spells: [],
  }];
}

function featGrantChanged(
  backgroundKey: BackgroundKey,
  { catalog, composition }: BuilderTransitionContext,
): boolean {
  return featGrantOf(catalog, composition.backgroundKey) !== featGrantOf(catalog, backgroundKey);
}

function featGrantOf(catalog: DndCatalog, key: BackgroundKey | null): string {
  const background = catalog.backgrounds.find((entry) => entry.key === key);

  return `${background?.originFeat ?? ""}:${background?.originFeatSpellList ?? ""}`;
}

function speciesFeatConflicts(
  backgroundKey: BackgroundKey,
  { catalog, composition }: BuilderTransitionContext,
): boolean {
  const background = catalog.backgrounds.find((entry) => entry.key === backgroundKey);
  if (!composition.speciesFeat || background?.originFeat !== composition.speciesFeat) return false;

  return !catalog.originFeats.find((feat) => feat.key === composition.speciesFeat)?.repeatable;
}

function filteredSkills(
  context: BuilderTransitionContext,
  reset: Partial<CharacterComposition>,
): Pick<CharacterComposition, "classSkills" | "expertise"> {
  const next = { ...context.composition, ...reset };
  const blocked = skillsOutsideClass(next, context.catalog);
  const classSkills = next.classSkills.filter((skill) => !blocked.has(skill));
  const mastered = [...blocked, ...classSkills];

  return { classSkills, expertise: retainedExpertise(next.expertise, mastered) };
}

function skillsOutsideClass(composition: CharacterComposition, catalog: DndCatalog): Set<SkillName> {
  const background = catalog.backgrounds.find((entry) => entry.key === composition.backgroundKey);

  return new Set([
    ...(background?.skillProficiencies ?? []), ...composition.speciesSkills,
    ...composition.featSkills,
  ]);
}

function retainedEquipment(
  context: BuilderTransitionContext,
  reset: Partial<CharacterComposition>,
): Pick<CharacterComposition, "armorKey" | "shield"> {
  const next = { ...context.composition, ...reset };
  const owned = new Set(grantedItems(context.catalog, next).map((item) => item.itemKey));

  return {
    armorKey: next.armorKey && owned.has(next.armorKey) ? next.armorKey : null,
    shield: next.shield && owned.has(SHIELD_ITEM_KEY),
  };
}
