import type { ComputedCharacter, ResolvedProficiencies } from "@donjon-dragon/shared";
import {
  ARMOR_TRAINING_LABELS,
  WEAPON_PROFICIENCY_LABELS,
} from "@/shared/constants/character-labels";
import { backgroundOf, classOf, type StepContext } from "./builder-lookups";

const NONE = "Aucune";

export interface RecapLine {
  name: string;
  value: string;
}

type KnownProficiencies = Pick<ResolvedProficiencies, "weapons" | "armorTraining" | "skills" | "tools">;

interface ProficiencySource {
  context: StepContext;
  preview: ComputedCharacter | null;
}

/** Les maîtrises : celles du serveur dès qu'il répond, celles des choix bruts avant. */
export function recapProficienciesOf({ context, preview }: ProficiencySource): RecapLine[] {
  const known = preview?.proficiencies ?? draftProficienciesOf(context);
  const { skillLabels, toolLabels } = context.catalog;

  return [
    { name: "Armes", value: listOf(known.weapons.map((weapon) => WEAPON_PROFICIENCY_LABELS[weapon])) },
    { name: "Armures", value: listOf(known.armorTraining.map((armor) => ARMOR_TRAINING_LABELS[armor])) },
    { name: "Compétences", value: listOf(known.skills.map((skill) => skillLabels[skill] ?? skill)) },
    { name: "Outils", value: listOf(known.tools.map((tool) => toolLabels[tool] ?? tool)) },
  ];
}

function draftProficienciesOf(context: StepContext): KnownProficiencies {
  const characterClass = classOf(context);
  const background = backgroundOf(context);
  const { composition } = context;
  const backgroundTool = background?.fixedTool ?? composition.backgroundTool;

  return {
    weapons: characterClass?.weaponProficiencies ?? [],
    armorTraining: characterClass?.armorTraining ?? [],
    skills: [
      ...(background?.skillProficiencies ?? []),
      ...composition.classSkills,
      ...composition.speciesSkills,
      ...composition.featSkills,
    ],
    tools: [...(characterClass?.toolProficiencies ?? []), ...(backgroundTool ? [backgroundTool] : [])],
  };
}

function listOf(labels: string[]): string {
  return [...new Set(labels)].join(", ") || NONE;
}
