import { backgroundOf, classOf, type StepContext } from "./builder-lookups";
import { isExactBoundedChoice } from "./builder-validity";
import type { StepDescriptor } from "./builder-step-descriptors";

const counted = (chosen: number, total: number) => ({ chosen, total });

export const backgroundToolDescriptor: StepDescriptor = {
  key: "backgroundTool", label: "Outil d’historique",
  isVisible: (context) => (backgroundOf(context)?.toolOptions.length ?? 0) > 0,
  isValid: (context) => isExactBoundedChoice(
    context.composition.backgroundTool ? [context.composition.backgroundTool] : [],
    1, backgroundOf(context)?.toolOptions ?? [],
  ),
};

export const weaponMasteriesDescriptor: StepDescriptor = {
  key: "weaponMasteries", label: "Maîtrises d’armes",
  isVisible: (context) => classOf(context)?.weaponMastery !== null,
  isValid: (context) => isExactBoundedChoice(
    context.composition.weaponMasteries,
    classOf(context)?.weaponMastery?.count ?? 0,
    classOf(context)?.weaponMastery?.options ?? [],
  ),
  progress: (context) => counted(
    context.composition.weaponMasteries.length,
    classOf(context)?.weaponMastery?.count ?? 0,
  ),
};

export const classToolsDescriptor: StepDescriptor = {
  key: "classTools", label: "Outils de classe",
  isVisible: (context) => classOf(context)?.toolChoice !== null,
  isValid: (context) => isExactBoundedChoice(
    context.composition.classTools,
    classOf(context)?.toolChoice?.count ?? 0,
    classOf(context)?.toolChoice?.options ?? [],
  ),
  progress: (context) => counted(
    context.composition.classTools.length,
    classOf(context)?.toolChoice?.count ?? 0,
  ),
};

export const classLanguageDescriptor: StepDescriptor = {
  key: "classLanguage", label: "Langue de classe",
  isVisible: (context) => classOf(context)?.grantsLanguageChoice === true,
  isValid: ({ catalog, composition }) => [...catalog.languages.standard, ...catalog.languages.rare]
    .some((entry) => entry.key === composition.classLanguage),
};

export const invocationDescriptor: StepDescriptor = {
  key: "invocation", label: "Manifestation occulte",
  isVisible: ({ composition }) => composition.classKey === "warlock",
  isValid: invocationIsComplete,
};

function invocationIsComplete({ catalog, composition }: StepContext): boolean {
  const invocation = catalog.invocations.find((entry) => entry.key === composition.invocation);
  if (!invocation) return false;
  if (invocation.detail === "familiar") {
    return catalog.familiarForms.some((entry) => entry.key === composition.familiarForm);
  }
  if (invocation.detail === "weapon") {
    return catalog.pactWeaponOptions.some((entry) => entry.key === composition.pactWeaponKey);
  }
  if (invocation.detail === "tome") {
    return composition.invocationSpells.length === 5
      && new Set(composition.invocationSpells).size === 5;
  }
  return true;
}
