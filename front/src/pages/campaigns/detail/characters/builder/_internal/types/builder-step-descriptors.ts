import { isFullyAssigned } from "./character-composition";
import { completeIdentityOf } from "./identity-fields";
import {
  classOf,
  fightingStyleChoiceOf,
  orderChoiceOf,
  resolvedSizeOf,
  speciesOf,
  type StepContext,
} from "./builder-lookups";
import {
  areBonusesDone,
  areFeatsDone,
  chosenLanguages,
  hasChosenLineage,
  hasValidName,
  STANDARD_LANGUAGE_QUOTA,
} from "./builder-validity";
import { hasChosenEquipment } from "./starting-equipment";
import {
  backgroundToolDescriptor,
  classLanguageDescriptor,
  classToolsDescriptor,
  invocationDescriptor,
  weaponMasteriesDescriptor,
} from "./builder-proficiency-step-descriptors";
import { cantripsDescriptor, spellsDescriptor } from "./builder-spell-step-descriptors";
import type { BuilderStep, StepProgress } from "./builder-steps";

export interface StepDescriptor {
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
export const STEP_DESCRIPTORS: readonly StepDescriptor[] = [
  {
    key: "species",
    label: "Espèce",
    isVisible: always,
    isValid: (context) =>
      Boolean(speciesOf(context)) &&
      resolvedSizeOf(context) !== null &&
      context.composition.speciesSkills.length ===
        (speciesOf(context)?.skillChoice?.count ?? 0),
    progress: (context) =>
      counted(
        context.composition.speciesSkills.length,
        speciesOf(context)?.skillChoice?.count ?? 0,
      ),
  },
  {
    key: "lineage",
    label: "Lignage",
    isVisible: (context) => Boolean(speciesOf(context)?.lineage),
    isValid: hasChosenLineage,
  },
  {
    key: "languages",
    label: "Langues",
    isVisible: always,
    isValid: (context) => chosenLanguages(context).length === STANDARD_LANGUAGE_QUOTA,
    progress: (context) =>
      counted(chosenLanguages(context).length, STANDARD_LANGUAGE_QUOTA),
  },
  {
    key: "class",
    label: "Classe",
    isVisible: always,
    isValid: ({ composition }) => composition.classKey !== null,
  },
  {
    key: "background",
    label: "Historique",
    isVisible: always,
    isValid: ({ composition }) => composition.backgroundKey !== null,
  },
  backgroundToolDescriptor,
  {
    key: "classSkills",
    label: "Compétences",
    isVisible: (context) => Boolean(classOf(context)),
    isValid: (context) =>
      context.composition.classSkills.length === (classOf(context)?.skillChoice.count ?? 0),
    progress: (context) =>
      counted(context.composition.classSkills.length, classOf(context)?.skillChoice.count ?? 0),
  },
  {
    key: "fightingStyle",
    label: "Style de combat",
    isVisible: (context) => fightingStyleChoiceOf(context) !== undefined,
    isValid: ({ composition }) => composition.fightingStyle !== null,
  },
  {
    key: "classOrder",
    label: "Ordre",
    isVisible: (context) => orderChoiceOf(context) !== undefined,
    isValid: ({ composition }) => composition.classOrder !== null,
  },
  weaponMasteriesDescriptor,
  classToolsDescriptor,
  classLanguageDescriptor,
  {
    key: "feats",
    label: "Dons",
    isVisible: ({ composition }) => composition.backgroundKey !== null,
    isValid: areFeatsDone,
  },
  {
    key: "expertise",
    label: "Expertise",
    isVisible: (context) => (classOf(context)?.expertiseCount ?? 0) > 0,
    isValid: (context) =>
      context.composition.expertise.length === (classOf(context)?.expertiseCount ?? 0),
    progress: (context) =>
      counted(context.composition.expertise.length, classOf(context)?.expertiseCount ?? 0),
  },
  invocationDescriptor,
  {
    key: "abilities",
    label: "Caractéristiques",
    isVisible: always,
    isValid: (context) =>
      isFullyAssigned(context.composition) && areBonusesDone(context.composition),
  },
  cantripsDescriptor,
  spellsDescriptor,
  // L'étape bloque tant que les deux paquetages ne sont pas tranchés : un
  // personnage sans équipement de départ n'est pas un personnage fini.
  {
    key: "equipment",
    label: "Équipement",
    isVisible: always,
    isValid: ({ catalog, composition }) => hasChosenEquipment(catalog, composition),
  },
  {
    key: "identity",
    label: "Identité",
    isVisible: always,
    isValid: ({ composition }) =>
      hasValidName(composition.name) && completeIdentityOf(composition) !== null,
  },
];
