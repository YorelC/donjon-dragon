import { isFullyAssigned } from "./character-draft";
import {
  cantripQuotaOf,
  classOf,
  fightingStyleChoiceOf,
  orderChoiceOf,
  speciesOf,
  spellQuotaOf,
  type StepContext,
} from "./builder-lookups";
import {
  areBonusesDone,
  areFeatsDone,
  chosenCantrips,
  chosenSpells,
} from "./builder-validity";

export const BUILDER_STEPS = [
  "species",
  "lineage",
  "class",
  "classSkills",
  "expertise",
  "fightingStyle",
  "classOrder",
  "background",
  "feats",
  "abilities",
  "cantrips",
  "spells",
  "equipment",
] as const;

export type BuilderStep = (typeof BUILDER_STEPS)[number];

export interface StepProgress {
  chosen: number;
  total: number;
}

interface StepDescriptor {
  key: BuilderStep;
  label: string;
  isVisible: (context: StepContext) => boolean;
  isValid: (context: StepContext) => boolean;
  progress?: (context: StepContext) => StepProgress;
}

const always = () => true;

const counted = (chosen: number, total: number): StepProgress => ({ chosen, total });

/**
 * La table qui décrit le parcours.
 *
 * Une seule source pour trois choses : quelles étapes apparaissent, laquelle est
 * franchissable, et le compteur affiché dans le fil conducteur. Les répartir
 * dans trois fonctions les ferait diverger dès la première règle ajoutée.
 */
const STEPS: readonly StepDescriptor[] = [
  {
    key: "species",
    label: "Espèce",
    isVisible: always,
    isValid: (context) =>
      Boolean(speciesOf(context)) &&
      context.draft.speciesSkills.length === (speciesOf(context)?.skillChoice?.count ?? 0),
    progress: (context) =>
      counted(context.draft.speciesSkills.length, speciesOf(context)?.skillChoice?.count ?? 0),
  },
  {
    key: "lineage",
    label: "Lignage",
    isVisible: (context) => Boolean(speciesOf(context)?.lineage),
    isValid: ({ draft }) => draft.lineageKey !== null,
  },
  {
    key: "class",
    label: "Classe",
    isVisible: always,
    isValid: ({ draft }) => draft.classKey !== null,
  },
  {
    key: "classSkills",
    label: "Compétences",
    isVisible: (context) => Boolean(classOf(context)),
    isValid: (context) =>
      context.draft.classSkills.length === (classOf(context)?.skillChoice.count ?? 0),
    progress: (context) =>
      counted(context.draft.classSkills.length, classOf(context)?.skillChoice.count ?? 0),
  },
  {
    key: "expertise",
    label: "Expertise",
    isVisible: (context) => (classOf(context)?.expertiseCount ?? 0) > 0,
    isValid: (context) =>
      context.draft.expertise.length === (classOf(context)?.expertiseCount ?? 0),
    progress: (context) =>
      counted(context.draft.expertise.length, classOf(context)?.expertiseCount ?? 0),
  },
  {
    key: "fightingStyle",
    label: "Style de combat",
    isVisible: (context) => fightingStyleChoiceOf(context) !== undefined,
    isValid: ({ draft }) => draft.fightingStyle !== null,
  },
  {
    key: "classOrder",
    label: "Ordre",
    isVisible: (context) => orderChoiceOf(context) !== undefined,
    isValid: ({ draft }) => draft.classOrder !== null,
  },
  {
    key: "background",
    label: "Historique",
    isVisible: always,
    isValid: ({ draft }) => draft.backgroundKey !== null,
  },
  {
    key: "feats",
    label: "Dons",
    isVisible: ({ draft }) => draft.backgroundKey !== null,
    isValid: areFeatsDone,
  },
  {
    key: "abilities",
    label: "Caractéristiques",
    isVisible: always,
    isValid: (context) => isFullyAssigned(context.draft) && areBonusesDone(context.draft),
  },
  {
    key: "cantrips",
    label: "Sorts mineurs",
    isVisible: (context) => cantripQuotaOf(context) > 0,
    isValid: (context) => chosenCantrips(context.draft) >= cantripQuotaOf(context),
    progress: (context) => counted(chosenCantrips(context.draft), cantripQuotaOf(context)),
  },
  {
    key: "spells",
    label: "Sorts",
    isVisible: (context) => spellQuotaOf(context) > 0,
    isValid: (context) => chosenSpells(context.draft) >= spellQuotaOf(context),
    progress: (context) => counted(chosenSpells(context.draft), spellQuotaOf(context)),
  },
  { key: "equipment", label: "Équipement", isVisible: always, isValid: always },
];

export function visibleSteps(context: StepContext): BuilderStep[] {
  return STEPS.filter((step) => step.isVisible(context)).map((step) => step.key);
}

export function stepLabel(step: BuilderStep): string {
  return STEPS.find((entry) => entry.key === step)?.label ?? step;
}

export function isStepValid(step: BuilderStep, context: StepContext): boolean {
  return STEPS.find((entry) => entry.key === step)?.isValid(context) ?? true;
}

export function stepProgress(step: BuilderStep, context: StepContext): StepProgress | null {
  const progress = STEPS.find((entry) => entry.key === step)?.progress;

  return progress ? progress(context) : null;
}
