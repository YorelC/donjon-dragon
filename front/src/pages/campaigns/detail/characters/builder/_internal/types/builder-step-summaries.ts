import type { CatalogClassChoice } from "@donjon-dragon/shared";
import { GAME_MASTER_ABILITY_METHODS } from "./ability-methods";
import {
  backgroundOf,
  classOf,
  featsOf,
  fightingStyleChoiceOf,
  orderChoiceOf,
  speciesOf,
  type StepContext,
} from "./builder-lookups";
import { stepProgress, type BuilderStep, type StepProgress } from "./builder-steps";
import { chosenEquipmentOptions } from "./starting-equipment";

/** Ce que le rail affiche sous une étape qui n'a encore rien de retenu. */
export const PENDING_SUMMARY = "À choisir";

type Summary = (context: StepContext) => string | null;

/**
 * La valeur que le rail affiche sous chaque étape : le nom retenu, ou le
 * compteur de l'étape quand elle en a un. `null` laisse la place à « À choisir ».
 */
const SUMMARIES: Record<BuilderStep, Summary> = {
  species: (context) => speciesOf(context)?.name ?? null,
  lineage: lineageName,
  languages: counterOf("languages"),
  class: (context) => classOf(context)?.name ?? null,
  background: (context) => backgroundOf(context)?.name ?? null,
  backgroundTool: (context) => toolName(context, context.composition.backgroundTool),
  classSkills: counterOf("classSkills"),
  fightingStyle: (context) =>
    optionName(fightingStyleChoiceOf(context), context.composition.fightingStyle),
  classOrder: (context) => optionName(orderChoiceOf(context), context.composition.classOrder),
  weaponMasteries: counterOf("weaponMasteries"),
  classTools: counterOf("classTools"),
  classLanguage: classLanguageName,
  feats: featNames,
  expertise: counterOf("expertise"),
  invocation: invocationName,
  abilities: methodName,
  cantrips: counterOf("cantrips"),
  spells: counterOf("spells"),
  equipment: equipmentOptions,
  identity: ({ composition }) => composition.name.trim() || null,
};

export function stepSummaryOf(step: BuilderStep, context: StepContext): string {
  return SUMMARIES[step](context) ?? PENDING_SUMMARY;
}

/** Le compteur du rail, compact comme dans la maquette : « 2/3 ». */
function formatProgress({ chosen, total }: StepProgress): string {
  return `${chosen}/${total}`;
}

function counterOf(step: BuilderStep): Summary {
  return (context) => {
    const progress = stepProgress(step, context);

    return progress && progress.total > 0 ? formatProgress(progress) : null;
  };
}

function lineageName(context: StepContext): string | null {
  const lineage = speciesOf(context)?.lineage;

  return lineage?.options.find((entry) => entry.key === context.composition.lineageKey)?.name
    ?? null;
}

function optionName(choice: CatalogClassChoice | undefined, key: string | null): string | null {
  return choice?.options.find((option) => option.key === key)?.name ?? null;
}

function toolName({ catalog }: StepContext, tool: string | null): string | null {
  return tool ? catalog.toolLabels[tool] ?? tool : null;
}

function classLanguageName({ catalog, composition }: StepContext): string | null {
  const languages = [...catalog.languages.standard, ...catalog.languages.rare];

  return languages.find((entry) => entry.key === composition.classLanguage)?.name ?? null;
}

function featNames(context: StepContext): string | null {
  return featsOf(context).map((feat) => feat.name).join(", ") || null;
}

function invocationName({ catalog, composition }: StepContext): string | null {
  return catalog.invocations.find((entry) => entry.key === composition.invocation)?.name ?? null;
}

/** Toutes les méthodes, saisie manuelle comprise : le rail nomme, il n'autorise pas. */
function methodName({ composition }: StepContext): string | null {
  return GAME_MASTER_ABILITY_METHODS.find((method) => method.key === composition.abilityMethod)?.label ?? null;
}

function equipmentOptions({ catalog, composition }: StepContext): string | null {
  const chosen = chosenEquipmentOptions(catalog, composition);

  return chosen.length > 0 ? chosen.map((option) => `Option ${option.id}`).join(" · ") : null;
}
